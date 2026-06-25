-- ==========================================
-- Database Schema: Site Visit Booking Automation
-- Target: MySQL (with SQLite compatibility in mind)
-- ==========================================

CREATE DATABASE IF NOT EXISTS site_visit_booking;
USE site_visit_booking;

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(25) DEFAULT 'Available', -- 'Available', 'On Visit', 'Offline'
  password VARCHAR(100) DEFAULT 'agent123',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20) UNIQUE NOT NULL, -- Format: SV-XXXX
  customer_id INT NOT NULL,
  agent_id INT DEFAULT NULL,
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(50) NOT NULL,
  property_location VARCHAR(255) NOT NULL,
  budget VARCHAR(50) DEFAULT NULL,
  status VARCHAR(25) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'Rescheduled'
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- 4. Visit History Table (for audit trails)
CREATE TABLE IF NOT EXISTS visit_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  status VARCHAR(25) NOT NULL,
  notes TEXT DEFAULT NULL,
  updated_by VARCHAR(50) NOT NULL, -- e.g., 'Admin', 'Agent Name'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'WhatsApp', 'Email', 'Reminder'
  recipient VARCHAR(100) NOT NULL, -- Phone or Email
  message TEXT NOT NULL,
  status VARCHAR(25) DEFAULT 'Pending', -- 'Pending', 'Sent', 'Failed'
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ==========================================
-- Insert Real Data for Seed Setup
-- ==========================================

-- Seed Agents
INSERT INTO agents (name, email, phone, status, password) VALUES
('ayush', 'pradeepyadavpullagura@gmail.com', '9390914844', 'Available', '123456789');

-- Seed Customers
INSERT INTO customers (name, phone, email) VALUES
('Pradeep Yadav Pullagura', '+919849150858', 'pradeepyadavpullagura@gmail.com'),
('Pullagura Pradeep Yadav', '9100137168', 'pullagurapradeepyadav565@gmail.com'),
('Thammala Saketh', '9459666686', 'pradeepasuslaptop@gmail.com');

-- Seed Bookings
INSERT INTO bookings (booking_code, customer_id, agent_id, preferred_date, preferred_time_slot, property_location, budget, status, notes) VALUES
('SV-1001', 3, 1, '2026-07-11', '10:00 AM - 12:00 PM', 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)', '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L', 'Pending', 'no'),
('SV-1002', 2, 1, '2026-07-09', '10:00 AM - 12:00 PM', 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)', '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L', 'Pending', 'no');

-- Seed Visit History
INSERT INTO visit_history (booking_id, status, notes, updated_by) VALUES
(1, 'Pending', 'Booking registered online. Auto-assigned agent.', 'System'),
(2, 'Pending', 'Booking registered online. Auto-assigned agent.', 'System');

-- Seed Notifications
INSERT INTO notifications (booking_id, type, recipient, message, status) VALUES
(1, 'WhatsApp', '9459666686', 'Hi Thammala Saketh, we have received your request SV-1001 for Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland). Status: Pending.', 'Pending'),
(2, 'WhatsApp', '9100137168', 'Hi Pullagura Pradeep Yadav, we have received your request SV-1002 for Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland). Status: Pending.', 'Pending');
