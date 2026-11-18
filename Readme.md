# ODD WARS — Real-Time Multiplayer Online Game

![Architecture](https://img.shields.io/badge/Architecture-Modular%20Full--Stack-blue)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20TailwindCSS-61DAFB)
![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

ODD WARS is an online multiplayer 2–4 player real-time game built with a modern full-stack architecture. The platform is designed from the ground up for server-authoritative game logic, low-latency real-time synchronization, modular matchmaking, and horizontal multi-instance scalability via Redis.

---

## 1. Project Directory Structure

```text
odd-wars/
├── client/                     # Frontend client (React + Vite + Tailwind CSS)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── assets/             # Asset files
│   │   │   ├── images/         # Game art and icons
│   │   │   ├── sounds/         # Audio clips and SFX
│   │   │   └── textures/       # Game surface and sprite textures
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Routed view pages (Home, Architecture, Rooms)
│   │   ├── layouts/            # Page layouts and chrome
│   │   ├── hooks/              # Custom React hooks (e.g. useSocket)
│   │   ├── services/           # API and Socket client services
│   │   ├── store/              # State management
│   │   ├── animations/         # GSAP & Framer Motion animation configs
│   │   ├── config/             # Client configuration and environment
│   │   ├── styles/             # Global CSS and Tailwind definitions
│   │   ├── utils/              # Helper utilities and constants
│   │   ├── App.jsx             # Root React component with routing
│   │   └── main.jsx            # React DOM mounting entry point
│   ├── .env.example            # Client environment template
│   ├── index.html              # HTML5 entry template
│   ├── package.json            # Client dependencies and build scripts
│   ├── postcss.config.js       # PostCSS config for Tailwind
│   ├── tailwind.config.js      # Tailwind CSS theme configuration
│   └── vite.config.js          # Vite build and dev server config
│
├── server/                     # Backend API & Real-time Game Server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Config loaders (env, database, redis)
│   │   ├── controllers/        # Express route handlers
│   │   ├── middleware/         # Auth, validation, error handling middleware
│   │   ├── models/             # Mongoose schemas (User, Room, Match)
│   │   ├── routes/             # REST route declarations
│   │   ├── sockets/            # Socket.IO connection and event dispatchers
│   │   ├── game-engine/        # Authoritative game state, loop, and physics/rules
│   │   ├── services/           # Business logic (Matchmaking, Rooms, Auth)
│   │   ├── utils/              # Structured logging and standard API responses
│   │   └── server.js           # Server bootstrap and lifecycle entry point
│   ├── .env.example            # Server environment template
│   └── package.json            # Server dependencies and lifecycle scripts
│
├── .gitignore                  # Root Git ignore rules
├── package.json                # Monorepo/Root task runner
└── README.md                   # Project documentation (this file)
```

---

## 2. Technology Stack

### Frontend (`client/`)
- **Core:** React 18, Vite 5, JavaScript (ESM)
- **Styling:** Tailwind CSS 3, PostCSS, Autoprefixer
- **Navigation:** React Router DOM (v6)
- **Animations:** GSAP 3, Framer Motion 11
- **Icons:** Lucide React
- **Real-Time Networking:** Socket.IO Client (v4)

### Backend (`server/`)
- **Runtime & Framework:** Node.js, Express 4 (ESM)
- **Real-Time Communication:** Socket.IO (v4)
- **Scalability & PubSub:** Redis Client (`redis` v4), `@socket.io/redis-adapter`
- **Persistence:** MongoDB via Mongoose
- **Security & Utilities:** Helmet, CORS, Dotenv, Zod, JsonWebToken, Google Auth Library, BcryptJS

---

## 3. Architectural Highlights

1. **Server-Authoritative Design:**
   Game state will be maintained and computed on the server inside `server/src/game-engine/` using a tick-based simulation loop. The client acts as a high-fps prediction and rendering engine.

2. **Zero-Crash Graceful Degradation in Development:**
   External persistence and caching services (MongoDB, Redis, Google OAuth) are **strictly optional** during initial development. If unconfigured or unreachable, the server boots in an isolated development mode, operates Socket.IO with an in-memory adapter, and surfaces clear diagnostic statuses via `/health`.

3. **Horizontal Scaling Foundation:**
   The Socket.IO architecture is wired to automatically attach `@socket.io/redis-adapter` when Redis credentials are provided. This allows multi-process / multi-container cluster distribution supporting 100+ concurrent players across instances.

---

## 4. Environment Configuration

### Client (`client/.env.example`)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Server (`server/.env.example`)
```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: MongoDB
MONGO_URI=

# Optional: Redis
REDIS_URL=

# Optional: Authentication
JWT_SECRET=supersecretdevjwtkey_change_in_production
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 5. Getting Started

### Installation
From the project root:
```bash
npm run install:all
```
Or install each module individually:
```bash
# Frontend
cd client && npm install

# Backend
cd ../server && npm install
```

### Running Development Servers

You can start both frontend and backend concurrently from the root directory:
```bash
npm run dev
```

Or run them in separate terminals:
```bash
# Terminal 1: Backend (Express + Socket.IO on port 5000)
npm run server

# Terminal 2: Frontend (Vite on port 5173)
npm run client
```

---

## 6. Verification Endpoints

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Socket.IO Status:** Connects automatically from frontend to [http://localhost:5000](http://localhost:5000)

---

## 7. Roadmap & Next Steps (Task 02)

- **Authentication & User Profiles:** Google OAuth integration with JWT session management and user stats models.
- **Lobby & Room Management:** Public matchmaking queue and private password-protected rooms (2–4 players).
- **Socket Event Protocols:** Strict schema-validated events for room creation, join, ready-state, and chat.
