import app from '../app.js';
import http from 'http';

interface TestResult {
  step: number;
  route: string;
  method: string;
  expectedStatus: number;
  actualStatus: number;
  durationMs: number;
  passed: boolean;
  notes: string;
}

async function runAutomatedRouteTests() {
  console.log('=====================================================');
  console.log('🚀 AUTOMATED API ROUTE TEST RUNNER');
  console.log('=====================================================\n');

  // Start HTTP Server on a random free port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`📡 Server running locally on ${baseUrl}\n`);

  const results: TestResult[] = [];
  let step = 1;
  let authToken = '';
  let createdVehicleId = 0;
  let createdRentalId = 0;

  async function testEndpoint(
    description: string,
    method: string,
    path: string,
    expectedStatus: number,
    body?: any,
    useAuth = true,
  ): Promise<any> {
    const startTime = Date.now();
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, options);
      const durationMs = Date.now() - startTime;
      let json: any = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      const passed = res.status === expectedStatus;
      const statusIcon = passed ? '✅ PASS' : '❌ FAIL';

      results.push({
        step: step++,
        route: `${method} ${path}`,
        method,
        expectedStatus,
        actualStatus: res.status,
        durationMs,
        passed,
        notes: description,
      });

      console.log(
        `[${statusIcon}] Step ${step - 1}: ${method} ${path} | Status: ${res.status} (Expected: ${expectedStatus}) | Time: ${durationMs}ms`,
      );
      if (!passed) {
        console.log(`   ⚠️ Response:`, JSON.stringify(json, null, 2));
      }

      return { status: res.status, data: json };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      results.push({
        step: step++,
        route: `${method} ${path}`,
        method,
        expectedStatus,
        actualStatus: 0,
        durationMs,
        passed: false,
        notes: `Network Error: ${err.message}`,
      });
      console.log(`[❌ FAIL] Step ${step - 1}: ${method} ${path} | Error: ${err.message}`);
      return { status: 0, data: null };
    }
  }

  try {
    // 1. Health Check
    await testEndpoint('Root Health Check', 'GET', '/', 200, undefined, false);

    // 2. Swagger UI Check
    await testEndpoint('Swagger UI Documentation', 'GET', '/api-docs/', 200, undefined, false);

    // 3. Auth Protection Check (Without Token)
    await testEndpoint('Protected Route without Token', 'GET', '/api/v1/vehicles', 401, undefined, false);

    // 4. Staff Login
    const loginRes = await testEndpoint(
      'Staff Login with Credentials',
      'POST',
      '/api/v1/auth/login',
      200,
      {
        email: 'admin@rental.com',
        password: 'Password123!',
      },
      false,
    );

    if (loginRes.data?.data?.token) {
      authToken = loginRes.data.data.token;
      console.log(`   🔑 Obtained JWT Token successfully!\n`);
    } else {
      console.error('   ❌ Could not obtain JWT token. Skipping protected route tests.');
    }

    // 5. Auth Profile Check
    await testEndpoint('Get Current Logged-in Staff Profile', 'GET', '/api/v1/auth/me', 200);

    // 6. Change Password Check
    await testEndpoint('Change Staff Password', 'POST', '/api/v1/auth/change-password', 200, {
      current_password: 'Password123!',
      new_password: 'Password123!',
    });

    // 7. Fleet Stats Summary
    await testEndpoint('Get Vehicle Fleet Stats Summary', 'GET', '/api/v1/vehicles/stats/summary', 200);

    // 8. Vehicles: List
    await testEndpoint('List Vehicles (Paginated)', 'GET', '/api/v1/vehicles?page=1&limit=5', 200);

    // 9. Vehicles: Get By ID
    await testEndpoint('Get Vehicle #1 Details', 'GET', '/api/v1/vehicles/1', 200);

    // 10. Vehicles: Availability Check
    await testEndpoint(
      'Check Vehicle #1 Availability for Sep 1-5',
      'GET',
      '/api/v1/vehicles/1/availability?start_date=2026-09-01&end_date=2026-09-05',
      200,
    );

    // 11. Vehicles: Create New Vehicle
    const uniquePlate = `TEST-${Date.now().toString().slice(-6)}`;
    const createVehRes = await testEndpoint('Create New Vehicle', 'POST', '/api/v1/vehicles', 201, {
      name: 'Test Automation Coupe',
      plate_number: uniquePlate,
      category: 'Coupe',
      daily_rate: 120.5,
    });

    if (createVehRes.data?.data?.id) {
      createdVehicleId = createVehRes.data.data.id;
    }

    // 12. Vehicles: Update Vehicle
    if (createdVehicleId) {
      await testEndpoint(`Update Vehicle #${createdVehicleId}`, 'PUT', `/api/v1/vehicles/${createdVehicleId}`, 200, {
        name: 'Test Automation Coupe (Updated)',
        category: 'Coupe Luxury',
        daily_rate: 140.0,
      });
    }

    // 13. Vehicles: Soft Delete Vehicle
    if (createdVehicleId) {
      await testEndpoint(`Soft Delete Vehicle #${createdVehicleId}`, 'DELETE', `/api/v1/vehicles/${createdVehicleId}`, 200);
    }

    // 14. Rentals: List Rentals
    await testEndpoint('List Rentals with Filters', 'GET', '/api/v1/rentals?page=1&limit=5', 200);

    // 15. Rentals: Get Rental By ID
    await testEndpoint('Get Rental #1 Details', 'GET', '/api/v1/rentals/1', 200);

    // 16. Rentals: Create Rental
    const createRentalRes = await testEndpoint('Create New Rental Booking', 'POST', '/api/v1/rentals', 201, {
      vehicle_id: 1,
      customer_name: 'Automation Tester',
      customer_phone: '+8801799999999',
      start_date: '2026-12-01',
      end_date: '2026-12-05',
    });

    if (createRentalRes.data?.data?.id) {
      createdRentalId = createRentalRes.data.data.id;
    }

    // 17. Rentals: Overlap Prevention Check (Expect 409 Conflict)
    await testEndpoint('Attempt Double Booking Overlap (Expect 409)', 'POST', '/api/v1/rentals', 409, {
      vehicle_id: 1,
      customer_name: 'Conflict Tester',
      customer_phone: '+8801888888888',
      start_date: '2026-12-03',
      end_date: '2026-12-07',
    });

    // 18. Rentals: Update Status
    if (createdRentalId) {
      await testEndpoint(`Quick Update Rental Status #${createdRentalId} to completed`, 'PATCH', `/api/v1/rentals/${createdRentalId}/status`, 200, {
        status: 'completed',
      });
    }

    // 19. Rentals: Update Rental Details
    if (createdRentalId) {
      await testEndpoint(`Update Rental #${createdRentalId}`, 'PUT', `/api/v1/rentals/${createdRentalId}`, 200, {
        customer_name: 'Automation Tester (Updated)',
        status: 'completed',
      });
    }

    // 20. Rentals: Delete Rental
    if (createdRentalId) {
      await testEndpoint(`Delete Rental #${createdRentalId}`, 'DELETE', `/api/v1/rentals/${createdRentalId}`, 200);
    }

    // 21. Reports: Get Monthly Revenue Report
    await testEndpoint('Get Monthly Revenue Report (2026-08)', 'GET', '/api/v1/reports/rentals?month=2026-08', 200);

    // 22. Reports: Get Monthly Report Filtered by Vehicle
    await testEndpoint('Get Monthly Report Filtered for Vehicle #1', 'GET', '/api/v1/reports/rentals?month=2026-08&vehicle_id=1', 200);

    // Summary Table
    console.log('\n=====================================================');
    console.log('📊 AUTOMATED ROUTE TESTING SUMMARY');
    console.log('=====================================================');
    console.table(
      results.map((r) => ({
        Step: r.step,
        Route: r.route,
        Expected: r.expectedStatus,
        Actual: r.actualStatus,
        Result: r.passed ? 'PASS ✅' : 'FAIL ❌',
        Time: `${r.durationMs}ms`,
        Description: r.notes,
      })),
    );

    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;
    console.log(`\n🎉 Test Execution Finished: ${totalPassed}/${results.length} PASSED | ${totalFailed} FAILED\n`);
  } finally {
    server.close();
  }
}

runAutomatedRouteTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
