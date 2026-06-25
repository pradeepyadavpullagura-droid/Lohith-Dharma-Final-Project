const mysql = require('mysql2/promise');
let sqlite3 = null;
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
        let useSqlite = false;
        if (process.env.VERCEL) {
          console.log('Bypassing native sqlite3 library on Vercel.');
          dbType = 'alasql';
        } else {
          try {
            if (!sqlite3) {
              sqlite3 = require('sqlite3').verbose();
            }
            useSqlite = true;
          } catch (sqliteErr) {
            console.warn('Failed to load native sqlite3 driver, falling back to pure-JS AlaSQL database:', sqliteErr.message);
            dbType = 'alasql';
          }
        }

        if (useSqlite) {
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
      }

      if (dbType === 'alasql') {
        console.log('Initializing AlaSQL In-Memory Database Schema...');
        try {
          await initializeAlasqlSchema();
          console.log('AlaSQL Database Schema and Seed Data initialized successfully.');
        } catch (initErr) {
          console.error('Error seeding AlaSQL Database:', initErr.message);
        }
      }
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

function coerceParams(sql, params) {
  if (!params || !params.length) return params;
  const segments = sql.split('?');
  return params.map((param, i) => {
    if (typeof param === 'string') {
      const segment = segments[i];
      if (segment) {
        const match = segment.match(/(\w+)\s*(?:=|!=|<>|>=|<=|>|<|LIKE|IS)\s*$/i);
        if (match) {
          const colName = match[1].toLowerCase();
          if (colName === 'id' || colName.endsWith('_id')) {
            const num = Number(param);
            if (!isNaN(num)) {
              return num;
            }
          }
        }
      }
    }
    return param;
  });
}

