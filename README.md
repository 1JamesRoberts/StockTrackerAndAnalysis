# Stock Tracker & Analysis App (Baht)

This repository contains a full-stack application with a React Native/Expo frontend and a Python (Flask) backend for managing user portfolios and transactions.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **Python** (v3.8+ recommended)
- **uv** (Astral's fast Python package installer: `pip install uv`)

---

## 🛠️ Setup Instructions

You will need to set up both the frontend and the backend independently.

### 1. Frontend Setup (React Native / Expo)
The frontend uses npm for dependency management.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```
*(If you encounter dependency conflicts, you can use `npm install --legacy-peer-deps`)*

### 2. Backend Setup (Flask)
The backend uses `uv` for lightning-fast Python dependency management and execution.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment using uv
uv venv

# Install the Python dependencies into the virtual environment
uv pip install -r requirements.txt
```
---

## 🚀 How to Run the App

To run the application, you need to start **both** the frontend and the backend servers at the same time. You will need two separate terminal windows.

### Terminal 1: Start the Backend Server
The frontend relies on the backend to fetch portfolio and transaction data. Keep this terminal running.

```bash
# Navigate to the backend directory
cd backend

# Run the server (uv automatically handles the virtual environment)
uv run app.py
```
*The backend will start running on `http://127.0.0.1:5000`.*

### Terminal 2: Start the Frontend App
Once the backend is running, you can start the Expo app.

**For Web:**
```bash
# Navigate to the frontend directory
cd frontend

# Start the frontend web app
npm run web
```
*The web app will start, and you can view it in your browser.*

**For Android Emulator (Native App):**
```bash
# Navigate to the frontend directory
cd frontend

# Compile the native code and install on the emulator
npm run android
```

> [!IMPORTANT]
> **Why `npm run android` instead of pressing 'a' in `npm run web`?**
> The project uses advanced libraries (like Reanimated and SVG) which contain custom C++/Java code. 
> - `npm run android`: **Compiles all the custom native code** into an Android app, installs it on your emulator, and then starts the JavaScript server.
> - `npm run web` (or `npx expo start`): **Only starts the JavaScript server**. If you just press `a` in this terminal without having built the native app first, it will try to launch Expo Go. Because Expo Go doesn't contain the custom native code for this app, the app will instantly crash with a `TurboModuleRegistry` error.

---

## ⚠️ Troubleshooting

**1. "Expo is not recognized" Error**
- Ensure you have run `npm install` in the `frontend` directory to generate the `node_modules` folder.

**2. Backend "SSL handshake failed" (MongoDB Error)**
- **Cause:** MongoDB Atlas blocks external connections by default.
- **Fix:** Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com), go to **Security > Network Access**, and add your current IP address (or `0.0.0.0/0` for testing).

**3. "ModuleNotFoundError" in Backend**
- Make sure you ran `uv pip install -r requirements.txt` inside the `backend` folder before running `uv run app.py`.
