# StyleMe — AI Hairstyle Try-On 💇‍♀️

A web app for trying on hairstyles using **Google nano-banana** via **Replicate**.

---

## 📁 Project structure

```txt
styleme/
├── backend/                 # Node.js server
│   ├── server.js           # Main file
│   ├── config.js           # Configuration
│   ├── package.json        # Dependencies
│   └── .env.example        # Secrets template
│
├── frontend/               # React app
│   ├── src/
│   │   ├── App.js          # Main component
│   │   ├── App.css         # Styles
│   │   ├── api.js          # API client
│   │   └── config.js       # Configuration
│   ├── public/
│   │   └── index.html
│   └── .env.example
│
├── .gitignore              # .env files should NOT go to Git
└── README.md
```

---

## 🔑 STEP 0: Get an API token (Replicate)

**Do this first!**

1. Go to https://replicate.com  
2. Sign in with GitHub  
3. Open **Account → API tokens**  
4. Copy your token (starts with `r8_...`)

**Cost:** ~$0.039 per photo

---

## 🚀 Step-by-step setup (Local)

### STEP 1: Install Node.js

1. Download Node.js 18+ from https://nodejs.org/
2. Verify:
```bash
node --version   # v18.x.x or higher
npm --version    # 9.x.x or higher
```

---

### STEP 2: Setup Backend

```bash
cd styleme/backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Paste YOUR token:
REPLICATE_API_TOKEN=r8_your_real_token_here
```

Run backend:
```bash
npm run dev
```

Health check:
- http://localhost:3001/health

---

### STEP 3: Setup Frontend

```bash
cd styleme/frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:3001
```

Run frontend:
```bash
npm start
```

Open:
- http://localhost:3000

---

## 🧠 GitHub (Push the project)

### 1) Create a repository

1. Go to https://github.com
2. **New repository** → name it `styleme`
3. Set **Private**
4. **Do NOT** add README
5. Create repository

### 2) Push code

From the root folder `styleme/`:

```bash
git init
git add .
git commit -m "Initial commit"

# Replace with YOUR URL:
git remote add origin https://github.com/YOUR_USERNAME/styleme.git
git branch -M main
git push -u origin main
```

### ⚠️ Security check

`.env` files must NOT be committed.

```bash
git status
```

---

## ☁️ Deploy Backend to Railway

### STEP 5.1: Sign up
1. Go to https://railway.app
2. Sign in with GitHub

### STEP 5.2: Deploy from GitHub
1. **New Project**
2. **Deploy from GitHub repo**
3. Select `styleme`
4. Choose folder: `backend`

### STEP 5.3: Add environment variables
Railway → **Variables**:

| Variable | Value |
|---------|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | (leave empty for now) |
| `REPLICATE_API_TOKEN` | `r8_your_token_here` |

### STEP 5.4: Get Railway URL
After deploy, you’ll get something like:
```
https://styleme-production-abc123.up.railway.app
```
Save it.

---

## 🌐 Deploy Frontend to Vercel

### STEP 6.1: Sign up
1. Go to https://vercel.com
2. Sign in with GitHub

### STEP 6.2: Import project
1. **Add New → Project**
2. Select repo `styleme`
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### STEP 6.3: Add environment variable (Vercel)
Set:
```
REACT_APP_API_URL = https://your-backend.railway.app
```

### STEP 6.4: Deploy
You’ll get a URL like:
```
https://styleme-xxx.vercel.app
```

---

## 🔗 Connect Frontend + Backend (CORS)

Go back to **Railway → Variables** and set:

```
FRONTEND_URL = https://styleme-xxx.vercel.app
```

Railway will redeploy automatically.

---

## ✅ Done

Your app is live:
- `https://styleme-xxx.vercel.app`

---

## 📱 Mobile App Options

### Option A: WebView (quick & simple)

**React Native:**
```javascript
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <WebView
      source={{ uri: 'https://styleme-xxx.vercel.app' }}
      allowsInlineMediaPlayback={true}
    />
  );
}
```

### Option B: Capacitor (full native wrapper)

```bash
cd frontend
npm install @capacitor/core @capacitor/cli
npx cap init StyleMe com.styleme.app
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios
```

---

## 💰 Costs

- **Replicate nano-banana:** ~$0.039 per photo
- **Railway:** Free tier (500 hours/month)
- **Vercel:** Free tier

---

## 🔧 Useful commands

### Backend
```bash
cd backend
npm run dev      # Development
npm start        # Production
```

### Frontend
```bash
cd frontend
npm start        # Development
npm run build    # Build
```

---

## ❓ Troubleshooting

### CORS error
Make sure `FRONTEND_URL` (Railway Variables) exactly matches your Vercel frontend URL.

### “API Key not configured”
Make sure `REPLICATE_API_TOKEN` exists in Railway Variables (and locally in `backend/.env` for local dev).

### Slow processing
Nano-banana can take 10–60 seconds per image. That’s normal.

---

Made with ❤️
