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
-- Insert Sample Dummy Data for Seed Setup (Removed for clean installation)
-- ==========================================

