# Plan: Lumi voice resilience (branch `fix/gemini-live-voice-resilience`)

Spec: `docs/superpowers/specs/2026-10-17-gemini-live-voice-resilience-design.md`

TDD: mỗi bước có test viết trước (RED) rồi mới code (GREEN).

## T1 — RED: test cho AudioGuard `tests/test_audio_guard.py`
- [ ] Test 1: 200 frame giống hệt nhau (frozen) → `distinct_rms == 1`, `max_identical_run >= 199`, `voiced_frames == 0`.
- [ ] Test 2: 200 frame khác nhau, biên độ lớn (speech) → `voiced_frames > 100`, `distinct_rms > 50`, `max_identical_run <= 1`.
- [ ] Test 3: `learner_active` = True khi có frame voiced trong cửa sổ gần nhất; False khi toàn frozen.
- [ ] Test 4: `snapshot()` trả số liệu của cửa sổ hiện tại rồi reset cửa sổ.
- [ ] Chạy: `pytest tests/test_audio_guard.py` → FAIL (chưa có module).

## T2 — GREEN: `lumio/audio_guard.py`
- [ ] `frame_rms`, `frame_digest`, `AudioGuard.feed(pcm)`, `AudioGuard.snapshot()`, `AudioGuard.learner_active`.
- [ ] Ngưỡng voiced mặc định 0.03; cửa sổ mặc định 4.0s.
- [ ] Chạy lại T1 → PASS.

## T3 — RED: test cho policy + session proxy `tests/test_gemini_resilient.py`
- [ ] Test 1: `backoff_delay(0..6)` tăng dần, chặn trên 8.0s.
- [ ] Test 2: `should_recover` — không hồi phục khi khoẻ; hồi phục khi quá hạn + học viên đang nói; không hồi phục khi học viên im; không hồi phục khi hết lượt.
- [ ] Test 3: `_SessionProxy` lấy được handle từ message `session_resumption_update` **đứng một mình** (không có `model_turn`), bỏ qua khi `resumable=False`.
- [ ] Test 4: proxy chuyển tiếp `send_realtime_input` xuống session thật; `last_message_at` cập nhật; đếm loại message.
- [ ] Test 5: `get_config()` của LLM: **không** còn `context_window_compression`, có `session_resumption` khi đã có handle.
- [ ] Chạy: `pytest tests/test_gemini_resilient.py` → FAIL.

## T4 — GREEN: `lumio/gemini_resilient.py`
- [ ] `ResilientGeminiRealtime(gemini.Realtime)`: ghi đè `get_config`, `_session`, `_processing_loop`, `simple_audio_response`.
- [ ] `_processing_loop`: reconnect có retry + backoff, watchdog tick, hỏng hẳn → log đỏ + `_on_disconnected`.
- [ ] `simple_audio_response`: bỏ qua khi đang hồi phục, không raise lỗi gửi (chỉ đếm + log 1 lần), đẩy frame vào `AudioGuard`.
- [ ] Cảnh báo `learner audio looks frozen` sau 3 cửa sổ liên tiếp `voiced==0 && distinct_rms==1`.
- [ ] Chạy lại T3 → PASS.

## T5 — Wiring `agent.py`
- [ ] `build_llm()` đọc env `GEMINI_LIVE_MODEL` (mặc định `gemini-3.8-live`), `LUMIO_AUDIO_DEBUG`, `LUMIO_STALL_SECONDS`; `create_agent` dùng nó.
- [ ] Log 1 dòng khi tạo: `model=... compression=off resume=on`.
- [ ] `python -c "import agent"` OK (không cần mạng).

## T6 — Vệ sinh & tài liệu
- [ ] `.gitignore`: thêm `diag.log`.
- [ ] `README.md`: bảng env mới + cách chạy.

## T7 — Kiểm chứng cuối (bắt buộc)
- [ ] `pytest` toàn bộ xanh.
- [ ] Probe thật với Google: model `gemini-3.8-live` + **không** compression → có `audio_bytes` trả về và transcript (script tạm ngoài repo, không commit).
- [ ] `git diff --stat` chỉ chạm `vision-agent/` + `docs/`; commit trên branch.
- [ ] Báo user: cách chạy agent + những dòng log cần nhìn khi test trên app.
