const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = process.env.DB_TYPE || 'sqlite';
let mysqlPool = null;
let sqliteDb = null;
let initPromise = null;

// Initialize Database connection
async function initDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
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
        let sqliteFile = process.env.SQLITE_FILE || './database.sqlite';
        if (process.env.VERCEL) {
          sqliteFile = '/tmp/database.sqlite';
        }
        const sqlitePath = path.resolve(__dirname, sqliteFile);
        const isNewDb = !fs.existsSync(sqlitePath);
        console.log(`Connecting to SQLite Database at: ${sqlitePath}`);

        await new Promise((resolve, reject) => {
          sqliteDb = new sqlite3.Database(sqlitePath, async (err) => {
            if (err) {
              console.error('Failed to open SQLite Database:', err.message);
              return reject(err);
            }
            console.log('Connected to SQLite Database.');
            sqliteDb.run("PRAGMA foreign_keys = ON", (pragmaErr) => {
              if (pragmaErr) {
                console.error("Failed to enable foreign key constraints:", pragmaErr.message);
              } else {
                console.log("SQLite foreign key constraints enabled.");
              }
            });
            if (isNewDb) {
              console.log('Initializing SQLite database schema & seed data...');
              try {
                await initializeSqliteSchema();
                console.log('SQLite Schema and Seed Data initialized successfully.');
              } catch (initErr) {
                console.error('Error seeding SQLite Database:', initErr.message);
              }
            } else {
              try {
                await runMigrationSqlite();
              } catch (migrationErr) {
                console.error('Error running SQLite migrations:', migrationErr.message);
              }
            }
            resolve();
          });
        });
      }
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
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
            password TEXT DEFAULT 'agent123',
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
          await run(`INSERT INTO agents (name, email, phone, status, password) VALUES
            ('Rohan Sharma', 'rohan.sharma@realestate.com', '+919876543210', 'Available', 'agent123'),
            ('Sneha Reddy', 'sneha.reddy@realestate.com', '+919876543211', 'Available', 'agent123'),
            ('Amit Patel', 'amit.patel@realestate.com', '+919876543212', 'On Visit', 'agent123'),
            ('Priya Nair', 'priya.nair@realestate.com', '+919876543213', 'Offline', 'agent123'),
            ('Vikram Singh', 'vikram.singh@realestate.com', '+919876543214', 'Available', 'agent123')`);

          await run(`INSERT INTO customers (name, phone, email) VALUES
            ('Rajesh Kumar', '+919911223344', 'rajesh.k@gmail.com'),
            ('Ananya Sen', '+919911223355', 'ananya.sen@yahoo.com'),
            ('Vijay Mhatre', '+919911223366', 'vijay.m@outlook.com'),
            ('Ramesh Kulkarni', '+919900000001', 'ramesh.k@gmail.com'),
            ('Suresh Babu', '+919900000002', 'suresh.b@gmail.com'),
            ('Divya Teja', '+919900000003', 'divya.t@gmail.com'),
            ('Kiran Kumar', '+919900000004', 'kiran.k@gmail.com'),
            ('Madhavi Latha', '+919900000005', 'madhavi.l@gmail.com')`);

          await run(`INSERT INTO bookings (booking_code, customer_id, agent_id, preferred_date, preferred_time_slot, property_location, budget, status, notes) VALUES
            ('SV-1001', 3, 3, '2026-06-05', '11:00 AM - 01:00 PM', 'Meadow Villas, Plot 14', '₹2.5Cr+', 'Completed', 'Visit completed. Client liked the garden layout.'),
            ('SV-1002', 1, 1, '2026-06-06', '10:00 AM - 12:00 PM', 'Greenwood Residency, Sector 45', '₹80L - ₹1.2Cr', 'Approved', 'Client wants to see the 3BHK flat.'),
            ('SV-1003', 2, 2, '2026-06-07', '02:00 PM - 04:00 PM', 'Skyline Heights, Block C', '₹1.5Cr - ₹2.0Cr', 'Pending', 'Interested in penthouse view.'),
            ('SV-1004', 4, 1, '2026-07-01', '09:00 AM - 11:00 AM', 'Yerragondapalem Gated Farms', '1 Acre - ₹60L - ₹80L', 'Approved', 'Interested in site tour with family.'),
            ('SV-1005', 5, 2, '2026-07-02', '11:00 AM - 01:00 PM', 'Seshachalam Foothills Block A', '1/4 Acre - ₹15L - ₹25L', 'Pending', 'Needs transport support from Tirupati.'),
            ('SV-1006', 6, 5, '2026-07-03', '02:00 PM - 04:00 PM', 'Nallamala Native Sector Block B', '1/2 Acre - ₹30L - ₹45L', 'Approved', 'Wants to inspect water resources.'),
            ('SV-1007', 7, 1, '2026-07-04', '04:00 PM - 06:00 PM', 'Giddalur Range Sandalwood plots', '2+ Acres - ₹1.2Cr+', 'Completed', 'Corporate client site visit.'),
            ('SV-1008', 8, 2, '2026-07-05', '11:00 AM - 01:00 PM', 'Yerragondapalem Gated Farms', '1 Acre - ₹60L - ₹80L', 'Rescheduled', 'Requested senior advisor presence.')`);

          await run(`INSERT INTO visit_history (booking_id, status, notes, updated_by) VALUES
            (1, 'Pending', 'Booking created online', 'System'),
            (1, 'Approved', 'Assigned agent Amit Patel', 'Admin'),
            (1, 'Completed', 'Customer showed high interest. Will follow up next week.', 'Amit Patel'),
            (2, 'Pending', 'Booking created online', 'System'),
            (2, 'Approved', 'Assigned agent Rohan Sharma and approved visit slot.', 'Admin'),
            (3, 'Pending', 'Booking created online', 'System'),
            (4, 'Pending', 'Booking created online', 'System'),
            (4, 'Approved', 'Assigned agent Rohan Sharma', 'Admin'),
            (5, 'Pending', 'Booking created online', 'System'),
            (6, 'Pending', 'Booking created online', 'System'),
            (6, 'Approved', 'Assigned agent Vikram Singh', 'Admin'),
            (7, 'Pending', 'Booking created online', 'System'),
            (7, 'Approved', 'Assigned agent Rohan Sharma', 'Admin'),
            (7, 'Completed', 'Client booked 2 acres of Red Sandalwood.', 'Rohan Sharma'),
            (8, 'Pending', 'Booking created online', 'System'),
            (8, 'Rescheduled', 'Rescheduled on client request.', 'Admin')`);

          await run(`INSERT INTO notifications (booking_id, type, recipient, message, status) VALUES
            (1, 'WhatsApp', '+919911223366', 'Hi Vijay Mhatre, your site visit SV-1001 is confirmed.', 'Sent'),
            (1, 'Reminder', '+919911223366', 'Reminder: Hello Vijay Mhatre, your site visit for Meadow Villas is scheduled today at 11:00 AM - 01:00 PM.', 'Sent'),
            (2, 'WhatsApp', '+919911223344', 'Hi Rajesh Kumar, your site visit SV-1002 for Greenwood Residency is confirmed on 2026-06-06 at 10:00 AM - 12:00 PM. Agent Rohan Sharma (+919876543210) will host you.', 'Sent'),
            (3, 'WhatsApp', '+919911223355', 'Hi Ananya Sen, we have received your request SV-1003 for Skyline Heights on 2026-06-07 at 02:00 PM - 04:00 PM. It is currently pending review.', 'Sent'),
            (4, 'WhatsApp', '+919900000001', 'Hi Ramesh Kulkarni, your site visit SV-1004 has been approved. Date: 2026-07-01, Time: 09:00 AM - 11:00 AM. Agent: Rohan Sharma (+919876543210).', 'Sent'),
            (5, 'WhatsApp', '+919900000002', 'Hi Suresh Babu, we have received your request SV-1005 for Seshachalam Foothills Block A. Status: Pending.', 'Sent'),
            (6, 'WhatsApp', '+919900000003', 'Hi Divya Teja, your site visit SV-1006 has been approved. Date: 2026-07-03, Time: 02:00 PM - 04:00 PM. Agent: Vikram Singh (+919876543214).', 'Sent'),
            (7, 'WhatsApp', '+919900000004', 'Hi Kiran Kumar, thank you for visiting Giddalur Range Sandalwood plots today. We hope you found the session informative!', 'Sent'),
            (8, 'WhatsApp', '+919900000005', 'Hi Madhavi Latha, your site visit booking SV-1008 has been rescheduled. New Date: 2026-07-05, New Time: 11:00 AM - 01:00 PM. Agent: Sneha Reddy.', 'Sent')`);

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
        initPromise = null;
        resolve();
      });
    });
  }
  if (mysqlPool) {
    await mysqlPool.end();
    console.log('Closed MySQL Database pool.');
    mysqlPool = null;
    initPromise = null;
  }
}

async function runMigrationSqlite() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("PRAGMA table_info(agents)", (err, columns) => {
      if (err) {
        return reject(err);
      }
      const hasPassword = columns.some(col => col.name === 'password');
      if (!hasPassword) {
        console.log("Migration: Adding 'password' column to SQLite 'agents' table...");
        sqliteDb.run("ALTER TABLE agents ADD COLUMN password TEXT DEFAULT 'agent123'", (alterErr) => {
          if (alterErr) {
            return reject(alterErr);
          }
          console.log("Migration: 'password' column successfully added.");
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  query,
  initDatabase,
  closeDatabase,
  getDbType: () => dbType
};
