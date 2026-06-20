# GastroPOS Frontend Architecture

## Overview
The frontend for **GastroPOS** is a robust, responsive Single Page Application (SPA) built with **React** and **Vite**. The application provides a unified interface tailored for three distinct user roles:
1. **Admins & Cashiers:** The primary Point of Sale (POS) and management dashboards.
2. **Chefs:** The real-time Kitchen Display System (KDS).
3. **Customers:** The self-ordering and digital payment portal (accessed via QR code).

---

## 🛠️ Technology Stack
- **Framework:** React 18 (Bootstrapped with Vite for instant HMR)
- **State Management:** Zustand (Global State) + React Query (Server State / Caching)
- **Styling:** Tailwind CSS (Utility-first CSS framework)
- **Routing:** React Router v6
- **Real-Time Updates:** Native HTML5 WebSockets (`ws://`)
- **Forms & Validation:** React Hook Form + Zod

---

## 📁 Project Structure

The codebase follows a feature-based structure for maximum maintainability.

```text
client/src/
├── components/
│   └── ui/               # Reusable atomic UI components (Buttons, Inputs, Modals, Badges)
├── layouts/              # Shared layout wrappers (DashboardLayout with Sidebar/Navbar)
├── pages/                # High-level route components (The actual views)
├── routes/               # Route definitions and Protected Route wrappers
├── services/             # Axios API wrapper and centralized API endpoints (api.js)
├── store/                # Zustand global state (posStore.js)
└── index.css             # Tailwind base styles and CSS variables
```

---

## 🧠 State Management Philosophy

We utilize a dual-state management strategy to optimize performance and developer experience:

### 1. Server State (`React Query`)
All data fetched from the backend (Products, Categories, Users, Kitchen Orders) is managed by `@tanstack/react-query`. 
*   **Why?** It automatically handles caching, background fetching, loading states, and error handling.
*   **Real-time Integration:** When a WebSocket message is received (e.g., in the KDS), we use `queryClient.setQueryData()` to manually update the React Query cache, ensuring the UI re-renders instantly without performing an unnecessary HTTP fetch.

### 2. Client State (`Zustand`)
The `posStore.js` manages ephemeral, global state that only exists on the client.
*   **Current Cart:** The items a cashier or customer is currently ringing up.
*   **Active Session:** The currently logged-in user and active POS Session ID.
*   **Why?** Zustand is significantly simpler and requires less boilerplate than Redux, making it perfect for managing the fast-paced POS checkout cart.

---

## 🚦 Routing & Security

React Router is used to handle client-side navigation. We enforce security using a `<ProtectedRoute>` wrapper.

*   **Public Routes:** `/login`, `/signup`, `/customer/*` (QR Code ordering)
*   **Protected Routes:** `/pos`, `/kds`, `/admin/*`
*   **Mechanism:** If a user attempts to access a protected route without a valid JWT token in local storage, they are instantly redirected to `/login`.

---

## 📱 Key Interfaces (The `pages/` Directory)

### 1. The POS Terminal (`POSOrder.jsx`)
The heart of the application for Cashiers. 
*   Features a responsive grid of menu categories and products on the left.
*   A persistent cart/checkout pane on the right.
*   Integrates with `CouponsPromotions` to automatically apply bulk discounts.
*   Handles complex logic for order types (Dine-in, Takeaway, Delivery).

### 2. The Kitchen Display System (`KDS.jsx`)
A specialized dashboard for chefs.
*   **Kanban Board:** Orders are split into columns: "To Cook", "Preparing", and "Served".
*   **Real-Time:** Connects to `ws://host:8082/ws/kds`. As cashiers punch in orders, tickets instantly appear on the board via WebSockets.
*   **Drag & Drop:** Chefs can drag a ticket from "To Cook" to "Preparing" to instantly update the backend status.

### 3. Customer Self-Ordering (`CustomerDashboard.jsx`)
The digital menu accessed by customers via their smartphones.
*   **Mobile First:** Designed heavily around mobile viewports.
*   **Live Order Tracking:** Uses WebSockets to monitor the status of the customer's active order, showing real-time ETA and status changes (e.g., "Your food is being prepared!").

### 4. Table Management (`TableManagement.jsx`)
A visual map of the restaurant floor plan.
*   Displays tables as physical blocks (Squares, Rectangles, Circles).
*   Color-coded based on real-time occupancy (Green = Available, Red = Occupied).

### 5. Admin Panels
Dedicated CRUD screens for managers to oversee the business:
*   `AdminDashboard.jsx`: Sales metrics, revenue charts, and operational statistics.
*   `ProductManagement.jsx` / `CategoryManagement.jsx`: Menu creation.
*   `UserManagement.jsx`: Staff provisioning and role assignment.

---

## 🎨 UI & Design System

The application relies heavily on **Tailwind CSS** for styling, prioritizing a sleek, modern, and highly readable interface.

*   **Custom Colors:** Defined in `tailwind.config.js` and `index.css` (primary, secondary, accent, destructive).
*   **Atomic Components:** The `components/ui/` folder contains pure, stateless presentational components (like `<Card>`, `<Button>`, `<Input>`) that encapsulate Tailwind classes. This prevents class clutter in the main page files and ensures visual consistency across the entire application.
