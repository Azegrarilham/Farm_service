// Token Repair Tool - Run this in browser console when on /sell-crops page
(async function fixTokenAndFarms() {
  console.log('🔍 Starting token and farm-crops diagnostic...');

  // 1. Check current token
  const currentToken = localStorage.getItem('access_token');
  console.log('Current token exists:', !!currentToken);
  if (currentToken) {
    console.log('Token first 10 chars:', currentToken.substring(0, 10) + '...');
  } else {
    console.error('No token found! You need to log in.');
    if (confirm('No token found. Redirect to login page?')) {
      window.location.href = '/login?redirect=/sell-crops';
    }
    return;
  }

  // 2. Test token with direct fetch
  try {
    console.log('Testing token with user endpoint...');
    const userResponse = await fetch('http://localhost:8000/api/user', {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Accept': 'application/json'
      }
    });

    if (!userResponse.ok) {
      console.error(`Token validation failed with status ${userResponse.status}`);

      if (confirm('Your token appears to be invalid. Would you like to logout and log back in?')) {
        // Force logout and redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login?redirect=/sell-crops';
      }
      return;
    }

    const userData = await userResponse.json();
    console.log('✅ Token is valid! User:', userData);

    // 3. Check farms
    console.log('Checking farms...');
    const farmsResponse = await fetch('http://localhost:8000/api/farms/user', {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Accept': 'application/json'
      }
    });

    if (!farmsResponse.ok) {
      console.error(`Failed to fetch farms: ${farmsResponse.status}`);
      return;
    }

    const farmsData = await farmsResponse.json();
    console.log(`Found ${farmsData.length} farms for your account`);

    if (farmsData.length === 0) {
      if (confirm('You have no farms registered. Would you like to create one now?')) {
        window.location.href = '/farms/add';
      }
      return;
    }

    // 4. Check crops
    console.log('Checking crops...');
    const cropsResponse = await fetch('http://localhost:8000/api/crops/user', {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    const cropsStatus = cropsResponse.status;
    console.log('Crops response status:', cropsStatus);

    let cropsData = [];
    try {
      const responseText = await cropsResponse.text();
      if (responseText.trim()) {
        cropsData = JSON.parse(responseText);
      }
    } catch (e) {
      console.error('Failed to parse crops response:', e);
    }

    if (Array.isArray(cropsData)) {
      console.log(`Found ${cropsData.length} crops`);

      if (cropsData.length === 0 && farmsData.length > 0) {
        if (confirm('You have farms but no crops. Would you like to add a crop now?')) {
          window.location.href = '/sell-crops/add';
        }
      }
    } else {
      console.error('Crops data is not an array:', cropsData);
    }

    // 5. Force page refresh with cleared cache
    if (confirm('Diagnostic complete. Would you like to refresh the page?')) {
      window.location.reload(true);
    }

  } catch (error) {
    console.error('Error during diagnostic:', error);
  }
})();
