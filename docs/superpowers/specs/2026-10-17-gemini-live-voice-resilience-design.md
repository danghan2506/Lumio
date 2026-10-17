# Thiết kế: Lumi không được "chết lặng" khi đang dạy (Gemini Live resilience)

- Ngày: 2026-10-17
- Branch: `fix/gemini-live-voice-resilience`
- Phạm vi: `vision-agent/` (Python). Không sửa `.venv`, không sửa app RN trong bước này.

## 1. Vấn đề

Trong buổi học thật (log `vision-agent/diag.log`, 2 lượt học liên tiếp):

| Hiện tượng | Bằng chứng trong log |
| --- | --- |
| Lumi chào + dạy 1 lượt rồi im vĩnh viễn | T+37.89s `GEMINI spoke`, T+51–53s phản hồi, sau đó **không còn transcript/audio nào** dù học viên nói tiếp 85 giây |
| Socket **không** hề chết | Server gửi `session_resumption_update` mỗi ~4s suốt bài; `go_away` = 0 lần |
| Google kill session bằng 1011 | Lượt học 2: `Gemini connection lost (API error code 1011)` chỉ 5.96s sau khi kết nối |
| Thư viện **vứt bỏ** handle resumption | **76** message `session_resumption_update` bị log "Unrecognized event structure" (handle chỉ được lấy khi có `model_turn`, `gemini_realtime.py:467-475`) → mọi reconnect mất ngữ cảnh bài học |
| Reconnect không an toàn | `_processing_loop` gọi `await self._establish_session()` **không có try/except** (`gemini_realtime.py:534-538`); lỗi ở đây giết task đọc message trong khi `self.connected` vẫn `True` → audio gửi vào socket không ai đọc, không bao giờ hồi phục |
| Audio gửi trong lúc đổi session gây spam lỗi | ~24 dòng `ConnectionClosedError ... 1011` + `Error while processing audio input` |
| App báo "đã kết nối" trong khi AI đã chết | `useStreamLessonAgent` chỉ biết HTTP POST đã thành công |

Ngoài ra còn một **nghi vấn chưa chốt**: từ ~T+62s, RMS của từng frame audio học viên lặp lại y hệt (`0.0968`, 4 chữ số) suốt 80 giây — dấu hiệu nội dung audio bị "đóng băng" (mic/đường publish), chứ không phải tiếng nói thật. Cần đo lại bằng số liệu chắc chắn (không suy đoán từ mẫu thưa).

## 2. Mục tiêu

1. Session Gemini bị kill (1011) → agent **tự hồi phục**, và **giữ ngữ cảnh bài học** nhờ resumption handle.
2. Session "sống nhưng câm" (socket khoẻ, không có phản hồi) → agent **tự phát hiện và hồi phục** (watchdog).
3. Không bao giờ để task đọc message chết lặng: mọi lỗi reconnect đều có retry có giới hạn + backoff, và lỗi cuối cùng **phải hiện ra log** rõ ràng.
4. Trong lúc hồi phục, **không gửi audio vào session đã chết** (hết spam `ConnectionClosedError`).
5. Có số liệu khẳng định/loại trừ nghi vấn "audio học viên đóng băng" **ngay trong lần test tới** (không cần vòng chẩn đoán riêng).

Không nằm trong phạm vi: sửa UI app, đổi kiến trúc call, thay model trong lúc chạy.

## 3. Quyết định kỹ thuật

| # | Quyết định | Lý do |
| --- | --- | --- |
| D1 | Đổi model mặc định sang `gemini-3.8-live` (env `GEMINI_LIVE_MODEL` để override) | `gemini-3.1-flash-live-preview` bị 1011 ở 6s trong log này; `3.8-live` đã được probe chạy OK với key của dự án |
| D2 | **Tắt** `context_window_compression` | Google xác nhận đây là workaround cho lỗi 1011; bài học ngắn nên không cần nén ngữ cảnh |
| D3 | Giữ `session_resumption` bật | Cần cho hồi phục giữ ngữ cảnh |
| D4 | Bọc lại `GeminiRealtime` bằng subclass trong `vision-agent/lumio/` (không sửa `.venv`) | Thư viện 0.6.9 (bản mới nhất trên PyPI) vẫn lỗi; patch cục bộ dễ test, dễ gỡ khi upstream sửa |
| D5 | Lấy `session_resumption_update` từ **mọi** message qua session-proxy | Handle hiện chỉ được lấy khi có `model_turn` → 76 handle bị bỏ |
| D6 | Watchdog dựa trên "học viên đang nói + không có phản hồi" thay vì "không có message" | Server vẫn gửi resumption mỗi 4s nên "im lặng ở tầng message" không phát hiện được sự cố thật |
| D7 | Hồi phục tối đa 3 lần liên tiếp, backoff 0.5→8s; sau đó log ĐỎ và báo `_on_disconnected` | Tránh vòng lặp vô hạn; đảm bảo trạng thái "chết" được báo đúng |
| D8 | `AudioGuard` (đo `voiced%`, `distinct_rms`, `max_identical_run`) chạy mặc định ở mức cảnh báo, chi tiết khi `LUMIO_AUDIO_DEBUG=1` | Lần test tới vừa kiểm tra fix vừa chốt được nghi vấn audio "đóng băng" |

## 4. Thành phần

```
vision-agent/
  lumio/
    __init__.py
    audio_guard.py         # AudioGuard: cửa sổ 4s -> voiced%, distinct_rms, max_identical_run, learner_active
    gemini_resilient.py    # ResilientGeminiRealtime + _SessionProxy + policy thuần (backoff, should_recover)
  tests/
    test_audio_guard.py
    test_gemini_resilient.py
  agent.py                 # create_agent() dùng build_llm(); env: GEMINI_LIVE_MODEL, LUMIO_AUDIO_DEBUG
```

`ResilientGeminiRealtime` ghi đè đúng 4 điểm: `get_config()`, `_session` (property → proxy), `_processing_loop()`, `simple_audio_response()`.

## 5. Tiêu chí nghiệm thu

- `pytest` xanh toàn bộ (test cũ + mới).
- Log khi vào bài có dòng `model=gemini-3.8-live` và `compression=off`.
- Khi Google kill session: log hiện `recovering (attempt n/3)` rồi `session established`; **không** còn chuỗi `ConnectionClosedError` spam.
- Khi session câm > 25s trong lúc học viên đang nói: watchdog hồi phục và Lumi trả lời lại.
- Nếu audio học viên bị đóng băng: log hiện cảnh báo `learner audio looks frozen` (đây là dữ liệu để quyết định bước sửa phía app).
