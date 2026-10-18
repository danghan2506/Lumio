# Plan: Lumi voice resilience (branch `fix/gemini-live-voice-resilience`)

Spec: `docs/superpowers/specs/2026-10-17-gemini-live-voice-resilience-design.md`

TDD: mỗi bước có test viết trước (RED) rồi mới code (GREEN).

## T1 — RED: test cho AudioGuard `tests/test_audio_guard.py`
- [x] Test 1: 200 frame giống hệt nhau (frozen) → `distinct_rms == 1`, `max_identical_run >= 199`, `voiced_frames == 0`.
- [x] Test 2: 200 frame khác nhau, biên độ lớn (speech) → `voiced_frames > 150`, `distinct_rms > 50`, `max_identical_run <= 1`.
- [x] Test 3: `learner_active` = True khi có frame voiced gần đây; False khi toàn frozen / quá hạn.
- [x] Test 4: `snapshot()` trả số liệu cửa sổ hiện tại rồi reset.
- [x] Chạy `pytest tests/test_audio_guard.py` → RED (ModuleNotFoundError) → GREEN (6 passed).

## T2 — GREEN: `lumio/audio_guard.py`
- [x] `frame_rms`, `frame_digest`, `frame_is_varying`, `AudioGuard.feed/snapshot/learner_active`.
- [x] Ngưỡng voiced 0.03 + yêu cầu frame phải *biến thiên* (frame DC/giữ nguyên không tính là tiếng nói).

## T3 — RED: test cho policy + session proxy `tests/test_gemini_resilient.py`
- [x] Test 1: `backoff_delay` tăng dần, chặn trên 8.0s.
- [x] Test 2: `should_recover` — không hồi phục khi khoẻ / khi học viên im / khi hết lượt.
- [x] Test 3: `SessionProxy` lấy handle từ message `session_resumption_update` **đứng một mình**; bỏ qua `resumable=False`.
- [x] Test 4: proxy chuyển tiếp `send_realtime_input`, cập nhật `last_message_at`, fallback attribute.
- [x] Test 5: `get_config()` không còn `context_window_compression`; có `session_resumption` khi đã có handle.
- [x] Test 6: `_processing_loop` sống sót qua lỗi 1011 (reconnect thật sự xảy ra, loop đọc tiếp).
- [x] Test 7: `_processing_loop` báo "chết" rõ ràng khi reconnect thất bại liên tục.
- [x] Test 8/9: watchdog hồi phục khi học viên đang nói mà Gemini im; im lặng khi học viên không nói.
- [x] Test 10: audio không được gửi vào session đang chết.
- [x] Chạy → RED → GREEN (20 passed, gồm cả `test_audio_guard.py`).

## T4 — GREEN: `lumio/gemini_resilient.py`
- [x] `ResilientGeminiRealtime(gemini.Realtime)` ghi đè `get_config`, `_session`, `_processing_loop`, `simple_audio_response`, `close`.
- [x] Reconnect có retry + backoff, có lock; hỏng hẳn → log ERROR + `_on_disconnected` (không còn "connected=True mà không ai đọc socket").
- [x] Watchdog `_watchdog_tick` / `_watchdog_loop`, tự bật khi `_start_processing_task`, tự tắt khi `close`.
- [x] `build_llm()` đọc `GEMINI_LIVE_MODEL`, `LUMIO_STALL_SECONDS`, `LUMIO_AUDIO_DEBUG`.

## T5 — Wiring `agent.py`
- [x] `create_agent()` dùng `build_llm()` (bỏ `gemini.Realtime()` trần).
- [x] Test wiring: `create_agent()` trả về `ResilientGeminiRealtime`, model `gemini-3.8-live`, không compression.

## T6 — Vệ sinh & tài liệu
- [x] `.gitignore`: thêm `diag.log`.
- [x] `README.md`: mục "Voice resilience" + bảng env + các dòng log cần theo dõi.

## T7 — Observability (phát hiện khi kiểm chứng, ngoài kế hoạch ban đầu)
- [x] Test: `configure_lumio_logging` gắn đúng 1 handler, idempotent, level theo `LUMIO_LOG_LEVEL`, con của `lumi` hưởng handler.
- [x] `lumio/logging_setup.py` + gọi trong `agent.py` sau `load_dotenv()`.
- [x] Lý do: SDK chỉ cấu hình logger `vision_agents` → mọi dòng INFO của agent bị nuốt (bằng chứng: log serve không có dòng "Gemini Live ready" trước khi sửa).