// Unified query wrapper supporting both MySQL, SQLite, and AlaSQL
async function query(sql, params = []) {
  if (!initPromise) {
    await initDatabase();
  }

  if (dbType === 'mysql') {
    // For MySQL, replace placeholder datetime() if any, but since we pass JS dates it is fine
    const [results] = await mysqlPool.execute(sql, params);
    return results;
  } else if (dbType === 'sqlite') {
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
  } else if (dbType === 'alasql') {
    return new Promise((resolve, reject) => {
      try {
        const alasql = require('alasql');
        const modifiedSql = sql.replace(/\bas\s+count\b/gi, 'as [count]');
        const coercedParams = coerceParams(modifiedSql, params);
        const res = alasql(modifiedSql, coercedParams);
        
        const normalizedSql = sql.trim().toUpperCase();
        if (normalizedSql.startsWith('INSERT')) {
          const match = sql.match(/INSERT\s+INTO\s+(\w+)/i);
          let insertId = typeof res === 'number' ? res : 0;
          if (match && match[1]) {
            const table = match[1];
            const maxRes = alasql(`SELECT MAX(id) as maxId FROM ${table}`);
            if (maxRes && maxRes[0]) {
              insertId = maxRes[0].maxId || insertId;
            }
          }
          resolve({
            insertId: insertId,
            affectedRows: 1
          });
        } else if (normalizedSql.startsWith('UPDATE') || normalizedSql.startsWith('DELETE')) {
          resolve({
            insertId: 0,
            affectedRows: res
          });
        } else {
          resolve(res);
        }
      } catch (err) {
        console.error(`AlaSQL query error (SQL: ${sql}):`, err.message);
        reject(err);
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
            ('ayush', 'pradeepyadavpullagura@gmail.com', '9390914844', 'Available', '123456789')`);

          await run(`INSERT INTO customers (name, phone, email) VALUES
            ('Pradeep Yadav Pullagura', '+919849150858', 'pradeepyadavpullagura@gmail.com'),
            ('Pullagura Pradeep Yadav', '9100137168', 'pullagurapradeepyadav565@gmail.com'),
            ('Thammala Saketh', '9459666686', 'pradeepasuslaptop@gmail.com')`);

          await run(`INSERT INTO bookings (booking_code, customer_id, agent_id, preferred_date, preferred_time_slot, property_location, budget, status, notes) VALUES
            ('SV-1001', 3, 1, '2026-07-11', '10:00 AM - 12:00 PM', 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)', '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L', 'Pending', 'no'),
            ('SV-1002', 2, 1, '2026-07-09', '10:00 AM - 12:00 PM', 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)', '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L', 'Pending', 'no')`);

          await run(`INSERT INTO visit_history (booking_id, status, notes, updated_by) VALUES
            (1, 'Pending', 'Booking registered online. Auto-assigned agent.', 'System'),
            (2, 'Pending', 'Booking registered online. Auto-assigned agent.', 'System')`);

          await run(`INSERT INTO notifications (booking_id, type, recipient, message, status) VALUES
            (1, 'WhatsApp', '9459666686', 'Hi Thammala Saketh, we have received your request SV-1001 for Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland). Status: Pending.', 'Pending'),
            (2, 'WhatsApp', '9100137168', 'Hi Pullagura Pradeep Yadav, we have received your request SV-1002 for Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland). Status: Pending.', 'Pending')`);

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

function initializeAlasqlSchema() {
  return new Promise((resolve, reject) => {
    try {
      const alasql = require('alasql');
      
      // Create tables
      alasql(`CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name STRING,
        phone STRING,
        email STRING,
        created_at DATETIME
      )`);

      alasql(`CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name STRING,
        email STRING UNIQUE,
        phone STRING,
        status STRING DEFAULT 'Available',
        password STRING DEFAULT 'agent123',
        created_at DATETIME
      )`);

      alasql(`CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code STRING UNIQUE,
        customer_id INT,
        agent_id INT,
        preferred_date STRING,
        preferred_time_slot STRING,
        property_location STRING,
        budget STRING,
        status STRING DEFAULT 'Pending',
        notes STRING,
        created_at DATETIME,
        updated_at DATETIME
      )`);

      alasql(`CREATE TABLE IF NOT EXISTS visit_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT,
        status STRING,
        notes STRING,
        updated_by STRING,
        created_at DATETIME
      )`);

      alasql(`CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT,
        type STRING,
        recipient STRING,
        message STRING,
        status STRING DEFAULT 'Pending',
        sent_at DATETIME
      )`);

      // Insert seed data
      alasql(`INSERT INTO agents (name, email, phone, status, password) VALUES
        ('ayush', 'pradeepyadavpullagura@gmail.com', '9390914844', 'Available', '123456789')`);

      alasql(`INSERT INTO customers (name, phone, email) VALUES
        ('Pradeep Yadav Pullagura', '+919849150858', 'pradeepyadavpullagura@gmail.com'),
        ('Pullagura Pradeep Yadav', '9100137168', 'pullagurapradeepyadav565@gmail.com'),
        ('Thammala Saketh', '9459666686', 'pradeepasuslaptop@gmail.com')`);

      alasql(`INSERT INTO bookings (booking_code, customer_id, agent_id, preferred_date, preferred_time_slot, property_location, budget, status, notes) VALUES
        ('SV-1001', 3, 1, '2026-07-11', '10:00 AM - 12:00 PM', 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)', '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L', 'Pending', 'no'),
        ('SV-1002', 2, 1, '2026-07-09', '10:00 AM - 12:00 PM', 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)', '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L', 'Pending', 'no')`);

      alasql(`INSERT INTO visit_history (booking_id, status, notes, updated_by) VALUES
        (1, 'Pending', 'Booking registered online. Auto-assigned agent.', 'System'),
        (2, 'Pending', 'Booking registered online. Auto-assigned agent.', 'System')`);

      alasql(`INSERT INTO notifications (booking_id, type, recipient, message, status) VALUES
        (1, 'WhatsApp', '9459666686', 'Hi Thammala Saketh, we have received your request SV-1001 for Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland). Status: Pending.', 'Pending'),
        (2, 'WhatsApp', '9100137168', 'Hi Pullagura Pradeep Yadav, we have received your request SV-1002 for Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland). Status: Pending.', 'Pending')`);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
