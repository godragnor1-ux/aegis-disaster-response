import { calculateDistanceMeters } from '../utils/geoMath.js';
import { Responder } from '../database/schemas/Responder.js';
import { User } from '../database/schemas/User.js';
import { Task } from '../database/schemas/Task.js';
import { SOSBeacon } from '../database/schemas/SOSBeacon.js';

/**
 * Vehicle average speeds in urban disaster zones (km/h)
 */
const VEHICLE_SPEED_KMH = {
  'Inflatable Zodiac Rescue Boat': 35,
  'Tactical Mobile ICU Ambulance': 50,
  'Hazmat Pumper Tender': 40,
  'All-Terrain USAR Buggy': 45,
  'Mobile Drone Staging Rig': 65,
  default: 40,
};

/**
 * Role skill alignment mapping
 */
const ROLE_SKILLS_MAP = {
  swift_water: ['swift_water', 'boat_rescue', 'flood_evacuation', 'water_extraction'],
  paramedic: ['paramedic', 'trauma_care', 'triage', 'resuscitation', 'medical'],
  firefighter: ['firefighter', 'hazmat', 'fire_suppression', 'smoke_extraction'],
  k9_search: ['k9_search', 'acoustic_search', 'scent_tracking', 'usar_search'],
  heavy_extrication: ['heavy_extrication', 'structural_collapse', 'hydraulic_jaws', 'crane_rigging'],
  drone_pilot: ['drone_pilot', 'aerial_recon', 'thermal_mapping', 'payload_drop'],
};

/**
 * Score a single candidate responder against a task or SOS beacon
 * Multi-Factor Scoring: Distance, Severity, Availability, Skill Match, Battery
 *
 * @param {Object} target - Task or SOS Beacon object with location, severity, category/emergencyType
 * @param {Object} responder - Responder or Rescuer User
 * @returns {Object} Structured score metrics and ETA
 */
export const scoreCandidateForTask = (target, responder) => {
  const targetLat = target.location?.lat || 28.6185;
  const targetLng = target.location?.lng || 77.2115;
  const responderLat = responder.location?.lat || 28.6185;
  const responderLng = responder.location?.lng || 77.2115;

  // 1. Distance & Travel Time (Haversine Formula)
  const distanceMeters = calculateDistanceMeters(targetLat, targetLng, responderLat, responderLng);
  const distanceKm = Math.max(0.1, +(distanceMeters / 1000).toFixed(2));

  // Distance Score (Normalized 0 - 35 pts) - Diminishing decay curve
  const distanceScore = +(35 / (1 + (distanceKm / 2.5))).toFixed(1);

  // ETA Calculation
  const vehicleSpeed = VEHICLE_SPEED_KMH[responder.vehicleType] || VEHICLE_SPEED_KMH.default;
  const transitMinutes = (distanceKm / vehicleSpeed) * 60;
  const dispatchDelayMinutes = responder.status === 'available' ? 1.5 : 4.0;
  const etaMinutes = Math.max(2, Math.round(transitMinutes + dispatchDelayMinutes));

  // 2. Severity Factor (Normalized 0 - 25 pts)
  const severityStr = (target.priority || target.urgency || target.severity || 'high').toLowerCase();
  const severityWeights = { critical: 25, high: 20, medium: 14, low: 8 };
  const severityScore = severityWeights[severityStr] || 18;

  // 3. Availability Factor (Normalized 0 - 20 pts)
  const availabilityWeights = {
    available: 20,
    on_duty: 18,
    on_scene: 9,
    en_route: 5,
    busy: 0,
    off_duty: 0,
    offline: 0,
  };
  const availabilityScore = availabilityWeights[responder.status] !== undefined ? availabilityWeights[responder.status] : 10;

  // 4. Skill & Specialty Fit (Normalized 0 - 15 pts)
  const targetCategory = (target.category || target.emergencyType || '').toLowerCase();
  const candidateSkills = [
    responder.role,
    ...(responder.specialties || []),
    ...(ROLE_SKILLS_MAP[responder.role] || []),
    ...(responder.equipment || []),
  ].map((s) => s.toLowerCase());

  let skillMatchMultiplier = 0.5; // Base capability

  if (targetCategory.includes('flood') || targetCategory.includes('water')) {
    if (candidateSkills.includes('swift_water') || responder.role === 'swift_water') skillMatchMultiplier = 1.0;
  } else if (targetCategory.includes('medical') || targetCategory.includes('trauma')) {
    if (candidateSkills.includes('paramedic') || responder.role === 'paramedic') skillMatchMultiplier = 1.0;
  } else if (targetCategory.includes('fire') || targetCategory.includes('smoke')) {
    if (candidateSkills.includes('firefighter') || responder.role === 'firefighter') skillMatchMultiplier = 1.0;
  } else if (targetCategory.includes('collapse') || targetCategory.includes('trapped') || targetCategory.includes('debris')) {
    if (candidateSkills.includes('k9_search') || candidateSkills.includes('heavy_extrication') || responder.role === 'k9_search') {
      skillMatchMultiplier = 1.0;
    }
  } else {
    skillMatchMultiplier = 0.8;
  }

  const skillScore = +(15 * skillMatchMultiplier).toFixed(1);

  // 5. Battery & Equipment Readiness (Normalized 0 - 5 pts)
  const batteryLevel = responder.batteryLevel || 85;
  const batteryScore = +((batteryLevel / 100) * 5).toFixed(1);

  // Total Score (0 - 100%)
  const totalScorePct = +Math.min(100, Math.max(10, distanceScore + severityScore + availabilityScore + skillScore + batteryScore)).toFixed(1);

  return {
    candidateId: responder._id,
    callsign: responder.callsign,
    name: responder.name,
    role: responder.role,
    vehicleType: responder.vehicleType,
    status: responder.status,
    distanceKm,
    etaMinutes,
    scores: {
      distanceScore,
      severityScore,
      availabilityScore,
      skillScore,
      batteryScore,
      totalScorePct,
    },
    fitRating: totalScorePct >= 80 ? 'EXCELLENT_MATCH' : totalScorePct >= 65 ? 'STRONG_MATCH' : 'ADEQUATE_MATCH',
  };
};

