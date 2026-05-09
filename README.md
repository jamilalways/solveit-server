# SolveIt — Backend API Server

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.6-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Storage-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**The full-stack backend powering SolveIt — Bangladesh's Problem Solving Marketplace**

[🌐 Live API](https://solveit-server.onrender.com/api/health) · [🖥️ Frontend Repo](https://github.com/jamilalways/solveit-client) · [🌍 Live Site](https://solveit-place.vercel.app)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Security](#-security)
- [Author](#-author)

---

## 🚀 About the Project

This repository contains the **Node.js + Express.js backend API** for **SolveIt** — a two-sided Problem Solving Marketplace where Clients post problems and Solvers bid to resolve them in exchange for payment.

The backend handles:
- 🔐 JWT-based authentication and role-based access control
- 📋 Problem, bid, and contract lifecycle management
- 💰 Secure escrow wallet payment system
- 💬 Real-time chat via Socket.io
- 📧 Transactional email via Nodemailer
- 📁 File storage via Cloudinary
- 🛡️ Admin governance and dispute resolution

**Frontend Repository:** [solveit-client](https://github.com/jamilalways/solveit-client)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based register, login, role guard (Client / Solver / Admin) |
| 📋 **Problem Management** | Full CRUD with file attachments, search, filter, and pagination |
| 📨 **Bidding System** | Submit proposals, accept/reject bids, auto-contract creation |
| 💰 **Escrow Payments** | Wallet deposit/withdraw, escrow lock/release, transaction history |
| 💬 **Real-Time Chat** | Socket.io private rooms per contract with message persistence |
| ⭐ **Reviews & Badges** | Post-contract reviews, auto badge recalculation (5 levels) |
| 🔔 **Notifications** | In-app real-time + email notifications for all key events |
| ⚖️ **Dispute System** | Client/solver disputes with admin resolution authority |
| 🛡️ **Admin Dashboard** | Platform analytics, user ban/unban, content moderation |
| 🔒 **Security** | Helmet, CORS, rate limiting, input validation, bcrypt hashing |

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18.x |
| Database | MongoDB + Mongoose | 6.0+ |
| Real-time | Socket.io | 4.6.x |
| Authentication | jsonwebtoken | 9.0.x |
| Password Hashing | bcryptjs | 2.4.x |
| File Upload | Multer + Cloudinary | 1.4.x / v2 |
| Email | Nodemailer | 6.9.x |
| Security | Helmet.js | 7.1.x |
| Rate Limiting | express-rate-limit | 7.1.x |
| Validation | express-validator | 7.0.x |
| Logging | Morgan | 1.10.x |
| Dev Server | Nodemon | 3.0.x |

---

## 📁 Project Structure

```
solveit-server/
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB Atlas connection
│   │   ├── cloudinary.js       # Cloudinary + Multer setup (with local fallback)
│   │   └── mail.js             # Nodemailer SMTP transporter
│   │
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + restrictTo role guard
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── rateLimiter.js      # Auth rate limiting (10 req/15 min)
│   │   └── validate.js         # express-validator error handler
│   │
│   ├── models/
│   │   ├── User.js             # User schema (name, email, role, badge, skills)
│   │   ├── Problem.js          # Problem schema (title, budget, deadline, files)
│   │   ├── Bid.js              # Bid schema (proposedPrice, deliveryDays, message)
│   │   ├── Contract.js         # Contract schema (escrow, solution, status)
│   │   ├── Wallet.js           # Wallet schema (balance, escrowBalance)
│   │   ├── Transaction.js      # Transaction history schema
│   │   ├── Message.js          # Chat message schema
│   │   ├── Notification.js     # In-app notification schema
│   │   ├── Review.js           # Review + rating schema
│   │   └── Dispute.js          # Dispute schema with resolution
│   │
│   ├── controllers/
│   │   ├── auth.controller.js          # register, login, getMe, logout
│   │   ├── user.controller.js          # getProfile, updateProfile
│   │   ├── problem.controller.js       # CRUD + getMyProblems
│   │   ├── bid.controller.js           # submitBid, getBids, acceptBid, rejectBid
│   │   ├── contract.controller.js      # getContracts, submitSolution, completeContract
│   │   ├── payment.controller.js       # getWallet, deposit, withdraw, lockEscrow
│   │   ├── chat.controller.js          # getMessages, sendMessage
│   │   ├── review.controller.js        # createReview, getUserReviews
│   │   ├── dispute.controller.js       # createDispute, getAllDisputes, resolveDispute
│   │   ├── notification.controller.js  # getNotifications, markAllRead
│   │   └── admin.controller.js         # getStats, getAllUsers, toggleBan, getDisputes
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── problem.routes.js
│   │   ├── bid.routes.js
│   │   ├── contract.routes.js
│   │   ├── payment.routes.js
│   │   ├── wallet.routes.js
│   │   ├── chat.routes.js
│   │   ├── review.routes.js
│   │   ├── dispute.routes.js
│   │   ├── notification.routes.js
│   │   └── admin.routes.js
│   │
│   ├── services/
│   │   ├── escrow.service.js           # Lock and release escrow funds
│   │   ├── notification.service.js     # Create and emit notifications
│   │   └── badge.service.js            # Recalculate solver badge level
│   │
│   ├── sockets/
│   │   └── socket.js                   # Socket.io server, rooms, chat, notifications
│   │
│   ├── utils/
│   │   ├── jwt.js                      # signToken, verifyToken helpers
│   │   ├── response.js                 # sendSuccess, sendError, catchAsync
│   │   └── emailTemplates.js           # HTML email templates
│   │
│   └── server.js                       # Entry point — Express + HTTP + Socket.io
│
├── uploads/                            # Local file fallback (when Cloudinary not set)
├── .env.example                        # Environment variable template
├── .gitignore
├── package.json
├── render.yaml                         # Render deployment config
└── README.md
```

---

## 🗄️ Database Design

The system uses **10 MongoDB collections** with the following relationships:

```
Users ──────┬──── Problems (client posts)
            ├──── Bids (solver submits)
            ├──── Reviews (reviewer/reviewee)
            └──── Wallets (one-to-one)

Problems ───┬──── Bids (one-to-many)
            └──── Contracts (one-to-one after bid accept)

Contracts ──┬──── Transactions (payment records)
            ├──── Messages (chat history)
            └──── Disputes (if raised)
```

**Key Indexes:**
- `Users` — email (unique), role
- `Problems` — category+status (compound), text index on title+description
- `Bids` — problem+solver (unique compound)
- `Contracts` — client, solver
- `Messages` — contract+createdAt

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login, receive JWT |
| `GET` | `/api/auth/me` | JWT | Get current user |
| `POST` | `/api/auth/logout` | JWT | Logout |

### Problems
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/problems` | No | List problems (search, filter, sort) |
| `POST` | `/api/problems` | Client | Create problem with file upload |
| `GET` | `/api/problems/mine` | Client | Get own problems only |
| `GET` | `/api/problems/:id` | No | Problem detail + bids |
| `PUT` | `/api/problems/:id` | Client | Edit open problem |
| `DELETE` | `/api/problems/:id` | Client | Delete problem |

### Bids
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/problems/:id/bids` | Solver | Submit proposal |
| `GET` | `/api/problems/:id/bids` | Client | View all bids |
| `PUT` | `/api/bids/:id/accept` | Client | Accept bid → create contract |
| `PUT` | `/api/bids/:id/reject` | Client | Reject bid |

### Contracts & Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/contracts` | JWT | My contracts |
| `GET` | `/api/contracts/:id` | JWT | Contract detail |
| `POST` | `/api/contracts/:id/submit` | Solver | Upload solution files |
| `PUT` | `/api/contracts/:id/complete` | Client | Release escrow payment |
| `GET` | `/api/wallet` | JWT | Wallet balance + history |
| `POST` | `/api/wallet/deposit` | JWT | Deposit funds |
| `POST` | `/api/wallet/withdraw` | JWT | Withdraw funds |
| `POST` | `/api/payments/escrow/:contractId` | Client | Lock funds in escrow |

### Chat, Reviews, Disputes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/chat/:contractId` | JWT | Load messages |
| `POST` | `/api/chat/:contractId` | JWT | Send message (REST fallback) |
| `POST` | `/api/reviews` | JWT | Submit review |
| `GET` | `/api/users/:id/reviews` | No | Get user reviews |
| `POST` | `/api/disputes` | JWT | Raise dispute |
| `PUT` | `/api/disputes/:id/resolve` | Admin | Resolve dispute |
| `GET` | `/api/notifications` | JWT | Get notifications |
| `PUT` | `/api/notifications/read` | JWT | Mark all read |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Platform analytics |
| `GET` | `/api/admin/users` | Admin | All users |
| `PUT` | `/api/admin/users/:id/ban` | Admin | Ban/unban user |
| `GET` | `/api/admin/disputes` | Admin | All disputes |
| `GET` | `/api/health` | No | Server health check |

---

## ⚡ Getting Started

### Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) v18 or higher
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free)
- A [Cloudinary](https://cloudinary.com/) account (free)

### 1. Clone the repository

```bash
git clone https://github.com/jamilalways/solveit-server.git
cd solveit-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values (see [Environment Variables](#-environment-variables) below).

### 4. Start the development server

```bash
npm run dev
```

You should see:

```
🚀 SolveIt server running on http://localhost:5000
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
📦 Environment: development
```

### 5. Test the API

Open your browser or Postman and visit:

```
http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "OK",
  "environment": "development",
  "time": "2026-04-16T..."
}
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory. Copy from `.env.example`:

```env
# ── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── MongoDB Atlas ─────────────────────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/solveit?retryWrites=true&w=majority

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# ── Frontend URL (for CORS) ───────────────────────────────
CLIENT_URL=http://localhost:5173

# ── Cloudinary (optional — uses local storage if empty) ───
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Email via Gmail SMTP ──────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_16_char_app_password
```

> ⚠️ **Never commit your `.env` file to GitHub.** It is already listed in `.gitignore`.

### Getting your credentials

| Credential | Where to get it |
|---|---|
| `MONGO_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |
| `CLOUDINARY_*` | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `MAIL_PASS` | Google Account → Security → 2FA → App Passwords |

---

## 🚀 Deployment

This backend is deployed on **[Render](https://render.com)** (free tier).

### Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your `solveit-server` GitHub repository
4. Configure:

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node src/server.js` |
| **Region** | Singapore |
| **Instance Type** | Free |

5. Add all environment variables in the **Environment** tab
6. Click **Create Web Service**

> ⚠️ **Note:** Render free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up. This is normal for the free plan.

---

## 🔒 Security

The following security measures are implemented:

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs with 12 salt rounds |
| Authentication | Stateless JWT (7-day expiry) |
| HTTP headers | Helmet.js (XSS, HSTS, CSP) |
| Rate limiting | 10 requests / 15 min on auth routes |
| Input validation | express-validator on all routes |
| CORS policy | Whitelist frontend origin only |
| NoSQL injection | mongo-sanitize on all inputs |
| Secrets management | Environment variables only — never hardcoded |

---

## 🏗️ Escrow Flow

```
1. Client deposits funds → Wallet balance increases
2. Client accepts bid   → Contract created (pending_payment)
3. Client locks escrow  → balance moves to escrow_balance
4. Solver works         → Submits solution files
5. Client approves      → escrow_balance → Solver wallet
6. Contract completed   → Both can leave reviews
```

If a dispute is raised, escrow funds remain locked until an Admin resolves it.

---

## 📊 Badge System

Solver badges are automatically recalculated after each review:

| Badge | Jobs Completed | Avg Rating |
|---|---|---|
| 🌱 Newcomer | 0+ | Any |
| ⭐ Rising Star | 3+ | 4.0+ |
| 🏅 Intermediate | 10+ | 4.2+ |
| 💎 Pro | 25+ | 4.5+ |
| 🏆 Expert | 50+ | 4.7+ |

---

## 🤝 Related Repository

| Repository | Description | Link |
|---|---|---|
| **solveit-client** | React.js frontend application | [GitHub](https://github.com/jamilalways/solveit-client) |
| **solveit-server** | Node.js backend API (this repo) | [GitHub](https://github.com/jamilalways/solveit-server) |

---

## 👨‍💻 Author

**Md. Jamil**

- 🌍 Live Site: [https://solveit-place.vercel.app](https://solveit-place.vercel.app)
- 💻 GitHub: [@jamilalways](https://github.com/jamilalways)
- 📧 Final Year CSE Project

---

## 📄 License

This project is developed as a **Final Year CSE Project** for academic purposes.

---

<div align="center">

Made with ❤️ by **Md. Jamil** — Final Year CSE Project

⭐ If you found this project helpful, please give it a star!

</div>
