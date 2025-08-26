const axios = require('axios');
require('dotenv').config();

console.log('=== Testing Street View Static API ===');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
console.log('API Key starts with:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'Missing');

if (!API_KEY) {
  console.log('❌ No API key found');
  process.exit(1);
}

// Test Street View Static API
const testAddress = '123 Main St, Los Angeles, CA';
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${encodeURIComponent(testAddress)}&key=${API_KEY}`;

console.log('Testing Street View for:', testAddress);
console.log('URL:', streetViewUrl.substring(0, 80) + '...');

// First, try a HEAD request to check if the image exists
axios.head(streetViewUrl)
  .then(response => {
    console.log('✅ Street View HEAD request successful');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    
    if (response.status === 200) {
      console.log('✅ Street View API working!');
      console.log('Image URL:', streetViewUrl);
    } else {
      console.log('❌ Street View returned status:', response.status);
    }
  })
  .catch(error => {
    console.log('❌ Street View HEAD request failed');
    console.log('Error:', error.response ? error.response.status : error.message);
    
    if (error.response && error.response.data) {
      console.log('Error details:', error.response.data);
    }
    
    // Try a GET request to see the full error
    console.log('\nTrying GET request to see full error...');
    return axios.get(streetViewUrl);
  })
  .then(response => {
    if (response && response.status === 200) {
      console.log('✅ Street View GET request successful');
    }
  })
  .catch(error => {
    console.log('❌ Street View GET request also failed');
    console.log('Error:', error.response ? error.response.status : error.message);
    
    if (error.response && error.response.data) {
      console.log('Full error response:', error.response.data);
    }
  });
