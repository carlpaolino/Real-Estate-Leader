const axios = require('axios');
require('dotenv').config();

console.log('=== Testing API Connections ===');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

console.log('Google Maps API Key:', GOOGLE_MAPS_API_KEY ? '✅ Found' : '❌ Missing');
console.log('Bridge API Key:', BRIDGE_API_KEY ? '✅ Found' : '❌ Missing');

// Test Google Maps API
async function testGoogleMaps() {
  if (!GOOGLE_MAPS_API_KEY) {
    console.log('❌ Google Maps API key not found');
    return;
  }

  console.log('\n--- Testing Google Maps API ---');
  
  try {
    // Test Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=123+Main+St+Los+Angeles+CA&key=${GOOGLE_MAPS_API_KEY}`;
    const geocodeResponse = await axios.get(geocodeUrl);
    
    if (geocodeResponse.data.status === 'OK') {
      console.log('✅ Google Maps Geocoding API working');
    } else {
      console.log('❌ Google Maps Geocoding API error:', geocodeResponse.data.status);
    }

    // Test Street View API
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=123+Main+St+Los+Angeles+CA&key=${GOOGLE_MAPS_API_KEY}`;
    const streetViewResponse = await axios.head(streetViewUrl);
    
    if (streetViewResponse.status === 200) {
      console.log('✅ Google Maps Street View API working');
    } else {
      console.log('❌ Google Maps Street View API error:', streetViewResponse.status);
    }

  } catch (error) {
    console.log('❌ Google Maps API error:', error.response ? error.response.status : error.message);
  }
}

// Test Bridge API
async function testBridgeAPI() {
  if (!BRIDGE_API_KEY) {
    console.log('❌ Bridge API key not found');
    return;
  }

  console.log('\n--- Testing Bridge API ---');
  
  try {
    // Test Bridge API with a sample address
    const bridgeUrl = 'https://api.bridgedataoutput.com/api/v2/assessments';
    const bridgeResponse = await axios.get(bridgeUrl, {
      headers: {
        'Authorization': `Bearer ${BRIDGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        access_token: BRIDGE_API_KEY,
        address: '123 Main St, Los Angeles, CA'
      },
      timeout: 10000
    });

    if (bridgeResponse.data) {
      console.log('✅ Bridge API working');
      console.log('Response status:', bridgeResponse.status);
    } else {
      console.log('❌ Bridge API error: No data returned');
    }

  } catch (error) {
    console.log('❌ Bridge API error:', error.response ? error.response.status : error.message);
    if (error.response && error.response.data) {
      console.log('Error details:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  await testGoogleMaps();
  await testBridgeAPI();
  
  console.log('\n=== API Test Summary ===');
  console.log('Google Maps:', GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing');
  console.log('Bridge API:', BRIDGE_API_KEY ? 'Configured' : 'Missing');
}

runTests().catch(console.error);
