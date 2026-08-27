import { Task } from '../../database/schemas/Task.js';
import { User } from '../../database/schemas/User.js';
import { Responder } from '../../database/schemas/Responder.js';
import { SOSBeacon } from '../../database/schemas/SOSBeacon.js';
import {
  evaluateCandidatesForTask,
  autoAssignSingleTask,
  autoAssignAllTasks as runAutoAssignAllTasks,
  scoreCandidateForTask
} from '../../services/autoDispatchService.js';

/**
 * @desc    Get all rescue tasks with optional filters
 * @route   GET /api/tasks
 * @access  Public / Protected
 */
export const getTasks = async (req, res) => {
  try {
    const { status, priority, category, assignedTo } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email callsign specialties phone status')
      .populate('sosBeaconId')
      .populate('incidentId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Public / Protected
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email callsign specialties phone status')
      .populate('sosBeaconId')
      .populate('incidentId');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Create a new rescue task
 * @route   POST /api/tasks
 * @access  Protected (Admin or Rescuer)
 */
export const createTask = async (req, res) => {
  try {
    const taskId = req.body.taskId || `TASK-${Date.now().toString().slice(-6)}`;
    const task = new Task({
      ...req.body,
      taskId,
    });

    await task.save();

    req.io?.emit('task:created', task);

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Evaluate and score candidate responders for a task (Distance, Severity, Availability, Skills)
 * @route   POST /api/tasks/:id/evaluate-candidates
 * @access  Public / Protected
 */
export const evaluateTaskCandidates = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const rankedCandidates = await evaluateCandidatesForTask(task);
    res.json({
      success: true,
      taskId: task.taskId,
      candidateCount: rankedCandidates.length,
      candidates: rankedCandidates,
    });
  } catch (error) {
    console.error('evaluateTaskCandidates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Auto-Assign nearest optimal responder to a single task
 * @route   POST /api/tasks/:id/auto-assign
 * @access  Protected (Admin or Rescuer)
 */
export const autoAssignTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const assignment = await autoAssignSingleTask(task);

    if (assignment.assigned) {
      req.io?.emit('task:assigned', assignment);
    }

    res.json(assignment);
  } catch (error) {
    console.error('autoAssignTaskById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Manual Assign task to rescuer
 * @route   PATCH /api/tasks/:id/assign
 * @access  Protected (Admin or Rescuer)
 */
export const assignTask = async (req, res) => {
  try {
    const { userId, callsign } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    task.assignedTo = userId || task.assignedTo;
    task.assignedResponderCallsign = callsign || task.assignedResponderCallsign;
    task.status = 'assigned';
    task.assignedAt = new Date();

    if (req.body.note) {
      task.notes.push({
        author: req.user ? req.user.name : 'Incident Commander',
        text: req.body.note,
      });
    }

    await task.save();

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { assignedTasks: task._id },
        status: 'busy',
      });
    }

    req.io?.emit('task:assigned', { task, assignedTo: userId, callsign });

    res.json({ success: true, task });
  } catch (error) {
    console.error('assignTask error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update task status (in_progress, completed, cancelled)
 * @route   PATCH /api/tasks/:id/status
 * @access  Protected
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    task.status = status || task.status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    if (note) {
      task.notes.push({
        author: req.user ? req.user.name : 'First Responder',
        text: note,
      });
    }

    await task.save();

    req.io?.emit('task:status_changed', { taskId: task.taskId, status, task });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Auto-Assign all pending rescue tasks across the entire sector
 * @route   POST /api/tasks/auto-dispatch
 * @access  Protected (Admin/Commander)
 */
export const autoDispatchAllTasks = async (req, res) => {
  try {
    const result = await runAutoAssignAllTasks();

    if (result.success && result.assignments?.length > 0) {
      for (const item of result.assignments) {
        req.io?.emit('task:assigned', item);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('autoDispatchAllTasks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
