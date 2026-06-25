
async function createBookings() {
  const url = 'http://localhost:5000/api/create-booking';
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

  console.log('Sending requests to create 5 bookings...');
  
  for (let i = 0; i < bookings.length; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookings[i])
      });
      const result = await response.json();
      console.log(`Booking ${i + 1}: Status: ${response.status}, Success: ${result.success}`);
      if (result.success) {
        console.log(`  -> Code: ${result.data.booking_code}, Assigned Agent: ${result.data.agent_name}`);
      } else {
        console.log(`  -> Error: ${result.message}`);
      }
    } catch (err) {
      console.error(`Failed to submit booking ${i + 1}:`, err.message);
    }
  }
}

createBookings();
