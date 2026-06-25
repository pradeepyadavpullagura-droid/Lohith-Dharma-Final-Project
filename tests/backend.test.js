const path = require('path');
module.paths.push(path.resolve(__dirname, '../backend/node_modules'));

const assert = require('assert');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

// Force database to SQLite file in tests folder for clean runs
process.env.DB_TYPE = 'sqlite';
process.env.SQLITE_FILE = './test_database.sqlite';

const { query, initDatabase, closeDatabase } = require('../backend/db');

let serverInstance;
const TEST_PORT = 5005;
const API_URL = `http://localhost:${TEST_PORT}/api`;
const TEST_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'pullagurapradeepyadav@gmail.com';
const TEST_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '984915';

async function runTests() {
  console.log('\x1b[36m%s\x1b[0m', '=== Starting Backend Integration Tests ===');

  try {
    // Clean up any existing test db file before initializing
    const fs = require('fs');
    const dbPath = path.resolve(__dirname, '../backend/test_database.sqlite');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Removed old test database file.');
    }

    // 1. Init Test Database
    console.log('Initializing test database...');
    await initDatabase();
    
    // Clear tables for a clean test run
    await query('DELETE FROM notifications');
    await query('DELETE FROM visit_history');
    await query('DELETE FROM bookings');
    await query('DELETE FROM customers');
    console.log('Test database cleaned.');

    // 2. Spin up the real server programmatically
    const { app } = require('../backend/server');
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`Test server listening on port ${TEST_PORT}`);
    });

    // Run Test Cases
    await testLoginSuccess();
    await testLoginFailure();
    await testCreateBooking();
    await testCreateBookingInvalidEmail();
    await testGetBookings();
    await testUpdateBookingStatus();
    await testGetAgents();
    await testCreateAgent();
    await testUpdateAgent();
    await testUpdateAgentStatus();
    await testAssignAgent();
    await testGetBookingDetails();
    await testUpdateBookingDetails();
    await testGetDashboardStats();
    await testDeleteAgent();
    await testDeleteBooking();

    console.log('\n\x1b[32m%s\x1b[0m', '✓ ALL TESTS PASSED SUCCESSFULLY!');
    await shutdown(0);

  } catch (err) {
    console.error('\n\x1b[31m%s\x1b[0m', '✗ TEST SUITE FAILED:');
    console.error(err);
    await shutdown(1);
  }
}

// Test Case: Login success
async function testLoginSuccess() {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.user.role, 'admin');
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Auth: Login Success Test Passed');
}

// Test Case: Login invalid password
async function testLoginFailure() {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: 'wrongpassword' })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 401);
  assert.strictEqual(data.success, false);
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Auth: Login Fail Safe Test Passed');
}

// Test Case: Create lead booking
let createdBookingId;
async function testCreateBooking() {
  const response = await fetch(`${API_URL}/create-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Client',
      phone: '+919999999999',
      email: 'test@client.com',
      preferred_date: '2026-06-10',
      preferred_time_slot: '11:00 AM - 01:00 PM',
      property_location: 'Greenwood Residency, Sector 45',
      budget: '₹80L - ₹1.2Cr',
      notes: 'Test notes'
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.booking_code.startsWith('SV-'));
  assert.strictEqual(data.data.status, 'Pending');
  createdBookingId = data.data.id;
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Bookings: Lead Booking Creation Test Passed');
}

// Test Case: Create booking with invalid email (should fail)
async function testCreateBookingInvalidEmail() {
  const response = await fetch(`${API_URL}/create-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Customer',
      phone: '+919999999999',
      email: 'invalid-email-format',
      preferred_date: '2026-06-10',
      preferred_time_slot: '11:00 AM - 01:00 PM',
      property_location: 'Yerragondapalem Gated Farms',
      budget: '1 Acre - ₹60L',
      notes: 'Should fail validation'
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 400);
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.message, 'Invalid email address format');
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Bookings: Invalid Email Rejection Test Passed');
}


