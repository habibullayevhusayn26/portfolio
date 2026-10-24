# Admin panelni sozlash

Portfolio sahifasi va admin panel Supabase orqali ishlarni saqlaydi. Loyiha URL'i va `anon` kaliti kiritilmaguncha admin panel ishlamaydi; bu ma'lumotlar `js/supabase-config.js` faylida bo‘sh qoldirilgan.

## Supabase loyihasini tayyorlash

1. Supabase'da yangi loyiha yarating.
2. `SQL Editor`'da `supabase/schema.sql` faylining mazmunini ochib, `ADMIN_EMAIL_CHANGE_ME` qiymatini admin hisobingizning haqiqiy emailiga almashtiring va SQL'ni bajaring. SQL'ni qayta ishlatsangiz ham siyosatlar xavfsiz tarzda yangilanadi.
3. `Authentication` → `Users` bo‘limidan o‘zingiz uchun email/parol bilan admin foydalanuvchi yarating. Ochiq ro‘yxatdan o‘tishni yoqmang.
4. `Project Settings` → `API` bo‘limidan project URL va **anon/public** kalitni oling. `service_role` yoki secret key'ni hech qachon brauzerga qo‘ymang.
5. `js/supabase-config.js` ichiga qiymatlarni kiriting:

   ```js
   export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
   export const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";
   export const ADMIN_EMAIL = "admin-emailingiz@example.com";
   ```

   `ADMIN_EMAIL` SQL siyosatlaridagi email bilan aynan bir xil bo‘lishi kerak. Anon kalit brauzerda ishlatiladi; ma'lumotlar xavfsizligini RLS siyosatlari ta'minlaydi.
6. Saytni `file://` orqali emas, Live Server yoki HTTPS qo‘llaydigan hosting orqali oching. Masalan, VS Code'da `index.html` ustida **Open with Live Server** tanlang.
7. `admin.html` sahifasiga o‘tib, admin email va paroli bilan kiring. Yangi ish qo‘shish, tahrirlash, o‘chirish, rasm yuklash va ishni qoralama sifatida saqlash mumkin. Faqat e'lon qilingan ishlar `ishlarim.html` sahifasida ko‘rinadi.

`admin.html` manzilini yashirishning o‘zi xavfsizlik emas: haqiqiy kirish nazorati Supabase Auth va `supabase/schema.sql` dagi email bilan cheklangan RLS siyosatlari orqali amalga oshadi.
