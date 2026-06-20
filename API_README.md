# GastroPOS API Documentation

This document outlines all the RESTful API endpoints available in the GastroPOS backend. The API is built with Spring Boot and serves both the POS Terminal (Admin/Employee facing) and the Customer Self-Ordering interface.

## 🔒 Authentication & Security (`/api/auth`)
*Why it was created:* To secure the system using JSON Web Tokens (JWT). All endpoints except `/public` and `/auth` require a valid Bearer token.

| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `{ "email": "...", "password": "..." }` | Authenticates a user and returns a JWT token along with user details. |
| `POST` | `/api/auth/signup` | `{ "name": "...", "email": "...", "password": "..." }` | Registers a new employee or admin user. |
| `POST` | `/api/auth/change-password` | `{ "oldPassword": "...", "newPassword": "..." }` | Allows the currently logged-in user to securely update their password. |

---

## 🕒 POS Sessions (`/api/sessions`)
*Why it was created:* To track cash flow, shifts, and daily operations. A POS terminal cannot process employee orders unless a session is open.

| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sessions/current` | *None* | Retrieves the currently active POS session (if any). |
| `POST` | `/api/sessions/open` | `{ "openingCashAmount": 100.00 }` | Opens a new register session with a starting cash float. |
| `POST` | `/api/sessions/close` | *None* | Closes the current active session, summarizing the total expected cash/sales. |
| `GET` | `/api/sessions` | *None* | Retrieves a historical list of all POS sessions for auditing. |

---

## 📦 Products & Categories (`/api/products` & `/api/categories`)
*Why it was created:* To manage the restaurant's menu dynamically. Categories group products together, and products store price, stock, and descriptive data.

### Categories
| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | *None* | Fetches all active menu categories (e.g., Starters, Mains, Drinks). |
| `POST` | `/api/categories` | `{ "name": "...", "description": "..." }` | Creates a new category. |
| `PUT` | `/api/categories/{id}` | `{ "name": "..." }` | Updates an existing category's details. |
| `DELETE` | `/api/categories/{id}` | *None* | Deletes a category. |

### Products
| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | *None* | Fetches all menu items. |
| `POST` | `/api/products` | `{ "name": "...", "price": 10.50, "categoryId": 1 }` | Adds a new product to the menu. |
| `PUT` | `/api/products/{id}` | `{ "name": "...", "price": 12.00 }` | Updates a specific product's pricing or details. |
| `DELETE` | `/api/products/{id}` | *None* | Removes a product from the menu. |
| `GET` | `/api/products/search?name={query}` | *None* | Searches for a product by its name. |

---

## 🪑 Tables (`/api/tables`)
*Why it was created:* To map the physical layout of the restaurant for Dine-in orders.

| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tables` | *None* | Retrieves all tables and their current availability status. |
| `POST` | `/api/tables` | `{ "tableNumber": "T1", "capacity": 4 }` | Registers a new table in the system. |
| `PUT` | `/api/tables/{id}` | `{ "status": "OCCUPIED" }` | Updates the table's properties or occupancy status. |
| `DELETE` | `/api/tables/{id}` | *None* | Removes a table. |

---

## 📝 Employee Orders (`/api/orders`)
*Why it was created:* Core business logic for the POS. Allows cashiers and waiters to punch in orders, check past receipts, and manage billing.

| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | `{ "orderType": "dine-in", "tableId": 2, "items": [...] }` | Creates a new order directly from the POS terminal. |
| `GET` | `/api/orders` | *None* | Fetches a directory of all orders across the restaurant. |
| `GET` | `/api/orders/{id}` | *None* | Retrieves the full details (receipt) of a specific order. |
| `GET` | `/api/orders/table/{id}` | *None* | Fetches active orders for a specific table. |
| `GET` | `/api/orders/session/{id}` | *None* | Fetches all orders processed during a specific POS session. |
| `PUT` | `/api/orders/{id}/status` | `{ "status": "PAID" }` | Updates the overall billing status (e.g., DRAFT, PENDING, PAID). |

---

## 📱 Customer Self-Ordering (`/api/public`)
*Why it was created:* To allow customers to scan a QR code on their table, browse the menu, place orders, and pay from their own devices *without* requiring an employee login.

| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/public/categories` | *None* | Fetches menu categories for the public customer dashboard. |
| `GET` | `/api/public/products` | *None* | Fetches products available for public ordering. |
| `POST` | `/api/public/orders` | `{ "orderType": "dine-in", "tableId": 5, "items": [...] }` | Allows a customer to initiate an order themselves. |
| `GET` | `/api/public/orders/{id}` | *None* | Allows the customer to poll and track their order status. |
| `PUT` | `/api/public/orders/{id}/append`| `{ "items": [...] }` | Allows customers to add more items to an ongoing Dine-in order. |
| `PUT` | `/api/public/orders/{id}/pay` | *None* | Marks a customer's order as paid (via digital checkout/gateway). |

---

## 🍳 Kitchen Display System (`/api/kitchen`)
*Why it was created:* To provide a real-time dashboard for the chefs. It isolates kitchen-specific data so chefs only see items they need to cook, ignoring billing details.

| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/kitchen/orders` | *None* | Retrieves all active orders that have items needing preparation. |
| `PUT` | `/api/kitchen/items/{id}/status` | `{ "kitchenStatus": "PREPARING" }` | Updates the cooking status of an *individual item* (e.g., marking a steak as cooking). |
| `PUT` | `/api/kitchen/orders/{id}/status`| `{ "kitchenStatus": "READY" }` | Updates the status of the *entire order* once all items are plated and ready. |

---

## 👥 Users & Admin (`/api/users` & `/api/payment-methods`)
*Why it was created:* For managers/admins to maintain staff accounts and configure allowed payment gateways.

| Method | Endpoint | Payload Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | *None* | Lists all registered employees/admins. |
| `POST` | `/api/users` | `{ "name": "...", "role": "ADMIN" }` | Provisions a new employee account. |
| `PUT` | `/api/users/{id}/password` | `{ "newPassword": "..." }` | Allows an admin to force-reset an employee's password. |
| `PUT` | `/api/users/{id}/archive` | *None* | Soft-deletes/archives an employee so they can no longer login. |
| `DELETE` | `/api/users/{id}` | *None* | Permanently deletes a user. |
| `GET` | `/api/payment-methods` | *None* | Fetches configured payment methods (Cash, Card, UPI, etc.). |
| `PUT` | `/api/payment-methods/{id}/toggle` | *None* | Enables or disables a specific payment method. |
