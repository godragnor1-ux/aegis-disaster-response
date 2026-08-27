import { Incident } from '../../database/schemas/Incident.js';
import { SOSBeacon } from '../../database/schemas/SOSBeacon.js';
import { Responder } from '../../database/schemas/Responder.js';
import { Shelter } from '../../database/schemas/Shelter.js';
import { MissingPerson } from '../../database/schemas/MissingPerson.js';
import { ChatMessage } from '../../database/schemas/ChatMessage.js';
import { analyzeDamageImage } from '../../ai/damageVisionClassifier.js';
import { scoreSOSPriority } from '../../ai/sosPriorityScorer.js';
import { getDisasterPredictions } from '../../ai/disasterPredictionEngine.js';
import { computeSafeRoute } from '../../services/dynamicRoutingService.js';
import { autoAssignResponder } from '../../services/autoDispatchService.js';
import { simulateMeshPacketRelay } from '../../services/meshSimulatorService.js';
import { encodeSOSMessage } from '../../utils/smsCompression.js';

// --- Incidents & Danger Zones ---
export const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json({ success: true, count: incidents.length, incidents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createIncident = async (req, res) => {
  try {
    const incident = new Incident(req.body);
    await incident.save();
    req.io?.emit('incident:new', incident);
    res.status(201).json({ success: true, incident });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- SOS Beacons & Dispatch ---
export const getSOSBeacons = async (req, res) => {
  try {
    const beacons = await SOSBeacon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: beacons.length, beacons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const triggerSOS = async (req, res) => {
  try {
    const sosId = req.body.sosId || `SOS-${Date.now().toString().slice(-6)}`;
    const beacon = new SOSBeacon({
      ...req.body,
      sosId,
      status: 'pending'
    });
    await beacon.save();

    req.io?.emit('sos:new_distress', beacon);

    // Run Auto-Dispatch
    const dispatchResult = await autoAssignResponder(beacon);
    if (dispatchResult.assigned) {
      req.io?.emit('dispatch:assigned', dispatchResult);
      req.io?.emit('sos:updated', await SOSBeacon.findById(beacon._id));
    }

    res.status(201).json({
      success: true,
      beacon,
      dispatch: dispatchResult,
      smsFallbackPayload: encodeSOSMessage(beacon)
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateSOSStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const beacon = await SOSBeacon.findByIdAndUpdate(
      id,
      { status, ...(notes && { notes }) },
      { new: true }
    );
    req.io?.emit('sos:updated', beacon);
    res.json({ success: true, beacon });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Responders ---
export const getResponders = async (req, res) => {
  try {
    const responders = await Responder.find();
    res.json({ success: true, count: responders.length, responders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const responder = await Responder.findByIdAndUpdate(id, req.body, { new: true });
    req.io?.emit('responder:status_changed', responder);
    res.json({ success: true, responder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Shelters & Safe Zones ---
export const getShelters = async (req, res) => {
  try {
    const shelters = await Shelter.find();
    res.json({ success: true, count: shelters.length, shelters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateShelterCapacity = async (req, res) => {
  try {
    const { id } = req.params;
    const { occupied, supplies, status } = req.body;
    const shelter = await Shelter.findByIdAndUpdate(
      id,
      {
        ...(occupied !== undefined && { occupied }),
        ...(supplies && { supplies }),
        ...(status && { status })
      },
      { new: true }
    );
    req.io?.emit('shelter:updated', shelter);
    res.json({ success: true, shelter });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Missing Persons ---
export const getMissingPersons = async (req, res) => {
  try {
    const { query, status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { clothingDescription: { $regex: query, $options: 'i' } },
        { 'lastSeenLocation.addressName': { $regex: query, $options: 'i' } }
      ];
    }
    const list = await MissingPerson.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, count: list.length, list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createMissingPerson = async (req, res) => {
  try {
    const person = new MissingPerson(req.body);
    await person.save();
    req.io?.emit('missing:new_record', person);
    res.status(201).json({ success: true, person });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const addTipToMissingPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await MissingPerson.findById(id);
    if (!person) return res.status(404).json({ success: false, message: 'Record not found' });

    person.tips.push(req.body);
    if (req.body.suggestedStatus) {
      person.status = req.body.suggestedStatus;
    }
    await person.save();
    req.io?.emit('missing:updated', person);
    res.json({ success: true, person });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Communications ---
export const getChatMessages = async (req, res) => {
  try {
    const { channel = 'citizen_public' } = req.query;
    const messages = await ChatMessage.find({ channel }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const msg = new ChatMessage(req.body);
    await msg.save();
    req.io?.emit('chat:new_message', msg);
    if (msg.channel) {
      req.io?.to(msg.channel).emit('chat:new_message', msg);
    }
    res.status(201).json({ success: true, message: msg });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- AI, Routing & Prediction API Handlers ---
export const analyzeDamage = async (req, res) => {
  try {
    const analysis = await analyzeDamageImage(req.body);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const scorePriority = async (req, res) => {
  try {
    const result = scoreSOSPriority(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const calculateRoute = async (req, res) => {
  try {
    const { start, destination, mode } = req.body;
    const incidents = await Incident.find({ status: 'active' });
    const dangerZones = incidents.map((inc) => ({
      name: inc.title,
      type: inc.type,
      polygon: inc.dangerPolygon,
      center: [inc.location.lat, inc.location.lng],
      radiusMeters: inc.radiusMeters
    }));

    const result = computeSafeRoute({
      start: start || [28.6185, 77.2115],
      destination: destination || [28.5950, 77.2050],
      dangerZones,
      mode: mode || 'rescue_vehicle'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPredictionsData = async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 28.6185;
    const lng = req.query.lng ? parseFloat(req.query.lng) : 77.2115;
    const predictions = await getDisasterPredictions({ lat, lng });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const runMeshSimulation = async (req, res) => {
  try {
    const simulation = simulateMeshPacketRelay(req.body);
    req.io?.emit('mesh:packet_relayed', simulation);
    res.json(simulation);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const broadcastEmergencyAlert = async (req, res) => {
  try {
    const alertData = {
      ...req.body,
      broadcastId: `ALERT-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    req.io?.emit('alert:emergency_broadcast', alertData);
    res.json({ success: true, alert: alertData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