## T8 — Kiểm chứng cuối (bắt buộc)
- [x] `pytest -m "not integration"` → **74 passed**, 2 integration deselected.
- [x] Probe API thật: `gemini-3.8-live` + compression OFF → `audio_bytes=66240`, `handles=1`, `go_away=0`, socket sống qua 30s stream im lặng.
- [x] Smoke server: `agent.py serve` → `/health` 200, `/ready` 200.
- [x] End-to-end thật: `POST /calls/lumio-verify-172114/sessions` → 201 → log `Gemini Live ready: model=gemini-3.8-live compression=off resumption=on stall=25.0s` → `Gemini live connected to session <lumio.gemini_resilient.SessionProxy object ...>` → agent nói (transcript "Hello, my friend. Can you repeat after me?") → `DELETE .../sessions/...` 202 + tắt sạch.
- [x] `git diff --stat`: chỉ chạm `vision-agent/` và `docs/` (không đụng app RN, không đụng `.venv`).

## T9 — Vòng review code độc lập (trước khi mở PR)

Reviewer độc lập (context riêng, không thấy hội thoại) soi `git diff 4c1eb6b..daca3cb`, chạy lại test suite (`74 passed`) và tái hiện 2 race bằng probe ngoài repo. Kết quả: 1 Critical + 3 Important, đều đã sửa.

- [x] **C1 (Critical)** `_recover_once` gate reader theo `had_reader` → sau một lần hồi phục **thất bại**, reader đã bị xoá nên lần hồi phục thành công sau đó **không spawn lại reader**: `connected=True` mà không ai đọc socket (đúng triệu chứng gốc). Sửa: `_ensure_reader()` idempotent, luôn bảo đảm có reader sống sau khi hồi phục thành công.
- [x] **I1 (Important)** Nhánh "give up" trong `_watchdog_tick` thiếu `not self._recovering` / `self._recoveries >= self.max_recoveries` → giữa lúc đang hồi phục (còn lượt) vẫn có thể tuyên bố "Lumi is deaf", huỷ luôn các lượt còn lại và để lại trạng thái không nhất quán. Sửa: thêm 2 điều kiện.
- [x] **I2 (Important)** `input_transcript` bị tính là hoạt động của model → session transcribe liên tục mà không trả lời sẽ **reset đồng hồ stall mãi mãi** (đúng thất bại production 85s). Sửa: bỏ `input_transcript` khỏi `MODEL_ACTIVITY_KINDS`; transcript chỉ chứng minh audio đã tới Google.
- [x] **I3 (Important)** Nhánh watchdog dùng `audio_guard.learner_active` trực tiếp, nên một cửa sổ vừa "frozen" vừa "voiced" sẽ tiêu một lượt hồi phục cho Gemini trong khi lỗi nằm ở phone. Sửa: `_uplink_frozen` chặn cả hồi phục lẫn give-up (ưu tiên cảnh báo frozen).
- [x] **Minor** `lumio.*` (logger theo module) không nằm dưới handler `lumi` → log DEBUG/INFO của module bị nuốt; `configure_lumio_logging` nay cấu hình cả `lumi` và `lumio`.
- [x] **Minor** thiếu log chẩn đoán khi give-up → thêm `_diagnostics()` (histogram message, sent/send_failures/dropped/frozen/recoveries).
- [x] **Minor** `SessionProxy` không có `__repr__` → log "connected to session <SessionProxy object at 0x…>"; nay in `<SessionProxy session=... messages=N>`.
- [x] **Minor** `DEFAULT_RECOVERY_ATTEMPTS` 3 → 5 để thang backoff 0.5→8s đã ghi trong D7 thực sự chạy được.
- [x] **Minor** `LUMIO_STALL_SECONDS` đọc bằng `float()` trần → env sai làm chết agent lúc khởi động; nay `_env_float` + sàn `MIN_STALL_SECONDS = 5`.
- [x] **Minor** tên test `..._and_frozen_audio_is_reported` không phản ánh nội dung → tách thành `test_audio_is_not_sent_while_recovering` + `test_frozen_uplink_is_reported_once_per_episode`.
- [x] RED→GREEN: 9 test mới trong `tests/test_gemini_resilient.py` + 1 test trong `tests/test_logging_setup.py`; probe ngoài repo xác nhận logic cũ **fail** đúng chỗ (C1: reader sau hồi phục = `False`; I1: give-up giữa lúc đang hồi phục = `True`).
- [x] `pytest -q -m "not integration"` → **84 passed**, 2 deselected.
- [x] Reviewer kết luận: "Ready to merge? With fixes" → đã sửa hết Critical/Important và minor rẻ.
