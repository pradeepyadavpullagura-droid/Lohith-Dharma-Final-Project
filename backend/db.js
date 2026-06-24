const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = process.env.DB_TYPE || 'sqlite';
let mysqlPool = null;
let sqliteDb = null;

// Initialize Database connection
async function initDatabase() {
  if (dbType === 'mysql') {
    try {
      console.log('Connecting to MySQL Database...');
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'site_visit_booking',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      // Test connection
      await mysqlPool.query('SELECT 1');
      console.log('Successfully connected to MySQL Database.');
    } catch (err) {
      console.error('MySQL connection failed. Error details:', err.message);
      console.warn('Falling back to SQLite database for local execution...');
      dbType = 'sqlite';
    }
  }

  if (dbType === 'sqlite') {
    const sqlitePath = path.resolve(__dirname, process.env.SQLITE_FILE || './database.sqlite');
    const isNewDb = !fs.existsSync(sqlitePath);
    console.log(`Connecting to SQLite Database at: ${sqlitePath}`);

    return new Promise((resolve, reject) => {
      sqliteDb = new sqlite3.Database(sqlitePath, async (err) => {
        if (err) {
          console.error('Failed to open SQLite Database:', err.message);
          return reject(err);
        }
        console.log('Connected to SQLite Database.');
        if (isNewDb) {
          console.log('Initializing SQLite database schema & seed data...');
          try {
            await initializeSqliteSchema();
            console.log('SQLite Schema and Seed Data initialized successfully.');
          } catch (initErr) {
            console.error('Error seeding SQLite Database:', initErr.message);
          }
        }
        resolve();
      });
    });
  }
}

// Unified query wrapper supporting both MySQL and SQLite
async function query(sql, params = []) {
  if (!mysqlPool && !sqliteDb) {
    await initDatabase();
  }

  if (dbType === 'mysql') {
    // For MySQL, replace placeholder datetime() if any, but since we pass JS dates it is fine
    const [results] = await mysqlPool.execute(sql, params);
    return results;
  } else {
    // SQLite integration
    return new Promise((resolve, reject) => {
      const normalizedSql = sql.trim();
      const isSelect = normalizedSql.toUpperCase().startsWith('SELECT');

      if (isSelect) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) {
            console.error(`SQLite query error (SQL: ${sql}):`, err.message);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) {
            console.error(`SQLite execute error (SQL: ${sql}):`, err.message);
            reject(err);
          } else {
            // Map return values to match MySQL mysql2 format
            resolve({
              insertId: this.lastID,
              affectedRows: this.changes
            });
          }
        });
      }
    });
  }
}

// Schema Initializer for SQLite
function initializeSqliteSchema() {
  return new Promise((resolve, reject) => {
    sqliteDb.serialize(() => {
      const run = (sql) => {
        return new Promise((res, rej) => {
          sqliteDb.run(sql, (err) => {
            if (err) rej(err);
            else res();
          });
        });
      };

      (async () => {
        try {
          // Create tables
          await run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

          await run(`CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            status TEXT DEFAULT 'Available',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

          await run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_code TEXT UNIQUE NOT NULL,
            customer_id INTEGER NOT NULL,
            agent_id INTEGER,
            preferred_date TEXT NOT NULL,
            preferred_time_slot TEXT NOT NULL,
            property_location TEXT NOT NULL,
            budget TEXT,
            status TEXT DEFAULT 'Pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
          )`);

          await run(`CREATE TABLE IF NOT EXISTS visit_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            updated_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
          )`);

          await run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            recipient TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
          )`);

          // Insert seed data
          await run(`INSERT INTO agents (name, email, phone, status) VALUES
            ('Rohan Sharma', 'rohan.sharma@realestate.com', '+919876543210', 'Available'),
            ('Sneha Reddy', 'sneha.reddy@realestate.com', '+919876543211', 'Available'),
            ('Amit Patel', 'amit.patel@realestate.com', '+919876543212', 'On Visit'),
            ('Priya Nair', 'priya.nair@realestate.com', '+919876543213', 'Offline'),
            ('Vikram Singh', 'vikram.singh@realestate.com', '+919876543214', 'Available')`);

          await run(`INSERT INTO customers (name, phone, email) VALUES
            ('Rajesh Kumar', '+919911223344', 'rajesh.k@gmail.com'),
            ('Ananya Sen', '+919911223355', 'ananya.sen@yahoo.com'),
            ('Vijay Mhatre', '+919911223366', 'vijay.m@outlook.com')`);

          await run(`INSERT INTO bookings (booking_code, customer_id, agent_id, preferred_date, preferred_time_slot, property_location, budget, status, notes) VALUES
            ('SV-1001', 3, 3, '2026-06-05', '11:00 AM - 01:00 PM', 'Meadow Villas, Plot 14', '₹2.5Cr+', 'Completed', 'Visit completed. Client liked the garden layout.'),
            ('SV-1002', 1, 1, '2026-06-06', '10:00 AM - 12:00 PM', 'Greenwood Residency, Sector 45', '₹80L - ₹1.2Cr', 'Approved', 'Client wants to see the 3BHK flat.'),
            ('SV-1003', 2, 2, '2026-06-07', '02:00 PM - 04:00 PM', 'Skyline Heights, Block C', '₹1.5Cr - ₹2.0Cr', 'Pending', 'Interested in penthouse view.')`);

          await run(`INSERT INTO visit_history (booking_id, status, notes, updated_by) VALUES
            (1, 'Pending', 'Booking created online', 'System'),
            (1, 'Approved', 'Assigned agent Amit Patel', 'Admin'),
            (1, 'Completed', 'Customer showed high interest. Will follow up next week.', 'Amit Patel'),
            (2, 'Pending', 'Booking created online', 'System'),
            (2, 'Approved', 'Assigned agent Rohan Sharma and approved visit slot.', 'Admin'),
            (3, 'Pending', 'Booking created online', 'System')`);

          await run(`INSERT INTO notifications (booking_id, type, recipient, message, status) VALUES
            (1, 'WhatsApp', '+919911223366', 'Hi Vijay Mhatre, your site visit SV-1001 is confirmed.', 'Sent'),
            (1, 'Reminder', '+919911223366', 'Reminder: Hello Vijay Mhatre, your site visit for Meadow Villas is scheduled today at 11:00 AM - 01:00 PM.', 'Sent'),
            (2, 'WhatsApp', '+919911223344', 'Hi Rajesh Kumar, your site visit SV-1002 for Greenwood Residency is confirmed on 2026-06-06 at 10:00 AM - 12:00 PM. Agent Rohan Sharma (+919876543210) will host you.', 'Sent'),
            (3, 'WhatsApp', '+919911223355', 'Hi Ananya Sen, we have received your request SV-1003 for Skyline Heights on 2026-06-07 at 02:00 PM - 04:00 PM. It is currently pending review.', 'Sent')`);

          resolve();
        } catch (err) {
          reject(err);
        }
      })();
    });
  });
}

async function closeDatabase() {
  if (sqliteDb) {
    return new Promise((resolve) => {
      sqliteDb.close((err) => {
        if (err) {
          console.error('Error closing SQLite DB:', err.message);
        } else {
          console.log('Closed SQLite Database connection.');
        }
        sqliteDb = null;
        resolve();
      });
    });
  }
  if (mysqlPool) {
    await mysqlPool.end();
    console.log('Closed MySQL Database pool.');
    mysqlPool = null;
  }
}

module.exports = {
  query,
  initDatabase,
  closeDatabase,
  getDbType: () => dbType
};