/**
 * Evaluate and rank all candidate responders for a given task or SOS beacon
 */
export const evaluateCandidatesForTask = async (target) => {
  const responders = await Responder.find({ status: { $ne: 'off_duty' } });

  if (!responders || responders.length === 0) {
    return [];
  }

  const scoredList = responders.map((resp) => ({
    ...scoreCandidateForTask(target, resp),
    responderDoc: resp,
  }));

  // Sort descending by totalScorePct
  scoredList.sort((a, b) => b.scores.totalScorePct - a.scores.totalScorePct);

  return scoredList;
};

/**
 * Auto-assign the highest scoring responder to an SOS Beacon
 */
export const autoAssignResponder = async (sosBeacon) => {
  try {
    const candidates = await evaluateCandidatesForTask(sosBeacon);

    if (candidates.length === 0) {
      return {
        assigned: false,
        message: 'No available rescue units in sector. Placed in high-priority queue.',
      };
    }

    const topCandidate = candidates[0];
    const bestResponder = topCandidate.responderDoc;

    sosBeacon.status = 'assigned';
    sosBeacon.assignedResponderId = bestResponder._id;
    sosBeacon.assignedResponderName = `${bestResponder.callsign} (${bestResponder.name})`;
    await sosBeacon.save();

    bestResponder.status = 'en_route';
    bestResponder.activeTaskId = sosBeacon.sosId;
    await bestResponder.save();

    return {
      assigned: true,
      sosId: sosBeacon.sosId,
      responder: bestResponder,
      distanceKm: topCandidate.distanceKm,
      etaMinutes: topCandidate.etaMinutes,
      score: topCandidate.scores.totalScorePct,
      breakdown: topCandidate.scores,
      fitRating: topCandidate.fitRating,
    };
  } catch (error) {
    console.error('Auto Dispatch SOS Error:', error);
    return { assigned: false, error: error.message };
  }
};

/**
 * Auto-assign the highest scoring candidate to a specific Task
 */
export const autoAssignSingleTask = async (task) => {
  try {
    const candidates = await evaluateCandidatesForTask(task);

    if (candidates.length === 0) {
      return {
        assigned: false,
        message: 'No responder candidates found.',
      };
    }

    const topCandidate = candidates[0];
    const bestResponder = topCandidate.responderDoc;

    task.status = 'assigned';
    task.assignedResponderCallsign = bestResponder.callsign;
    task.assignedAt = new Date();
    task.notes.push({
      author: 'AI Auto-Dispatch Engine',
      text: `Auto-assigned to ${bestResponder.callsign} with Match Score: ${topCandidate.scores.totalScorePct}% (ETA: ~${topCandidate.etaMinutes} min).`,
    });
    await task.save();

    bestResponder.status = 'en_route';
    bestResponder.activeTaskId = task.taskId;
    await bestResponder.save();

    return {
      assigned: true,
      taskId: task.taskId,
      task,
      responder: bestResponder,
      distanceKm: topCandidate.distanceKm,
      etaMinutes: topCandidate.etaMinutes,
      score: topCandidate.scores.totalScorePct,
      breakdown: topCandidate.scores,
      fitRating: topCandidate.fitRating,
    };
  } catch (error) {
    console.error('Auto Assign Task Error:', error);
    return { assigned: false, error: error.message };
  }
};

/**
 * Auto-assign all pending tasks in the database to the optimal fleet
 */
export const autoAssignAllTasks = async () => {
  try {
    const pendingTasks = await Task.find({ status: 'pending' }).sort({ priority: 1, createdAt: 1 });
    const assignments = [];

    for (const task of pendingTasks) {
      const result = await autoAssignSingleTask(task);
      if (result.assigned) {
        assignments.push(result);
      }
    }

    return {
      success: true,
      countAssigned: assignments.length,
      assignments,
    };
  } catch (error) {
    console.error('Auto Assign All Tasks Error:', error);
    return { success: false, error: error.message };
  }
};
