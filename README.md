# 🍔 GastroPOS

![GastroPOS Banner](https://img.shields.io/badge/GastroPOS-Modern%20Restaurant%20Management-orange?style=for-the-badge&logo=react)

**GastroPOS** is a full-stack, real-time Point of Sale (POS) and Restaurant Management system. It is designed to handle everything from walk-in orders at the cashier terminal to live kitchen dispatching and seamless customer self-ordering via QR codes.

## ✨ Key Features

*   **⚡ Real-Time Kitchen Display System (KDS):** Chefs get instant updates via WebSockets when orders are placed, with a drag-and-drop Kanban board for order fulfillment.
*   **🛒 Customer Self-Ordering:** Customers can scan a QR code at their table, browse a beautiful digital menu, and place orders directly to the kitchen without waiting for a waiter.
*   **💳 POS Terminal:** A high-speed interface for cashiers to punch in orders, apply bulk discounts, and handle split bills.
*   **🗺️ Visual Table Management:** Interactive restaurant floor plan displaying real-time table availability and occupancy.
*   **📊 Admin Dashboard:** Sales analytics, session history, and full CRUD management for products, categories, and staff.

---

## 🏗️ Architecture & Documentation

GastroPOS is built as a highly robust **Modular Monolith** to maximize performance and ease of deployment.

Want to dive deep into how it works? Check out our detailed documentation:
*   [📖 API Reference Guide](./API_README.md)
*   [⚙️ Backend Architecture](./BACKEND_ARCHITECTURE.md)
*   [🎨 Frontend Architecture](./FRONTEND_ARCHITECTURE.md)

---

## 💻 Tech Stack

### Frontend
*   **React 18** (Vite)
*   **Tailwind CSS** (for styling and animations)
*   **Zustand** (Client-side global state) & **React Query** (Server state)
*   **React Router v6** & **React Hook Form**
*   **Lucide React** (Icons)

### Backend
*   **Java 17** & **Spring Boot 3.3.x**
*   **Spring Security & JWT** (Stateless authentication)
*   **Spring WebSockets** (Real-time updates)
*   **Spring Data JPA / Hibernate**
*   **PostgreSQL**

---

## 🚀 Getting Started

Follow these instructions to run the project locally on your machine.

### Prerequisites
*   [Node.js](https://nodejs.org/en/) (v18+)
*   [Java 17 JDK](https://adoptium.net/)
*   [Maven](https://maven.apache.org/)
*   [PostgreSQL](https://www.postgresql.org/)

### 1. Database Setup
Create a local PostgreSQL database named `odoo_pos` (or update `application.properties` to match your existing database credentials).
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/odoo_pos
spring.datasource.username=postgres
spring.datasource.password=yourpassword
```

### 2. Start the Backend
Navigate to the `Server` directory and use Maven to run the Spring Boot application.
```bash
cd Server
mvn clean install
mvn spring-boot:run
```
*The backend will start on `http://localhost:8082` and will automatically generate the database schema using Hibernate.*

### 3. Start the Frontend
Open a new terminal, navigate to the `client` directory, install dependencies, and start the Vite dev server.
```bash
cd client
npm install
npm run dev
```
*The frontend will start on `http://localhost:5173`.*

---

## 📱 User Roles & Access

Once both servers are running, you can access the following interfaces:

1.  **POS/Admin Login:** `http://localhost:5173/login`
    *   *Create your first Admin account via the UI to access the management tools.*
2.  **Kitchen Display System:** `http://localhost:5173/kds`
    *   *Accessible to Chefs and Admins.*
3.  **Customer Self-Ordering:** `http://localhost:5173/customer`
    *   *No login required! Just browse and order.*

---

## 🤝 Contributing

Contributions are welcome! Please ensure you read the Architecture documents to understand the DTO patterns and WebSocket implementations before submitting a Pull Request.
