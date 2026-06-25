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
-- Insert Sample Dummy Data for Seed Setup
-- ==========================================

-- Seed Agents
INSERT INTO agents (name, email, phone, status, password) VALUES
('Rohan Sharma', 'rohan.sharma@realestate.com', '+919876543210', 'Available', 'agent123'),
('Sneha Reddy', 'sneha.reddy@realestate.com', '+919876543211', 'Available', 'agent123'),
('Amit Patel', 'amit.patel@realestate.com', '+919876543212', 'On Visit', 'agent123'),
('Priya Nair', 'priya.nair@realestate.com', '+919876543213', 'Offline', 'agent123'),
('Vikram Singh', 'vikram.singh@realestate.com', '+919876543214', 'Available', 'agent123');

-- Seed Customers
INSERT INTO customers (name, phone, email) VALUES
('Rajesh Kumar', '+919911223344', 'rajesh.k@gmail.com'),
('Ananya Sen', '+919911223355', 'ananya.sen@yahoo.com'),
('Vijay Mhatre', '+919911223366', 'vijay.m@outlook.com'),
('Ramesh Kulkarni', '+919900000001', 'ramesh.k@gmail.com'),
('Suresh Babu', '+919900000002', 'suresh.b@gmail.com'),
('Divya Teja', '+919900000003', 'divya.t@gmail.com'),
('Kiran Kumar', '+919900000004', 'kiran.k@gmail.com'),
('Madhavi Latha', '+919900000005', 'madhavi.l@gmail.com');

-- Seed Bookings
INSERT INTO bookings (booking_code, customer_id, agent_id, preferred_date, preferred_time_slot, property_location, budget, status, notes) VALUES
('SV-1001', 3, 3, '2026-06-05', '11:00 AM - 01:00 PM', 'Meadow Villas, Plot 14', '₹2.5Cr+', 'Completed', 'Visit completed. Client liked the garden layout.'),
('SV-1002', 1, 1, '2026-06-06', '10:00 AM - 12:00 PM', 'Greenwood Residency, Sector 45', '₹80L - ₹1.2Cr', 'Approved', 'Client wants to see the 3BHK flat.'),
('SV-1003', 2, 2, '2026-06-07', '02:00 PM - 04:00 PM', 'Skyline Heights, Block C', '₹1.5Cr - ₹2.0Cr', 'Pending', 'Interested in penthouse view.'),
('SV-1004', 4, 1, '2026-07-01', '09:00 AM - 11:00 AM', 'Yerragondapalem Gated Farms', '1 Acre - ₹60L - ₹80L', 'Approved', 'Interested in site tour with family.'),
('SV-1005', 5, 2, '2026-07-02', '11:00 AM - 01:00 PM', 'Seshachalam Foothills Block A', '1/4 Acre - ₹15L - ₹25L', 'Pending', 'Needs transport support from Tirupati.'),
('SV-1006', 6, 5, '2026-07-03', '02:00 PM - 04:00 PM', 'Nallamala Native Sector Block B', '1/2 Acre - ₹30L - ₹45L', 'Approved', 'Wants to inspect water resources.'),
('SV-1007', 7, 1, '2026-07-04', '04:00 PM - 06:00 PM', 'Giddalur Range Sandalwood plots', '2+ Acres - ₹1.2Cr+', 'Completed', 'Corporate client site visit.'),
('SV-1008', 8, 2, '2026-07-05', '11:00 AM - 01:00 PM', 'Yerragondapalem Gated Farms', '1 Acre - ₹60L - ₹80L', 'Rescheduled', 'Requested senior advisor presence.');

-- Seed Visit History
INSERT INTO visit_history (booking_id, status, notes, updated_by) VALUES
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
(8, 'Rescheduled', 'Rescheduled on client request.', 'Admin');

-- Seed Notifications
INSERT INTO notifications (booking_id, type, recipient, message, status) VALUES
(1, 'WhatsApp', '+919911223366', 'Hi Vijay Mhatre, your site visit SV-1001 is confirmed.', 'Sent'),
(1, 'Reminder', '+919911223366', 'Reminder: Hello Vijay Mhatre, your site visit for Meadow Villas is scheduled today at 11:00 AM - 01:00 PM.', 'Sent'),
(2, 'WhatsApp', '+919911223344', 'Hi Rajesh Kumar, your site visit SV-1002 for Greenwood Residency is confirmed on 2026-06-06 at 10:00 AM - 12:00 PM. Agent Rohan Sharma (+919876543210) will host you.', 'Sent'),
(3, 'WhatsApp', '+919911223355', 'Hi Ananya Sen, we have received your request SV-1003 for Skyline Heights on 2026-06-07 at 02:00 PM - 04:00 PM. It is currently pending review.', 'Sent'),
(4, 'WhatsApp', '+919900000001', 'Hi Ramesh Kulkarni, your site visit SV-1004 has been approved. Date: 2026-07-01, Time: 09:00 AM - 11:00 AM. Agent: Rohan Sharma (+919876543210).', 'Sent'),
(5, 'WhatsApp', '+919900000002', 'Hi Suresh Babu, we have received your request SV-1005 for Seshachalam Foothills Block A. Status: Pending.', 'Sent'),
(6, 'WhatsApp', '+919900000003', 'Hi Divya Teja, your site visit SV-1006 has been approved. Date: 2026-07-03, Time: 02:00 PM - 04:00 PM. Agent: Vikram Singh (+919876543214).', 'Sent'),
(7, 'WhatsApp', '+919900000004', 'Hi Kiran Kumar, thank you for visiting Giddalur Range Sandalwood plots today. We hope you found the session informative!', 'Sent'),
(8, 'WhatsApp', '+919900000005', 'Hi Madhavi Latha, your site visit booking SV-1008 has been rescheduled. New Date: 2026-07-05, New Time: 11:00 AM - 01:00 PM. Agent: Sneha Reddy.', 'Sent');
