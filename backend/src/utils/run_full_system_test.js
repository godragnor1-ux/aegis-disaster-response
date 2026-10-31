import http from 'http';

const API_BASE = 'http://localhost:5001/api';

async function makeRequest(path, method = 'GET', body = null, headers = {}) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 RUNNING RESQ-COMMAND END-TO-END SYSTEM VALIDATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // TEST 1: Health Check
    console.log('--- 1. Testing System Health & Connectivity ---');
    const health = await makeRequest('/health');
    assert(health.status === 200 && health.data.status === 'ONLINE', 'System Health Endpoint Online');

    // TEST 2: Authentication & RBAC
    console.log('\n--- 2. Testing Auth & Role-Based Access Control ---');
    const login = await makeRequest('/auth/login', 'POST', {
      email: 'admin@aegis.gov',
      password: 'admin123',
    });
    assert(login.status === 200 && login.data.success && !!login.data.token, 'Admin Login & JWT Issuance');
    const token = login.data.token;

    const me = await makeRequest('/auth/me', 'GET', null, { Authorization: `Bearer ${token}` });
    assert(me.status === 200 && me.data.user.role === 'admin', 'Protected Profile (GET /api/auth/me)');

    const users = await makeRequest('/auth/users', 'GET', null, { Authorization: `Bearer ${token}` });
    assert(users.status === 200 && users.data.count >= 3, 'Admin RBAC User Listing');

    // TEST 3: SOS Distress Beacon Flow
    console.log('\n--- 3. Testing SOS Beacon Pipeline & Auto-Dispatch ---');
    const sosPayload = {
      userName: 'Test Citizen (E2E Test)',
      userPhone: '+1 (555) 999-8888',
      location: { lat: 28.6185, lng: 77.2115, accuracy: 5, altitude: 10 },
      batteryLevel: 22,
      urgency: 'critical',
      emergencyType: 'flood_rising',
      peopleCount: 3,
      notes: 'Water level rising quickly in basement.',
      frontCameraImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      backCameraImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    };
    const sosRes = await makeRequest('/sos', 'POST', sosPayload);
    assert((sosRes.status === 200 || sosRes.status === 201) && sosRes.data.success && !!sosRes.data.beacon, 'SOS Distress Ingestion & DB Storage');
    const createdSOS = sosRes.data.beacon;

    const sosList = await makeRequest('/sos');
    assert(sosList.status === 200 && sosList.data.beacons.length > 0, 'SOS Beacon Directory Retrieval');

    const updateSOS = await makeRequest(`/sos/${createdSOS._id}`, 'PATCH', { status: 'in_progress' });
    assert(updateSOS.status === 200 && updateSOS.data.beacon.status === 'in_progress', 'SOS Status Update Transition');

    // TEST 4: Dynamic Hazard-Avoidance Routing
    console.log('\n--- 4. Testing Dynamic Rescue Routing (Hazard Avoidance) ---');
    const routeRes = await makeRequest('/routing/calculate', 'POST', {
      start: [28.6185, 77.2115], // Sector 4 Flood Zone
      destination: [28.5950, 77.2050], // Indira Memorial Shelter
      mode: 'rescue_vehicle',
    });
    assert(
      routeRes.status === 200 &&
      routeRes.data.success &&
      routeRes.data.directPathHazard === true &&
      routeRes.data.safeWaypoints.length >= 4,
      'Dynamic Hazard Avoidance Routing Calculation'
    );
    assert(routeRes.data.distanceKm > 0 && routeRes.data.etaMinutes > 0, 'Route Distance & ETA Generation');

    // TEST 5: AI Damage Vision Classifier
    console.log('\n--- 5. Testing AI Computer Vision Damage Classifier ---');
    const aiVision = await makeRequest('/ai/damage-analysis', 'POST', {
      incidentType: 'flood',
      customNotes: 'Trapped family with water submerging ground floor and burning electrical transformer',
    });
    assert(
      aiVision.status === 200 &&
      aiVision.data.success &&
      aiVision.data.boundingBoxes.length >= 2 &&
      aiVision.data.confidenceScore > 0.8,
      'AI Image Damage Detection (Fire, Flood, Injury)'
    );

    // TEST 6: AI SOS Priority Scoring Engine
    console.log('\n--- 6. Testing AI SOS Priority Scoring Engine ---');
    const aiScore = await makeRequest('/ai/score-priority', 'POST', {
      sosId: createdSOS.sosId,
      emergencyType: 'flood_rising',
      urgency: 'critical',
      peopleCount: 4,
      batteryLevel: 12,
      notes: 'Elderly with asthma trapped on balcony with water surging',
    });
    assert(
      aiScore.status === 200 &&
      aiScore.data.success &&
      aiScore.data.priorityScore >= 80 &&
      aiScore.data.priorityRank === 'P1_CRITICAL',
      'AI SOS Priority Scoring (0-100 Score & P1 Rank)'
    );

    // TEST 7: AI Weather Disaster Prediction
    console.log('\n--- 7. Testing AI Meteorological Disaster Prediction ---');
    const aiPredict = await makeRequest('/prediction/forecast');
    assert(
      aiPredict.status === 200 &&
      aiPredict.data.success &&
      !!aiPredict.data.cycloneForecast &&
      aiPredict.data.floodSurgeTimeline.length >= 4,
      'AI Disaster Prediction with Live Weather API'
    );

    // TEST 8: Communications & Multi-Channel Chat
    console.log('\n--- 8. Testing Tactical Communications & Chat ---');
    const chatMsg = await makeRequest('/chat', 'POST', {
      channel: 'responder_tactical',
      senderName: 'Capt. Marcus (RESCUE-EAGLE-1)',
      senderRole: 'responder',
      message: 'Arrived on scene at Sector 4 Flood Balcony. Deploying zodiac boat.',
      priority: 'urgent',
    });
    assert(chatMsg.status === 201 && chatMsg.data.success && !!chatMsg.data.message, 'Multi-Channel Chat Message Dispatch');

    const chatHistory = await makeRequest('/chat?channel=responder_tactical');
    assert(chatHistory.status === 200 && chatHistory.data.messages.length > 0, 'Chat Channel History Retrieval');

    const broadcast = await makeRequest('/alert/broadcast', 'POST', {
      title: 'CIVIL DEFENSE FLASH ADVISORY',
      message: 'Water surge stabilizing in Sector 4. Evacuation corridor open.',
      threatLevel: 'CODE_RED',
    });
    assert(broadcast.status === 200 && broadcast.data.success, 'Admin Civil Defense Alert Broadcast');

    // TEST 9: Auto Task Assignment & Candidate Ranking
    console.log('\n--- 9. Testing Auto Task Assignment & Responder Scoring ---');
    const tasks = await makeRequest('/tasks');
    assert(tasks.status === 200 && tasks.data.tasks.length > 0, 'Task Directory Retrieval');
    const targetTask = tasks.data.tasks[0];

    const evalCandidates = await makeRequest(`/tasks/${targetTask._id}/evaluate-candidates`, 'POST');
    assert(
      evalCandidates.status === 200 &&
      evalCandidates.data.success &&
      evalCandidates.data.candidates.length > 0 &&
      evalCandidates.data.candidates[0].scores.totalScorePct > 60,
      'Multi-Factor Candidate Scoring (Distance, Severity, Availability, Skills)'
    );

    const autoAssign = await makeRequest(`/tasks/${targetTask._id}/auto-assign`, 'POST', null, {
      Authorization: `Bearer ${token}`,
    });
    assert(autoAssign.status === 200 && autoAssign.data.assigned === true, 'Single Task Auto-Assignment to Optimal Responder');

    // TEST 10: Missing Person Registry
    console.log('\n--- 10. Testing Missing Person Registry & Sighting Tips ---');
    const createMissing = await makeRequest('/missing', 'POST', {
      name: 'Ravi Kumar (Test)',
      age: 34,
      gender: 'Male',
      clothingDescription: 'Black raincoat, hiking boots',
      medicalConditions: 'None',
      lastSeenLocation: { lat: 28.625, lng: 77.220, addressName: 'Connaught Block D' },
      reporterContact: '+1 (555) 333-4444',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60'
    });
    assert(createMissing.status === 201 && createMissing.data.success, 'Missing Person Registration');
    const missingId = createMissing.data.person._id;

    const addTip = await makeRequest(`/missing/${missingId}/tips`, 'POST', {
      reporterName: 'Volunteer Sentry',
      comment: 'Spotted assisting elders near Ridge Highway relief point.',
      suggestedStatus: 'spotted'
    });
    assert(addTip.status === 200 && addTip.data.person.status === 'spotted', 'Community Sighting Tip Submission & Status Transition');

    // TEST 11: P2P Bluetooth / LoRa Mesh Simulation
    console.log('\n--- 11. Testing P2P Bluetooth / LoRa Mesh Relay ---');
    const mesh = await makeRequest('/mesh/simulate', 'POST', {
      originNodeId: 'VICTIM-MOBILE-01',
      targetGatewayId: 'AEGIS-COMMAND-HQ',
      payload: { type: 'DISTRESS_BEACON', lat: 28.6185, lng: 77.2115 }
    });
    assert(mesh.status === 200 && mesh.data.success && mesh.data.totalHops >= 3, 'Decentralized P2P Mesh Relay Simulation');

    console.log('\n================================================================');
    console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    if (failed === 0) {
      console.log('🎉 ALL SYSTEM MODULES FULLY OPERATIONAL AND VERIFIED WITH 100% SUCCESS!');
    }
  } catch (error) {
    console.error('Fatal test error:', error);
  }
}

runE2ETests();
