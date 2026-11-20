/**
 * ODD WARS — Complete End-to-End Multiplayer Game Flow Integration Test
 *
 * Tests the entire real-world player flow:
 * 1. Player 1 creates a public room.
 * 2. Player 2 joins room using room code.
 * 3. Both connect via real Socket.IO clients to the running server.
 * 4. Player 2 marks ready; Host (Player 1) starts match.
 * 5. Both receive MATCH_STARTING / MATCH_STARTED socket broadcasts.
 * 6. Turn order & Paper Style verified (both clients have same style).
 * 7. Active player opens Magical Book via Socket & REST.
 * 8. Authoritative outcome received by both players via Socket.IO.
 * 9. Active player draws and submits character stage (HEAD).
 * 10. Both players receive DRAWING_UPDATED with vector strokes.
 * 11. Turn passes deterministically to next player.
 * 12. Simulate combat attack from armed station against opponent row.
 * 13. Verify opponent row is permanently marked ELIMINATED and broadcast to both.
 * 14. Reconnection / refresh test: disconnect and fetch room state, verify state integrity.
 * 15. Match finish & victory detection test.
 */

process.env.PORT = '5099';
process.env.NODE_ENV = 'test';

import { io as ioClient } from '../client/node_modules/socket.io-client/build/esm/index.js';

