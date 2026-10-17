# راهنمای آنلاین کردن سایت (رایگان)

| بخش                  | کجا    | آدرس نهایی (نمونه)                       |
| -------------------- | ------ | ---------------------------------------- |
| سایت (Next.js)       | Vercel | `https://safari-beauty-salon.vercel.app` |
| سرور (NestJS API)    | Render | `https://safari-api.onrender.com`        |
| دیتابیس (PostgreSQL) | Neon   | فقط Render و شما به آن وصل می‌شوید       |

هر سه سرویس با **حساب GitHub** ثبت‌نام می‌شوند. ترتیب مهم است: **GitHub ← Neon ← Render ← داده‌های اولیه ← Vercel**.

---

## ۱. گذاشتن کد روی GitHub

1. در github.com یک مخزن **خصوصی (Private)** به نام `safari-beauty-salon` بسازید. تیک README و ‎.gitignore را **نزنید**.
2. در پوشهٔ پروژه (PowerShell):

```powershell
git remote add origin https://github.com/<نام-کاربری-شما>/safari-beauty-salon.git
git push -u origin main
```

بار اول ویندوز یک پنجره برای ورود به GitHub باز می‌کند.

## ۲. دیتابیس روی Neon

1. در neon.com با GitHub ثبت‌نام کنید (کارت لازم نیست).
2. **New Project** ← نام: `safari`، نسخهٔ Postgres: **17**، منطقه: **AWS Europe Central 1 (Frankfurt)**.
3. **Connect** را بزنید، گزینهٔ **Connection pooling را خاموش کنید** و آدرس اتصال را کپی کنید. شبیه این است:
   `postgresql://...@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

این آدرس رمز دیتابیس است؛ جایی منتشرش نکنید.

## ۳. سرور روی Render

1. در render.com با GitHub ثبت‌نام کنید.
2. **New ← Blueprint** ← مخزن `safari-beauty-salon` را انتخاب کنید. Render فایل `render.yaml` را می‌خواند.
3. برای `DATABASE_URL` آدرس Neon (مرحلهٔ ۲) را بچسبانید و **Apply** بزنید. کلیدهای امنیتی (JWT) را خود Render می‌سازد.
4. ساخت حدود ۵ دقیقه طول می‌کشد. بعد این آدرس را باز کنید؛ باید `ok` ببینید:
   `https://safari-api.onrender.com/api/health`

اگر Render اسم دیگری داد (مثلاً `safari-api-x1y2`)، در مرحله‌های بعد همان را بنویسید.

## ۴. داده‌های اولیه (یک بار، از کامپیوتر خودتان)

حساب مدیر، خدمات و نمونهٔ آرایشگرها را می‌سازد. در پوشهٔ پروژه (PowerShell):

```powershell
$env:DATABASE_URL = "آدرس Neon از مرحلهٔ ۲"
$env:SEED_ADMIN_PHONE = "07XXXXXXXX"          # شمارهٔ موبایل خود مدیر
$env:SEED_ADMIN_PASSWORD = "یک رمز قوی و جدید"  # حداقل ۸ کاراکتر
pnpm --filter @safari/api db:deploy
pnpm --filter @safari/api db:seed
Remove-Item Env:DATABASE_URL, Env:SEED_ADMIN_PHONE, Env:SEED_ADMIN_PASSWORD
```

⚠️ این داده‌ها **نمونه** هستند: سه آرایشگر نمونه و چند نظر آزمایشی. قبل از معرفی سایت به مشتری‌های واقعی، در پنل ادمین آرایشگرهای نمونه را غیرفعال و نظرهای نمونه را پنهان کنید، و آرایشگرهای واقعی را اضافه کنید.

## ۵. سایت روی Vercel

1. در vercel.com با GitHub ثبت‌نام کنید.
2. **Add New ← Project** ← مخزن `safari-beauty-salon` ← **Import**.
3. **Root Directory** را روی `apps/web` بگذارید (دکمهٔ Edit).
4. نام پروژه: `safari-beauty-salon`.
5. در **Environment Variables** اضافه کنید (بدون `/` در آخر):

   | Key                | Value                             |
   | ------------------ | --------------------------------- |
   | `API_INTERNAL_URL` | `https://safari-api.onrender.com` |

6. **Deploy** بزنید. قبلش آدرس health مرحلهٔ ۳ را یک بار باز کنید تا سرور بیدار باشد.

اگر آدرس سایت چیزی غیر از `https://safari-beauty-salon.vercel.app` شد: در Render ← `safari-api` ← **Environment** مقدار `WEB_ORIGIN` را به آدرس واقعی سایت تغییر دهید و ذخیره کنید.

## ۶. بیدار نگه داشتن سرور (رایگان)

سرور رایگان Render بعد از ۱۵ دقیقه بی‌کاری می‌خوابد و اولین بازدید بعدی ۳۰ تا ۶۰ ثانیه طول می‌کشد. برای جلوگیری:

1. در cron-job.org ثبت‌نام کنید.
2. **Create cronjob** ← آدرس: `https://safari-api.onrender.com/api/health` ← هر **۱۰ دقیقه**.

## ۷. امتحان نهایی

- صفحهٔ اصلی و «رزرو نوبت» باز می‌شوند و خدمات و آرایشگرها دیده می‌شوند.
- یک نوبت آزمایشی بگیرید و در پنل ادمین (`/admin/login`) ببینید، بعد لغوش کنید.

## به‌روزرسانی‌ها

هر بار که تغییری با `git push` روی GitHub برود، Render و Vercel خودشان نسخهٔ جدید را می‌سازند و منتشر می‌کنند.

## اگر مشکلی پیش آمد

| نشانه                                        | علت محتمل                 | راه‌حل                                                           |
| -------------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| «رزرو آنلاین موقتاً در دسترس نیست»           | سرور خوابیده یا خاموش است | آدرس health را باز کنید، یک دقیقه صبر کنید، صفحه را رفرش کنید    |
| ساخت در Render خطا می‌دهد                    |                           | متن Logs را بفرستید                                              |
| ورود به پنل نمی‌ماند / بیرون می‌اندازد       | آدرس اشتباه               | `API_INTERNAL_URL` در Vercel و `WEB_ORIGIN` در Render را چک کنید |
| همه با هم پیام «تعداد درخواست زیاد» می‌گیرند | تنظیم پراکسی              | مقدار `TRUST_PROXY_HOPS` در Render را بررسی کنید                 |

## روزی که رزرو واقعی شروع شد

- در Render، پلن `safari-api` را به **Starter** (حدود ۷ دلار در ماه) ببرید؛ دیگر نمی‌خوابد و cron-job.org لازم نیست.
- پلن رایگان Vercel طبق قوانینش برای استفادهٔ غیرتجاری است؛ آن روز یا سایت را هم به Render می‌بریم یا پلن پولی Vercel را می‌گیرید.
