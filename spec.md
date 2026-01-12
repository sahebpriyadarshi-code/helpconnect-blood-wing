# HelpConnect Blood Wing - Technical Specification (v1)

**Version**: 1.0 (Graffiti Update)
**Last Updated**: January 2026

---

## 1. Executive Summary
HelpConnect Blood Wing is a modern, real-time blood donation coordination platform. Version 1 transitions from a theoretical blockchain model to a practical, production-ready **Supabase** architecture, featuring a unique "Graffiti & Gradients" UI design to maximize user engagement.

## 2. System Architecture

### 2.1 Technology Stack
- **Frontend**: React 18, Vite, TypeScript
- **UI System**: Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Supabase (Baas)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Compute**: Supabase Edge Functions (Deno)

### 2.2 Data Flow
1.  **User Action**: User submits a "Request Blood" form.
2.  **Database Write**: Request is saved to `blood_requests` table via Supabase Client.
3.  **Realtime Trigger**:
    - Sidebar listeners update for all users.
    - `postgres_changes` payload triggers frontend updates.
4.  **Edge Function**: A database webhook triggers `send-match-notification`.
5.  **External API**: Edge function calls Resend API to email compatible donors.

## 3. Database Schema

### `donors` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary Key (matches auth.users) |
| `full_name` | text | Donor's display name |
| `blood_type` | text | O+, O-, A+, etc. |
| `availability`| boolean | Online/Offline status |
| `email` | text | Contact for notifications |

### `blood_requests` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary Key |
| `requester_id`| uuid | FK to auth.users |
| `blood_type` | text | Requested blood type |
| `status` | text | 'pending', 'fulfilled', 'discarded' |
| `urgency` | text | 'critical', 'high', etc. |

## 4. Feature Specifications

### 4.1 "Graffiti" UI System
- **Philosophy**: Emergency apps don't have to be boring. High contrast and movement keep users alert.
- **Implementation**:
    - **Backgrounds**: Absolute positioned SVGs (`Droplet`, `Activity`) with `opacity-10`.
    - **Typography**: Large, bold, tracking-tight headers with `bg-clip-text` gradients.
    - **Interactions**: Hover scales (1.02), active scales (0.95), glassmorphism borders (`border-white/20`).

### 4.2 Auto-Matching Logic
*Implemented in `useBloodMatching.ts`*
- **Strict Matching**: A donor with `A+` will ONLY see requests for `A+` or `AB+` (recipients).
- **Status Filtering**: `discarded` or `fulfilled` requests are hidden from the main dashboard.

### 4.3 Notification System
- **Trigger**: Database Insert on `blood_requests`.
- **Processor**: Supabase Edge Function (`deno`).
- **Delivery**: Email via Resend.
- **Failover**: Toast notifications in-app (React Hot Toast).

## 5. Security & RLS

### Row Level Security (RLS) Policies
1.  **Public Read**: `donors` table is readable by authenticated users (to find matches).
2.  **Owner Write**: Users can only update their own `donors` profile.
3.  **Request Visibility**:
    - Request Creators can see their own requests.
    - Compatible Donors can see pending requests.

## 6. Known Limitations (v1)
- **No SMS**: Notifications are Email-only currently.
- **Geolocation**: Matching is currently based on simple text/list logic, not geospatial distance calculation.

## 7. Future Roadmap (v1.1)
- [ ] Integration of Mapbox for donor visualization.
- [ ] SMS fallback via Twilio.
- [ ] "Volunteer" gamification badges.
