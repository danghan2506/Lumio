# Design Spec: Multiple Choice Questions in Practice Tab

## 1. Overview & Objective

In the Lumio language learning application, the **Practice** tab (located next to the **Lessons** tab in `app/(tabs)/learn.tsx`) currently displays a placeholder ("Practice Mode Coming Soon!").

This feature implements the **Multiple Choice Practice** system:
- Fetches multiple choice activities from Supabase (`activities` table where `type = 'multiple_choice'`) associated with `lesson_id` and `language_id`.
- Provides an interactive, Duolingo-inspired quiz interface:
  - Displays practice cards grouped by lessons for the active unit and language.
  - Interactive quiz modal with progress indicator, question prompt, and 4 answer options.
  - Instant visual & audio feedback upon selecting an option (Emerald Green for correct, Coral Red for incorrect).
  - Bottom sheet with contextual feedback ("Chính xác!", "Chưa đúng! Đáp án đúng là...") and a "Tiếp tục" action button.
  - Final completion modal summarizing score, tailored message & XP reward based on performance, recording progress to Supabase via `record_lesson_progress` / `daily_activity`.

---

## 2. Supabase Schema & Data Contract

### 2.1 Database Schema (Existing & Aligned)

The `activities` table in Supabase (`20260811000000_add_content_tables_and_seed.sql`) stores activities with:
- `id` (`text PRIMARY KEY`): e.g. `'en-unit-1-lesson-1-act-1'`
- `lesson_id` (`text REFERENCES lessons(id)`): e.g. `'en-unit-1-lesson-1'`
- `order` (`integer`): order within lesson
- `type` (`text`): `'multiple_choice'`
- `instruction` (`text`): e.g. `'Chọn nghĩa đúng của từ sau:'`
- `data` (`jsonb`):
  ```json
  {
    "question": "\"Hello\" có nghĩa là gì?",
    "options": ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"],
    "correctIndex": 1
  }
  ```

### 2.2 TypeScript Data Types (`types/learning.ts`)

```typescript
export interface MultipleChoiceData {
  question: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
}

export interface MultipleChoiceActivityItem {
  id: string;
  lesson_id: string;
  order: number;
  type: 'multiple_choice';
  instruction: string;
  data: MultipleChoiceData;
}

export interface PracticeLessonItem {
  id: string;
  unit_id: string;
  order: number;
  title: string;
  xp_reward: number;
  estimated_minutes: number;
  activitiesCount: number;
  status: 'not_started' | 'in_progress' | 'completed';
}
```

---

## 3. Architecture & Edge Cases Handling

### 3.1 Edge Case: Mid-Quiz Exit (Thoát giữa chừng khi chưa xong bài)
- **Kịch bản**: Người dùng bấm nút `(X)` trên header hoặc bấm nút Back vật lý Android.
- **Xử lý UX**:
  - Hiển thị dialog xác nhận:
    - Tiêu đề: *"Thoát bài luyện tập?"*
    - Nội dung: *"Tiến trình làm bài hiện tại sẽ không được lưu và bạn sẽ chưa nhận được XP."*
    - Nút 1: *"Tiếp tục học"* (Resume) -> Giữ nguyên câu hỏi hiện tại.
    - Nút 2: *"Rời đi"* (Exit) -> Hủy quiz, không ghi nhận XP hay hoàn thành vào Supabase, quay về danh sách Practice.

### 3.2 Edge Case: Phân loại kết quả & Tính điểm XP (Scoring & Rewards Matrix)

| Kết quả | Tỉ lệ đúng | Mascot / Visual | Tiêu đề & Thông điệp | Cách tính XP | Trạng thái ghi nhận |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hoàn hảo (Perfect)** | 100% (ví dụ: 3/3) | `images.lumiCelebration` (Ăn mừng) | *"Tuyệt đỉnh! 🌟"*<br>*"Bạn đã trả lời chính xác tất cả các câu hỏi!"* | **100% XP bài học** (VD: +10 XP) | `status = 'completed'`, tăng `xp_earned` và `daily_activity`. |
| **Đạt một phần (Partial)** | 50% - 99% (VD: 2/3, 1/2) | `images.lumiTutor` (Động viên) | *"Làm tốt lắm! 👍"*<br>*"Bạn đã nắm được phần lớn kiến thức, hãy tiếp tục phát huy!"* | **XP tính theo tỷ lệ câu đúng**<br>`Math.round(xp_reward * correctCount / totalCount)` (VD: +7 XP) | `status = 'completed'`, tăng `xp_earned` và `daily_activity`. |
| **Không đúng câu nào (Zero)** | 0% (VD: 0/3) | `images.lumiDefault` (An ủi) | *"Đừng nản lòng! 💪"*<br>*"Học ngoại ngữ cần sự kiên trì. Hãy thử lại nhé!"* | **+0 XP**<br>(Gợi ý: "Luyện tập lại để nhận trọn điểm XP") | `attempts + 1`, không tăng XP. Có thêm nút **"Luyện tập lại" (Try Again)** ngay trên modal. |

