// Run this in your browser console to check authentication status
(async function testAuth() {
  try {
    console.log('Testing authentication...');

    // Get the token from localStorage
    const token = localStorage.getItem('access_token');
    console.log('Token exists:', !!token);
    if (token) {
      console.log('Token first 10 chars:', token.substring(0, 10) + '...');
    }

    // Try making a direct request to the debug endpoint
    console.log('Trying to access debug/auth endpoint...');
    const response = await fetch('http://localhost:8000/api/debug/auth', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    // Also check user endpoint
    console.log('Trying to access user endpoint...');
    const userResponse = await fetch('http://localhost:8000/api/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('User response status:', userResponse.status);
    const userData = await userResponse.json();
    console.log('User data:', userData);

    // Now check crops/user endpoint with direct fetch
    console.log('Trying to access crops/user endpoint...');
    const cropsResponse = await fetch('http://localhost:8000/api/crops/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    console.log('Crops response status:', cropsResponse.status);
    const cropsData = await cropsResponse.text();
    console.log('Raw crops response:', cropsData);

    try {
      const parsedCrops = JSON.parse(cropsData);
      console.log('Parsed crops data:', parsedCrops);
    } catch (e) {
      console.error('Could not parse crops response as JSON:', e);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
})();
