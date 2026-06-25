# Site Visit Booking Automation System

A full-stack operations management and customer booking portal built for real estate companies. It automates the workflow of booking a property site visit, allocating available sales executives, scheduling reminders, logging audit history, and dispatching WhatsApp confirmation templates.

---

## 🌟 Key Features

1. **Client Lead Booking Portal**: Public scheduling interface with project selectors, date-time pickers, and budget brackets.
2. **Workload-Balanced Agent Allocation**: Automatic round-robin workflow that assigns new enquiries to the available sales agent with the fewest active bookings.
3. **Admin Operations Panel**: Control center to approve/reject bookings, manually reallocate agents, adjust schedules, and view client-wise statistics.
4. **Agent Tour Sheets**: Personalized portals for sales executives to review assigned schedules, inspect notes, and log client visit feedback.
5. **Dynamic WhatsApp Dispatcher**: Fully simulated WhatsApp template queue with pre-filled WhatsApp Web redirect links.
6. **Reports & Exports**: CSV exports, print-optimized PDF outputs, and custom SVG analytical charts.
7. **Dual Database Adaptor**: Out-of-the-box SQLite fallback with auto-seeding for instant testing, easily toggleable to MySQL.

---

## 📂 Repository Structure

```
/SITE Project
  ├── /backend
  │    ├── /config
  │    ├── db.js             # Dual MySQL/SQLite query adaptor
  │    ├── server.js         # API handlers & business logic
  │    ├── package.json
  │    └── .env              # Environment configurations
  ├── /frontend
  │    ├── /src
  │    │    ├── /components  # SidebarLayout, Toast Container
  │    │    ├── /pages       # Login, Booking Form, Dashboards
  │    │    ├── /context     # React State & Axios Fetch wrapper
  │    │    ├── App.jsx      # Private route gates & page router
  │    │    └── index.css    # Premium styling tokens & glassmorphism
  │    ├── package.json
  │    └── vite.config.js
  ├── /docs
  │    └── db_schema.sql     # Full database schema for MySQL
  ├── /tests
  │    └── backend.test.js   # Automated integration test suite
  └── README.md
```

---

## ⚙️ Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [NPM](https://www.npmjs.com/)
- MySQL Server (Optional, only if using MySQL mode)

---

### Step 1: Backend Setup
1. Open a terminal inside the `/backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` variables. A pre-configured `.env` is provided. By default, it runs on **SQLite** (plug-and-play) and creates a local `database.sqlite` file, seeded with dummy data:
   ```env
   PORT=5000
   DB_TYPE=sqlite
   SQLITE_FILE=./database.sqlite
   ```
4. Start the backend server:
   ```bash
   npm run start
   ```
   *(For development with hot-reloading: `npm run dev`)*

---

### Step 2: Frontend Setup
1. Open a new terminal inside the `/frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000` to interact with the app.

---

### Step 3: Run Automated Tests
You can run the integration test suite by executing the following command from the project root:
```bash
node tests/backend.test.js
```

---

## 🔑 Demo Logins (Auto-populate Buttons Available)

- **Admin Portal**:
  - **Email**: `pullagurapradeepyadav@gmail.com`
  - **Password**: `984915`
- **Sales Executive Portals**:
  - **ayush**: `pradeepyadavpullagura@gmail.com` / `123456789`

---

## 🛢️ MySQL Production Database Setup

To migrate from SQLite to MySQL:
1. Open your MySQL client (e.g. phpMyAdmin, Workbench, or command-line CLI).
2. Execute the schema script located at [docs/db_schema.sql](file:///c:/Users/prade/OneDrive/Desktop/SITE%20Project/docs/db_schema.sql) to create the database tables and insert initial real entries.
3. Open [/backend/.env](file:///c:/Users/prade/OneDrive/Desktop/SITE%20Project/backend/.env) and change the variables:
   ```env
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=site_visit_booking
   ```
4. Restart the backend server. It will now run on your local MySQL server.

---

## 🚀 Deployment Instructions

### Backend (Node.js/Express)
1. Deploy the backend code to a cloud VM (e.g., AWS EC2, DigitalOcean Droplet, Render, or Heroku).
2. Set up environment variables on the cloud server.
3. Use a process manager like **PM2** to keep the backend running indefinitely:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "site-visit-backend"
   ```
4. Use Nginx as a reverse proxy to forward traffic from port 80/443 to port 5000.

### Frontend (React/Vite)
1. Build the production assets:
   ```bash
   npm run build
   ```
2. Upload the generated `/frontend/dist` directory to static hosting services (e.g. Netlify, Vercel, AWS S3, or Cloudflare Pages).
3. Ensure API base path changes inside `/frontend/src/context/AppContext.jsx` to match your cloud backend server's URL.
