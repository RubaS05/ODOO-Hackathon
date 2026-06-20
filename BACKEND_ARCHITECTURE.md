# GastroPOS Backend Architecture

## Overview
The backend for GastroPOS is designed as a **Modular Monolithic Application** built on **Spring Boot**. The architecture prioritizes speed, ease of deployment, and simplicity, avoiding the unnecessary overhead of microservices (like Kafka and Docker) while retaining real-time communication capabilities crucial for a modern restaurant POS system.

## Tech Stack
- **Framework:** Spring Boot 3.3.4 (Java 17)
- **Database Access:** Spring Data JPA / Hibernate
- **Security:** Spring Security with JSON Web Tokens (JWT)
- **Real-Time Communication:** Spring WebSockets
- **Connection Pooling:** HikariCP
- **Database:** PostgreSQL (with automatic schema generation)

---

## Core Components and Layers

The backend follows a standard multi-tiered architecture to ensure separation of concerns:

### 1. Controllers (`com.cafepos.controller`)
Expose REST API endpoints to the React frontend. They are kept thin, delegating all business logic to the services. Includes endpoints like `/api/orders`, `/api/auth`, and `/api/kitchen`.

### 2. Services (`com.cafepos.service`)
Contain the core business rules and transaction boundaries (`@Transactional`). 
*   **OrderService:** Handles the complex logic of assembling an order, calculating taxes/subtotals, and publishing real-time WebSocket events.
*   **KitchenService:** Dedicated service isolating the Kitchen Display System (KDS) logic, enabling status modifications (e.g. `TO_COOK` -> `PREPARING`).
*   **AuthService:** Manages JWT generation and credential verification.

### 3. Repositories (`com.cafepos.repository`)
Interfaces extending `JpaRepository` to perform database operations. We utilize custom derived queries (e.g., `findByKitchenStatusInOrderByOrderDateAsc()`) to fetch data efficiently.

### 4. DTOs (Data Transfer Objects)
All API responses map Database Entities to DTOs (e.g., `OrderDto`, `OrderItemDto`).
**Why?** 
*   Prevents recursive JSON serialization errors between bi-directional JPA entities (like `PosOrder` and `OrderItem`).
*   Hides sensitive database information from the client.
*   Decouples the database schema from the API contract.

---

## Real-Time Architecture (WebSockets)

A restaurant requires immediate updates when an order is placed. We implemented a pure WebSocket architecture to achieve sub-second latency for the Kitchen Display System (KDS) and Table Management screens.

### How it works:
1. **Connection:** The React client opens a persistent connection to `ws://{host}:8082/ws/kds`.
2. **Handlers:** Spring Boot manages these sessions using `KdsWebSocketHandler` and `TableWebSocketHandler`.
3. **Broadcasting:** When `OrderService` saves a new order, it instantly calls `kdsWebSocketHandler.broadcastUpdate()`.
4. **Payloads:** The WebSocket sends structured JSON payloads directly to the React frontend:
   ```json
   {
       "type": "NEW_ORDER",
       "payload": { "id": 53, "orderType": "dine-in", "kitchenStatus": "TO_COOK" ... }
   }
   ```
   *Updates* use `"type": "UPDATE_ORDER"`, which dynamically updates the Kanban board on the frontend without requiring a page refresh.

> **Design Decision:** We deliberately rolled back a Kafka/Zookeeper event-driven approach in favor of direct WebSockets. For a single-server deployment (Modular Monolith), pure WebSockets eliminate the operational complexity of managing external message brokers and Docker containers, while providing the exact same real-time UX to the chefs.

---

## Security Strategy

The application uses **Stateless JWT Authentication**.

*   **Public Endpoints:** Routes starting with `/api/public/**` (used by customers scanning QR codes at tables) are entirely open and require no authentication.
*   **Secured Endpoints:** All other routes require a valid `Bearer Token` in the Authorization header.
*   **Filters:** `JwtAuthenticationFilter` intercepts requests, validates the token signature, and injects the `AppUser` context into Spring Security's `SecurityContextHolder`.

---

## Database Schema (Key Entities)

The system is centered around the concept of `PosSession` and `PosOrder`.

1. **PosSession:** A tracking boundary. Employees must "Open a Register" to start a session. All cash, card transactions, and orders belong to the active session for end-of-day auditing.
2. **PosOrder:** Represents a single checkout event. It tracks `subtotal`, `tax`, `paymentMethod`, and links to a `RestaurantTable` or `Customer`.
3. **OrderItem:** The individual line items (e.g., "1x Burger"). Each item has its own `KitchenStatus` so chefs can mark items off one-by-one, or complete the entire `PosOrder` at once. 
4. **AppUser:** Staff members (Admins, Cashiers, Chefs).

---

## Exception Handling
We implemented a global `@ControllerAdvice` to catch exceptions (like `EntityNotFoundException` or `BadCredentialsException`) and map them to consistent JSON error responses with the appropriate HTTP status codes (404, 401, 400).