### 3.3 Edge Case: Lỗi dữ liệu & Ngoại lệ mạng
1. **Bài học không có câu hỏi trắc nghiệm (`activitiesCount === 0`)**:
   - Thẻ bài học hiển thị badge `Chưa có câu hỏi`, vô hiệu hóa nút hoặc hiển thị thông báo rỗng thân thiện.
2. **Dữ liệu JSONB bị thiếu hoặc lỗi format**:
   - Có hàm an toàn `sanitizeMultipleChoiceData(raw)`: Kiểm tra `question`, `options` (tối thiểu 2 options), `correctIndex` hợp lệ. Nếu lỗi thì bỏ qua câu lỗi, không làm crash ứng dụng.
3. **Lỗi mạng khi lưu kết quả lên Supabase**:
   - Bắt lỗi trong khối try/catch, thông báo toast nhẹ nhàng, không block giao diện làm treo máy người dùng.
4. **Luyện tập lại nhiều lần (Re-practice)**:
   - Cho phép làm lại không giới hạn.
   - RPC Supabase `record_lesson_progress` đảm bảo tính toán `xp_delta = GREATEST(0, p_xp_earned - old_xp)` để tránh spam điểm.

---

## 4. Detailed Component & Hook Specifications

### 4.1 `lib/api.ts`
- `getMultipleChoiceActivities(lessonId: string): Promise<ActivityRow[]>`
- `getPracticeLessons(unitId: string): Promise<PracticeLessonItem[]>`

### 4.2 `hooks/usePracticeData.ts`
- `practiceLessons`: Danh sách bài tập kèm số lượng câu hỏi trắc nghiệm.
- `loading`, `refreshing`, `error`, `refresh()`.

### 4.3 `hooks/useMultipleChoiceQuiz.ts`
- State: `currentIndex`, `selectedOption`, `isAnswerChecked`, `isCorrect`, `correctAnswersCount`, `isQuizFinished`, `isExitConfirmVisible`.
- Actions: `selectOption(idx)`, `checkAnswer()`, `nextQuestion()`, `restartQuiz()`, `requestExit()`, `cancelExit()`, `confirmExit()`.

### 4.4 Components (`components/practice/`)
- `PracticeCard.tsx`: Thẻ bài học luyện tập NativeWind.
- `MultipleChoiceQuizModal.tsx`: Màn hình làm quiz (header progress, question, 4 option cards, bottom instant feedback sheet).
- `QuizCompletionModal.tsx`: Modal tổng kết kết quả tái sử dụng thiết kế với mascot `lumiCelebration` / `lumiTutor`, huy hiệu XP, phân cấp thông điệp theo tỷ lệ đúng/sai và nút Luyện tập lại/Hoàn thành.
- `QuizExitConfirmDialog.tsx`: Dialog xác nhận thoát giữa chừng.

---

## 5. Testing Strategy

1. **Unit Tests**:
   - `useMultipleChoiceQuiz.test.ts`: Test chọn đáp án, kiểm tra đúng/sai, tính điểm tỉ lệ (100%, một phần, 0%), xử lý thoát giữa chừng.
   - `usePracticeData.test.ts`: Test tải dữ liệu, xử lý lỗi mạng, pull-to-refresh.
   - `api.test.ts`: Test các query Supabase `getMultipleChoiceActivities`, `getPracticeLessons`.
2. **Component Tests**:
   - `PracticeCard.test.tsx`, `MultipleChoiceQuizModal.test.tsx`, `QuizCompletionModal.test.tsx`.
3. **Integration Tests**:
   - `learn.test.tsx`: Test chuyển tab Practice, danh sách bài học, mở modal, hoàn thành nhận XP và trường hợp thoát bài.
