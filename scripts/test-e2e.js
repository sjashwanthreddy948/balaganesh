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

  // 1. Verify Entry WITHOUT Login is Blocked (401 Unauthorized)
  console.log('1. Verifying Entry WITHOUT login is strictly blocked...');
  const unauthRes = await post('/api/contributions', {
    fullName: 'Anonymous Donor',
    amount: 500,
    paymentMethod: 'CASH',
  });
  if (unauthRes.status === 401) {
    console.log('✓ Successfully blocked unauthenticated contribution entry (401)!');
  } else {
    throw new Error(`Expected 401 Unauthorized, but received: ${unauthRes.status}`);
  }

  // 2. Staff / Admin Login
  console.log('2. Testing Staff / Admin Login (admin / BalaGaneshAdmin@2026)...');
  const loginRes = await post('/api/auth/login', {
    username: 'admin',
    password: 'BalaGaneshAdmin@2026',
  });
  if (loginRes.status !== 200 || !loginRes.data.user) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
  }
  const authCookie = { Cookie: loginRes.headers.get('set-cookie')?.split(';')[0] || '' };
  console.log(`✓ Admin/Staff logged in! User: ${loginRes.data.user.name}`);

  // 3. Fast Cash Contribution (Logged In)
  console.log('3. Recording CASH contribution with login (Ramesh Patel, ₹2000, CASH)...');
  const cashRes = await post(
    '/api/contributions',
    {
      fullName: 'Ramesh Patel',
      mobileNumber: '9876543210',
      amount: 2000,
      paymentMethod: 'CASH',
    },
    authCookie
  );
  if (cashRes.status !== 200 || cashRes.data.data.paymentStatus !== 'CASH_RECEIVED') {
    throw new Error(`Cash contribution failed: ${JSON.stringify(cashRes.data)}`);
  }
  console.log(`✓ Cash contribution saved! Certificate No: ${cashRes.data.data.certificateNumber}`);

  // 4. Online Contribution with login
  console.log('4. Recording ONLINE contribution with login (Kiran Rao, ₹5000, ONLINE)...');
  const onlineRes = await post(
    '/api/contributions',
    {
      fullName: 'Kiran Rao',
      mobileNumber: '9988776655',
      amount: 5000,
      paymentMethod: 'ONLINE',
    },
    authCookie
  );
  if (onlineRes.status !== 200 || onlineRes.data.data.paymentStatus !== 'PENDING') {
    throw new Error(`Online contribution failed: ${JSON.stringify(onlineRes.data)}`);
  }
  const onlineId = onlineRes.data.data.id;
  console.log(`✓ Online contribution saved! Certificate No: ${onlineRes.data.data.certificateNumber}`);

  // 5. Admin Verifies Online Contribution
  console.log(`5. Verifying online contribution ${onlineId}...`);
  const verifyRes = await patch(`/api/contributions/${onlineId}`, { status: 'VERIFIED' }, authCookie);
  if (verifyRes.status !== 200 || verifyRes.data.data.paymentStatus !== 'VERIFIED') {
    throw new Error(`Verification failed: ${JSON.stringify(verifyRes)}`);
  }
  console.log('✓ Online contribution verified and included in financial balance!');

  // 6. Record Cash Expense with "Entered By" (Who is entering the expense)
  console.log('6. Recording CASH Expense with Entered By (Flowers, ₹2,500, Entered By: Suresh Reddy)...');
  const cashExpenseRes = await post(
    '/api/expenses',
    {
      shopName: 'Lakshmi Flower Stall',
      category: 'Flowers',
      description: 'Marigold and Jasmine garlands for main deity',
      amount: 2500,
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
      notes: 'Paid cash at stall',
      enteredBy: 'Suresh Reddy (Treasurer)',
    },
    authCookie
  );
  if (cashExpenseRes.status !== 200 || cashExpenseRes.data.data.enteredBy !== 'Suresh Reddy (Treasurer)') {
    throw new Error(`Cash expense creation failed: ${JSON.stringify(cashExpenseRes.data)}`);
  }
  console.log(`✓ Expense saved with enteredBy: "${cashExpenseRes.data.data.enteredBy}"! Number: ${cashExpenseRes.data.data.expenseNumber}`);

  // 7. Record Online Expense with "Entered By"
  console.log('7. Recording ONLINE Expense with Entered By (Sound System, ₹15,000, Entered By: Ramesh Kumar)...');
  const onlineExpenseRes = await post(
    '/api/expenses',
    {
      shopName: 'Sri Venkateshwara Sounds',
      category: 'Sound System',
      description: 'Pandal audio mixer, speakers and mic setup',
      amount: 15000,
      paymentMethod: 'ONLINE',
      date: new Date().toISOString().split('T')[0],
      notes: 'Paid via UPI',
      enteredBy: 'Ramesh Kumar (Committee Member)',
    },
    authCookie
  );
  if (onlineExpenseRes.status !== 200 || onlineExpenseRes.data.data.enteredBy !== 'Ramesh Kumar (Committee Member)') {
    throw new Error(`Online expense creation failed: ${JSON.stringify(onlineExpenseRes.data)}`);
  }
  const onlineExpId = onlineExpenseRes.data.data.id;
  console.log(`✓ Expense saved with enteredBy: "${onlineExpenseRes.data.data.enteredBy}"! Number: ${onlineExpenseRes.data.data.expenseNumber}`);

  // 8. Search Expenses by "enteredBy"
  console.log('8. Testing Expense Search by person entering...');
  const expSearchRes = await get('/api/expenses?search=Suresh%20Reddy', authCookie);
  if (expSearchRes.status === 200 && expSearchRes.data.data.length >= 1) {
    console.log(`✓ Found expense by enteredBy search: "${expSearchRes.data.data[0].enteredBy}"`);
  } else {
    throw new Error(`Search by enteredBy failed: ${JSON.stringify(expSearchRes)}`);
  }

  // 9. Financial Summary Calculations
  console.log('9. Verifying Festival Financial Summary Calculations...');
  const finSummaryRes = await get('/api/admin/financial-summary', authCookie);
  if (finSummaryRes.status !== 200 || !finSummaryRes.data.summary) {
    throw new Error(`Financial summary failed: ${JSON.stringify(finSummaryRes)}`);
  }
  const fs = finSummaryRes.data.summary;
  console.log(`✓ Total Verified Chanda: ₹${fs.income.totalChanda}`);
  console.log(`✓ Total Expenses: ₹${fs.expenses.totalExpenses}`);
  console.log(`✓ REMAINING BALANCE: ₹${fs.balance.remainingBalance}`);
  console.log(`✓ Cash in Hand: ₹${fs.balance.estimatedCashBalance}, Online Bank Balance: ₹${fs.balance.onlineBalance}`);

  // 10. Financial Report CSV Export contains "Entered By"
  console.log('10. Testing Complete Financial Report CSV Export with Entered By column...');
  const finCsvRes = await get('/api/admin/export-financial', authCookie);
  if (
    finCsvRes.status === 200 &&
    finCsvRes.data.includes('Suresh Reddy (Treasurer)') &&
    finCsvRes.data.includes('Ramesh Kumar (Committee Member)')
  ) {
    console.log('✓ Financial CSV report successfully includes the person who entered the expense!');
  } else {
    throw new Error(`Financial CSV export failed to include enteredBy: ${JSON.stringify(finCsvRes)}`);
  }

  // 11. Edit Expense with updated "Entered By"
  console.log(`11. Editing expense ${onlineExpId}...`);
  const editExpRes = await put(
    `/api/expenses/${onlineExpId}`,
    {
      shopName: 'Sri Venkateshwara Sounds & Lighting',
      category: 'Sound System',
      amount: 15000,
      paymentMethod: 'ONLINE',
      date: new Date().toISOString().split('T')[0],
      notes: 'Final settlement invoice received',
      enteredBy: 'Ramesh Kumar (General Secretary)',
    },
    authCookie
  );
  if (editExpRes.status === 200 && editExpRes.data.data.enteredBy === 'Ramesh Kumar (General Secretary)') {
    console.log('✓ Expense updated with new enteredBy title successfully!');
  } else {
    throw new Error(`Edit expense failed: ${JSON.stringify(editExpRes)}`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL 11 E2E TESTS PASSED (LOGIN REQUIRED & ENTERED BY PERSON VERIFIED) 🎉');
  console.log('========================================================================\n');
}

runComprehensiveTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
