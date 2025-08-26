const axios = require('axios');
require('dotenv').config();

console.log('=== Simple Google Maps API Test ===');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
console.log('API Key starts with:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'Missing');

if (!API_KEY) {
  console.log('❌ No API key found');
  process.exit(1);
}

// Test with a simple geocoding request
const testAddress = '123 Main St, Los Angeles, CA';
const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${API_KEY}`;

console.log('Testing geocoding for:', testAddress);
console.log('URL:', url.substring(0, 50) + '...');

axios.get(url)
  .then(response => {
    console.log('✅ API call successful');
    console.log('Status:', response.data.status);
    
    if (response.data.status === 'OK') {
      console.log('✅ Geocoding working!');
      const result = response.data.results[0];
      console.log('Formatted address:', result.formatted_address);
      console.log('Location:', result.geometry.location);
    } else {
      console.log('❌ Geocoding failed:', response.data.status);
      console.log('Error message:', response.data.error_message);
    }
  })
  .catch(error => {
    console.log('❌ API call failed');
    console.log('Error:', error.response ? error.response.status : error.message);
    
    if (error.response && error.response.data) {
      console.log('Error details:', error.response.data);
    }
  });
