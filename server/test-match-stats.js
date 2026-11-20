// Set test environment flags BEFORE importing server module
process.env.PORT = '5098';
process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('--- STARTING MATCH HISTORY, STATS & LEADERBOARD VERIFICATION ---');

  const { matchService } = await import('./src/services/matchService.js');
  const { startServer } = await import('./src/server.js');
  const { server } = await startServer(5098);
  const BASE_URL = 'http://localhost:5098/api';

  try {
    // 1. Initial State: Player stats should be 0 matches
    console.log('\n[TEST 1] Querying initial player stats for guest_alice...');
    const resStatsInitialRaw = await fetch(`${BASE_URL}/stats/player/guest_alice`);
    const resStatsInitial = await resStatsInitialRaw.json();
    console.log(`[TEST 1] Result: Status ${resStatsInitialRaw.status}, matchesPlayed: ${resStatsInitial.data.matchesPlayed}`);
    if (resStatsInitial.data.matchesPlayed !== 0) throw new Error('Expected 0 matches played initially');

    // 2. Initial Leaderboard: Query empty/initial leaderboard
    console.log('\n[TEST 2] Querying initial global leaderboard...');
    const resLeaderboardInitialRaw = await fetch(`${BASE_URL}/leaderboard`);
    const resLeaderboardInitial = await resLeaderboardInitialRaw.json();
    console.log(`[TEST 2] Result: Status ${resLeaderboardInitialRaw.status}, count: ${resLeaderboardInitial.data.leaderboard.length}`);

    // 3. Simulate Match Completion & Authoritative Record
    console.log('\n[TEST 3] Recording completed match between Alice and Bob...');
    const fakeRoom = {
      code: 'TEST99',
      name: 'Pencil Arena',
      isPrivate: false,
      paperStyle: 'classic-blue',
      bookPageCount: 100,
      createdAt: new Date(Date.now() - 120000), // 2 mins ago
      status: 'FINISHED',
      players: [
        {
          playerId: 'guest_alice',
          nickname: 'Alice Pen',
          primaryColor: 'BLUE',
          assignedShade: { name: 'Royal Blue', hex: '#1d4ed8' },
          isEliminated: false,
          territory: { rowStates: [ { isEliminated: false }, { isEliminated: false } ] }
        },
        {
          playerId: 'guest_bob',
          nickname: 'Bob Eraser',
          primaryColor: 'RED',
          assignedShade: { name: 'Crimson', hex: '#dc2626' },
          isEliminated: true,
          territory: { rowStates: [ { isEliminated: true }, { isEliminated: true } ] }
        }
      ],
      gameState: {
        turnNumber: 8,
        winnerId: 'guest_alice',
        winnerNickname: 'Alice Pen',
        combatLog: [
          {
            attackerPlayerId: 'guest_alice',
            targetPlayerId: 'guest_bob',
            targetPlayerEliminated: true,
            targetRowEliminated: true
          }
        ]
      }
    };

    const matchId1 = await matchService.recordCompletedMatch(fakeRoom);
    console.log(`[TEST 3] Match 1 recorded: matchId = ${matchId1}`);
    if (!matchId1) throw new Error('Failed to record match');

    // 4. Test Idempotency: Recording the same match again must return same matchId without duplicate saves
    console.log('\n[TEST 4] Testing idempotency by re-submitting fakeRoom...');
    const matchIdDuplicate = await matchService.recordCompletedMatch(fakeRoom);
    console.log(`[TEST 4] Duplicate record result: ${matchIdDuplicate}`);
    if (matchIdDuplicate !== matchId1) throw new Error('Idempotency check failed: matchId mismatch');

    // Verify stats were not double-counted
    const aliceStatsAfterMatch1 = await matchService.getPlayerStats({ playerId: 'guest_alice' });
    console.log(`[TEST 4] Alice stats after single match: wins=${aliceStatsAfterMatch1.wins}, matchesPlayed=${aliceStatsAfterMatch1.matchesPlayed}, streak=${aliceStatsAfterMatch1.currentStreak}`);
    if (aliceStatsAfterMatch1.matchesPlayed !== 1 || aliceStatsAfterMatch1.wins !== 1) {
      throw new Error(`Stats inflation detected: expected 1 match/win, got ${aliceStatsAfterMatch1.matchesPlayed}/${aliceStatsAfterMatch1.wins}`);
    }

    // 5. Check Bob's stats (loss)
    console.log('\n[TEST 5] Checking Bob (loser) stats...');
    const bobStats = await matchService.getPlayerStats({ playerId: 'guest_bob' });
    console.log(`[TEST 5] Bob stats: wins=${bobStats.wins}, losses=${bobStats.losses}, winPercentage=${bobStats.winPercentage}%, streak=${bobStats.currentStreak}`);
    if (bobStats.losses !== 1 || bobStats.wins !== 0 || bobStats.winPercentage !== 0) {
      throw new Error('Bob stats mismatch');
    }

    // 6. Simulate a Second Match (Alice wins again -> Streak becomes 2)
    console.log('\n[TEST 6] Simulating second match where Alice wins again...');
    const fakeRoom2 = {
      code: 'TEST98',
      name: 'Doodle Colosseum',
      isPrivate: true,
      paperStyle: 'graph-grid',
      bookPageCount: 200,
      createdAt: new Date(Date.now() - 60000),
      status: 'FINISHED',
      players: [
        {
          playerId: 'guest_alice',
          nickname: 'Alice Pen',
          primaryColor: 'BLUE',
          isEliminated: false
        },
        {
          playerId: 'guest_charlie',
          nickname: 'Charlie Ruler',
          primaryColor: 'GREEN',
          isEliminated: true
        }
      ],
      gameState: {
        turnNumber: 12,
        winnerId: 'guest_alice',
        winnerNickname: 'Alice Pen',
        combatLog: [
          {
            attackerPlayerId: 'guest_alice',
            targetPlayerId: 'guest_charlie',
            targetPlayerEliminated: true
          }
        ]
      }
    };
    await matchService.recordCompletedMatch(fakeRoom2);
    const aliceStatsAfterMatch2 = await matchService.getPlayerStats({ playerId: 'guest_alice' });
    console.log(`[TEST 6] Alice after Match 2: wins=${aliceStatsAfterMatch2.wins}, streak=${aliceStatsAfterMatch2.currentStreak}, bestStreak=${aliceStatsAfterMatch2.bestStreak}, winPct=${aliceStatsAfterMatch2.winPercentage}%`);
    if (aliceStatsAfterMatch2.wins !== 2 || aliceStatsAfterMatch2.currentStreak !== 2) {
      throw new Error('Alice streak calculation failed');
    }

    // 7. Test API: GET /api/matches/player/:playerId
    console.log('\n[TEST 7] Testing GET /api/matches/player/guest_alice via HTTP...');
    const resHistoryRaw = await fetch(`${BASE_URL}/matches/player/guest_alice?page=1&limit=10`);
    const resHistory = await resHistoryRaw.json();
    console.log(`[TEST 7] Status ${resHistoryRaw.status}, total matches: ${resHistory.data.pagination.total}`);
    if (resHistory.data.matches.length !== 2) {
      throw new Error(`Expected 2 matches for Alice, got ${resHistory.data.matches.length}`);
    }
    const latestMatch = resHistory.data.matches[0];
    console.log(`[TEST 7] Latest match: roomCode=${latestMatch.roomCode}, isWinner=${latestMatch.isWinner}, opponents=${latestMatch.opponents.map(o => o.nickname).join(', ')}`);
    if (!latestMatch.isWinner || latestMatch.opponents.length === 0) {
      throw new Error('Match history opponent or result metadata missing');
    }

    // 8. Test API: GET /api/matches/:matchId
    console.log('\n[TEST 8] Testing GET /api/matches/:matchId via HTTP...');
    const resMatchDetailsRaw = await fetch(`${BASE_URL}/matches/${matchId1}`);
    const resMatchDetails = await resMatchDetailsRaw.json();
    console.log(`[TEST 8] Status ${resMatchDetailsRaw.status}, roomName: "${resMatchDetails.data.roomName}", totalTurns: ${resMatchDetails.data.totalTurns}`);
    if (resMatchDetails.data.matchId !== matchId1) {
      throw new Error('Match details ID mismatch');
    }

    // 9. Test API: GET /api/leaderboard
    console.log('\n[TEST 9] Testing GET /api/leaderboard via HTTP...');
    const resLeaderboardRaw = await fetch(`${BASE_URL}/leaderboard`);
    const resLeaderboard = await resLeaderboardRaw.json();
    console.log(`[TEST 9] Status ${resLeaderboardRaw.status}, ranked count: ${resLeaderboard.data.leaderboard.length}`);
    const rank1 = resLeaderboard.data.leaderboard[0];
    console.log(`[TEST 9] Rank #1: ${rank1.nickname} (wins: ${rank1.wins}, winPct: ${rank1.winPercentage}%, streak: ${rank1.currentStreak})`);
    if (rank1.playerId !== 'guest_alice' || rank1.rank !== 1) {
      throw new Error('Leaderboard rank 1 is not Alice');
    }

    console.log('\n--- ALL MATCH HISTORY, STATS & LEADERBOARD TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
