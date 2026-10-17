# Strict Pronunciation Prompt — Design

## Intent / Why
Learner phát âm chưa chuẩn (transcript lệch ~40%, chỉ đúng ~60%) nhưng Lumi vẫn khen và qua từ tiếp theo. Root cause đã xác nhận trong `vision-agent/agent.py`: `TEACHER_RULES` không định nghĩa "đúng" là gì, không có vòng lặp repeat-until-mastery, và `build_instructions` vứt mất `pronunciation/translation` dù API đã query đủ. Fix đợt này chỉ sửa prompt — không thêm scoring audio, không đổi schema.

## Goals
- Agent so transcript với từ mục tiêu và phân loại: đúng / gần đúng / sai.
- Sai hoặc lệch rõ → không qua từ mới, phải sửa + bắt đọc lại (tối đa 3 lần/từ).
- Feedback sửa lỗi có mẫu cố định: nghe được gì → chuẩn là gì → tách âm/đọc chậm lại → mời đọc lại.
- Vẫn giữ giọng ấm áp nhưng trung thực: khen nỗ lực, không khen phát âm sai là đúng.
- Vẫn giữ 1-2 câu ngắn, spoken-only, không markdown/list/emoji.

## Non-goals
- Không thêm Azure/ELSAs pronunciation scoring, không dùng confidence phoneme.
- Không sửa `CompletionCoordinator`, turn limit, caption relay, Stream plumbing.
- Không đổi Supabase schema hay `ai_teacher_prompt` trong DB đợt này.

## Anti-goals (thất bại dù vẫn chạy)
- Agent khen "perfect!" khi transcript sai hẳn.
- Agent qua từ mới khi từ hiện tại chưa đạt sau lần 1.
- Prompt dài dòng khiến realtime voice bị chậm hoặc nói lan man >2 câu.

## Constraints
- File chính: `vision-agent/agent.py` (`TEACHER_RULES`, `build_instructions`, `teacher_instructions` nếu cần).
- Tests: `vision-agent/tests/test_agent.py` (pytest, `uv run pytest -q`).
- Python 3.13, không thêm dependency.
- Prompt phải tương thích cả 2 path: có `aiTeacherPrompt` từ DB và fallback per-language.

## Decided parts (builder làm theo)
1. `TEACHER_RULES`: thêm mục Pronunciation assessment với 3-tier + quy tắc "do not advance until pass or 3 tries", cấm praise sai thành đúng, mẫu câu sửa lỗi 1-2 câu.
2. `build_instructions`: liệt kê vocab kèm `word (translation, pronunciation)` thay vì chỉ `word`; phrases giữ nguyên nhưng nêu rõ là chuẩn để so transcript.
3. `complete_lesson` gating: chỉ gọi khi từng từ đã pass hoặc đã hết 3 tries (ghi nhận và qua), không gọi sớm vì "đã đọc qua".
4. Giữ `build_greeting` và completion logic nguyên vẹn.

## Left to builder
- Wording tiếng Anh exact trong prompt (miễn đạt 4 ý trên và pass tests).
- Có log transcript mismatch ở level debug hay không (optional, không bắt buộc).
