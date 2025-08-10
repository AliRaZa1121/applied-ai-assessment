# 🧠 Applied AI – Microservices Architecture

This repository contains a **Dockerized microservices setup** for an application with:

- **User Subscription Service** – Manages users and subscription data.
- **Payment Gateway Service** – Handles payment transactions.
- **Notification Service** – Sends email notifications.
- **PostgreSQL databases** – Separate DB instances for User and Payment services.
- **RabbitMQ** – For inter-service messaging.
- **Redis** – For caching and token storage.

---

## 📂 Project Structure

```
.
├── docker-compose.yml               # Service definitions
├── services/
│   ├── user-subscription-service/    # User service source
│   ├── payment-gateway-service/      # Payment service source
│   └── notification-service/         # Notification service source
├── scripts/
│   ├── prisma-cli.js                 # Interactive Prisma menu
│   └── prisma-runner.js              # Prisma runner logic
├── .env.example                      # Example environment variables
├── .env.development                  # Development environment variables
├── .env.production                   # Production environment variables
└── package.json                      # Docker scripts & Prisma helpers
```

---

## 🚀 Getting Started

### 1️⃣ Prerequisites

Make sure you have the following installed:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (for local scripts like Prisma menu)

---

### 2️⃣ Install Dependencies

Before running Docker commands, install Node.js dependencies:

```bash
npm install
```

This ensures the Prisma helper scripts and any development tooling work properly.

---

### 3️⃣ Environment Variables

Environment variables are split into three files:

- **`.env.example`** → Template with placeholder values.
- **`.env.development`** → Development settings.
- **`.env.production`** → Production settings.

**Setup**
Copy `.env.example` to the desired environment file:

```bash
cp .env.example .env.development
# OR
cp .env.example .env.production
```

Fill in the appropriate values for your environment.

---

### 4️⃣ Running in Development

```bash
npm run docker:dev
```

This will:

- Build and run all services using `Dockerfile.dev`.
- Load environment variables from `.env.development`.
- Attach logs to your terminal.

**Stop and remove containers + volumes:**

```bash
npm run docker:down-dev
```

---

### 5️⃣ Running in Production

```bash
npm run docker:prod
```

This will:

- Build and run services using `Dockerfile`.
- Load environment variables from `.env.production`.
- Run in detached mode (`-d`).

**Stop and remove containers + volumes:**

```bash
npm run docker:down-prod
```

---

## 🛠 Services Overview

| Service                   | Port (Host)      | Description                     |
| ------------------------- | ---------------- | ------------------------------- |
| **User Subscription API** | `3001`           | User & subscription management  |
| **Payment Gateway API**   | `3002`           | Payment transactions            |
| **Notification API**      | `3003`           | Sends email notifications       |
| **Postgres User DB**      | `5433`           | Database for user subscriptions |
| **Postgres Payment DB**   | `5434`           | Database for payments           |
| **RabbitMQ**              | `5672` / `15672` | Messaging + Management UI       |
| **Redis**                 | `6379`           | Caching & token storage         |

---

## ⚙️ Database Access

You can connect to the databases locally via:

- **User DB:** `localhost:5433`
- **Payment DB:** `localhost:5434`

Example:

```bash
docker compose exec postgres-user psql -U postgres -d user_subscription_db
```

---

## 📬 Notification Service

Email settings (SMTP) are configured via:

```
FROM_EMAIL
MAIL_HOST
MAIL_PORT
MAIL_SECURE
MAIL_USER
MAIL_PASS
```

---

## 🔑 JWT & Caching

- JWT secrets and expiry times are set in the `.env` files.
- Redis is used to cache tokens with expiry values.

---

## 🧰 Helpful Scripts

| Command                    | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `npm run docker:dev`       | Start development environment                           |
| `npm run docker:prod`      | Start production environment                            |
| `npm run docker:down-dev`  | Stop & clean dev containers                             |
| `npm run docker:down-prod` | Stop & clean prod containers                            |
| `npm run prisma:menu`      | Interactive menu to run Prisma commands for any service |
| `npm run prisma:help`      | Show Prisma command usage examples                      |

---

## 📦 Prisma Commands

This project includes a helper CLI to make running Prisma commands inside Docker containers easier.

### **Interactive Menu**

Run:

```bash
npm run prisma:menu
```

You’ll be prompted to:

1. **Select a service** – `user-subscription-service` or `payment-gateway-service`.
2. **Select an environment** – Development or Production.
3. **Select a Prisma action**:

   - **Migrate**

     - Development: `prisma migrate dev` (optionally with `--name <migration>`).
     - Production: `prisma migrate deploy`.

   - **Generate** – Generates Prisma client.
   - **Seed** – Runs `prisma db seed`.
   - **Reset** – Resets DB (development only, with cleanup).

4. **Add optional flags** – Any extra Prisma CLI flags.

The CLI wraps `scripts/prisma-runner.js`, which:

- Loads the correct `.env` file.
- Injects the correct `DATABASE_URL` into the container.
- Handles DB locks and resets safely.
- Runs Prisma inside the corresponding Docker container.

---
