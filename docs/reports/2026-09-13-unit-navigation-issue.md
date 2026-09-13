# Issue Report — Learn tab chỉ hiển thị Unit 1 (không chuyển được unit)

**Ngày phát hiện:** 2026-09-13
**Mức độ:** Cao (blocking) — người dùng không thể học Unit 2+ trong app
**Ảnh hưởng:** tất cả ngôn ngữ (en / es / fr / ko)

---

## 1. Triệu chứng

- Mở app, vào tab **Learn** (hoặc **Practice**) → chỉ thấy 2 lesson của **Unit 1**, dù database đã có đầy đủ Unit 2 và Unit 3 (vừa seed).
- Test với tiếng Tây Ban Nha: vào lesson AI cũng chỉ có 2 bài của Unit 1.
- Unit khác chỉ "tiếp cận" được gián tiếp qua nút **Continue** trên Dashboard (do dashboard tự duyệt tuần tự mọi unit để tìm lesson cần học tiếp).

## 2. Nguyên nhân gốc

Learn/Practice tab **hardcode activeUnit = unit đầu tiên** và không có UI để chuyển unit:

| Vị trí code | Vấn đề |
|---|---|
| `hooks/useLessonsData.ts:10-12` | `getInitialActiveUnit()` luôn trả `units[0]` |
| `hooks/useLessonsData.ts:42-43` | Chỉ fetch lessons của `units[0]`: `getLessonsWithProgress(activeUnit.id)` — lessons unit khác không bao giờ được load |
| `hooks/usePracticeData.ts:25-26, 88-93` | Cùng pattern: `getInitialActiveUnit(fetchedUnits)` → `getPracticeLessons(firstUnit.id)` |
| `app/(tabs)/learn.tsx:117-120` | `UnitHeader` render `activeUnit` nhưng `onBackPress` / `onBookmarkPress` không được wire sang logic đổi unit — không có bất kỳ control nào để chuyển unit |

Data layer hoàn toàn bình thường: `getUnitsFromDB(languageId)` (`lib/api.ts:205`) đã lấy đủ mọi unit, có `.order('order')` — chỉ là UI không dùng tới ngoài unit đầu.

Ngược lại, Dashboard dùng `findContinueLesson()` (`lib/dashboardHelpers.ts:79`) duyệt **tuần tự mọi unit** để tìm lesson `in_progress` / `not_started` đầu tiên — nên hai màn hình này "hiểu" tiến độ khác nhau, gây mất nhất quán.

**Kết luận:** đây là lỗ hổng thiết kế có từ đầu dự án (Unit 1 là unit duy nhất được cân nhắc khi làm UI). Việc seed thêm Unit 2/3 chỉ làm vấn đề lộ rõ.

## 3. Hướng sửa

### Option A — Fix tối thiểu (khuyên dùng cho capstone)

1. **Smart default unit:** `getInitialActiveUnit` đổi thành "trả về unit chưa hoàn thành đầu tiên" (đã xong hết thì trả unit cuối) — đồng bộ logic với `findContinueLesson` của Dashboard.
   - Chỉ cần fetch lessons của mọi unit với 1 query `.in('unit_id', unitIds)` thay vì `.eq` theo 1 unit.
2. **Unit navigation:** wire 2 chevron trên `UnitHeader` thành nút **Previous / Next unit**, disable khi hết ranh giới.
3. **Unit locking (tuỳ chọn):** unit N+1 bị khoá (icon 🔒) cho tới khi hoàn thành hết unit N — đúng mô hình Duolingo, tránh learner nhảy cóc sai trình tự độ khó.

- **Chi phí:** ~3 file (`useLessonsData.ts`, `usePracticeData.ts`, `learn.tsx` + `UnitHeader.tsx`); không đổi schema, không đổi RLS.
- **Rủi ro:** thấp; cần cập nhật test hiện có (`__tests__/hooks/useLessonsData.test.ts`, `useDashboardData.test.ts`).

### Option B — Duolingo-style path (đẹp hơn, nặng hơn)

Một learning path liền mạch: lessons của mọi unit render trong 1 danh sách, header unit xen kẽ, tự scroll tới lesson hiện tại.
- **Chi phí:** redesign màn Learn + state scroll position; dễ phát sinh regression.
- Phù hợp nếu còn thời gian sau khi đã ổn định các feature chính.

### Khuyến nghị

**Làm Option A (bao gồm luôn bước locking nếu kịp).** Nó sửa đúng gốc issue bằng thay đổi nhỏ, giữ scope an toàn cho deadline capstone; Option B để dành như enhancement nếu hội đồng đánh giá cao và còn thời gian.

## 4. Kế hoạch kiểm thử sau fix

1. Learn tab mở lên → active unit là unit chưa hoàn thành đầu tiên (không phải luôn Unit 1).
2. Bấm Next/Prev unit → danh sách lesson đổi theo, progress bar (`x / y lessons`) đúng.
3. Học hết lesson Unit 1 → Unit 2 tự mở (hoặc hết khoá, tuỳ bước locking).
4. Dashboard "Continue" và Learn tab chỉ cùng 1 lesson hiện tại.
5. Practice tab hoạt động nhất quán trên unit đang chọn.
6. `npm run lint && npm run typecheck` + test suite pass.

---

**Ghi chú thêm:** bài học từ issue này — khi thêm content mới (Unit 3) cần verify cả đường đi UI của nó, vì data seed vào DB không đồng nghĩa màn hình hiển thị được.
