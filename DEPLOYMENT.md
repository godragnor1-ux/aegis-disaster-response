# 🚀 Production Deployment Guide: AEGIS-PULSE (ResQ-Command)

This guide provides step-by-step instructions to deploy the full **AEGIS-PULSE (ResQ-Command)** platform across:
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Cloud Managed Database)
- **Backend API & WebSockets**: [Render](https://render.com) (Node.js Web Service)
- **Frontend App**: [Vercel](https://vercel.com) (Next.js Edge Network)

---

## 🏗️ Architecture Overview

```
[ Citizens & Rescuers ]
          │
          ▼
┌─────────────────────────┐
│   Vercel (Frontend)     │  Next.js 14 App Router (React, TailwindCSS, Framer Motion)
│ https://resq.vercel.app │
└───────────┬─────────────┘
            │  REST APIs & WebSocket Streams (Socket.IO)
            ▼
┌─────────────────────────┐
│     Render (Backend)    │  Express.js, AI Engines, Dynamic Routing, WebSockets
│ https://resq.onrender.com
└───────────┬─────────────┘
            │  Mongoose Connection Pool (TLS/SSL)
            ▼
┌─────────────────────────┐
│   MongoDB Atlas (Cloud) │  SOSBeacons, Incidents, Responders, Shelters, Users, Tasks
└─────────────────────────┘
```

---

## Step 1: Deploy Database on MongoDB Atlas

1. **Create Free M0 Cluster**:
   - Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Click **Create Database** ➔ Choose **M0 Free Tier** ➔ Select your preferred region (e.g. AWS / us-east-1).

2. **Create Database User**:
   - Go to **Database Access** ➔ Click **Add New Database User**.
   - Select **Password Authentication**.
   - Username: `aegis_admin`
   - Password: `<GENERATE_STRONG_PASSWORD>`
   - Role: `Read and write to any database`.

3. **Configure Network Access**:
   - Go to **Network Access** ➔ Click **Add IP Address**.
   - Select **Allow Access From Anywhere (`0.0.0.0/0`)** so Render backend instances can connect.

4. **Copy Connection String**:
   - Click **Connect** on your cluster ➔ Choose **Drivers (Node.js)**.
   - Copy the URI:
     ```
     mongodb+srv://aegis_admin:<PASSWORD>@cluster0.xxxxx.mongodb.net/resq-command?retryWrites=true&w=majority
     ```

---

## Step 2: Deploy Backend & WebSockets on Render

### Option A: Using Render Blueprint (Recommended)
1. Push your repository to **GitHub** / **GitLab**.
2. Log in to [Render](https://dashboard.render.com).
3. Click **New +** ➔ **Blueprint**.
4. Connect your repository. Render will automatically read `render.yaml`.
5. Set the required Environment Variables:
   - `MONGODB_URI`: Paste your MongoDB Atlas URI from Step 1.
   - `CLIENT_ORIGIN`: Your Vercel frontend URL (e.g. `https://resq-command.vercel.app`).
6. Click **Apply**. Render will build and deploy the backend with WebSockets enabled.

### Option B: Manual Web Service Setup
1. On Render, click **New +** ➔ **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `resq-command-backend`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)` or closest to your database
   - **Branch**: `main`
   - **Build Command**: `npm install && npm install --prefix backend`
   - **Start Command**: `node backend/server.js`
   - **Health Check Path**: `/api/health`
4. Add **Environment Variables**:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://...` |
   | `JWT_SECRET` | `<32_BYTE_SECRET_KEY>` |
   | `CLIENT_ORIGIN` | `https://resq-command.vercel.app` |
5. Click **Create Web Service**.
6. Copy your Render service URL (e.g. `https://resq-command-backend.onrender.com`).

---

## Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import your Git repository.
4. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click Edit ➔ select **`frontend`** (or leave as root if using `npm run build --prefix frontend`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add **Environment Variables**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_SERVER_URL` | `https://resq-command-backend.onrender.com` | Render REST API URL |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://resq-command-backend.onrender.com` | Render WebSocket URL |
   | `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.your_token...` *(Optional)* | For Satellite Recon Map |
6. Click **Deploy**.
7. Vercel will build the Next.js production bundle and assign your live URL (e.g. `https://resq-command.vercel.app`).

---

## Step 4: Post-Deployment Smoke Test & Verification

Once both services are deployed, test your live production deployment:

### 1. Verify Backend Health
```bash
curl https://resq-command-backend.onrender.com/api/health
# Response: {"status":"ONLINE","service":"ResQ-Command Real-Time Platform", ...}
```

### 2. Verify Database Connection & Seed Data
```bash
curl https://resq-command-backend.onrender.com/api/shelters
# Response: {"success":true,"count":3,"shelters":[...]}
```

### 3. Verify Frontend Real-Time Telemetry
1. Open your Vercel URL in your browser: `https://resq-command.vercel.app`.
2. Inspect the top navbar:
   - Connection status pill should display `🟢 WS LIVE (~25ms)`.
3. Open two browser windows side-by-side:
   - Trigger a **One-Tap SOS** in Window 1.
   - Observe instant visual update and audio chime in Window 2 without refreshing.

---

## Default Seeded Accounts (Production Ready)

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Commander / Admin** | `admin@aegis.gov` | `admin123` | Full Mission Control, Civil Defense Broadcasts, Auto-Dispatch |
| **First Responder** | `rescuer1@aegis.gov` | `rescuer123` | Task Execution, Fleet GPS Telemetry, Tactical Comms |
| **Citizen / Survivor** | `citizen@aegis.gov` | `citizen123` | One-Tap SOS, Sighting Tips, Safe Zone Navigation |
