import express from 'express';
import {
  getIncidents,
  createIncident,
  getSOSBeacons,
  triggerSOS,
  updateSOSStatus,
  getResponders,
  updateResponder,
  getShelters,
  updateShelterCapacity,
  getMissingPersons,
  createMissingPerson,
  addTipToMissingPerson,
  getChatMessages,
  sendChatMessage,
  analyzeDamage,
  scorePriority,
  calculateRoute,
  getPredictionsData,
  runMeshSimulation,
  broadcastEmergencyAlert
} from '../controllers/disasterController.js';

import {
  registerUser,
  loginUser,
  getMe,
  getAllUsers
} from '../controllers/authController.js';

import {
  getTasks,
  getTaskById,
  createTask,
  assignTask,
  updateTaskStatus,
  autoDispatchAllTasks,
  evaluateTaskCandidates,
  autoAssignTaskById
} from '../controllers/taskController.js';

import {
  uploadSingleImage,
  uploadMultipleImages
} from '../controllers/uploadController.js';

import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// --- Auth Routes (Role-based: admin, rescuer, user) ---
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/me', protect, getMe);
router.get('/auth/users', protect, authorize('admin'), getAllUsers);

// --- Task Management & Automated Dispatch ---
router.get('/tasks', getTasks);
router.get('/tasks/:id', getTaskById);
router.post('/tasks', protect, authorize('admin', 'rescuer'), createTask);
router.post('/tasks/:id/evaluate-candidates', evaluateTaskCandidates);
router.post('/tasks/:id/auto-assign', protect, authorize('admin', 'rescuer'), autoAssignTaskById);
router.patch('/tasks/:id/assign', protect, authorize('admin', 'rescuer'), assignTask);
router.patch('/tasks/:id/status', protect, updateTaskStatus);
router.post('/tasks/auto-dispatch', protect, authorize('admin', 'rescuer'), autoDispatchAllTasks);

// --- Image Upload System ---
router.post('/upload/single', upload.single('image'), uploadSingleImage);
router.post('/upload/multiple', upload.array('images', 8), uploadMultipleImages);

// --- Incidents & Map ---
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);

// --- SOS Beacons & Triage ---
router.get('/sos', getSOSBeacons);
router.post('/sos', triggerSOS);
router.patch('/sos/:id', updateSOSStatus);

// --- First Responders & Dispatch ---
router.get('/responders', getResponders);
router.patch('/responders/:id', updateResponder);

// --- Shelters & Safe Zones ---
router.get('/shelters', getShelters);
router.patch('/shelters/:id', updateShelterCapacity);

// --- Missing Persons ---
router.get('/missing', getMissingPersons);
router.post('/missing', createMissingPerson);
router.post('/missing/:id/tips', addTipToMissingPerson);

// --- Communication & Chat ---
router.get('/chat', getChatMessages);
router.post('/chat', sendChatMessage);

// --- Advanced AI Engine Endpoints ---
router.post('/ai/damage-analysis', analyzeDamage);
router.post('/ai/score-priority', scorePriority);
router.post('/routing/calculate', calculateRoute);
router.get('/prediction/forecast', getPredictionsData);
router.post('/mesh/simulate', runMeshSimulation);
router.post('/alert/broadcast', broadcastEmergencyAlert);

export default router;
