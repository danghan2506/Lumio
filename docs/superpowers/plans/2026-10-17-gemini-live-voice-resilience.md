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