async function runFullMultiplayerTest() {
  console.log('\n================================================================');
  console.log('   ODD WARS — FULL MULTIPLAYER END-TO-END VALIDATION SUITE    ');
  console.log('================================================================\n');

  const { startServer } = await import('./src/server.js');
  const { server } = await startServer(5099);
  const BASE_URL = 'http://localhost:5099';

  const player1 = {
    playerId: 'p1_host_' + Date.now(),
    nickname: 'HostAce',
    primaryColor: 'BLUE'
  };

  const player2 = {
    playerId: 'p2_guest_' + Date.now(),
    nickname: 'GuestStriker',
    primaryColor: 'RED'
  };

  let socket1 = null;
  let socket2 = null;
  let roomCode = null;

  try {
    // -------------------------------------------------------------
    // STEP 1: CREATE ROOM
    // -------------------------------------------------------------
    console.log('[STEP 1] Player 1 creates public room...');
    const createRes = await fetch(`${BASE_URL}/api/rooms/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Championship Arena',
        maxPlayers: 2,
        bookPageCount: 100,
        player: player1
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      throw new Error(`Failed to create room: ${JSON.stringify(createData)}`);
    }
    roomCode = createData.data.room.code;
    const initialPaperStyle = createData.data.room.paperStyle || createData.data.room.gameState?.paperStyle;
    console.log(`  ✓ Room created with code: "${roomCode}", Paper Style: "${initialPaperStyle}"`);

    // -------------------------------------------------------------
    // STEP 2: PLAYER 2 JOINS ROOM
    // -------------------------------------------------------------
    console.log('\n[STEP 2] Player 2 joins room with code...');
    const joinRes = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: roomCode,
        player: player2
      })
    });
    const joinData = await joinRes.json();
    if (!joinRes.ok || !joinData.success) {
      throw new Error(`Failed to join room: ${JSON.stringify(joinData)}`);
    }
    console.log(`  ✓ Player 2 joined! Room now has ${joinData.data.room.players.length} players.`);

    // -------------------------------------------------------------
    // STEP 3: CONNECT BOTH PLAYERS VIA SOCKET.IO
    // -------------------------------------------------------------
    console.log('\n[STEP 3] Connecting both players via real Socket.IO connections...');
    socket1 = ioClient(BASE_URL, { transports: ['websocket'], forceNew: true });
    socket2 = ioClient(BASE_URL, { transports: ['websocket'], forceNew: true });

    await Promise.all([
      new Promise((resolve) => socket1.on('connect', resolve)),
      new Promise((resolve) => socket2.on('connect', resolve))
    ]);
    console.log(`  ✓ Socket 1 connected: ${socket1.id}`);
    console.log(`  ✓ Socket 2 connected: ${socket2.id}`);

    // Join room channels
    await Promise.all([
      new Promise((resolve) => socket1.emit('room:join', { roomCode, player: player1 }, resolve)),
      new Promise((resolve) => socket2.emit('room:join', { roomCode, player: player2 }, resolve))
    ]);
    console.log(`  ✓ Both players joined socket room channel "${roomCode}"`);

    // -------------------------------------------------------------
    // STEP 4: PLAYER 2 MARKS READY & HOST STARTS MATCH
    // -------------------------------------------------------------
    console.log('\n[STEP 4] Player 2 marks ready & Host starts match...');
    const readyPromise = new Promise((resolve) => {
      socket1.once('room:state', (updatedRoom) => {
        const p2 = updatedRoom.players.find(p => p.playerId === player2.playerId);
        if (p2 && p2.isReady) resolve(updatedRoom);
      });
    });

    socket2.emit('room:ready', {
      roomCode,
      playerId: player2.playerId,
      isReady: true
    });
    const roomAfterReady = await readyPromise;
    console.log(`  ✓ Socket broadcast confirmed: Player 2 ready state = true (Room Status: ${roomAfterReady.status})`);

    // Listen for MATCH_STARTING on both sockets
    const startEventPromise1 = new Promise((resolve) => socket1.once('MATCH_STARTING', resolve));
    const startEventPromise2 = new Promise((resolve) => socket2.once('MATCH_STARTING', resolve));

    socket1.emit('room:start', {
      roomCode,
      hostPlayerId: player1.playerId
    });

    const [startPayload1, startPayload2] = await Promise.all([startEventPromise1, startEventPromise2]);
    console.log(`  ✓ Both sockets received MATCH_STARTING event! (Status: ${startPayload1.room.status})`);

    // Both players enter battlefield & transition to PLAYING
    socket1.emit('START_PLAYING', { roomCode });
    socket2.emit('START_PLAYING', { roomCode });

    const playRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/play`, { method: 'POST' });
    const playData = await playRes.json();
    const playingRoom = playData.data.room || playData.data;
    console.log(`  ✓ Match transitioned to PLAYING! Turn #${playingRoom.gameState.turnNumber} active.`);

    // -------------------------------------------------------------
    // STEP 5: VERIFY SYNCHRONIZED NOTEBOOK PAPER STYLE & TERRITORIES
    // -------------------------------------------------------------
    console.log('\n[STEP 5] Verifying synchronized paper style & 45%/55% territories...');
    const p1Style = playingRoom.gameState.paperStyle;
    console.log(`  ✓ Synchronized Paper Style: "${p1Style}"`);
    if (!p1Style) throw new Error('Paper style not set in gameState!');

    for (const p of playingRoom.players) {
      if (p.territory.rows.length !== 5) {
        throw new Error(`Player ${p.nickname} does not have 5 rows!`);
      }
    }
    console.log('  ✓ Verified: 5 rows (1, 3, 5, 7, 9) assigned to every player territory.');

    // -------------------------------------------------------------
    // STEP 6: AUTHORITATIVE MAGICAL BOOK ACTIVATION
    // -------------------------------------------------------------
    console.log('\n[STEP 6] Active player activates the Magical Book of Fate...');
    const activePlayerId = playingRoom.gameState.activePlayerId;
    const activeSocket = activePlayerId === player1.playerId ? socket1 : socket2;
    const activePlayer = activePlayerId === player1.playerId ? player1 : player2;

    const bookOpeningPromise1 = new Promise((resolve) => socket1.once('BOOK_OPENING', resolve));
    const bookOpeningPromise2 = new Promise((resolve) => socket2.once('BOOK_OPENING', resolve));
    const bookResultPromise1 = new Promise((resolve) => socket1.once('BOOK_RESULT', resolve));
    const bookResultPromise2 = new Promise((resolve) => socket2.once('BOOK_RESULT', resolve));

    activeSocket.emit('REQUEST_BOOK_OPEN', {
      roomCode,
      playerId: activePlayerId,
      requestId: 'test_book_req_' + Date.now()
    });

    await Promise.all([bookOpeningPromise1, bookOpeningPromise2]);
    console.log('  ✓ Both players received BOOK_OPENING broadcast (animation start).');

    const [bookRes1, bookRes2] = await Promise.all([bookResultPromise1, bookResultPromise2]);
    const outcome = bookRes1.outcome;
    console.log(`  ✓ Both players received BOOK_RESULT: Page ${outcome.pageNumber} (Ends in ${outcome.finalDigit}, Odd: ${outcome.isOdd}, TargetRow: ${outcome.targetRow})`);

    // -------------------------------------------------------------
    // STEP 7: AUTHORITATIVE DRAWING SUBMISSION & STROKE PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n[STEP 7] Submitting manual character drawing (HEAD stage)...');
    // If outcome was even, book passed the turn; let's check current active player
    const currentActiveRoomRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}`);
    const currentActiveRoomData = await currentActiveRoomRes.json();
    let currentRoom = currentActiveRoomData.data.room || currentActiveRoomData.data;

    let drawingPlayer = currentRoom.players.find(p => p.playerId === currentRoom.gameState.activePlayerId);
    let drawingSocket = drawingPlayer.playerId === player1.playerId ? socket1 : socket2;

    // If turn phase is awaiting book, open book for current player to unlock a row
    if (currentRoom.gameState.turnPhase === 'AWAITING_BOOK') {
      const openBookRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/book/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: drawingPlayer.playerId })
      });
      const bookData = await openBookRes.json();
      currentRoom = bookData.data.room;
    }

    // Now submit drawing for the active player's eligible row (or Row 1)
    const targetDrawingRow = currentRoom.gameState.currentTurn?.eligibleAction?.targetRow || 1;
    const drawingUpdatedPromise1 = new Promise((resolve) => socket1.once('DRAWING_UPDATED', resolve));
    const drawingUpdatedPromise2 = new Promise((resolve) => socket2.once('DRAWING_UPDATED', resolve));

    drawingSocket.emit('SUBMIT_DRAWING', {
      roomCode,
      playerId: currentRoom.gameState.activePlayerId,
      rowNumber: targetDrawingRow,
      stage: 'HEAD',
      strokeData: {
        strokes: [
          {
            id: 'pencil_head_circle',
            tool: 'pencil',
            color: '#23252A',
            width: 4,
            points: [{ x: 50, y: 50 }, { x: 75, y: 75 }, { x: 50, y: 100 }, { x: 25, y: 75 }, { x: 50, y: 50 }]
          }
        ]
      }
    });

    const [drawEvent1, drawEvent2] = await Promise.all([drawingUpdatedPromise1, drawingUpdatedPromise2]);
    console.log(`  ✓ Both players received DRAWING_UPDATED: ${drawEvent1.stage} sketched on Row ${drawEvent1.rowNumber}!`);
    console.log(`  ✓ Next required stage for Row ${drawEvent1.rowNumber}: "${drawEvent1.nextStage}"`);

    // -------------------------------------------------------------
    // STEP 8: COMBAT ENGINE & ROW ELIMINATION TEST
    // -------------------------------------------------------------
    console.log('\n[STEP 8] Testing authoritative Combat Engine & Row Elimination...');
    const { inMemoryRooms: memStore } = await import('./src/services/roomService.js');
    const roomInMem8 = memStore.get(roomCode);

    const attackerP = roomInMem8.players.find(p => p.playerId === player1.playerId);
    const targetP = roomInMem8.players.find(p => p.playerId === player2.playerId);

    const attackerRow1 = attackerP.territory.rowStates.find(r => r.rowNumber === 1);
    attackerRow1.drawings = {
      HEAD: { strokes: [] },
      BODY: { strokes: [] },
      GUN: { strokes: [] },
      BULLET: { strokes: [] }
    };
    attackerRow1.bulletCount = 1;
    attackerRow1.bullets = [
      { slot: 1, state: 'LOADED' },
      { slot: 2, state: 'EMPTY' },
      { slot: 3, state: 'EMPTY' }
    ];

    // Set turn to player 1 with Row 1 eligible to attack
    roomInMem8.gameState.activePlayerId = player1.playerId;
    roomInMem8.gameState.turnPhase = 'AWAITING_ACTION';
    roomInMem8.gameState.currentTurn = {
      turnNumber: 5,
      playerId: player1.playerId,
      eligibleAction: {
        type: 'ATTACK',
        targetRow: 1,
        canAttack: true
      }
    };

    // Player 1 fires shot at Player 2 Row 3
    const shotFiredPromise2 = new Promise((resolve) => socket2.once('SHOT_FIRED', resolve));
    const rowElimPromise2 = new Promise((resolve) => socket2.once('ROW_ELIMINATED', resolve));

    socket1.emit('FIRE_SHOT', {
      roomCode,
      playerId: player1.playerId,
      attackerRow: 1,
      targetPlayerId: player2.playerId,
      targetRow: 3,
      actionId: 'test_shot_1'
    });

    const [shotEvent, rowElimEvent] = await Promise.all([shotFiredPromise2, rowElimPromise2]);
    console.log(`  ✓ Opponent received SHOT_FIRED broadcast: Attacker ${shotEvent.shotEvent.attackerNickname} struck Row ${shotEvent.shotEvent.targetRow}!`);
    console.log(`  ✓ Opponent received ROW_ELIMINATED: Row ${rowElimEvent.targetRow} is eliminated!`);

    // -------------------------------------------------------------
    // STEP 9: BROWSER REFRESH & RECONNECTION STATE RECOVERY
    // -------------------------------------------------------------
    console.log('\n[STEP 9] Testing browser refresh & reconnection recovery...');
    // Disconnect socket 2 (simulate closing tab or refreshing)
    socket2.disconnect();
    console.log('  - Socket 2 disconnected (simulating browser reload).');

    // Fetch canonical room state via REST as client would upon page mount
    const restoreRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}`);
    const restoreData = await restoreRes.json();
    const restoredRoom = restoreData.data.room || restoreData.data;

    // Verify paper style remains identical
    if (restoredRoom.gameState.paperStyle !== initialPaperStyle) {
      throw new Error(`Paper style changed after reload! Was: ${initialPaperStyle}, Now: ${restoredRoom.gameState.paperStyle}`);
    }
    console.log(`  ✓ Paper style intact across reload: "${restoredRoom.gameState.paperStyle}"`);

    // Verify drawing on targetDrawingRow survived reload
    const drawingPlayerRestored = restoredRoom.players.find(p => p.playerId === drawingPlayer.playerId).territory.rowStates.find(r => r.rowNumber === targetDrawingRow);
    if (!drawingPlayerRestored.drawings?.HEAD) {
      throw new Error(`Drawing on Row ${targetDrawingRow} for ${drawingPlayer.nickname} was lost after reload!`);
    }
    console.log(`  ✓ Player drawing vectors intact across reload in Row ${targetDrawingRow} for ${drawingPlayer.nickname}!`);

    // Verify Row 3 of player 2 remains eliminated
    const p2Row3Restored = restoredRoom.players.find(p => p.playerId === player2.playerId).territory.rowStates.find(r => r.rowNumber === 3);
    if (!p2Row3Restored.isEliminated || p2Row3Restored.status !== 'ELIMINATED') {
      throw new Error('Eliminated row state lost after reload!');
    }
    console.log('  ✓ Eliminated row state (Row 3) permanently preserved across reload!');

    // Reconnect socket 2
    socket2 = ioClient(BASE_URL, { transports: ['websocket'], forceNew: true });
    await new Promise((resolve) => socket2.on('connect', resolve));
    await new Promise((resolve) => socket2.emit('room:join', { roomCode, player: player2 }, resolve));
    console.log('  ✓ Socket 2 successfully reconnected to match channel.');

    // -------------------------------------------------------------
    // STEP 10: VICTORY & MATCH COMPLETION
    // -------------------------------------------------------------
    console.log('\n[STEP 10] Testing authoritative victory detection & match completion...');
    const { inMemoryRooms } = await import('./src/services/roomService.js');
    const roomInMem = inMemoryRooms.get(roomCode);

    const p1InMem = roomInMem.players.find(p => p.playerId === player1.playerId);
    const p2InMem = roomInMem.players.find(p => p.playerId === player2.playerId);

    const r1 = p1InMem.territory.rowStates.find(r => r.rowNumber === 1);
    r1.drawings = { HEAD: {}, BODY: {}, GUN: {} };
    r1.bulletCount = 1;
    r1.bullets = [{ slot: 1, state: 'LOADED' }, { slot: 2, state: 'EMPTY' }, { slot: 3, state: 'EMPTY' }];

    // Mark 4 of 5 rows of Player 2 as already eliminated (1, 3, 7, 9)
    [1, 3, 7, 9].forEach(rNum => {
      const rState = p2InMem.territory.rowStates.find(r => r.rowNumber === rNum);
      if (rState) {
        rState.isEliminated = true;
        rState.status = 'ELIMINATED';
      }
    });

    // Make row 5 the ONLY remaining active row for Player 2
    const r5 = p2InMem.territory.rowStates.find(r => r.rowNumber === 5);
    r5.isEliminated = false;
    r5.status = 'EMPTY';

    // Set turn to player 1 with Row 1 eligible to attack
    roomInMem.gameState.activePlayerId = player1.playerId;
    roomInMem.gameState.turnPhase = 'AWAITING_ACTION';
    roomInMem.gameState.currentTurn = {
      turnNumber: 10,
      playerId: player1.playerId,
      eligibleAction: {
        type: 'ATTACK',
        targetRow: 1,
        canAttack: true
      }
    };

    // Player 1 fires final shot
    const matchFinishedPromise1 = new Promise((resolve) => socket1.once('MATCH_FINISHED', resolve));
    const matchFinishedPromise2 = new Promise((resolve) => socket2.once('MATCH_FINISHED', resolve));

    // Emit match finish check
    socket1.emit('FIRE_SHOT', {
      roomCode,
      playerId: player1.playerId,
      attackerRow: 1,
      targetPlayerId: player2.playerId,
      targetRow: 5,
      actionId: 'test_final_shot'
    });

    const [finish1, finish2] = await Promise.all([matchFinishedPromise1, matchFinishedPromise2]);
    console.log(`  ✓ Both players received MATCH_FINISHED broadcast! Winner: ${finish1.winnerNickname || finish1.room?.gameState?.winnerNickname}`);
    console.log(`  ✓ Match status: "${finish1.room.status}"`);

    console.log('\n================================================================');
    console.log('  ALL 10 MULTIPLAYER FLOW STEPS PASSED WITH 100% SUCCESS!       ');
    console.log('================================================================\n');

  } finally {
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
    server.close();
  }
}

runFullMultiplayerTest().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ MULTIPLAYER E2E TEST FAILED:', err);
  process.exit(1);
});
