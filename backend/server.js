const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { query, initDatabase, getDbType } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Production Error Sanitizer Middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (process.env.NODE_ENV === 'production' && res.statusCode === 500 && data && typeof data.message === 'string') {
      const isSensitive = data.message.includes('SQL') || 
                          data.message.includes('Database') || 
                          data.message.includes('constraint') || 
                          data.message.includes('sqlite') ||
                          data.message.includes('mysql') ||
                          data.message.includes('table') ||
                          data.message.includes('column') ||
                          data.message.includes('SyntaxError');
      if (isSensitive) {
        data.message = 'Internal Server Error';
      }
    }
    return originalJson.call(this, data);
  };
  next();
});

// Async Queue for serializing concurrent booking operations to prevent race conditions
class AsyncQueue {
  constructor() {
    this.chain = Promise.resolve();
  }
  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.chain = this.chain
        .then(() => fn())
        .then(resolve)
        .catch(reject);
    });
  }
}
const bookingQueue = new AsyncQueue();

// Helper to generate unique booking code SV-XXXX
async function generateBookingCode() {
  try {
    const res = await query('SELECT MAX(id) as maxId FROM bookings');
    const nextId = (res[0].maxId || 0) + 1001;
    return `SV-${nextId}`;
  } catch (err) {
    // Fallback in case of error
    return `SV-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

// ----------------------------------------------------
// API Status Endpoint
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Site Visit Booking Automation API is running.',
    database: getDbType(),
    healthCheck: '/api/health'
  });
});

// ----------------------------------------------------
// Mock Auth Endpoint
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Admin Check
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@realestate.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (email === adminEmail && password === adminPassword) {
    return res.json({
      success: true,
      user: { name: 'System Admin', email: adminEmail, role: 'admin' }
    });
  }

  // Agent Check
  try {
    const agents = await query('SELECT * FROM agents WHERE email = ?', [email]);
    if (agents.length > 0) {
      const agent = agents[0];
      const dbPassword = agent.password || 'agent123';
      if (password === dbPassword) {
        return res.json({
          success: true,
          user: { name: agent.name, email: agent.email, role: 'agent', agentId: agent.id, phone: agent.phone }
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database login error: ' + err.message });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials. Use admin@realestate.com/admin123 or your registered agent credentials.' });
});

// ----------------------------------------------------
// API: GET /api/agents (Utility route for dropdowns)
// ----------------------------------------------------
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await query('SELECT * FROM agents ORDER BY name ASC');
    res.json({ success: true, data: agents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: POST /api/create-booking
// ----------------------------------------------------
app.post('/api/create-booking', async (req, res) => {
  const { name, phone, email, preferred_date, preferred_time_slot, property_location, budget, notes } = req.body;

  // 1. Validation
  if (!name || !phone || !email || !preferred_date || !preferred_time_slot || !property_location) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields: name, phone, email, preferred_date, preferred_time_slot, property_location' });
  }

  try {
    const result = await bookingQueue.enqueue(async () => {
      // 2. Check or Create Customer
      let customerId;
      const existingCustomers = await query('SELECT id FROM customers WHERE email = ? OR phone = ? LIMIT 1', [email, phone]);

      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const customerResult = await query(
          'INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)',
          [name, phone, email]
        );
        customerId = customerResult.insertId;
      }

      // 3. Auto-Assign Agent (Load balancing rule: find available agent with least active bookings)
      let assignedAgentId = null;
      let assignedAgentName = 'Unassigned';
      let assignedAgentPhone = '';

      const availableAgents = await query(`
        SELECT a.id, a.name, a.phone, COUNT(b.id) as active_bookings
        FROM agents a
        LEFT JOIN bookings b ON a.id = b.agent_id AND b.status IN ('Pending', 'Approved', 'Rescheduled')
        WHERE a.status = 'Available'
        GROUP BY a.id, a.name, a.phone
        ORDER BY active_bookings ASC
        LIMIT 1
      `);

      if (availableAgents.length > 0) {
        assignedAgentId = availableAgents[0].id;
        assignedAgentName = availableAgents[0].name;
        assignedAgentPhone = availableAgents[0].phone;
      }

      // 4. Create Booking with collision-retry logic (handles parallel concurrency)
      let newBookingId;
      let bookingCode;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        try {
          bookingCode = await generateBookingCode();
          const bookingResult = await query(`
            INSERT INTO bookings (booking_code, customer_id, agent_id, preferred_date, preferred_time_slot, property_location, budget, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
          `, [bookingCode, customerId, assignedAgentId, preferred_date, preferred_time_slot, property_location, budget, notes || '']);
          
          newBookingId = bookingResult.insertId;
          break; // Successfully inserted
        } catch (insertErr) {
          const isDup = insertErr.message.includes('UNIQUE constraint failed') || 
                        insertErr.code === 'ER_DUP_ENTRY' || 
                        insertErr.message.includes('Duplicate entry');
                        
          if (isDup) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw insertErr;
            }
            // Brief random backoff to allow parallel inserts to write and update MAX(id)
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 30) + 10));
          } else {
            throw insertErr; // Re-throw any other database error
          }
        }
      }

      // 6. Log History
      await query(`
        INSERT INTO visit_history (booking_id, status, notes, updated_by)
        VALUES (?, 'Pending', 'Booking registered online. Auto-assigned agent.', 'System')
      `, [newBookingId]);

      // 7. Generate WhatsApp Confirmation Notification
      let smsMessage = `Hello ${name}, thank you for booking a site visit! Booking ID: ${bookingCode} for ${property_location} is registered. `;
      if (assignedAgentId) {
        smsMessage += `Agent ${assignedAgentName} (${assignedAgentPhone}) has been assigned to assist you. Status: Pending Approval.`;
      } else {
        smsMessage += `Our team is reviewing your request and will assign an agent shortly. Status: Pending.`;
      }

      await query(`
        INSERT INTO notifications (booking_id, type, recipient, message, status)
        VALUES (?, 'WhatsApp', ?, ?, 'Sent')
      `, [newBookingId, phone, smsMessage]);

      return {
        id: newBookingId,
        booking_code: bookingCode,
        customer_id: customerId,
        agent_id: assignedAgentId,
        agent_name: assignedAgentName,
        preferred_date,
        preferred_time_slot,
        property_location,
        budget,
        status: 'Pending',
        notes
      };
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: result
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ----------------------------------------------------
// API: GET /api/bookings
// ----------------------------------------------------
app.get('/api/bookings', async (req, res) => {
  const { search, status, agentId, date } = req.query;
  let sql = `
    SELECT b.*, 
           c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
           a.name as agent_name, a.phone as agent_phone, a.status as agent_status
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    LEFT JOIN agents a ON b.agent_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }

  if (agentId) {
    sql += ' AND b.agent_id = ?';
    params.push(parseInt(agentId));
  }

  if (date) {
    sql += ' AND b.preferred_date = ?';
    params.push(date);
  }

  if (search) {
    sql += ' AND (c.name LIKE ? OR c.phone LIKE ? OR b.booking_code LIKE ? OR b.property_location LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  // Order by latest
  sql += ' ORDER BY b.created_at DESC';

  try {
    const bookings = await query(sql, params);
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: GET /api/booking/:id
// ----------------------------------------------------
app.get('/api/booking/:id', async (req, res) => {
  const bookingId = req.params.id;

  try {
    // Fetch Booking & Customer Details
    const bookingQuery = `
      SELECT b.*, 
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
             a.name as agent_name, a.phone as agent_phone, a.email as agent_email
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      LEFT JOIN agents a ON b.agent_id = a.id
      WHERE b.id = ?
    `;
    const bookings = await query(bookingQuery, [bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Fetch History Logs
    const history = await query(`
      SELECT * FROM visit_history 
      WHERE booking_id = ? 
      ORDER BY created_at ASC
    `, [bookingId]);

    // Fetch Notifications Logs
    const notifications = await query(`
      SELECT * FROM notifications 
      WHERE booking_id = ? 
      ORDER BY sent_at DESC
    `, [bookingId]);

    res.json({
      success: true,
      data: {
        booking,
        history,
        notifications
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: PUT /api/update-status
// ----------------------------------------------------
app.put('/api/update-status', async (req, res) => {
  const { bookingId, status, notes, updatedBy, preferred_date, preferred_time_slot } = req.body;

  if (!bookingId || !status || !updatedBy) {
    return res.status(400).json({ success: false, message: 'bookingId, status, and updatedBy are required fields' });
  }

  const validStatuses = ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'Rescheduled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    // Get original booking details first
    const originalBookings = await query(`
      SELECT b.*, c.name as customer_name, c.phone as customer_phone, a.name as agent_name, a.phone as agent_phone
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      LEFT JOIN agents a ON b.agent_id = a.id
      WHERE b.id = ?
    `, [bookingId]);

    if (originalBookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = originalBookings[0];

    // Set up update variables
    let updateSql = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (status === 'Rescheduled' && preferred_date && preferred_time_slot) {
      updateSql += ', preferred_date = ?, preferred_time_slot = ?';
      params.push(preferred_date, preferred_time_slot);
    }

    updateSql += ' WHERE id = ?';
    params.push(bookingId);

    // Run booking update
    await query(updateSql, params);

    // Update Agent Status if booking gets 'Completed' or goes 'On Visit'
    if (booking.agent_id) {
      if (status === 'Completed' || status === 'Cancelled' || status === 'Rejected' || status === 'Rescheduled' || status === 'Pending') {
        // Free the agent if they have no other 'Approved' bookings
        const otherApproved = await query(`
          SELECT COUNT(*) as count FROM bookings 
          WHERE agent_id = ? AND status = 'Approved' AND id != ?
        `, [booking.agent_id, bookingId]);
        
        if (otherApproved[0].count === 0) {
          // Preserve 'Offline' status by checking if they are currently 'On Visit'
          const currentAgent = await query('SELECT status FROM agents WHERE id = ?', [booking.agent_id]);
          if (currentAgent.length > 0 && currentAgent[0].status === 'On Visit') {
            await query("UPDATE agents SET status = 'Available' WHERE id = ?", [booking.agent_id]);
          }
        }
      } else if (status === 'Approved') {
        await query("UPDATE agents SET status = 'On Visit' WHERE id = ?", [booking.agent_id]);
      }
    }

    // Add Audit Log to visit_history
    const historyNotes = notes || `Status updated from ${booking.status} to ${status}`;
    await query(`
      INSERT INTO visit_history (booking_id, status, notes, updated_by)
      VALUES (?, ?, ?, ?)
    `, [bookingId, status, historyNotes, updatedBy]);

    // Send Notification based on status workflow rules
    let notificationMsg = '';
    const dateStr = preferred_date || booking.preferred_date;
    const slotStr = preferred_time_slot || booking.preferred_time_slot;
    const agentName = booking.agent_name || 'Unassigned Agent';
    const agentPhone = booking.agent_phone || '';

    switch (status) {
      case 'Approved':
        notificationMsg = `Hi ${booking.customer_name}, your site visit booking ${booking.booking_code} has been approved. Date: ${dateStr}, Time: ${slotStr}. Agent: ${agentName} (${agentPhone}). See you soon!`;
        break;
      case 'Rejected':
        notificationMsg = `Hi ${booking.customer_name}, we regret to inform you that your site visit SV-${booking.booking_code} could not be approved at this time. Notes: ${notes || 'Slots full'}.`;
        break;
      case 'Rescheduled':
        notificationMsg = `Hi ${booking.customer_name}, your site visit booking ${booking.booking_code} has been rescheduled. New Date: ${dateStr}, New Time: ${slotStr}. Agent: ${agentName}.`;
        break;
      case 'Cancelled':
        notificationMsg = `Hi ${booking.customer_name}, your site visit booking ${booking.booking_code} for ${booking.property_location} has been cancelled.`;
        break;
      case 'Completed':
        notificationMsg = `Hi ${booking.customer_name}, thank you for visiting ${booking.property_location} today. We hope you found the session informative! How would you rate your agent ${agentName}?`;
        break;
      default:
        notificationMsg = `Hi ${booking.customer_name}, the status of your site visit booking ${booking.booking_code} is now ${status}.`;
    }

    // Insert Notification entry
    await query(`
      INSERT INTO notifications (booking_id, type, recipient, message, status)
      VALUES (?, 'WhatsApp', ?, ?, 'Sent')
    `, [bookingId, booking.customer_phone, notificationMsg]);

    // Generate automated Reminder notification if approved/rescheduled
    if (status === 'Approved' || status === 'Rescheduled') {
      const reminderMsg = `Reminder: Hello ${booking.customer_name}, you have a scheduled site visit at ${booking.property_location} on ${dateStr} at ${slotStr}. Your agent is ${agentName}.`;
      await query(`
        INSERT INTO notifications (booking_id, type, recipient, message, status)
        VALUES (?, 'Reminder', ?, ?, 'Pending')
      `, [bookingId, booking.customer_phone, reminderMsg]);
    }

    res.json({
      success: true,
      message: `Status updated successfully to ${status}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: POST /api/assign-agent
// ----------------------------------------------------
app.post('/api/assign-agent', async (req, res) => {
  const { bookingId, agentId } = req.body;

  if (!bookingId || !agentId) {
    return res.status(400).json({ success: false, message: 'bookingId and agentId are required' });
  }

  try {
    // Check Agent availability
    const agents = await query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    const agent = agents[0];

    // Get Booking Details
    const bookings = await query(`
      SELECT b.*, c.name as customer_name, c.phone as customer_phone
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `, [bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const booking = bookings[0];

    // Update agent in bookings
    await query('UPDATE bookings SET agent_id = ? WHERE id = ?', [agentId, bookingId]);

    // Update agent status if booking is already approved
    if (booking.status === 'Approved') {
      await query("UPDATE agents SET status = 'On Visit' WHERE id = ?", [agentId]);
    }

    // Release old agent if reassigned
    const oldAgentId = booking.agent_id;
    if (oldAgentId && oldAgentId !== parseInt(agentId)) {
      const otherApproved = await query(`
        SELECT COUNT(*) as count FROM bookings 
        WHERE agent_id = ? AND status = 'Approved' AND id != ?
      `, [oldAgentId, bookingId]);
      
      if (otherApproved[0].count === 0) {
        // Preserve 'Offline' status by checking if they are currently 'On Visit'
        const currentOldAgent = await query('SELECT status FROM agents WHERE id = ?', [oldAgentId]);
        if (currentOldAgent.length > 0 && currentOldAgent[0].status === 'On Visit') {
          await query("UPDATE agents SET status = 'Available' WHERE id = ?", [oldAgentId]);
        }
      }
    }

    // Log History
    await query(`
      INSERT INTO visit_history (booking_id, status, notes, updated_by)
      VALUES (?, ?, ?, ?)
    `, [bookingId, booking.status, `Agent reassigned to ${agent.name}`, 'Admin']);

    // Send WhatsApp Notification to Customer
    const welcomeMsg = `Hi ${booking.customer_name}, agent ${agent.name} (${agent.phone}) has been assigned to host your site visit ${booking.booking_code} for ${booking.property_location}.`;
    await query(`
      INSERT INTO notifications (booking_id, type, recipient, message, status)
      VALUES (?, 'WhatsApp', ?, ?, 'Sent')
    `, [bookingId, booking.customer_phone, welcomeMsg]);

    res.json({
      success: true,
      message: `Agent ${agent.name} successfully assigned to booking ${booking.booking_code}`
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: PUT /api/update-agent-status
// ----------------------------------------------------
app.put('/api/update-agent-status', async (req, res) => {
  const { agentId, status } = req.body;

  if (!agentId || !status) {
    return res.status(400).json({ success: false, message: 'agentId and status are required' });
  }

  const validStatuses = ['Available', 'On Visit', 'Offline'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    await query('UPDATE agents SET status = ? WHERE id = ?', [status, agentId]);
    res.json({ success: true, message: `Availability status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: GET /api/dashboard-stats
// ----------------------------------------------------
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Counts
    const leadsRes = await query('SELECT COUNT(*) as count FROM bookings');
    const pendingRes = await query("SELECT COUNT(*) as count FROM bookings WHERE status = 'Pending'");
    const completedRes = await query("SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'");
    const todayRes = await query("SELECT COUNT(*) as count FROM bookings WHERE preferred_date = ?", [today]);

    // Agent Wise Statistics
    const agentStats = await query(`
      SELECT a.id, a.name, a.status,
             COUNT(b.id) as total_bookings,
             SUM(CASE WHEN b.status = 'Completed' THEN 1 ELSE 0 END) as completed_bookings,
             SUM(CASE WHEN b.status IN ('Pending', 'Approved', 'Rescheduled') THEN 1 ELSE 0 END) as active_bookings
      FROM agents a
      LEFT JOIN bookings b ON a.id = b.agent_id
      GROUP BY a.id, a.name, a.status
      ORDER BY total_bookings DESC
    `);

    // Recent Bookings
    const recentBookings = await query(`
      SELECT b.id, b.booking_code, b.preferred_date, b.preferred_time_slot, b.property_location, b.status,
             c.name as customer_name, a.name as agent_name
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      LEFT JOIN agents a ON b.agent_id = a.id
      ORDER BY b.created_at DESC
      LIMIT 6
    `);

    // Notification Logs (recent 5)
    const recentNotifications = await query(`
      SELECT n.*, b.booking_code 
      FROM notifications n
      JOIN bookings b ON n.booking_id = b.id
      ORDER BY n.sent_at DESC
      LIMIT 8
    `);

    // Simple Monthly/Daily booking trend
    // Let's list the past 7 days counting bookings
    const dbType = getDbType();
    let trendQuery = '';

    if (dbType === 'mysql') {
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM bookings
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY date
        ORDER BY date ASC
      `;
    } else if (dbType === 'sqlite') {
      trendQuery = `
        SELECT date(created_at) as date, COUNT(*) as count
        FROM bookings
        WHERE created_at >= date('now', '-7 days')
        GROUP BY date
        ORDER BY date ASC
      `;
    } else {
      // AlaSQL fallback
      trendQuery = `SELECT created_at FROM bookings`;
    }

    const rawTrend = await query(trendQuery);

    let trendData = [];
    if (dbType === 'alasql') {
      const counts = {};
      rawTrend.forEach(row => {
        if (row.created_at) {
          const datePart = new Date(row.created_at).toISOString().split('T')[0];
          counts[datePart] = (counts[datePart] || 0) + 1;
        }
      });
      trendData = Object.entries(counts).map(([date, count]) => ({ date, count }));
    } else {
      trendData = rawTrend;
    }

    // Fill in last 7 days defaults if empty
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = trendData.find(r => r.date === dateStr);
      trend.push({
        date: dateStr,
        count: match ? match.count : 0
      });
    }

    res.json({
      success: true,
      stats: {
        totalLeads: leadsRes[0].count || 0,
        pendingVisits: pendingRes[0].count || 0,
        completedVisits: completedRes[0].count || 0,
        todayVisits: todayRes[0].count || 0,
        agentStats,
        recentBookings,
        recentNotifications,
        trend
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: POST /api/agent
// ----------------------------------------------------
app.post('/api/agent', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Name, email, and phone are required fields' });
  }

  try {
    // Check if email is already taken
    const existing = await query('SELECT * FROM agents WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    const agentPassword = password || 'agent123';

    await query('INSERT INTO agents (name, email, phone, status, password) VALUES (?, ?, ?, "Available", ?)', [name, email, phone, agentPassword]);
    res.status(201).json({ success: true, message: 'Agent registered successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: PUT /api/agent/:id
// ----------------------------------------------------
app.put('/api/agent/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Name, email, and phone are required fields' });
  }

  try {
    // Check if email is already taken by another agent
    const existing = await query('SELECT * FROM agents WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email address is already in use by another executive.' });
    }

    if (password) {
      await query('UPDATE agents SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?', [name, email, phone, password, id]);
    } else {
      await query('UPDATE agents SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, id]);
    }
    res.json({ success: true, message: 'Agent details updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// API: DELETE /api/agent/:id
// ----------------------------------------------------
app.delete('/api/agent/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM agents WHERE id = ?', [id]);
    res.json({ success: true, message: 'Agent deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check probe
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ success: true, status: 'OK', database: getDbType() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database health check failed' });
  }
});

// Serve compiled static assets from the frontend/dist directory in production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  const staticPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(staticPath));
  
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Initialize database and start server if run directly
if (require.main === module) {
  initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Critical database initialization error:', err);
    process.exit(1);
  });
}

module.exports = { app, initDatabase };
