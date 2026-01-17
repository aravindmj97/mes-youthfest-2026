


# 🎭 MES Youth Festival Registration System

A full-stack web application built to manage **college-level youth festival registrations**, **event participation**, **ID card generation**, and **coordinator–admin communication**, with role-based access and real-time control.

Built using **Next.js + Supabase + Ant Design**.

---

## 🚀 Features Overview

### 👨‍💼 Admin Portal
- Manage institutions, coordinators, events
- Configure participation limits
- Lock / unlock coordinator editing
- Global announcements to coordinators
- Master Data management (global students)
- Festival-wide statistics dashboard
- Ticket / notification management from coordinators

### 🧑‍🏫 Coordinator Portal
- Student registration & event assignment
- Enforced participation limits
- Read-only mode when admin locks editing
- Statistics dashboard (institute-level)
- ID card generation (bulk & individual)
- Contact Admin (ticketing system)
- View admin announcements

---

## 🧱 Tech Stack

| Layer | Technology |
|-----|-----------|
| Frontend | Next.js (App Router) |
| UI | Ant Design |
| Backend | Supabase (Postgres + Auth + Storage) |
| Charts | @ant-design/charts |
| Files | pdf-lib, qrcode |
| Export | xlsx, file-saver |

---

## 📐 Architecture Diagram

```text
┌───────────────────────────────────────────┐
│                Browser                    │
│  (Admin / Coordinator via Next.js App)    │
└───────────────▲───────────────────────────┘
                │
                │ HTTPS (Supabase Client)
                ▼
┌───────────────────────────────────────────┐
│              Next.js App                  │
│                                           │
│  - App Router                             │
│  - Role-based Layouts                     │
│  - Ant Design UI                          │
│  - Client-side Data Fetching              │
│                                           │
└───────────────▲───────────────────────────┘
                │
                │
                ▼
┌───────────────────────────────────────────┐
│                Supabase                   │
│                                           │
│  ┌──────────────┐   ┌─────────────────┐   │
│  │ Postgres DB  │   │ Storage Buckets │   │
│  │              │   │ - Photos        │   │
│  │ - Students   │   │ - ID Cards      │   │
│  │ - Events     │   └─────────────────┘   │
│  │ - Tickets    │                         │
│  │ - Config     │   ┌─────────────────┐   │
│  │ - Announce   │   │ Auth (Optional) │   │
│  └──────────────┘   └─────────────────┘   │
│                                           │
└───────────────────────────────────────────┘
````

---

## 🔄 API & Data Flow

### 1️⃣ Coordinator Student Registration Flow

```text
Coordinator UI
   ↓
Fetch Config (limits, lock flag)
   ↓
Fetch Events + Students
   ↓
User Inputs Student Data
   ↓
Validation (event limits enforced)
   ↓
Insert / Update:
  - students
  - student_event_registrations
   ↓
Supabase DB
```

---

### 2️⃣ Admin Master Data Edit Flow

```text
Admin UI
   ↓
Fetch Global Students
   ↓
Inline Edit Row
   ↓
Validate Limits
   ↓
Update students table
   ↓
Delete + Insert event registrations
   ↓
Supabase DB
```

---

### 3️⃣ Ticketing (Contact Admin) Flow

#### Coordinator Side

```text
Coordinator
   ↓
Submit Ticket
   ↓
support_tickets (status=OPEN)
   ↓
View Ticket List
   ↓
View Ticket Detail + Comments
```

#### Admin Side

```text
Admin
   ↓
Notification Badge Count
   ↓
View Tickets List
   ↓
Open Ticket
   ↓
Add Comment + Change Status
   ↓
support_ticket_comments
support_tickets (status update)
```

---

### 4️⃣ Announcement Flow

```text
Admin Config Page
   ↓
Publish Announcement
   ↓
global_announcements (is_active=true)
   ↓
Coordinator Layout Fetch
   ↓
Display Alert Card
```

---

### 5️⃣ ID Card Generation Flow

```text
Coordinator
   ↓
Upload Student Photo
   ↓
Supabase Storage (public URL)
   ↓
Generate QR Code (student_id)
   ↓
Merge Template + Data
   ↓
Generate PDF
   ↓
Download (Individual / Bulk)
```

---

## 📂 Project Structure

```
app/
 ├─ admin/
 │   ├─ institutions/
 │   ├─ coordinators/
 │   ├─ events/
 │   ├─ config/
 │   ├─ master-data/
 │   ├─ stats/
 │   └─ notifications/
 │       └─ [ticketId]/
 │
 ├─ coordinator/
 │   └─ [coordinatorId]/
 │       ├─ students/
 │       ├─ stats/
 │       ├─ id-cards/
 │       └─ contact-admin/
 │           └─ [ticketId]/
 │
lib/
 ├─ supabase.ts
 ├─ statusColors.ts
```

---

## 🔐 Roles & Access

### Admin

* Full access to all data
* Can lock coordinator editing
* Can post & clear announcements
* Handles coordinator tickets

### Coordinator

* Restricted to own institute
* Cannot edit when admin lock is enabled
* Can raise tickets to admin
* Can view announcements

---

## 🗃️ Database Schema (Core Tables)

### Institutions

```sql
institutions(id, name, code)
```

### Coordinators

```sql
coordinators(id, name, email, phone, institution_id)
```

### Students

```sql
students(
  id, name, batch, phone, email, photo_url,
  institution_id, created_by
)
```

### Events

```sql
events(id, name, type)
```

### Student Event Registrations

```sql
student_event_registrations(student_id, event_id)
```

### Festival Configuration

```sql
festival_config(key, value INTEGER)
```

### Global Announcements

```sql
global_announcements(message, severity, is_active)
```

### Support Tickets

```sql
support_tickets(
  coordinator_id,
  subject,
  message,
  status
)
```

### Ticket Comments

```sql
support_ticket_comments(ticket_id, commented_by, message)
```

---

## 🎨 Ticket Status Colors

```text
OPEN         → Blue
IN_PROGRESS → Orange
CLOSED       → Green
REJECTED     → Red
```

Centralized in:

```
/lib/statusColors.ts
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone <repo-url>
cd <repo-name>
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=xxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

### 4️⃣ Supabase Setup

* Run SQL migrations
* Create storage buckets:

  * `student-photos`
  * `id-cards`

### 5️⃣ Run Locally

```bash
npm run dev
```

---

## 🧠 Design Principles

* Single source of truth
* Role-based UI enforcement
* No custom UI components
* Config-driven behavior
* Scalable & maintainable

---

## 🔮 Future Enhancements

* Row Level Security (RLS)
* Email notifications
* Ticket SLA tracking
* Bulk student import
* Festival branding support
* Mobile-first UX

---
