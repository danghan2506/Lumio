# Lumio Auth & Login Screen Design Spec (Tiếng Việt)

**Ngày cập nhật:** 2026-08-04  
**Chủ đề:** Màn hình Đăng nhập Lumio (`app/(auth)/login.tsx`)  
**Quy chuẩn Thiết kế:** [`DESIGN.md`](file:///d:/projects/learning-language/DESIGN.md) & [`AGENTS.md`](file:///d:/projects/learning-language/AGENTS.md)

---

## 1. Tổng quan & Mục tiêu

Xây dựng màn hình Đăng nhập hoàn chỉnh bằng **Tiếng Việt** cho ứng dụng **Lumio**, khớp phong cách với màn hình Onboarding và thiết kế hệ thống (`DESIGN.md`).

- **Hình ảnh Linh vật**: Sử dụng `lumi-welcome.png` ở vị trí header chào mừng.
- **Xác thực chính**: Email + Mật khẩu qua Supabase Auth (`supabase.auth.signInWithPassword()`).
- **Social Login**: Nút "Đăng nhập bằng Google" (và Facebook) qua Supabase Auth (`supabase.auth.signInWithOAuth()`).
- **Route**: `app/(auth)/login.tsx`.

---

## 2. Giao diện Tiếng Việt & Design Tokens

| Phần tử UI | Nội dung Tiếng Việt | Token màu / Style |
|---|---|---|
| **Header Title** | Chào mừng quay lại! 👋 | `colors.cream` (`#FFFBF4`), Font Fredoka/Bold 24px |
| **Subtitle** | Đăng nhập để tiếp tục hành trình học tập | `colors.lavenderMist` (`#EAE6FF`), Font Plus Jakarta Sans |
| **Email Input** | Nhãn: `Địa chỉ Email`, Placeholder: `ban@example.com` | Slate border `rgba(94, 90, 128, 0.2)` |
| **Password Input** | Nhãn: `Mật khẩu`, Placeholder: `••••••••` | Icon Lock + Toggle ẩn/hiện mật khẩu |
| **Forgot Password** | Quên mật khẩu? | `colors.lumioCoral` (`#FF6B57`), Font 14px Medium |
| **Main Button** | Đăng nhập | Lumio Coral `#FF6B57` Pill button, Text `#FFFBF4` 16px Bold |
| **Divider** | hoặc tiếp tục với | Slate text `#5E5A80` |
| **Google Button** | Đăng nhập bằng Google | White Pill button + Google G Logo |
| **Footer Link** | Chưa có tài khoản? Đăng ký ngay | Link chuyển hướng sang màn ký tài khoản |

---

## 3. Bản vẽ Giao diện Mockup (Vietnamese UI)

Below is the updated Vietnamese UI design mockup with mascot `lumi-welcome`:

![Lumio Login Screen Mockup - Tiếng Việt](file:///C:/Users/Lenovo LOQ/.gemini/antigravity/brain/558f966e-8671-46e1-b9bc-d72e7237874a/lumio_login_vi_mockup_1785816023549.jpg)

---

## 4. Quản lý Supabase Project & Auth Configuration

- Client singleton tại `lib/supabase.ts`.
- Biến môi trường đặt tại `.env.local`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- OAuth Google setup qua Custom Scheme: `lumio://auth/callback`.
