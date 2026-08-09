import app from '../app.js';
import http from 'http';
import { redis } from '../config/redis.js';

async function runConcurrentRentalTest() {
  console.log('=====================================================');
  console.log('⚡ STRESS TEST: CONCURRENT BOOKING WITH REDIS LOCK');
  console.log('=====================================================\n');

  // Start HTTP Server on a random free port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Login to get Auth Token
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@rental.com',
        password: 'Password123!',
      }),
    });
    const loginData = (await loginRes.json()) as any;
    const token = loginData.data?.token;

    if (!token) {
      throw new Error('Failed to login during stress test setup');
    }

    // 2. Fetch an existing vehicle ID
    const vehicleRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const vehicleData = (await vehicleRes.json()) as any;
    const vehicleId = vehicleData.data?.[0]?.id || 1;

    console.log(`🚗 Testing Concurrent Booking on Vehicle ID: ${vehicleId}`);

    // Generate unique future dates to prevent collision with previous test runs
    const yearOffset = Math.floor(Math.random() * 100) + 10;
    const startDate = `20${30 + (yearOffset % 50)}-01-01`;
    const endDate = `20${30 + (yearOffset % 50)}-01-05`;

    console.log(`📅 Target Booking Dates: ${startDate} to ${endDate}`);
    console.log(`💥 Firing 10 Concurrent Booking Requests simultaneously...\n`);

    // 3. Fire 10 simultaneous booking requests using Promise.all
    const requests = Array.from({ length: 10 }).map((_, index) => {
      return fetch(`${baseUrl}/api/v1/rentals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          customer_name: `Concurrent Tester #${index + 1}`,
          customer_phone: `+1234567890${index}`,
          start_date: startDate,
          end_date: endDate,
        }),
      }).then(async (res) => {
        const json: any = await res.json().catch(() => ({}));
        return { index: index + 1, status: res.status, body: json };
      });
    });

    const results = await Promise.all(requests);

    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;

    results.forEach((r) => {
      if (r.status === 201) {
        successCount++;
        console.log(`✅ Request #${r.index}: SUCCESS (201 Created) | Rental ID: ${r.body.data?.id}`);
      } else if (r.status === 409) {
        conflictCount++;
        console.log(`🔒 Request #${r.index}: CONFLICT (409 Blocked) | Message: "${r.body.error?.message || r.body.message}"`);
      } else {
        otherCount++;
        console.log(`⚠️ Request #${r.index}: STATUS ${r.status} | Body:`, JSON.stringify(r.body));
      }
    });

    console.log('\n=====================================================');
    console.log(`📊 CONCURRENCY TEST SUMMARY:`);
    console.log(`- Total Requests: ${results.length}`);
    console.log(`- Successfully Booked: ${successCount} (Should be EXACTLY 1)`);
    console.log(`- Blocked by Lock/Conflict: ${conflictCount} (Should be EXACTLY 9)`);
    console.log(`- Other Statuses: ${otherCount}`);
    console.log('=====================================================\n');

    if (successCount === 1 && conflictCount === 9) {
      console.log('🎉 TEST PASSED! Perfect concurrency handling - Zero double bookings!');
    } else {
      console.error('❌ TEST FAILED! Unexpected concurrency result.');
    }
  } catch (err) {
    console.error('❌ Error during stress test:', err);
  } finally {
    await redis.quit();
    server.close();
  }
}

runConcurrentRentalTest();
