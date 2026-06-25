const path = require('path');
module.paths.push(path.resolve(__dirname, '../backend/node_modules'));

const assert = require('assert');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

// Force database to concurrency SQLite file
process.env.DB_TYPE = 'sqlite';
process.env.SQLITE_FILE = './concurrency_database.sqlite';

const { query, initDatabase, closeDatabase } = require('../backend/db');

let serverInstance;
const TEST_PORT = 5006;
const API_URL = `http://localhost:${TEST_PORT}/api`;

async function runConcurrencyTests() {
  console.log('\x1b[36m%s\x1b[0m', '=== Starting Backend Concurrency & Stress Tests ===');

  try {
    // Clean up test DB file
    const fs = require('fs');
    const dbPath = path.resolve(__dirname, '../backend/concurrency_database.sqlite');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Removed old concurrency test database file.');
    }

    // 1. Init Database
    console.log('Initializing concurrency database...');
    await initDatabase();

    // Clear existing bookings/customers to have a clean slate
    await query('DELETE FROM notifications');
    await query('DELETE FROM visit_history');
    await query('DELETE FROM bookings');
    await query('DELETE FROM customers');
    await query('DELETE FROM agents');
    
    // Seed test agents for workload load balancing assertions
    await query(`INSERT INTO agents (name, email, phone, status, password) VALUES
      ('Rohan Sharma', 'rohan.sharma@realestate.com', '+919876543210', 'Available', 'agent123'),
      ('Sneha Reddy', 'sneha.reddy@realestate.com', '+919876543211', 'Available', 'agent123'),
      ('Vikram Singh', 'vikram.singh@realestate.com', '+919876543214', 'Available', 'agent123')`);
    
    console.log('Concurrency database cleaned and test agents seeded.');

    // 2. Spin up Express app
    const { app } = require('../backend/server');
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`Stress test server listening on port ${TEST_PORT}`);
    });

    // 3. Prepare 10 concurrent requests
    const bookingPayloads = Array.from({ length: 10 }).map((_, i) => ({
      name: `Concurrent Client ${i + 1}`,
      phone: `+9199999900${String(i).padStart(2, '0')}`,
      email: `concurrent.client.${i + 1}@gmail.com`,
      preferred_date: '2026-07-15',
      preferred_time_slot: '02:00 PM - 04:00 PM',
      property_location: 'Seshachalam Foothills Sector (Sandalwood Plot)',
      budget: '1/2 Acre (200 Sandalwood Trees) - ₹30L - ₹45L',
      notes: `Stress test booking ${i + 1}`
    }));

    console.log(`Firing 10 concurrent bookings to ${API_URL}/create-booking...`);
    
    // Fire all requests concurrently using Promise.all
    const startTime = Date.now();
    const responses = await Promise.all(
      bookingPayloads.map(payload => 
        fetch(`${API_URL}/create-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      )
    );
    const duration = Date.now() - startTime;
    console.log(`All concurrent requests completed in ${duration}ms.`);

    // 4. Verify all requests succeeded
    const results = await Promise.all(responses.map(res => res.json()));
    
    console.log('Validating HTTP status codes...');
    responses.forEach((res, index) => {
      assert.strictEqual(res.status, 201, `Request ${index + 1} failed with status ${res.status}`);
    });

    console.log('Validating success indicators...');
    results.forEach((data, index) => {
      assert.strictEqual(data.success, true, `Request ${index + 1} returned success: false. Message: ${data.message}`);
    });

    // 5. Verify booking code uniqueness (MAX(id) robustness)
    console.log('Validating unique booking code generation (anti-collision)...');
    const bookingCodes = results.map(r => r.data.booking_code);
    console.log('Generated Booking Codes:', bookingCodes);

    const uniqueCodes = new Set(bookingCodes);
    assert.strictEqual(uniqueCodes.size, 10, 'Duplicate booking codes detected! Concurrency collision occurred.');
    console.log('  ✓ Unique code assertion passed (no collisions).');

    // 6. Verify SQLite database integrity & load balancing
    console.log('Validating SQLite record counts...');
    const dbBookings = await query('SELECT * FROM bookings');
    assert.strictEqual(dbBookings.length, 10, `Database has ${dbBookings.length} bookings instead of 10.`);
    console.log('  ✓ Database record count matches.');

    console.log('Validating workload-balanced agent distribution...');
    const agentStats = await query(`
      SELECT agent_id, COUNT(id) as booking_count 
      FROM bookings 
      GROUP BY agent_id
    `);
    console.log('Agent Allocation Stats:', agentStats);
    
    // We expect bookings to be distributed across available agents (Rohan Sharma, Sneha Reddy, Vikram Singh)
    // No single agent should have all 10 bookings while others have 0.
    assert.ok(agentStats.length > 0, 'No agent was assigned any bookings!');
    agentStats.forEach(stat => {
      assert.ok(stat.booking_count > 0, 'Agent assigned negative or zero bookings.');
      assert.ok(stat.booking_count <= 5, 'Agent overloaded disproportionately.');
    });
    console.log('  ✓ Workload load balancing assertion passed.');

    console.log('\n\x1b[32m%s\x1b[0m', '✓ CONCURRENCY AND STRESS TESTS PASSED SUCCESSFULLY!');
    await shutdown(0);

  } catch (err) {
    console.error('\n\x1b[31m%s\x1b[0m', '✗ CONCURRENCY TEST SUITE FAILED:');
    console.error(err);
    await shutdown(1);
  }
}

async function shutdown(exitCode) {
  if (serverInstance) {
    await new Promise((resolve) => {
      serverInstance.close(async () => {
        console.log('Stress test server shut down.');
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

runConcurrencyTests();