// Test Case: Fetch bookings list
async function testGetBookings() {
  const response = await fetch(`${API_URL}/bookings`);
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length > 0);
  assert.strictEqual(data.data[0].customer_name, 'Test Client');
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Bookings: Fetch Listings Test Passed');
}

// Test Case: Update booking status
async function testUpdateBookingStatus() {
  const response = await fetch(`${API_URL}/update-status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: createdBookingId,
      status: 'Approved',
      notes: 'Visits approved by tester',
      updatedBy: 'Test Admin'
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);

  // Assert in SQLite
  const dbBooking = await query('SELECT status FROM bookings WHERE id = ?', [createdBookingId]);
  assert.strictEqual(dbBooking[0].status, 'Approved');
  
  const history = await query('SELECT * FROM visit_history WHERE booking_id = ? ORDER BY created_at ASC', [createdBookingId]);
  assert.strictEqual(history.length, 2); // 1. Created, 2. Approved
  assert.strictEqual(history[1].status, 'Approved');
  assert.strictEqual(history[1].notes, 'Visits approved by tester');

  console.log('\x1b[32m%s\x1b[0m', '  ✓ Workflows: Status Transition & History Trace Test Passed');
}

// Test Case: Fetch agents list
async function testGetAgents() {
  const response = await fetch(`${API_URL}/agents`);
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Agents: Fetch Agents Dropdown Test Passed');
}

// Test Case: Create new agent
let createdAgentId;
async function testCreateAgent() {
  const response = await fetch(`${API_URL}/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Agent',
      email: 'test.agent@realestate.com',
      phone: '+919876543219',
      password: 'testagentpassword'
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.success, true);

  // Get created agent ID
  const dbAgent = await query('SELECT id FROM agents WHERE email = ?', ['test.agent@realestate.com']);
  assert.ok(dbAgent.length > 0);
  createdAgentId = dbAgent[0].id;
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Agents: Create Agent Test Passed');
}

// Test Case: Update agent details
async function testUpdateAgent() {
  const response = await fetch(`${API_URL}/agent/${createdAgentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Agent Updated',
      email: 'test.agent.updated@realestate.com',
      phone: '+919876543299'
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);

  const dbAgent = await query('SELECT name, email, phone FROM agents WHERE id = ?', [createdAgentId]);
  assert.strictEqual(dbAgent[0].name, 'Test Agent Updated');
  assert.strictEqual(dbAgent[0].email, 'test.agent.updated@realestate.com');
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Agents: Update Agent Details Test Passed');
}

// Test Case: Update agent status (availability)
async function testUpdateAgentStatus() {
  const response = await fetch(`${API_URL}/update-agent-status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: createdAgentId,
      status: 'Offline'
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);

  const dbAgent = await query('SELECT status FROM agents WHERE id = ?', [createdAgentId]);
  assert.strictEqual(dbAgent[0].status, 'Offline');
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Agents: Update Agent Availability Test Passed');
}

// Test Case: Assign agent to booking
async function testAssignAgent() {
  // Make agent Available so they can accept visits
  await query("UPDATE agents SET status = 'Available' WHERE id = ?", [createdAgentId]);

  const response = await fetch(`${API_URL}/assign-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: createdBookingId,
      agentId: createdAgentId
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);

  const dbBooking = await query('SELECT agent_id FROM bookings WHERE id = ?', [createdBookingId]);
  assert.strictEqual(dbBooking[0].agent_id, createdAgentId);
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Bookings: Assign Representative Test Passed');
}

// Test Case: Fetch single booking details with history & notifications
async function testGetBookingDetails() {
  const response = await fetch(`${API_URL}/booking/${createdBookingId}`);
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.booking);
  assert.ok(Array.isArray(data.data.history));
  assert.ok(Array.isArray(data.data.notifications));
  assert.strictEqual(data.data.booking.customer_name, 'Test Client');
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Bookings: Get Booking Trace Details Test Passed');
}

// Test Case: Fetch aggregated dashboard stats
async function testGetDashboardStats() {
  const response = await fetch(`${API_URL}/dashboard-stats`);
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.stats);
  assert.strictEqual(data.stats.totalLeads, 1);
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Reports: Get Dashboard Statistics Test Passed');
}

// Test Case: Delete agent & verify foreign keys
async function testDeleteAgent() {
  const response = await fetch(`${API_URL}/agent/${createdAgentId}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);

  const dbAgent = await query('SELECT * FROM agents WHERE id = ?', [createdAgentId]);
  assert.strictEqual(dbAgent.length, 0);

  // Check SQLite constraint (ON DELETE SET NULL): booking's agent_id should now be null
  const dbBooking = await query('SELECT agent_id FROM bookings WHERE id = ?', [createdBookingId]);
  assert.strictEqual(dbBooking[0].agent_id, null);
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Agents: Delete Agent & Verify Constraints Test Passed');
}

