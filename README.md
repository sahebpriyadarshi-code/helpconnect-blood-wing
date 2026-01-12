# HelpConnect Blood Wing (v1)

> **Emergency Blood Coordination System** - *Now with "Graffiti & Gradients" Aesthetic* 🎨🩸

![V1 UI](https://placehold.co/1200x600/e11d48/ffffff?text=HelpConnect+Blood+Wing+v1)

## Overview

**HelpConnect Blood Wing** is a real-time, decentralized-style platform designed to bridge the gap between donors and recipients during critical emergencies.

In **Version 1**, we have overhauled the experience with a "Graffiti & Gradients" design language to make blood donation feel less clinical and more human, engaging, and urgent.

---

## 🚀 Key Features (v1)

### 🎨 "Eye-Catchy" UI/UX
- **Vibrant Aesthetic**: Deep Rose & Brilliant Orange gradients (`bg-gradient-to-r from-red-600 to-orange-500`).
- **Graffiti Elements**: Floating, animated background icons (`O+`, `Heart`, `Droplet`) that give the app a unique "street charm".
- **Glassmorphism**: Frosted glass cards and containers for a modern, premium feel.

### ⚡ Real-Time Coordination
- **Instant Matching**: Automatically filters compatible donors based on blood type rules (e.g., O- to everyone).
- **Live Updates**: Uses **Supabase Realtime** to update dashboards instantly when requests are created or accepted.
- **Status Tracking**: Track requests from `Pending` -> `Matched` -> `Fulfilled`.

### 📧 Intelligent Notifications
- **Automated Emails**: Powered by **Supabase Edge Functions** and **Resend**.
- **Instant Alerts**: Donors receive emails with recipient details immediately upon matching.

### 👤 Advanced Donor Management
- **Strict Filtering**: Donors *only* see requests compatible with their specific blood type.
- **Availability Toggle**: One-click switch to go offline/online.
- **Request Management**: "My Requests" dashboard with card minimization and discard options.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), TypeScript
- **Styling**: Tailwind CSS, Framer Motion (Animations), Lucide React (Icons)
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email & Internet Identity)
- **Serverless**: Supabase Edge Functions (Deno)
- **Notifications**: Resend API

---

## 📦 Project Structure

```
src/
├── components/         # Reusable UI components (Glass cards, Buttons)
├── hooks/             # Custom React Query hooks (useDonors, useRequests)
├── lib/               # Supabase client & utilities
├── pages/             # Main application pages
│   ├── LandingPage.tsx        # Hero section with parallax
│   ├── DonorDashboardPage.tsx # "Donate Blood" (Graffiti background)
│   ├── RequestBloodPage.tsx   # "Request Blood" (Glass form)
│   └── StatusTrackingPage.tsx # "My Requests" (Status view)
├── App.tsx            # Routing & Layouts
└── main.tsx           # Entry point
supabase/
├── functions/         # Edge Functions (send-match-notification)
└── migrations/        # SQL schemas for Donors/Requests tables
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/sahebpriyadarshi-code/helpconnect-blood-wing.git
    cd helpconnect-blood-wing
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

---

## 🌍 Deployment

### Vercel / Netlify
This project is optimized for Vercel and Netlify.
1.  Import repository.
2.  Set Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3.  Deploy! (SPA routing is handled via `vercel.json` or `_redirects`).

---

## 🤝 Contributing

We welcome contributions! Please see `CONTRIBUTING.md` (if available) or simply fork and submit a PR.

---

**Built with ❤️ for saving lives.**
