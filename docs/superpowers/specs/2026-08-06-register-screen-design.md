# Register Screen — Design Spec

**Date:** 2026-08-06  
**Status:** Approved  
**Scope:** Màn hình đăng ký tài khoản bằng email/password

---

## 1. Goal

Cho phép người dùng mới tạo tài khoản bằng email và mật khẩu. Sau khi đăng ký thành công, người dùng được đăng nhập ngay và điều hướng vào màn hình chính (`/`).

---

## 2. Fields & Validation (Zod)

| Field | Rule | Error message |
|-------|------|---------------|
| email | `z.string().email()` | "Email không hợp lệ" |
| password | `z.string().min(8)` | "Mật khẩu tối thiểu 8 ký tự" |
| confirmPassword | phải khớp với `password` (`z.refine`) | "Mật khẩu nhập lại không khớp" |

Validation chỉ trigger khi người dùng nhấn **Đăng ký** (submit), không validate on-blur để tránh UX khó chịu.

---

## 3. Architecture

### Files mới
- `app/(auth)/register.tsx` — màn hình đăng ký (screen only, compose components)
- `components/auth/RegisterForm.tsx` — form component, chứa Zod schema + logic

### Files thay đổi
- `app/(auth)/login.tsx` — đổi link "Đăng ký ngay" từ push `/(auth)/login` → push `/(auth)/register`
- `app/(auth)/_layout.tsx` — thêm `register` vào Stack nếu cần (hoặc Expo Router auto-detect)

### Package mới
- `zod` — schema validation (chưa có trong `package.json`)

---

## 4. Data Flow

```
User nhập email/password/confirmPassword
        ↓
Nhấn "Đăng ký"
        ↓
Zod validate → lỗi? hiện inline error, dừng
        ↓ (pass)
supabase.auth.signUp({ email, password })
        ↓
Lỗi Supabase? (vd: email đã tồn tại) → Alert.alert()
        ↓ (success)
Supabase trả session → onAuthStateChange trong _layout.tsx fires
        ↓
router.replace('/') — vào app
```

---

## 5. UI / UX

- Giữ nguyên design language với `login.tsx`:
  - Background: `colors.deepIndigo`
  - Card: glassmorphism `rgba(234, 230, 255, 0.05)` với border mờ
  - Font: `PlusJakartaSans_*Bold/Medium`
  - Button: `colors.lumioCoral`, pill shape (`borderRadius: 9999`)
- Inline error hiển thị ngay dưới field vi phạm, màu `colors.lumioCoral`
- Loading spinner trên nút khi đang gọi Supabase
- Nút "Đã có tài khoản? Đăng nhập" ở cuối điều hướng về `/(auth)/login`

---

## 6. Error Handling

| Tình huống | Xử lý |
|-----------|-------|
| Field trống / không hợp lệ | Inline error dưới field |
| Mật khẩu không khớp | Inline error dưới `confirmPassword` |
| Email đã tồn tại | `Alert.alert('Lỗi', message)` |
| Lỗi mạng / Supabase khác | `Alert.alert('Lỗi', 'Đăng ký thất bại...')` |

---

## 7. Out of Scope

- Xác nhận email (email confirmation) — không yêu cầu
- Tên hiển thị / avatar — chỉ email + password
- Social signup — chỉ email flow (Google đã có ở SocialAuthGroup)
- Reset password flow
