# TEL Điểm danh & Lương

The English Lovers' attendance, tuition and payroll website: one shared site for the CEO, manager, reception and teachers.
It is a static site (no build step, any static host: Cloudflare Pages, Vercel…), with sign-in and data on **Supabase**.
All TEL data lives in its own database section, the `tel` schema, so the Supabase project can also hold another app without the two mixing.

## Who sees what

| Role | Sees | Can change |
|---|---|---|
| **CEO** (the owner email added in step 2) | Everything | Everything, incl. pay rates and settings |
| **Manager** | Attendance, classes, students & tuition, every teacher's hours and pay | Attendance, classes, students, bonuses, "paid" marks, roles. **Not** pay rates or pay settings |
| **Reception** | Attendance, make-up videos, classes, students & tuition | Same. **No pay** |
| **Teacher** | Only their own classes, and their own payslips once sent | Attendance for their own classes on the lesson day |

These rules live in the database (`supabase/schema.sql`), so they hold even if someone edits the web page.

## First-time setup (about 15 minutes)

1. **Database rules.** In Supabase, open **SQL Editor → New query**. Paste all of `supabase/schema.sql` and press **Run**. Then go to **Project Settings → API → Exposed schemas**, add `tel`, and Save.
2. **Owner + current data.** In a new query, paste `seed.sql`, which Claude sent you separately, and press **Run**. It sets your email as the CEO and loads the centre's data. It isn't in this repo because it holds names and pay settings.
3. **Sign-in settings.** Go to **Authentication → Sign In / Providers → Email** and turn **off** "Confirm email". You approve every new account in *Phân quyền* anyway, and Supabase's free email allowance is small.
4. **Connect the site to the database.** Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key into `config.js` (edit it on GitHub with the pencil icon, then Commit).
5. **Publish.** On Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick this repo, leave the build command empty, Deploy. (On Vercel: Add New → Project, Framework Preset **Other**, Deploy.)
6. **Password-reset links.** In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to the site's address (e.g. `https://tel-app.pages.dev`).
7. **First sign-in.** Open the site and choose **Tạo tài khoản** with the owner email. You are the CEO.
8. **Staff.** Send staff the link. They create an account, then you (or the manager) open **Phân quyền** and give each person a role. For teachers, also pick their teacher name: their classes move into their account automatically.

## Everyday

- **Backups:** CEO → **Cài đặt → Tải file sao lưu** downloads every TEL record as one file. Do it weekly and keep it in Google Drive.
- **Safety checks:** the site checks it is talking to the TEL database before loading, and the database refuses any record that isn't a TEL record.

- **Payslips:** **Lương → Gửi phiếu lương cho giáo viên** sends each teacher their month. Sending again updates the payslip. Teachers see it under **Lương của tôi**.
- **Updates:** Claude pushes changes to this repo, and Vercel publishes them within a minute.

## Files

- `index.html`: the app
- `tel-supabase.js`: sign-in screen and data layer (reads and writes `public.tel_docs`, with live updates)
- `config.js`: your Supabase address and public key
- `supabase/schema.sql`: table, roles and access rules (safe to run again)
- `vercel.json`: hosting settings
