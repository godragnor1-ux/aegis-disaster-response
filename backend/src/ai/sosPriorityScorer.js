/**
 * AI Multi-Factor SOS Priority Scoring Engine
 * Computes normalized 0-100 triage priority, survival window, and optimal asset recommendation.
 */

/**
 * Score an emergency distress beacon based on multi-parameter telemetry
 * @param {Object} beacon
 * @param {string} [beacon.emergencyType] - 'trapped' | 'medical' | 'flood_rising' | 'fire_smoke' | 'food_water' | 'elderly_infant'
 * @param {string} [beacon.urgency] - 'critical' | 'high' | 'medium' | 'low'
 * @param {number} [beacon.peopleCount] - number of individuals in danger
 * @param {number} [beacon.batteryLevel] - percentage (0-100)
 * @param {string} [beacon.notes]
 * @param {Object} [beacon.location]
 * @returns {Object} Structured priority score, rank, and triage guidance
 */
export const scoreSOSPriority = (beacon = {}) => {
  const {
    emergencyType = 'trapped',
    urgency = 'critical',
    peopleCount = 1,
    batteryLevel = 85,
    notes = '',
  } = beacon;

  // 1. Urgency Base Score (Max 35 pts)
  const urgencyTypeScores = {
    trapped: 35,
    medical: 34,
    flood_rising: 32,
    fire_smoke: 30,
    elderly_infant: 28,
    food_water: 15,
  };
  let urgencyBaseScore = urgencyTypeScores[emergencyType] || 25;
  if (urgency === 'critical') urgencyBaseScore = Math.min(35, urgencyBaseScore + 3);

  // 2. Casualty & Vulnerability Score (Max 25 pts)
  const countMultiplier = Math.min(15, Math.log2(Math.max(1, peopleCount) + 1) * 8);
  const hasVulnerableKeywords = /infant|baby|elderly|asthma|pregnant|oxygen|bleeding|unconscious/i.test(notes);
  const vulnerabilityBonus = hasVulnerableKeywords ? 10 : 0;
  const casualtyScore = Math.min(25, countMultiplier + vulnerabilityBonus);

  // 3. Battery Degradation Urgency (Max 20 pts)
  // Survivors with low battery (<20%) risk imminent telemetry blackout
  const clampedBattery = Math.max(1, Math.min(100, batteryLevel));
  const batteryUrgencyScore = +(20 * (1 - clampedBattery / 100)).toFixed(1);

  // 4. Environmental Hazard Factor (Max 20 pts)
  let hazardScore = 15;
  if (emergencyType === 'flood_rising' || emergencyType === 'fire_smoke') {
    hazardScore = 19;
  }

  // Total Normalized Score (0 - 100)
  const rawTotal = urgencyBaseScore + casualtyScore + batteryUrgencyScore + hazardScore;
  const priorityScore = +Math.min(100, Math.max(10, rawTotal)).toFixed(1);

  // Priority Tier & Color Classification
  let priorityRank = 'P4_LOW';
  let triageColor = 'green';
  let responseWindowMinutes = 120;
  let recommendedAsset = 'VOLUNTEER_FOOT_PATROL';

  if (priorityScore >= 85) {
    priorityRank = 'P1_CRITICAL';
    triageColor = 'red';
    responseWindowMinutes = 15;
    recommendedAsset = emergencyType === 'flood_rising' ? 'SWIFT_WATER_ZODIAC_BOAT' : 'USAR_HEAVY_EXTRICATION';
  } else if (priorityScore >= 68) {
    priorityRank = 'P2_HIGH';
    triageColor = 'red';
    responseWindowMinutes = 30;
    recommendedAsset = emergencyType === 'medical' ? 'PARAMEDIC_MOBILE_ICU' : 'FIRE_TENDER_SQUAD';
  } else if (priorityScore >= 45) {
    priorityRank = 'P3_MEDIUM';
    triageColor = 'yellow';
    responseWindowMinutes = 60;
    recommendedAsset = 'DRONE_RECON_AND_SUPPLY_DROP';
  }

  return {
    success: true,
    sosId: beacon.sosId || `SOS-${Date.now().toString().slice(-4)}`,
    priorityScore,
    priorityRank,
    triageColor,
    responseWindowMinutes,
    recommendedAsset,
    breakdown: {
      urgencyBaseScore,
      casualtyScore: +casualtyScore.toFixed(1),
      batteryUrgencyScore,
      hazardScore,
    },
    actionDirective: `Dispatch ${recommendedAsset} within ${responseWindowMinutes} minutes. Target survivors: ${peopleCount} (Battery remaining: ${batteryLevel}%).`,
    timestamp: new Date().toISOString()
  };
};