// Test Case: Update booking & customer details
async function testUpdateBookingDetails() {
  const response = await fetch(`${API_URL}/booking/${createdBookingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Updated Tester Client',
      phone: '+919999998888',
      email: 'updated@tester.com',
      preferred_date: '2026-06-15',
      preferred_time_slot: '02:00 PM - 04:00 PM',
      property_location: 'Updated Greenwood Residency',
      budget: '₹1.5Cr - ₹2.0Cr',
      notes: 'Updated notes'
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);

  // Assert updates in database
  const dbBookingList = await query(`
    SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `, [createdBookingId]);

  assert.strictEqual(dbBookingList[0].customer_name, 'Updated Tester Client');
  assert.strictEqual(dbBookingList[0].customer_phone, '+919999998888');
  assert.strictEqual(dbBookingList[0].customer_email, 'updated@tester.com');
  assert.strictEqual(dbBookingList[0].preferred_date, '2026-06-15');
  assert.strictEqual(dbBookingList[0].preferred_time_slot, '02:00 PM - 04:00 PM');
  assert.strictEqual(dbBookingList[0].property_location, 'Updated Greenwood Residency');
  assert.strictEqual(dbBookingList[0].budget, '₹1.5Cr - ₹2.0Cr');
  assert.strictEqual(dbBookingList[0].notes, 'Updated notes');

  // Assert history log added
  const history = await query('SELECT * FROM visit_history WHERE booking_id = ? ORDER BY id DESC LIMIT 1', [createdBookingId]);
  assert.ok(history[0].notes.includes('Booking details updated'));

  console.log('\x1b[32m%s\x1b[0m', '  ✓ Bookings: Edit Customer & Booking Details Test Passed');
}

// Test Case: Delete booking & verify constraints
async function testDeleteBooking() {
  const response = await fetch(`${API_URL}/booking/${createdBookingId}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);

  // Assert that booking is gone
  const dbBooking = await query('SELECT * FROM bookings WHERE id = ?', [createdBookingId]);
  assert.strictEqual(dbBooking.length, 0);

  // Assert that related notifications and history are also gone
  const dbHistory = await query('SELECT * FROM visit_history WHERE booking_id = ?', [createdBookingId]);
  assert.strictEqual(dbHistory.length, 0);

  const dbNoti = await query('SELECT * FROM notifications WHERE booking_id = ?', [createdBookingId]);
  assert.strictEqual(dbNoti.length, 0);

  console.log('\x1b[32m%s\x1b[0m', '  ✓ Bookings: Delete Booking & Cascade Clean Test Passed');
}

// Teardown
async function shutdown(exitCode) {
  if (serverInstance) {
    await new Promise((resolve) => {
      serverInstance.close(async () => {
        console.log('Test server shut down.');
        await closeDatabase();
        resolve();
      });
    });
  } else {
    await closeDatabase();
  }
  setTimeout(() => {
    process.exit(exitCode);
  }, 100);
}

// Run the script
runTests();
