const http = require('http');

async function runTests() {
  console.log('--- Starting End-to-End Verification ---');

  const port = process.env.PORT || 3005;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Connecting to server at ${baseUrl}...`);

  // Helper fetch
  const post = async (path, body, headers = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json(), headers: res.headers };
  };

  const get = async (path, headers = {}) => {
    const res = await fetch(`${baseUrl}${path}`, { headers });
    return { status: res.status, data: await res.json() };
  };

  const patch = async (path, body, headers = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };

  // 1. Submit a valid contribution
  const testUtr = `UTR${Date.now()}`;
  console.log(`1. Submitting test contribution with UTR: ${testUtr}...`);
  const contribRes = await post('/api/contributions', {
    fullName: 'Ravi Teja',
    mobileNumber: '9876543210',
    address: 'Plot 45, Bala Ganesh Colony',
    amount: 501,
    utr: testUtr,
  });

  if (contribRes.status !== 200 || !contribRes.data.success) {
    throw new Error(`Contribution failed: ${JSON.stringify(contribRes.data)}`);
  }
  const receiptNo = contribRes.data.data.receiptNumber;
  const contribId = contribRes.data.data.id;
  console.log(`✓ Contribution created! Receipt: ${receiptNo}, Status: ${contribRes.data.data.paymentStatus}`);

  // 2. Test Duplicate UTR Protection
  console.log('2. Testing duplicate UTR protection with identical UTR...');
  const duplicateRes = await post('/api/contributions', {
    fullName: 'Duplicate User',
    mobileNumber: '9988776655',
    amount: 1000,
    utr: testUtr,
  });

  if (duplicateRes.status === 409 && duplicateRes.data.error.includes('already been submitted')) {
    console.log(`✓ Duplicate UTR successfully blocked! Error: "${duplicateRes.data.error}"`);
  } else {
    throw new Error(`Duplicate UTR test failed! Status: ${duplicateRes.status}, data: ${JSON.stringify(duplicateRes.data)}`);
  }

  // 3. Check public receipt lookup
  console.log(`3. Checking public receipt lookup for ${receiptNo}...`);
  const receiptLookup = await get(`/api/contributions/${receiptNo}`);
  if (receiptLookup.status === 200 && receiptLookup.data.data.receiptNumber === receiptNo) {
    console.log(`✓ Public receipt fetched! Name: ${receiptLookup.data.data.fullName}, Amount: ₹${receiptLookup.data.data.amount}`);
  } else {
    throw new Error(`Receipt lookup failed: ${JSON.stringify(receiptLookup)}`);
  }

  // 4. Test Admin Login
  console.log('4. Testing Admin Authentication...');
  const loginRes = await post('/api/admin/login', {
    username: 'admin',
    password: 'BalaGaneshAdmin@2026',
  });

  if (loginRes.status !== 200 || !loginRes.data.success) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
  }
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('✓ Admin login successful!');

  // Extract session cookie for authenticated requests
  const cookieHeader = { Cookie: setCookie ? setCookie.split(';')[0] : '' };

  // 5. Check Admin Stats
  console.log('5. Fetching Admin Stats...');
  const statsRes = await get('/api/admin/stats', cookieHeader);
  if (statsRes.status === 200 && statsRes.data.stats.totalContributions >= 1) {
    console.log(`✓ Stats verified: Total: ${statsRes.data.stats.totalContributions}, Amount: ₹${statsRes.data.stats.totalAmount}, Pending: ${statsRes.data.stats.pendingPayments}`);
  } else {
    throw new Error(`Admin stats check failed: ${JSON.stringify(statsRes)}`);
  }

  // 6. Admin Verifies Contribution
  console.log(`6. Admin verifying contribution ${contribId}...`);
  const verifyRes = await patch(
    '/api/admin/contributions',
    { id: contribId, status: 'VERIFIED' },
    cookieHeader
  );
  if (verifyRes.status === 200 && verifyRes.data.data.paymentStatus === 'VERIFIED') {
    console.log('✓ Contribution status changed to VERIFIED!');
  } else {
    throw new Error(`Verify failed: ${JSON.stringify(verifyRes)}`);
  }

  // 7. Verify updated receipt reflects VERIFIED
  console.log('7. Verifying receipt status update...');
  const updatedReceipt = await get(`/api/contributions/${receiptNo}`);
  if (updatedReceipt.data.data.paymentStatus === 'VERIFIED') {
    console.log('✓ Receipt status confirmed as VERIFIED in database!');
  } else {
    throw new Error(`Status update verification failed: ${JSON.stringify(updatedReceipt)}`);
  }

  console.log('\n🎉 ALL 7 END-TO-END AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
