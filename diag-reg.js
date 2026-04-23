const axios = require('axios');

async function testRegistration() {
  const url = 'http://localhost:5001/api/auth/register';
  const data = {
    name: 'Test Solver',
    email: `test_solver_${Date.now()}@example.com`,
    password: 'password123',
    role: 'solver'
  };

  try {
    const res = await axios.post(url, data);
    console.log('✅ Registration success:', res.data);
  } catch (err) {
    console.error('❌ Registration failed');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Message:', err.response.data.message);
      console.error('Full Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
    }
  }
}

testRegistration();
