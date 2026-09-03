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

  const del = async (path, headers = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
      headers,
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

  // 2. Fast Cash Contribution
  console.log('2. Recording CASH contribution (Ramesh Patel, ₹2000, CASH)...');
  const cashRes = await post(
    '/api/contributions',
    {
      fullName: 'Ramesh Patel',
      mobileNumber: '9876543210',
      amount: 2000,
      paymentMethod: 'CASH',
    },
    volCookie
  );
  if (cashRes.status !== 200 || cashRes.data.data.paymentStatus !== 'CASH_RECEIVED') {
    throw new Error(`Cash contribution failed: ${JSON.stringify(cashRes.data)}`);
  }
  console.log(`✓ Cash contribution saved! Certificate No: ${cashRes.data.data.certificateNumber}`);

  // 3. Online Contribution (without UTR - strictly optional)
  console.log('3. Recording ONLINE contribution (Kiran Rao, ₹5000, ONLINE)...');
  const onlineRes = await post(
    '/api/contributions',
    {
      fullName: 'Kiran Rao',
      mobileNumber: '9988776655',
      amount: 5000,
      paymentMethod: 'ONLINE',
    },
    volCookie
  );
  if (onlineRes.status !== 200 || onlineRes.data.data.paymentStatus !== 'PENDING') {
    throw new Error(`Online contribution failed: ${JSON.stringify(onlineRes.data)}`);
  }
  const onlineId = onlineRes.data.data.id;
  console.log(`✓ Online contribution saved! Certificate No: ${onlineRes.data.data.certificateNumber}`);

  // 4. Admin Login
  console.log('4. Testing Admin Login (admin / BalaGaneshAdmin@2026)...');
  const adminLoginRes = await post('/api/auth/login', {
    username: 'admin',
    password: 'BalaGaneshAdmin@2026',
  });
  if (adminLoginRes.status !== 200 || adminLoginRes.data.user.role !== 'ADMIN') {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
  }
  const adminCookie = { Cookie: adminLoginRes.headers.get('set-cookie')?.split(';')[0] || '' };
  console.log(`✓ Admin logged in! Name: ${adminLoginRes.data.user.name}`);

  // 5. Admin Verifies the Online Contribution
  console.log(`5. Admin verifying online contribution ${onlineId}...`);
  const verifyRes = await patch(`/api/contributions/${onlineId}`, { status: 'VERIFIED' }, adminCookie);
  if (verifyRes.status !== 200 || verifyRes.data.data.paymentStatus !== 'VERIFIED') {
    throw new Error(`Verification failed: ${JSON.stringify(verifyRes)}`);
  }
  console.log('✓ Online contribution verified and included in financial balance!');

  // 6. Record Cash Expense
  console.log('6. Recording CASH Expense (Flowers, ₹2,500, Lakshmi Flower Stall)...');
  const cashExpenseRes = await post(
    '/api/expenses',
    {
      shopName: 'Lakshmi Flower Stall',
      category: 'Flowers',
      description: 'Marigold and Jasmine garlands for main deity',
      amount: 2500,
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
      notes: 'Paid cash in person by volunteer',
    },
    adminCookie
  );
  if (cashExpenseRes.status !== 200 || !cashExpenseRes.data.data.expenseNumber.startsWith('EXP-')) {
    throw new Error(`Cash expense creation failed: ${JSON.stringify(cashExpenseRes.data)}`);
  }
  const expNo1 = cashExpenseRes.data.data.expenseNumber;
  console.log(`✓ Cash expense saved! Expense Number: ${expNo1}`);

  // 7. Record Online Expense
  console.log('7. Recording ONLINE Expense (Sound System, ₹15,000, Sri Venkateshwara Sounds)...');
  const onlineExpenseRes = await post(
    '/api/expenses',
    {
      shopName: 'Sri Venkateshwara Sounds',
      category: 'Sound System',
      description: 'Pandal audio mixer, speakers and mic setup for 9 days',
      amount: 15000,
      paymentMethod: 'ONLINE',
      date: new Date().toISOString().split('T')[0],
      notes: 'Paid via GPay to shop UPI',
    },
    adminCookie
  );
  if (onlineExpenseRes.status !== 200 || !onlineExpenseRes.data.data.expenseNumber.startsWith('EXP-')) {
    throw new Error(`Online expense creation failed: ${JSON.stringify(onlineExpenseRes.data)}`);
  }
  const expNo2 = onlineExpenseRes.data.data.expenseNumber;
  const onlineExpId = onlineExpenseRes.data.data.id;
  console.log(`✓ Online expense saved! Expense Number: ${expNo2}`);

  // 8. List Expenses with Filter
  console.log('8. Testing Expenses List & Filters...');
  const expListRes = await get('/api/expenses?category=Sound%20System', adminCookie);
  if (expListRes.status === 200 && expListRes.data.data.length >= 1) {
    console.log(`✓ Filtered expense found: ${expListRes.data.data[0].shopName} - ₹${expListRes.data.data[0].amount}`);
  } else {
    throw new Error(`Expense filter failed: ${JSON.stringify(expListRes)}`);
  }

  // 9. Financial Summary Calculations
  console.log('9. Verifying Festival Financial Summary Calculations...');
  const finSummaryRes = await get('/api/admin/financial-summary', adminCookie);
  if (finSummaryRes.status !== 200 || !finSummaryRes.data.summary) {
    throw new Error(`Financial summary failed: ${JSON.stringify(finSummaryRes)}`);
  }
  const fs = finSummaryRes.data.summary;
  console.log(`✓ Total Verified Chanda: ₹${fs.income.totalChanda} (Cash: ₹${fs.income.cashChanda}, Online: ₹${fs.income.onlineChanda})`);
  console.log(`✓ Total Expenses: ₹${fs.expenses.totalExpenses} (Cash: ₹${fs.expenses.cashExpenses}, Online: ₹${fs.expenses.onlineExpenses})`);
  console.log(`✓ REMAINING BALANCE: ₹${fs.balance.remainingBalance}`);
  console.log(`✓ Cash in Hand: ₹${fs.balance.estimatedCashBalance}, Online Bank Balance: ₹${fs.balance.onlineBalance}`);
  
  if (fs.balance.remainingBalance !== fs.income.totalChanda - fs.expenses.totalExpenses) {
    throw new Error('Balance equation mismatch: Remaining != Chanda - Expenses');
  }

  // 10. Financial Report CSV Export
  console.log('10. Testing Complete Financial Report CSV Export...');
  const finCsvRes = await get('/api/admin/export-financial', adminCookie);
  if (
    finCsvRes.status === 200 &&
    finCsvRes.data.includes('FINANCIAL SUMMARY OVERVIEW') &&
    finCsvRes.data.includes('Lakshmi Flower Stall')
  ) {
    console.log('✓ Complete Financial CSV report exported with overview, categories, and itemized rows!');
  } else {
    throw new Error(`Financial CSV export failed: ${JSON.stringify(finCsvRes)}`);
  }

  // 11. Edit Expense
  console.log(`11. Editing expense ${onlineExpId} (adjusting vendor notes)...`);
  const editExpRes = await put(
    `/api/expenses/${onlineExpId}`,
    {
      shopName: 'Sri Venkateshwara Sounds & Lighting',
      category: 'Sound System',
      amount: 15000,
      paymentMethod: 'ONLINE',
      date: new Date().toISOString().split('T')[0],
      notes: 'Final settlement invoice received',
    },
    adminCookie
  );
  if (editExpRes.status === 200 && editExpRes.data.data.shopName.includes('Lighting')) {
    console.log('✓ Expense updated successfully!');
  } else {
    throw new Error(`Edit expense failed: ${JSON.stringify(editExpRes)}`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL 11 COMPREHENSIVE CHANDA, EXPENSE & FINANCIAL TESTS PASSED! 🎉');
  console.log('========================================================================\n');
}

runComprehensiveTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
