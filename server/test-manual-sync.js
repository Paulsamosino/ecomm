const axios = require('axios');

async function testManualSync() {
  try {
    console.log('🔄 Testing manual delivery status sync...');
    
    // First, let's test syncing all pending deliveries
    const syncAllResponse = await axios.post('http://localhost:5000/api/delivery/sync-all', {}, {
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need a valid auth token for protected routes
        // For testing, you might need to modify the route temporarily or use a test token
      }
    });
    
    console.log('\n✅ Sync All Response:');
    console.log(JSON.stringify(syncAllResponse.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('\n❌ Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n💡 Authentication required. Let\'s try individual order sync...');
        
        // Try individual order sync for the orders we know
        const orderIds = ['687671dcd84c3fa425dfe0ce', '68767184d84c3fa425dfdae0'];
        
        for (const orderId of orderIds) {
          try {
            console.log(`\n🔄 Syncing order ${orderId}...`);
            const response = await axios.get(`http://localhost:5000/api/delivery/${orderId}/status/sync`);
            console.log('✅ Sync Response:', response.data);
          } catch (syncError) {
            console.log(`❌ Failed to sync order ${orderId}:`, syncError.response?.data || syncError.message);
          }
        }
      }
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

testManualSync();
