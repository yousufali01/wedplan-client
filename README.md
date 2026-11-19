# 💍 WedPlan – Wedding Service Marketplace

<p align="center">

  **A Modern Platform to Plan Your Perfect Wedding**

  Discover wedding services, connect with professional vendors, and manage your wedding bookings — all in one place.

</p>

---

## 🌐 Project Overview

**WedPlan** is a full-stack wedding service marketplace designed to simplify the wedding planning experience. It connects customers with professional wedding service providers through a modern, user-friendly platform.

Customers can explore wedding services, compare vendors, make bookings, and complete secure payments. Vendors can manage their services and booking requests, while administrators oversee the entire marketplace.

The frontend is built with **Next.js, TypeScript, Tailwind CSS, and ShadCN UI**, providing a responsive and interactive user experience.

## ✨ Key Features

### 👤 Customer Features
- Browse and discover available wedding services.
- Search services by keywords.
- Filter and sort services based on relevant criteria.
- View detailed service information and vendor profiles.
- Book services and manage booking requests.
- Track booking statuses: Pending, Accepted, Rejected, and Cancelled.
- Complete secure payments through Stripe.
- Manage personal profile information.
- View booking and transaction history.

### 🏪 Vendor Features
- Access a dedicated vendor dashboard.
- Create and manage wedding services.
- Upload service images.
- Submit services for administrator approval.
- Edit and delete existing services.
- Manage incoming booking requests.
- Accept or reject booking requests.
- Track service and booking activities.
- Manage subscription plans.

### 🛡️ Admin Features
- Access the administrator dashboard.
- Manage customers and vendors.
- Review and approve pending services.
- Manage marketplace services.
- Monitor bookings and transactions.
- Manage vendor access and platform activities.

### 🔐 Authentication & Security
- Email and password authentication.
- Google OAuth authentication.
- Better Auth integration.
- JWT-based authentication.
- Role-based dashboard access.
- Protected routes and authenticated pages.
- Secure user session management.
- Role-based interface and navigation.

### 💳 Payment Experience
- Stripe Checkout integration.
- Secure payment flow.
- Premium subscription support.
- Payment status and transaction information.

### 🎨 UI & User Experience
- Fully responsive design.
- Modern and clean interface.
- Reusable UI components.
- Interactive animations.
- Smooth navigation.
- Loading states and error handling.
- Toast notifications for user feedback.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Frontend Framework |
| React.js | UI Development |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| ShadCN UI | UI Components |
| Better Auth | Authentication |
| JWT | Secure Authentication |
| Stripe | Online Payments |
| Framer Motion | Animations |
| Lucide React | Icons |
| Axios / Fetch | API Communication |

---

## 📁 Project Structure

```text
WedPlan-Client/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── services/
│   │   ├── bookings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── shared/
│   │   ├── auth/
│   │   └── dashboard/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── .env.local
├── next.config.ts
├── package.json
└── README.md
```

*Note: The structure represents the intended organization; actual folders may vary.*

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone YOUR_FRONTEND_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd WedPlan-Client
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Add any additional public configuration required by your actual application.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## 🔗 Backend Integration

WedPlan Client communicates with the Express.js backend through RESTful APIs.

**Backend:** `http://localhost:5000`

The frontend integrates with backend services for:

- User authentication and authorization.
- Wedding service management.
- Booking management.
- User and vendor management.
- Payment processing.
- Transaction management.

---

## 👥 User Roles

| Role | Access |
|---|---|
| Customer | Browse services and manage bookings |
| Vendor | Manage services and booking requests |
| Admin | Manage users, vendors, services and transactions |

---

## 🚀 Project Goals

- Simplify the wedding planning process.
- Connect customers with professional wedding vendors.
- Provide a centralized wedding service marketplace.
- Ensure secure authentication and payment processing.
- Deliver a smooth and responsive user experience.

---

<p align="center">

  **WedPlan – Making Every Wedding Special. ❤️**

</p>
