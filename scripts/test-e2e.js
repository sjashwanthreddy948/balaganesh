async function runComprehensiveTests() {
  console.log('=== Starting Bala Ganesh Comprehensive E2E Verification ===\n');

  const port = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Connecting to application server at ${baseUrl}...`);

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
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      return { status: res.status, data: await res.text(), headers: res.headers };
    }
    return { status: res.status, data: await res.json(), headers: res.headers };
  };

  const patch = async (path, body, headers = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };

  const put = async (path, body, headers = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };

  // 1. Volunteer Login
  console.log('1. Testing Volunteer Login (volunteer / Volunteer@2026)...');
  const volLoginRes = await post('/api/auth/login', {
    username: 'volunteer',
    password: 'Volunteer@2026',
  });
  if (volLoginRes.status !== 200 || volLoginRes.data.user.role !== 'VOLUNTEER') {
    throw new Error(`Volunteer login failed: ${JSON.stringify(volLoginRes.data)}`);
  }
  const volCookie = { Cookie: volLoginRes.headers.get('set-cookie')?.split(';')[0] || '' };
  console.log(`✓ Volunteer logged in! Name: ${volLoginRes.data.user.name}`);

  // 2. Fast Cash Contribution (Physical money handed over)
  console.log('2. Recording CASH contribution (Ravi Kumar, ₹500, CASH)...');
  const cashRes = await post(
    '/api/contributions',
    {
      fullName: 'Ravi Kumar',
      mobileNumber: '9876543210',
      address: 'Plot 12, Pandal Ground',
      amount: 500,
      paymentMethod: 'CASH',
    },
    volCookie
  );
  if (cashRes.status !== 200 || cashRes.data.data.paymentStatus !== 'CASH_RECEIVED') {
    throw new Error(`Cash contribution failed: ${JSON.stringify(cashRes.data)}`);
  }
  const cashCertNo = cashRes.data.data.certificateNumber;
  console.log(`✓ Cash contribution saved! Certificate No: ${cashCertNo}, Status: ${cashRes.data.data.paymentStatus}`);

  // 3. Online Contribution (UPI WITH NO UTR - strictly optional now!)
  console.log('3. Recording ONLINE contribution WITHOUT UTR (Photo proof donor, ₹500, ONLINE)...');
  const onlineNoUtrRes = await post(
    '/api/contributions',
    {
      fullName: 'Sunil Camera Donor',
      amount: 500,
      paymentMethod: 'ONLINE',
      paymentScreenshot: '/uploads/sample-camera-proof.jpg',
    },
    volCookie
  );
  if (onlineNoUtrRes.status !== 200 || onlineNoUtrRes.data.data.paymentStatus !== 'PENDING') {
    throw new Error(`Online contribution without UTR failed: ${JSON.stringify(onlineNoUtrRes.data)}`);
  }
  console.log(`✓ Online contribution without UTR saved cleanly! Certificate: ${onlineNoUtrRes.data.data.certificateNumber}, UTR: ${onlineNoUtrRes.data.data.utr}`);

  // 4. Online Contribution with UTR
  const testUtr = `UPI${Date.now()}`;
  console.log(`4. Recording ONLINE contribution WITH UTR (${testUtr})...`);
  const onlineRes = await post(
    '/api/contributions',
    {
      fullName: 'Anand Varma',
      mobileNumber: '9988776655',
      amount: 1000,
      paymentMethod: 'ONLINE',
      utr: testUtr,
    },
    volCookie
  );
  if (onlineRes.status !== 200 || onlineRes.data.data.paymentStatus !== 'PENDING') {
    throw new Error(`Online contribution failed: ${JSON.stringify(onlineRes.data)}`);
  }
  const onlineCertNo = onlineRes.data.data.certificateNumber;
  const onlineContribId = onlineRes.data.data.id;
  console.log(`✓ Online contribution with UTR saved! Certificate No: ${onlineCertNo}`);

  // 5. Duplicate UTR Protection
  console.log('5. Testing Duplicate UTR Protection with same transaction ID...');
  const duplicateUtrRes = await post(
    '/api/contributions',
    {
      fullName: 'Fraud Attempt',
      amount: 500,
      paymentMethod: 'ONLINE',
      utr: testUtr,
    },
    volCookie
  );
  if (duplicateUtrRes.status === 409 && duplicateUtrRes.data.error.includes('already been recorded')) {
    console.log(`✓ Duplicate UTR blocked successfully: "${duplicateUtrRes.data.error}"`);
  } else {
    throw new Error(`Duplicate UTR test failed: ${JSON.stringify(duplicateUtrRes.data)}`);
  }

  // 6. Public Certificate Lookup
  console.log(`6. Verifying public landscape certificate lookup for ${cashCertNo}...`);
  const certLookupRes = await get(`/api/contributions/${cashCertNo}`);
  if (certLookupRes.status === 200 && certLookupRes.data.data.fullName === 'Ravi Kumar') {
    console.log(`✓ Certificate fetched: ${certLookupRes.data.data.fullName}, Amount: ₹${certLookupRes.data.data.amount}`);
  } else {
    throw new Error(`Certificate lookup failed: ${JSON.stringify(certLookupRes)}`);
  }

  // 7. Admin Login
  console.log('7. Testing Admin Login (admin / BalaGaneshAdmin@2026)...');
  const adminLoginRes = await post('/api/auth/login', {
    username: 'admin',
    password: 'BalaGaneshAdmin@2026',
  });
  if (adminLoginRes.status !== 200 || adminLoginRes.data.user.role !== 'ADMIN') {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
  }
  const adminCookie = { Cookie: adminLoginRes.headers.get('set-cookie')?.split(';')[0] || '' };
  console.log(`✓ Admin logged in! Name: ${adminLoginRes.data.user.name}`);

  // 8. Admin Dashboard Stats
  console.log('8. Verifying Admin Dashboard Stats...');
  const statsRes = await get('/api/admin/stats', adminCookie);
  if (statsRes.status === 200 && statsRes.data.stats.totalContributions >= 3) {
    const s = statsRes.data.stats;
    console.log(`✓ Stats Verified: Total Amount: ₹${s.totalAmount} (Cash: ₹${s.cashAmount}, Online: ₹${s.onlineAmount})`);
  } else {
    throw new Error(`Stats verification failed: ${JSON.stringify(statsRes)}`);
  }

  // 9. Admin Verifies Online Payment
  console.log(`9. Admin verifying online contribution ${onlineContribId}...`);
  const verifyRes = await patch(
    `/api/contributions/${onlineContribId}`,
    { status: 'VERIFIED' },
    adminCookie
  );
  if (verifyRes.status === 200 && verifyRes.data.data.paymentStatus === 'VERIFIED') {
    console.log('✓ Online payment successfully marked as VERIFIED by admin!');
  } else {
    throw new Error(`Verification failed: ${JSON.stringify(verifyRes)}`);
  }

  // 10. Admin Volunteer Tracking
  console.log('10. Verifying Volunteer Leaderboard tracking...');
  const volTrackRes = await get('/api/admin/volunteers', adminCookie);
  if (volTrackRes.status === 200 && volTrackRes.data.data.length > 0) {
    const v = volTrackRes.data.data[0];
    console.log(`✓ Volunteer Tracking: ${v.name} has recorded ${v.contributionCount} contributions totaling ₹${v.totalAmount}!`);
  } else {
    throw new Error(`Volunteer tracking failed: ${JSON.stringify(volTrackRes)}`);
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL COMPREHENSIVE TESTS INCLUDING OPTIONAL UTR PASSED! 🎉');
  console.log('===============================================================\n');
}

runComprehensiveTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
