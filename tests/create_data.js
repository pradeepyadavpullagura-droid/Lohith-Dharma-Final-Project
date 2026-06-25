async function createData() {
  const agentUrl = 'http://localhost:5000/api/agent';
  const bookingUrl = 'http://localhost:5000/api/create-booking';

  const agents = [
    {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@realestate.com',
      phone: '+919876543210',
      password: 'agent123'
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha.reddy@realestate.com',
      phone: '+919876543211',
      password: 'agent123'
    },
    {
      name: 'Amit Patel',
      email: 'amit.patel@realestate.com',
      phone: '+919876543212',
      password: 'agent123'
    }
  ];

  const bookings = [
    {
      name: 'Ramesh Kulkarni',
      phone: '+919900000001',
      email: 'ramesh.k@gmail.com',
      preferred_date: '2026-07-01',
      preferred_time_slot: '09:00 AM - 11:00 AM',
      property_location: 'Yerragondapalem Gated Farms',
      budget: '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L',
      notes: 'Interested in site tour with family.'
    },
    {
      name: 'Suresh Babu',
      phone: '+919900000002',
      email: 'suresh.b@gmail.com',
      preferred_date: '2026-07-02',
      preferred_time_slot: '11:00 AM - 01:00 PM',
      property_location: 'Seshachalam Foothills Block A',
      budget: '1/4 Acre (100 Sandalwood Trees) - ₹15L - ₹25L',
      notes: 'Needs transport support from Tirupati.'
    },
    {
      name: 'Divya Teja',
      phone: '+919900000003',
      email: 'divya.t@gmail.com',
      preferred_date: '2026-07-03',
      preferred_time_slot: '02:00 PM - 04:00 PM',
      property_location: 'Nallamala Native Sector Block B',
      budget: '1/2 Acre (200 Sandalwood Trees) - ₹30L - ₹45L',
      notes: 'Wants to inspect water resources.'
    },
    {
      name: 'Kiran Kumar',
      phone: '+919900000004',
      email: 'kiran.k@gmail.com',
      preferred_date: '2026-07-04',
      preferred_time_slot: '04:00 PM - 06:00 PM',
      property_location: 'Giddalur Range Sandalwood plots',
      budget: '2+ Acres (800+ Sandalwood Trees) - ₹1.2Cr+',
      notes: 'Corporate client site visit.'
    },
    {
      name: 'Madhavi Latha',
      phone: '+919900000005',
      email: 'madhavi.l@gmail.com',
      preferred_date: '2026-07-05',
      preferred_time_slot: '11:00 AM - 01:00 PM',
      property_location: 'Yerragondapalem Gated Farms',
      budget: '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L',
      notes: 'Requested senior advisor presence.'
    }
  ];

  console.log('--- Creating 3 Agents ---');
  for (const agent of agents) {
    try {
      const response = await fetch(agentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      });
      const result = await response.json();
      console.log(`Agent ${agent.name}: Status ${response.status}, Message: ${result.message || (result.success ? 'Success' : 'Error')}`);
    } catch (err) {
      console.error(`Failed to create agent ${agent.name}:`, err.message);
    }
  }

  console.log('\n--- Creating 5 Bookings ---');
  for (const booking of bookings) {
    try {
      const response = await fetch(bookingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      const result = await response.json();
      console.log(`Booking ${booking.name}: Status ${response.status}, Success: ${result.success}`);
      if (result.success) {
        console.log(`  -> Code: ${result.data.booking_code}, Assigned Agent: ${result.data.agent_name || 'None'}`);
      } else {
        console.log(`  -> Error: ${result.message}`);
      }
    } catch (err) {
      console.error(`Failed to submit booking ${booking.name}:`, err.message);
    }
  }
}

createData();
