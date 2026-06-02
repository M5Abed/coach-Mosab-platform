<div align="center">

# 🏋️ Coach Mosab

**A premium fitness coaching platform built for personalized training and nutrition management.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-000?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## 📋 Overview

Coach Mosab is a full-stack coaching platform that enables fitness coaches to manage clients, build workout and nutrition plans, and deliver a premium subscriber experience — all through a 100% graphical, card-based interface with **zero raw text input**.

The platform supports **bilingual (English / Arabic)** interfaces with full RTL support.

---

## ✨ Features

### 🔐 Authentication & Access Control
- Supabase Auth with role-based routing (`admin` / `subscriber`)
- Protected routes with automatic redirects
- Registration with fitness profiling (goals, experience level)

### 👨‍💼 Admin Panel
| Feature | Description |
|---|---|
| **Client Manager** | View all subscribers, assign/remove plans, monitor profiles |
| **Plans Directory** | Create workout & nutrition template blueprints |
| **Workout Builder** | Day-based exercise cards with Sets, Reps, RIR, and Rest selectors |
| **Diet Builder** | Structured meal builder with macro target configuration |
| **Food Alternatives** | Global food swap reference (Protein / Carbs / Fats) visible to all subscribers |
| **Payments Log** | Track and manage subscription payments |
| **Payment Config** | Configure payment methods and pricing |
| **Video Manager** | Upload and organize instructional video content |

### 🏃 Subscriber Dashboard
| Feature | Description |
|---|---|
| **Dashboard** | Personalized overview with active plan summary and quick stats |
| **Workouts** | Multi-day workout plans with interactive exercise cards, difficulty indicators, and guided tips |
| **Nutrition** | Circular macro rings, structured meal cards, and a global food alternatives reference |
| **Video Library** | Browse and watch coach-uploaded instructional videos |
| **Progress Tracker** | Visual progress tracking with charts and body metrics |
| **Settings** | Profile management, language toggle, and preferences |

### 🎨 Design System
- **Dark-mode first** aesthetic with neon yellow (#E8FF00) accent
- **Bebas Neue** + **DM Sans** typography
- Glassmorphism cards with subtle glow effects
- Micro-animations and hover interactions
- Fully responsive (mobile, tablet, desktop)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router 7 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand 5 |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Auth + RLS) |
| **Animations** | Framer Motion, CSS transitions |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **PDF Export** | jsPDF |
| **Drag & Drop** | dnd-kit |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
coach-mosab/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── layout/          # Sidebar, TopBar, MobileNav
│   │   └── ui/              # Card, Badge, Button, Modal, Toast
│   ├── lib/                 # Supabase client configuration
│   ├── pages/
│   │   ├── admin/           # Admin panel pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageClients.jsx
│   │   │   ├── ManagePlans.jsx
│   │   │   ├── WorkoutBuilder.jsx
│   │   │   ├── DietBuilder.jsx
│   │   │   ├── FoodAlternatives.jsx
│   │   │   ├── ManagePayments.jsx
│   │   │   ├── PaymentConfig.jsx
│   │   │   └── VideoManager.jsx
│   │   ├── dashboard/       # Subscriber pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Workouts.jsx
│   │   │   ├── WorkoutPlanDetail.jsx
│   │   │   ├── WorkoutDay.jsx
│   │   │   ├── Nutrition.jsx
│   │   │   ├── VideoLibrary.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── Progress.jsx
│   │   │   └── Settings.jsx
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Payment.jsx
│   ├── routes/              # Route guards (Private, Public)
│   ├── store/               # Zustand stores (auth, language, toast)
│   ├── utils/               # Parsers, translations, helpers
│   ├── App.jsx
│   └── index.css
├── supabase_schema.sql      # Database schema reference
├── vite.config.js
├── vercel.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- A **Supabase** project ([supabase.com](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/coach-mosab.git
cd coach-mosab

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the schema in your Supabase SQL Editor:

```bash
# Apply the schema
# Copy contents of supabase_schema.sql into Supabase SQL Editor and execute
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User profiles with role, fitness data, assigned plans |
| `plans` | Workout & nutrition plan templates with structured JSON data |
| `food_alternatives` | Global food swap reference (Protein / Carbs / Fats) |

All tables use **Row Level Security (RLS)** policies:
- Subscribers can only read their own data
- Admins have full CRUD access
- Food alternatives are readable by everyone

---

## 🌐 Deployment

The project is configured for **Vercel** deployment:

```bash
# Deploy to Vercel
vercel --prod
```

The `vercel.json` handles SPA routing rewrites automatically.

---

## 📜 License

This project is proprietary software. All rights reserved.

---

<div align="center">

**Built with ❤️ by Mohamed Abed**

</div>
