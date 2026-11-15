# File Vault - Personal Cloud Storage

A simple, free personal file storage app built with React, Supabase, and Vercel. Upload PDFs and images, access them from anywhere.

## Features

- 🔐 **Email/password authentication** (Supabase Auth)
- 📁 **Drag & drop upload** for PDFs and images (up to 50MB each)
- 🖼️ **File previews** - images display inline, PDFs show icons
- 🔍 **Search** files by name
- 📥 **Download** files with one click
- 🗑️ **Delete** files (with confirmation)
- ✅ **Multi-select** for batch operations
- 📱 **Responsive** - works on mobile and desktop
- 🌙 **Clean UI** with Tailwind CSS

## Free Tier Limits (Supabase + Vercel)

| Resource | Limit |
|----------|-------|
| Database (Postgres) | 500 MB |
| File Storage | 1 GB |
| Auth Users | Unlimited |
| Bandwidth (Vercel) | 100 GB/month |
| Functions (Supabase) | 500K invocations/month |

**~10,000 PDFs/images** fit in 1 GB free storage.

---

## Quick Deploy (5 minutes)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign up (free, GitHub/Google/email)
2. Click **"New Project"**
3. Choose organization, name it `file-vault`, set a **database password** (save it!)
4. Wait ~2 minutes for setup

### 2. Run Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy **entire contents** of `supabase-schema.sql` from this repo
4. Paste and click **"Run"**
5. Should see "Success. No rows returned"

### 3. Get Supabase Credentials

1. Go to **Settings** → **API** (left sidebar)
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 4. Deploy to Vercel

1. Push this folder to a **new GitHub repo** (or fork this)
2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repo
5. **Framework Preset:** Vite (auto-detected)
6. **Environment Variables** (expand section):
   - `VITE_SUPABASE_URL` = your Project URL from step 3
   - `VITE_SUPABASE_ANON_KEY` = your anon key from step 3
7. Click **"Deploy"**
8. Wait ~1 minute → **Your app is live!** 🎉

### 5. Test It

1. Open your Vercel URL (e.g., `https://file-vault-xxx.vercel.app`)
2. Click **"Sign Up"** → create account
3. Upload some PDFs/images
4. Open on your phone → same URL works!

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your credentials
cp .env.example .env

# 3. Start dev server
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
file-vault/
├── src/
│   ├── components/
│   │   ├── Auth.tsx          # Login/Signup form
│   │   └── Dashboard.tsx     # File grid, upload, actions
│   ├── lib/
│   │   └── supabase.ts       # Supabase client
│   ├── App.tsx               # Main app with auth state
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind + custom styles
├── supabase-schema.sql       # Run in Supabase SQL Editor
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

---

## Customization

### Change file size limit
Edit `supabase-schema.sql` (storage bucket `file_size_limit`) and `Dashboard.tsx` (dropzone `maxSize`)

### Add more file types
Update `allowed_mime_types` in `supabase-schema.sql` and `accept` in `Dashboard.tsx`

### Styling
Modify `tailwind.config.js` and component classNames

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Missing Supabase env vars" | Check Vercel project settings → Environment Variables |
| Upload fails | Check Supabase storage policies ran correctly |
| Files not showing | Check RLS policies on `files` table |
| Auth not working | Verify email confirmation is enabled in Supabase Auth settings |

---

## License

MIT - Free to use and modify.