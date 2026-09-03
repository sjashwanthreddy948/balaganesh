# 🕉️ Bala Ganesh Association — Digital Chanda Contribution Platform

A production-ready, mobile-first, clean, devotional website built for **Bala Ganesh Association** to collect Ganesh festival "Chanda" contributions digitally via UPI.

---

## 📸 Visuals & Features

- **Devotional & Elegant Design**: Built with deep royal blue pandal drapes, warm golden festive glows, traditional brass diyas, and clean typography inspired by the sacred Ganesh Chaturthi festival.
- **Mobile-First Customer Journey**:
  ```
  HOME → CHANDA DETAILS → PAYMENT / QR SCANNER → PAYMENT CONFIRMATION → RECEIPT JPG → WHATSAPP
  ```
- **Universal UPI Payment**: Dynamic high-resolution UPI QR code generator compatible with **Google Pay, PhonePe, Paytm, BHIM, Cred**, with a one-tap `"Pay using UPI App"` mobile intent link.
- **Digital Chanda Receipt Generation**: Client-side high-DPI HTML5 Canvas generates an official, downloadable **JPG receipt** with unique receipt number (`BG2026-000001`), donor details, and verification badge.
- **Instant WhatsApp Sharing**: Pre-formatted WhatsApp share link to immediately notify the association committee.
- **Duplicate UTR & Fraud Protection**: Unique database constraints prevent accidental or intentional duplicate transaction ID submissions.
- **Simple Admin Dashboard**:
  - Secure authentication with bcrypt and HTTP-only JWT cookies
  - Real-time statistics: Total Contributions, Total Amount (₹), Pending, Verified
  - Filter & Search across Donor Name, Mobile, Receipt Number, and UTR
  - View uploaded payment screenshots
  - 1-click **Verify** or **Reject** status updates
  - Direct public receipt lookup & download link

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **QR Code**: `qrcode`
- **Database**: Prisma ORM with SQLite (instant zero-config local run) & PostgreSQL / Supabase ready for production
- **Security & Validation**: Zod, bcryptjs, jose (Edge/Node JWT)

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd balaganesh
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Review and adjust variables in `.env`:
```env
# Database
DATABASE_URL="file:./dev.db"

# Admin Authentication
JWT_SECRET="your-super-secret-jwt-key"
ADMIN_DEFAULT_USER="admin"
ADMIN_DEFAULT_PASSWORD="BalaGaneshAdmin@2026"

# Association & UPI Payment Configuration
NEXT_PUBLIC_ASSOCIATION_NAME="BALA GANESH ASSOCIATION"
NEXT_PUBLIC_UPI_ID="balaganesh@upi"
NEXT_PUBLIC_UPI_PAYEE_NAME="BALA GANESH ASSOCIATION"
NEXT_PUBLIC_WHATSAPP_NUMBER="919876543210"
NEXT_PUBLIC_CONTACT_NUMBER="+91 98765 43210"
NEXT_PUBLIC_ASSOCIATION_ADDRESS="Main Road, Ganesh Pandal Ground, Hyderabad, Telangana"
NEXT_PUBLIC_FESTIVAL_YEAR="2026"
NEXT_PUBLIC_RECEIPT_PREFIX="BG2026"
```

### 3. Initialize Database & Seed Admin
```bash
npm run db:push
npm run db:seed
```
This sets up your SQLite database and creates the initial admin user:
- **Username**: `admin`
- **Password**: `BalaGaneshAdmin@2026`

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration Guide

All festival details and UPI settings are centralized in `src/config/festival.config.ts` and powered by environment variables:

| Setting | Variable | Description |
| :--- | :--- | :--- |
| **Association Name** | `NEXT_PUBLIC_ASSOCIATION_NAME` | Displayed on header, hero, footer, and receipts |
| **UPI ID** | `NEXT_PUBLIC_UPI_ID` | Your association's official VPA (e.g. `balaganesh@sbi`) |
| **UPI Payee Name** | `NEXT_PUBLIC_UPI_PAYEE_NAME` | Name shown on donor's UPI app payment screen |
| **WhatsApp Number** | `NEXT_PUBLIC_WHATSAPP_NUMBER` | Contact number receiving receipt messages |
| **Helpline Phone** | `NEXT_PUBLIC_CONTACT_NUMBER` | Displayed on footer and receipt for donor queries |
| **Pandal Address** | `NEXT_PUBLIC_ASSOCIATION_ADDRESS`| Displayed on footer and official receipt |
| **Festival Year** | `NEXT_PUBLIC_FESTIVAL_YEAR` | e.g. `2026` |
| **Receipt Prefix** | `NEXT_PUBLIC_RECEIPT_PREFIX` | Prefix for receipt numbers (e.g. `BG2026`) |

---

## 🔐 Admin Panel Guide

1. Navigate to `/admin` or `/admin/login`.
2. Login with your admin credentials:
   - **Default User**: `admin`
   - **Default Password**: `BalaGaneshAdmin@2026` *(Change in `.env` before public deployment)*
3. **Features**:
   - **Metrics**: Track total funds collected in real-time.
   - **Search & Filter**: Find any donor instantly by mobile, UTR, or name.
   - **Verification**: Match the donor's UTR against your association bank account or UPI app statement, then click **Verify**.
   - **Receipt Download**: View and download the official Chanda receipt.

---

## 🌐 Production Deployment

### Option A: Vercel + Supabase (Recommended)

1. **Create a Supabase PostgreSQL Database**:
   - Sign up at [supabase.com](https://supabase.com) and create a new project.
   - In Project Settings -> Database, copy the **Connection string (URI)**.
2. **Update Prisma datasource for PostgreSQL**:
   In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. **Push schema to Supabase**:
   ```bash
   DATABASE_URL="postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" npx prisma db push
   DATABASE_URL="postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" node prisma/seed.js
   ```
4. **Deploy to Vercel**:
   - Push your code to GitHub.
   - Import repository into [Vercel](https://vercel.com).
   - In Environment Variables, set all variables from `.env.example`, including:
     - `DATABASE_URL` (Supabase connection string)
     - `JWT_SECRET` (A strong random string)
     - `NEXT_PUBLIC_*` configuration variables.
   - Click **Deploy**.

### Option B: VPS / Node Server (Docker or PM2)

```bash
# Build
npm run build

# Seed admin if first run
npm run db:push
npm run db:seed

# Start production server
npm run start -p 3000
```

---

## 📲 WhatsApp Cloud API Integration (Optional)

The codebase is modularly designed with `buildWhatsAppShareUrl` in `src/config/festival.config.ts`. To upgrade to automated WhatsApp Cloud API message and media delivery:
1. Obtain Meta Developer credentials (`WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`).
2. Add a server-side webhook in `src/app/api/whatsapp/send/route.ts` to dispatch messages and media attachments directly via `graph.facebook.com`.

---

## 🙏 Ganpati Bappa Morya!
Bala Ganesh Association — Preserving tradition with modern excellence.
