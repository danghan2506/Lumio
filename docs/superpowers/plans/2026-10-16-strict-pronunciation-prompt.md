# Strict Pronunciation Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Lumi nghiêm khắc khi chấm phát âm bằng cách sửa prompt (không thêm scoring audio).

**Architecture:** Chỉ sửa `vision-agent/agent.py`: bổ sung chuẩn so sánh vào `build_instructions` và luật repeat-until-mastery vào `TEACHER_RULES`. Không đụng completion/coordinator/stream.

**Tech Stack:** Python 3.13, Gemini Realtime prompt text, pytest (`uv run pytest -q` trong `vision-agent/`).

**Spec:** `docs/superpowers/specs/2026-10-16-strict-pronunciation-prompt-design.md`

## Global Constraints
- Chỉ sửa prompt text trong `vision-agent/agent.py`; không thêm dependency mới.
- Giữ responses 1-2 câu ngắn, spoken-only, không markdown/list/emoji.
- Tương thích cả 2 path: có `aiTeacherPrompt` từ DB và fallback `teacher_instructions(language)`.
- Mọi thay đổi phải có test trong `vision-agent/tests/test_agent.py` trước (TDD).
- Chạy `uv run pytest -q` pass trước khi commit.

## Review Focus
- Transcript sai hẳn 1 từ (vd "goodbye" khi mục tiêu "hello") vẫn bị cho qua — phải bắt repeat.
- Transcript gần đúng (thiếu âm cuối, sai trọng âm) được sửa cụ thể thay vì khen chung chung.
- Hết 3 lần thử vẫn sai thì ghi nhận và qua từ tiếp theo, không kẹt vô hạn.
- Vocab không có `pronunciation` (None/rỗng) thì prompt vẫn build được, không crash.
- `aiTeacherPrompt` null/rỗng vẫn nhận đủ luật nghiêm từ fallback path.

---

### Task 1: Truyền chuẩn phát âm vào prompt

**Files:**
- Modify: `vision-agent/agent.py:459-478` (`build_instructions`)
- Test: `vision-agent/tests/test_agent.py`

**Interfaces:**
- Consumes: `custom_data["vocabulary"]: list[{word, translation, pronunciation}]`, `custom_data["phrases"]: list[str]`
- Produces: `build_instructions(custom_data, language) -> str` chứa `word (translation, pronunciation)` cho từng từ có đủ field.

- [ ] **Step 1: Write the failing test**

```python
def test_build_instructions_includes_pronunciation_and_translation():
    custom = {"vocabulary": [{"word": "Hola", "translation": "Hello", "pronunciation": "OH-lah"}], "phrases": ["¿Cómo estás?"]}
    instructions = build_instructions(custom, "Spanish")
    assert "Hola" in instructions
    assert "Hello" in instructions
    assert "OH-lah" in instructions
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/test_agent.py::test_build_instructions_includes_pronunciation_and_translation -v`
Expected: FAIL (pronunciation missing)

- [ ] **Step 3: Implement `build_instructions` vocab line in `vision-agent/agent.py:469-475`**

Format mỗi từ: `word (translation, pronunciation)` khi có field, fallback `word (translation)` hoặc `word` khi thiếu. Giữ câu `Practice phrases...` nguyên.

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest tests/test_agent.py::test_build_instructions_includes_pronunciation_and_translation -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add vision-agent/agent.py vision-agent/tests/test_agent.py
git commit -m "fix(vision-agent): include pronunciation and translation in teacher prompt"
```

### Task 2: Luật chấm nghiêm + repeat-until-mastery

**Files:**
- Modify: `vision-agent/agent.py:431-442` (`TEACHER_RULES`)
- Test: `vision-agent/tests/test_agent.py`

**Interfaces:**
- Consumes: `TEACHER_RULES: str`
- Produces: `TEACHER_RULES` chứa các cụm bắt buộc: `do not advance`, `repeat`, `3 attempts` (hoặc `three attempts`), `complete_lesson`, cấm khen sai là đúng.

- [ ] **Step 1: Write the failing test**

```python
def test_teacher_rules_enforce_strict_repeat():
    from agent import TEACHER_RULES
    low = TEACHER_RULES.lower()
    assert "do not advance" in low
    assert "repeat" in low
    assert "3 attempt" in low or "three attempt" in low
    assert "complete_lesson" in TEACHER_RULES
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/test_agent.py::test_teacher_rules_enforce_strict_repeat -v`
Expected: FAIL

- [ ] **Step 3: Implement strict rules in `TEACHER_RULES` (`vision-agent/agent.py:431-442`)**

Thêm 3 ý trong 3-4 dòng ngắn, giữ style "- ...": (a) compare transcript vs target word/phrase, classify correct/close/wrong; (b) do not advance until current word passes or after 3 attempts — mỗi lần sai phải nêu nghe được gì, chuẩn là gì, tách âm và mời đọc lại trong 1-2 câu; (c) never praise a wrong pronunciation as correct — praise effort, correct the error honestly.

- [ ] **Step 4: Run tests to verify nothing breaks**

Run: `uv run pytest -q`
Expected: PASS (41+ passed, 2 skipped như baseline)

- [ ] **Step 5: Commit**

```bash
git add vision-agent/agent.py vision-agent/tests/test_agent.py
git commit -m "fix(vision-agent): enforce strict pronunciation assessment and repeat loop"
```

### Task 3: Gating complete_lesson + regression toàn nhánh

**Files:**
- Modify: `vision-agent/agent.py:441` (dòng complete_lesson trong TEACHER_RULES, nếu Task 2 chưa cover đủ)
- Test: `vision-agent/tests/test_agent.py`

**Interfaces:**
- Consumes: `TEACHER_RULES`, `DEFAULT_INSTRUCTIONS`, `teacher_instructions()`, `build_instructions()`
- Produces: mọi path instructions đều chứa `complete_lesson` + điều kiện chỉ gọi khi từng từ đã pass hoặc hết 3 tries.

- [ ] **Step 1: Write the failing test**

```python
def test_all_instruction_paths_gate_complete_lesson_on_mastery():
    paths = [DEFAULT_INSTRUCTIONS, teacher_instructions("French"), build_instructions({"aiTeacherPrompt": "Teach greetings."}, "Spanish"), build_instructions({}, "Korean")]
    for instructions in paths:
        low = instructions.lower()
        assert "complete_lesson" in instructions
        assert "3 attempt" in low or "three attempt" in low
```

- [ ] **Step 2: Run test to verify it fails/passes**

Run: `uv run pytest tests/test_agent.py::test_all_instruction_paths_gate_complete_lesson_on_mastery -v`
Expected: FAIL nếu Task 2 chưa lan đủ sang mọi path (do `build_instructions` nối base + TEACHER_RULES nên thường đã PASS — khi đó giữ test như regression).

- [ ] **Step 3: Bổ sung wording gating nếu test fail**

Sửa dòng complete_lesson thành: chỉ gọi khi learner đã pass từng từ/phrase hoặc đã thử 3 lần (ghi nhận điểm yếu rồi qua), không gọi sớm.

- [ ] **Step 4: Run full suite**

Run: `uv run pytest -q`
Expected: PASS, không regression.

- [ ] **Step 5: Commit**

```bash
git add vision-agent/agent.py vision-agent/tests/test_agent.py docs/superpowers/specs/2026-10-16-strict-pronunciation-prompt-design.md docs/superpowers/plans/2026-10-16-strict-pronunciation-prompt.md
git commit -m "fix(vision-agent): gate complete_lesson on per-word mastery"
```
