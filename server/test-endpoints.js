// Set test environment flags BEFORE importing server module
process.env.PORT = '5088';
process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('--- STARTING ODD WARS INTEGRATION & LIFECYCLE TESTS ---');

  const { startServer } = await import('./src/server.js');
  const { server } = await startServer(5088);
  const BASE = 'http://localhost:5088';

  let createdRoomCode = null;
  let hostPlayerId = 'host_warrior_1';
  let guestPlayerId = 'guest_warrior_2';

  try {
    // 1. POST /api/rooms/public with full player payload
    console.log('\n[TEST 1] Testing POST /api/rooms/public...');
    const res1 = await fetch(`${BASE}/api/rooms/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alpha Combat Arena',
        maxPlayers: 4,
        bookPageCount: 100,
        player: {
          playerId: hostPlayerId,
          nickname: 'HostLeader',
          primaryColor: 'BLUE'
        }
      })
    });
    console.log('TEST 1 Status:', res1.status);
    const body1 = await res1.json();
    if (res1.status !== 201 || !body1.success) {
      throw new Error(`TEST 1 Failed: ${JSON.stringify(body1)}`);
    }
    createdRoomCode = body1.data.room.code;
    console.log(`✓ TEST 1 PASSED: Room created with code "${createdRoomCode}", bookPageCount: ${body1.data.room.bookPageCount}`);

    // 2. POST /api/rooms/public with fallback defaults (no player object)
    console.log('\n[TEST 2] Testing POST /api/rooms/public with default player fallback...');
    const res2 = await fetch(`${BASE}/api/rooms/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Beta Training Ground',
        maxPlayers: 2,
        bookPageCount: 200
      })
    });
    console.log('TEST 2 Status:', res2.status);
    const body2 = await res2.json();
    if (res2.status !== 201 || !body2.success) {
      throw new Error(`TEST 2 Failed: ${JSON.stringify(body2)}`);
    }
    console.log(`✓ TEST 2 PASSED: Room "${body2.data.room.name}" created with code "${body2.data.room.code}"`);

    // 2b. POST /api/rooms/private (Private Room Creation)
    console.log('\n[TEST 2b] Testing POST /api/rooms/private (Private Room Creation)...');
    const resPrivate = await fetch(`${BASE}/api/rooms/private`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Secret Chamber',
        password: 'oddsecretpass',
        maxPlayers: 4,
        bookPageCount: 100,
        player: {
          playerId: 'stealth_host',
          nickname: 'ShadowLeader',
          primaryColor: 'BLACK'
        }
      })
    });
    console.log('TEST 2b Status:', resPrivate.status);
    const bodyPrivate = await resPrivate.json();
    if (resPrivate.status !== 201 || !bodyPrivate.success || !bodyPrivate.data.room.isPrivate) {
      throw new Error(`TEST 2b Failed: ${JSON.stringify(bodyPrivate)}`);
    }
    console.log(`✓ TEST 2b PASSED: Private room created with code "${bodyPrivate.data.room.code}", isPrivate: ${bodyPrivate.data.room.isPrivate}`);

    // 3. POST /rooms/public without /api prefix
    console.log('\n[TEST 3] Testing POST /rooms/public (fallback root mount)...');
    const res3 = await fetch(`${BASE}/rooms/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Root Mount Room',
        maxPlayers: 3,
        bookPageCount: 100
      })
    });
    console.log('TEST 3 Status:', res3.status);
    const body3 = await res3.json();
    if (res3.status !== 201 || !body3.success) {
      throw new Error(`TEST 3 Failed: ${JSON.stringify(body3)}`);
    }
    console.log(`✓ TEST 3 PASSED: Root mount route succeeded!`);

    // 4. GET /api/rooms/public
    console.log('\n[TEST 4] Testing GET /api/rooms/public...');
    const res4 = await fetch(`${BASE}/api/rooms/public`);
    console.log('TEST 4 Status:', res4.status);
    const body4 = await res4.json();
    if (res4.status !== 200 || !Array.isArray(body4.data.rooms)) {
      throw new Error(`TEST 4 Failed: ${JSON.stringify(body4)}`);
    }
    console.log(`✓ TEST 4 PASSED: Retrieved ${body4.data.rooms.length} public rooms`);

    // 5. POST /api/rooms/join (Guest joining Alpha Combat Arena)
    console.log('\n[TEST 5] Testing POST /api/rooms/join...');
    const res5 = await fetch(`${BASE}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: createdRoomCode,
        player: {
          playerId: guestPlayerId,
          nickname: 'GuestStriker',
          primaryColor: 'RED'
        }
      })
    });
    console.log('TEST 5 Status:', res5.status);
    const body5 = await res5.json();
    if (res5.status !== 200 || !body5.success) {
      throw new Error(`TEST 5 Failed: ${JSON.stringify(body5)}`);
    }
    console.log(`✓ TEST 5 PASSED: Guest joined! Total players: ${body5.data.room.players.length}`);

    // 6. POST /api/rooms/:code/ready (Guest marks ready)
    console.log('\n[TEST 6] Testing POST /api/rooms/:code/ready...');
    const res6 = await fetch(`${BASE}/api/rooms/${createdRoomCode}/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: guestPlayerId,
        isReady: true
      })
    });
    console.log('TEST 6 Status:', res6.status);
    const body6 = await res6.json();
    if (res6.status !== 200 || !body6.success) {
      throw new Error(`TEST 6 Failed: ${JSON.stringify(body6)}`);
    }
    console.log(`✓ TEST 6 PASSED: Guest is ready!`);

    // 7. POST /api/rooms/:code/start (Host starts match)
    console.log('\n[TEST 7] Testing POST /api/rooms/:code/start...');
    const res7 = await fetch(`${BASE}/api/rooms/${createdRoomCode}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostPlayerId: hostPlayerId
      })
    });
    console.log('TEST 7 Status:', res7.status);
    const body7 = await res7.json();
    if (res7.status !== 200 || !body7.success) {
      throw new Error(`TEST 7 Failed: ${JSON.stringify(body7)}`);
    }
    const startedRoom = body7.data.room;
    console.log(`✓ TEST 7 PASSED: Match started! Room status is "${startedRoom.status}"`);

    // 8. Verify Battlefield Territories and 5 Rows (1, 3, 5, 7, 9)
    console.log('\n[TEST 8] Verifying Player Territories & Five Rows...');
    for (const p of startedRoom.players) {
      const rows = p.territory.rows;
      const expectedRows = [1, 3, 5, 7, 9];
      const match = JSON.stringify(rows) === JSON.stringify(expectedRows);
      if (!match) {
        throw new Error(`Player ${p.nickname} territory rows mismatch: ${JSON.stringify(rows)}`);
      }
      console.log(`  - Player ${p.nickname} has territory with rows: [${rows.join(', ')}]`);
    }
    console.log('✓ TEST 8 PASSED: All players have exact 5 rows (1, 3, 5, 7, 9)!');

    console.log('\n======================================================');
    console.log(' ALL 8 INTEGRATION TESTS PASSED PERFECTLY (100% OK) ');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
