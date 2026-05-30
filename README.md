# Forever Yours

Personalised marriage proposal web app — Express API, MongoDB, vanilla HTML/CSS/JS frontend.

## Requirements

- **Node.js** 18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Local development

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   copy env.example .env
   ```

   Edit `.env` and set `MONGO_URI`.

3. Start MongoDB locally (or use Atlas URI in `.env`).

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open the URL printed in the terminal (usually `http://localhost:5000` or `5001` if 5000 is busy).

## Production deployment

The app is a **single Node process** that serves the API and static frontend.

### Environment variables (required in production)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `ALLOWED_ORIGINS` | Yes | Your public site URL, e.g. `https://foreveryours.com` |
| `PORT` | Usually set by host | Default `5000` |
| `PROPOSAL_TTL_HOURS` | No | Active link lifetime after passcode (default `24`) |
| `PROPOSAL_DRAFT_TTL_HOURS` | No | Draft lifetime without passcode (default `72`) |

**Never commit `.env`** — configure variables in your hosting dashboard.

### Start command

```bash
npm start
```

Set `NODE_ENV=production` on your host.

### Health check

```
GET /api/health
```

Use this for uptime monitors and load balancers.

### Deploy on Render

1. New **Web Service** → connect this repo.
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. **Environment:** add `NODE_ENV`, `MONGO_URI`, `ALLOWED_ORIGINS` (your Render URL, e.g. `https://forever-yours.onrender.com`).
5. Use MongoDB Atlas; add Render’s outbound IPs to Atlas network access if needed.

### Deploy on Railway

1. New project from repo.
2. Add variables: `NODE_ENV=production`, `MONGO_URI`, `ALLOWED_ORIGINS` (your Railway public URL).
3. Railway sets `PORT` automatically.
4. Start command: `npm start` (default).

### Deploy on a VPS (Ubuntu)

```bash
git clone <your-repo>
cd LoveXA
npm install --production
cp env.example .env   # then edit with production values
NODE_ENV=production node backend/server.js
```

Use **PM2** or **systemd** to keep the process running, and **nginx** as a reverse proxy with HTTPS (Let’s Encrypt).

### Before you go live

- [ ] MongoDB Atlas cluster created; `MONGO_URI` in host env
- [ ] `ALLOWED_ORIGINS` matches your exact public URL (https, no trailing slash)
- [ ] `NODE_ENV=production`
- [ ] `.env` is **not** in git
- [ ] Test full flow: create proposal → share link → passcode → accept → success page
- [ ] Atlas IP allowlist includes your host (or `0.0.0.0/0` for prototypes only)

## Project layout

```
LoveXA/
  backend/          API (Express + Mongoose)
  assets/           CSS, JS, music
  *.html            Pages (flat layout)
  index.html        Home
  package.json
  env.example       Template for .env
```

## License

Private / personal project — use and deploy as you own it.
