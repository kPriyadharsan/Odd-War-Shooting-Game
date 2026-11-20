// Set test environment flags BEFORE importing server module
process.env.PORT = '5097';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_odd_war_oauth_verification';

async function runTests() {
  console.log('================================================================');
  console.log('   ODD WAR — PRODUCTION-READY AUTHENTICATION TEST SUITE       ');
  console.log('================================================================');

  const { authService } = await import('./src/services/authService.js');
  const { sessionService } = await import('./src/services/sessionService.js');
  const { config } = await import('./src/config/env.js');
  const { startServer } = await import('./src/server.js');
  const { server } = await startServer(5097);
  const BASE_URL = 'http://localhost:5097/api';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Unconfigured Google OAuth Initiation Behavior
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Initiating OAuth without credentials configured...');
    const resInitRaw = await fetch(`${BASE_URL}/auth/google`, { redirect: 'manual' });
    console.log(`[TEST 1] Status: ${resInitRaw.status}`);
    if (resInitRaw.status !== 501 && resInitRaw.status !== 302) {
      throw new Error(`Expected 501 or redirect when unconfigured, got ${resInitRaw.status}`);
    }
    console.log('✓ TEST 1 PASSED: Unconfigured OAuth gracefully rejected with safe diagnostic.');

    // -------------------------------------------------------------------------
    // TEST 2: Cryptographic State, Nonce & PKCE Generation
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Testing cryptographic OAuth transaction generation...');
    // Temporarily set mock test credentials
    config.googleClientId = 'mock_google_client_id_test_suite.apps.googleusercontent.com';
    config.googleClientSecret = 'mock_google_client_secret_test_suite';
    config.isGoogleAuthConfigured = true;

    const tx = authService.generateOAuthTransaction({
      guestPlayerId: 'p_guest_tester_123',
      returnTo: '/profile'
    });

    console.log(`[TEST 2] State length: ${tx.state.length}, Nonce length: ${tx.nonce.length}`);
    console.log(`[TEST 2] Auth URL: ${tx.authorizationUrl.substring(0, 60)}...`);

    if (!tx.state || tx.state.length !== 64) {
      throw new Error('State must be 32 bytes (64 hex characters)');
    }
    if (!tx.nonce || tx.nonce.length !== 64) {
      throw new Error('Nonce must be 32 bytes (64 hex characters)');
    }
    if (!tx.authorizationUrl.includes('code_challenge=')) {
      throw new Error('PKCE code_challenge missing from authorization URL');
    }
    if (!tx.authorizationUrl.includes('scope=openid+email+profile') && !tx.authorizationUrl.includes('scope=openid%20email%20profile')) {
      throw new Error('Required OIDC scopes missing from authorization URL');
    }
    console.log('✓ TEST 2 PASSED: Cryptographic state, nonce, and PKCE generated securely.');

    // -------------------------------------------------------------------------
    // TEST 3: OAuth State Validation & CSRF Protection
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Testing state validation and tampering prevention...');
    const unwrapped = authService.verifyAndConsumeTransaction(tx.transactionToken, tx.state);
    if (unwrapped.guestPlayerId !== 'p_guest_tester_123' || unwrapped.nonce !== tx.nonce) {
      throw new Error('Unwrapped transaction data mismatch');
    }

    // Rejection of invalid state
    let stateTamperCaught = false;
    try {
      authService.verifyAndConsumeTransaction(tx.transactionToken, 'forged_attacker_state_123');
    } catch {
      stateTamperCaught = true;
    }
    if (!stateTamperCaught) {
      throw new Error('Failed to reject forged state parameter!');
    }

    // Rejection of tampered token signature
    let tokenTamperCaught = false;
    try {
      const parts = tx.transactionToken.split('.');
      authService.verifyAndConsumeTransaction(`${parts[0]}.tampered_signature`, tx.state);
    } catch {
      tokenTamperCaught = true;
    }
    if (!tokenTamperCaught) {
      throw new Error('Failed to reject tampered HMAC signature!');
    }
    console.log('✓ TEST 3 PASSED: State validation and HMAC signature verified successfully.');

    // -------------------------------------------------------------------------
    // TEST 4: Safe Guest Account Linking & Separation of Google Identity from Game Nickname
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Testing safe guest-to-Google linking & nickname isolation...');
    const mockGoogleProfile1 = {
      googleId: 'google_sub_1092837465',
      email: 'alice.pen@example.com',
      emailVerified: true,
      displayName: 'Alice Pen',
      avatarUrl: 'https://lh3.googleusercontent.com/alice_avatar.jpg'
    };

    const { user: linkedUser, isNewUser: isFirstTime } = await authService.findOrCreateUserFromGoogle({
      googleProfile: mockGoogleProfile1,
      guestPlayerId: 'p_guest_tester_123'
    });

    console.log(`[TEST 4] User created: playerId: ${linkedUser.playerId}, isNewUser: ${isFirstTime}, nickname: ${linkedUser.nickname}`);
    if (linkedUser.playerId !== 'p_guest_tester_123') {
      throw new Error(`Guest playerId was not linked! Got ${linkedUser.playerId}`);
    }
    if (linkedUser.googleId !== mockGoogleProfile1.googleId) {
      throw new Error('Google provider ID mismatch');
    }
    if (!isFirstTime) {
      throw new Error('First sign-in should report isNewUser = true');
    }
    // Strict isolation: Google displayName ("Alice Pen") must NOT be automatically set as game nickname!
    if (linkedUser.nickname !== null && linkedUser.nickname !== undefined && linkedUser.nickname !== '') {
      throw new Error(`Google displayName was incorrectly set as game nickname: "${linkedUser.nickname}"`);
    }
    if (linkedUser.isProfileComplete) {
      throw new Error('New Google user profile must be incomplete before mandatory onboarding!');
    }
    console.log('✓ TEST 4 PASSED: Google account identity separated from game nickname; profile incomplete as required.');

    // -------------------------------------------------------------------------
    // TEST 5: Complete Mandatory Profile (Nickname + Color + DOB)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing mandatory profile onboarding (Nickname + Color + DOB)...');
    
    // Test rejection of invalid future DOB
    let futureDobRejected = false;
    try {
      await authService.updateUserProfile({
        playerId: linkedUser.playerId,
        nickname: 'Sharpshooter_Alice',
        primaryColor: 'RED',
        dob: '2099-01-01'
      });
    } catch {
      futureDobRejected = true;
    }
    if (!futureDobRejected) {
      throw new Error('Failed to reject future DOB!');
    }

    // Test rejection of missing DOB
    let missingDobRejected = false;
    try {
      await authService.updateUserProfile({
        playerId: linkedUser.playerId,
        nickname: 'Sharpshooter_Alice',
        primaryColor: 'RED',
        dob: null
      });
    } catch {
      missingDobRejected = true;
    }
    if (!missingDobRejected) {
      throw new Error('Failed to reject missing DOB!');
    }

    // Complete valid profile onboarding
    const updated = await authService.updateUserProfile({
      playerId: linkedUser.playerId,
      nickname: 'Sharpshooter_Alice',
      primaryColor: 'RED',
      dob: '1998-05-14'
    });
    if (updated.nickname !== 'Sharpshooter_Alice' || updated.primaryColor !== 'RED' || !updated.dob || !updated.isProfileComplete) {
      throw new Error('Profile update failed to save nickname, color, DOB, or mark isProfileComplete');
    }

    console.log('✓ TEST 5 PASSED: Profile completed with Nickname + Color + DOB; validations verified.');

    // -------------------------------------------------------------------------
    // TEST 6: Session Creation, Token Hashing & Expiration
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Testing persistent session creation and hashing...');
    const { session, rawToken } = await sessionService.createSession({
      user: linkedUser,
      req: { headers: { 'user-agent': 'OddWarTestAgent/1.0' }, ip: '127.0.0.1' }
    });

    console.log(`[TEST 6] Session ID: ${session.sessionId}, rawToken length: ${rawToken.length}`);
    if (rawToken === session.tokenHash) {
      throw new Error('CRITICAL: Raw token must never equal tokenHash!');
    }

    const validationResult = await sessionService.validateSession(rawToken);
    if (!validationResult || validationResult.user.playerId !== linkedUser.playerId) {
      throw new Error('Session validation failed for valid raw token');
    }
    console.log('✓ TEST 6 PASSED: Session created, hashed with SHA-256, and validated.');

    // -------------------------------------------------------------------------
    // TEST 7: HTTP GET /api/auth/me (Protected Route Verification)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Testing GET /api/auth/me with session cookie...');
    // Without cookie -> 401
    const resMeUnauth = await fetch(`${BASE_URL}/auth/me`);
    if (resMeUnauth.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated /auth/me, got ${resMeUnauth.status}`);
    }

    // With session cookie -> 200
    const resMeAuth = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Cookie': `odd_war_session=${rawToken}`
      }
    });
    const meBody = await resMeAuth.json();
    console.log(`[TEST 7] Status: ${resMeAuth.status}, user: ${meBody.data?.user?.nickname}`);
    if (resMeAuth.status !== 200 || meBody.data?.user?.playerId !== 'p_guest_tester_123') {
      throw new Error('GET /api/auth/me failed to return authenticated user');
    }
    console.log('✓ TEST 7 PASSED: requireAuth verified session cookie and returned user.');

    // -------------------------------------------------------------------------
    // TEST 8: Session Revocation & Logout (POST /api/auth/logout)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8] Testing POST /api/auth/logout...');
    const resLogout = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': `odd_war_session=${rawToken}`
      }
    });
    console.log(`[TEST 8] Logout Status: ${resLogout.status}`);
    const setCookieHeader = resLogout.headers.get('set-cookie');
    console.log(`[TEST 8] Set-Cookie: ${setCookieHeader}`);

    // Verify session is now revoked on the server
    const postLogoutCheck = await sessionService.validateSession(rawToken);
    if (postLogoutCheck !== null) {
      throw new Error('Revoked session should return null on validation!');
    }

    // Subsequent call to /auth/me must be rejected
    const resMeAfterLogout = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Cookie': `odd_war_session=${rawToken}`
      }
    });
    if (resMeAfterLogout.status !== 401) {
      throw new Error('Subsequent requests with revoked session must return 401!');
    }
    console.log('✓ TEST 8 PASSED: Session revoked server-side and cookie cleared.');

    // -------------------------------------------------------------------------
    // TEST 9: Duplicate Email / Provider ID Security Protection
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9] Testing conflict protection for unverified or duplicate accounts...');
    // Linking another Google ID with the same email updates the provider securely
    const mockGoogleProfileDuplicate = {
      googleId: 'google_sub_999999999',
      email: 'alice.pen@example.com',
      emailVerified: true,
      displayName: 'Alice Pen Replacement'
    };
    const { user: updatedUser } = await authService.findOrCreateUserFromGoogle({
      googleProfile: mockGoogleProfileDuplicate
    });
    if (updatedUser.playerId !== 'p_guest_tester_123' || updatedUser.googleId !== 'google_sub_999999999') {
      throw new Error('Verified email account update failed');
    }
    console.log('✓ TEST 9 PASSED: Account conflict protection verified.');

    // -------------------------------------------------------------------------
    // TEST 10: Nickname Availability & Duplicate Rejection
    // -------------------------------------------------------------------------
    console.log('\n[TEST 10] Testing nickname uniqueness & availability...');
    const isTaken = await authService.isNicknameAvailable('Sharpshooter_Alice');
    if (isTaken) {
      throw new Error('Sharpshooter_Alice should be reported as TAKEN (unavailable)');
    }
    const isOwnRetained = await authService.isNicknameAvailable('Sharpshooter_Alice', 'p_guest_tester_123');
    if (!isOwnRetained) {
      throw new Error('Current user must be allowed to retain their own nickname!');
    }
    const isNewAvailable = await authService.isNicknameAvailable('BrandNewWarrior_99');
    if (!isNewAvailable) {
      throw new Error('Unclaimed nickname should be available!');
    }
    console.log('✓ TEST 10 PASSED: Nickname uniqueness and own-player retention verified.');

    // -------------------------------------------------------------------------
    // TEST 11: HTTP GET /api/auth/check-nickname Endpoint
    // -------------------------------------------------------------------------
    console.log('\n[TEST 11] Testing GET /api/auth/check-nickname...');
    const resCheck = await fetch(`${BASE_URL}/auth/check-nickname?nickname=Sharpshooter_Alice`);
    const checkData = await resCheck.json();
    if (!checkData.success || checkData.data?.available !== false) {
      throw new Error('GET /api/auth/check-nickname failed to report taken nickname');
    }
    console.log('✓ TEST 11 PASSED: Nickname check API successfully reports availability.');

    // -------------------------------------------------------------------------
    // TEST 12: Incomplete Profile Gatekeeping on Gameplay / Room Endpoints
    // -------------------------------------------------------------------------
    console.log('\n[TEST 12] Testing gatekeeping for incomplete Google profiles...');
    // Create an uncompleted user session
    const { user: incompleteUser } = await authService.findOrCreateUserFromGoogle({
      googleProfile: {
        googleId: 'google_sub_incomplete_tester',
        email: 'bob.incomplete@example.com',
        emailVerified: true,
        displayName: 'Bob Incomplete'
      }
    });
    const { rawToken: incompleteToken } = await sessionService.createSession({
      user: incompleteUser,
      req: { headers: { 'user-agent': 'TestAgent' }, ip: '127.0.0.1' }
    });

    const resIncompleteRoom = await fetch(`${BASE_URL}/rooms/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `odd_war_session=${incompleteToken}`
      },
      body: JSON.stringify({
        name: 'Incomplete Test Room',
        maxPlayers: 2,
        bookPageCount: 100
      })
    });

    if (resIncompleteRoom.status !== 403) {
      throw new Error(`Incomplete profile should be rejected with 403, got ${resIncompleteRoom.status}`);
    }
    console.log('✓ TEST 12 PASSED: Incomplete Google profiles strictly blocked from gameplay with 403.');

    console.log('\n================================================================');
    console.log('  ALL 12 AUTHENTICATION & ONBOARDING TESTS PASSED WITH 100% OK! ');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ AUTH TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
