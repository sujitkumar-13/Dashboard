const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Slot = require('../models/Slot');

// Helper to auto-reject competing requests
async function autoRejectOthers(slotId, approvedRequestId) {
  if (!slotId) return;
  await Request.updateMany(
    { slotId: slotId, _id: { $ne: approvedRequestId }, reqStatus: { $ne: 'Rejected' } },
    { $set: { reqStatus: 'Rejected', studentStatus: 'Pending' } }
  );
}

// Get all requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests.map(r => ({ ...r.toObject(), id: r._id.toString(), slotId: r.slotId?.toString() })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a request (Candidate books slot)
router.post('/', async (req, res) => {
  try {
    // Check if slot already has 3 active requests
    const activeCount = await Request.countDocuments({
      slotId: req.body.slotId,
      reqStatus: { $ne: 'Rejected' }
    });

    if (activeCount >= 3) {
      return res.status(400).json({ message: 'Maximum 3 requests allowed for this slot.' });
    }

    const request = new Request({
      candidateId: req.body.candidateId,
      candidateName: req.body.candidateName,
      candidateEmail: req.body.candidateEmail,
      slotId: req.body.slotId,
      studentStatus: req.body.studentStatus,
      reqStatus: req.body.reqStatus
    });

    const newRequest = await request.save();
    req.app.get('io').emit('slot_updated');
    req.app.get('io').emit('request_updated');
    res.status(201).json({ ...newRequest.toObject(), id: newRequest._id.toString(), slotId: newRequest.slotId?.toString() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update student status (Admin updates status, trigger logic)
router.patch('/:id/status', async (req, res) => {
  const { studentStatus } = req.body;
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    let newReqStatus = request.reqStatus;
    let newSlotStatus = 'Booked';

    switch (studentStatus) {
      case 'Not Responding':
        newReqStatus = 'Parked';
        newSlotStatus = 'Available';
        break;
      case 'Disinterested':
        newReqStatus = 'Rejected';
        newSlotStatus = 'Available';
        break;
      case 'Call Back':
        newReqStatus = 'Parked';
        newSlotStatus = 'Available';
        break;
      case 'Scheduled':
        newReqStatus = 'Resolved';
        newSlotStatus = 'Booked';
        break;
      case 'Unreachable':
        newReqStatus = 'Rejected';
        newSlotStatus = 'Available';
        break;
      default:
        newReqStatus = request.reqStatus;
    }

    request.studentStatus = studentStatus;
    request.reqStatus = newReqStatus;
    const updatedRequest = await request.save();

    if (request.slotId) {
      if (newSlotStatus === 'Available') {
        const activeBookingsCount = await Request.countDocuments({
          slotId: request.slotId,
          reqStatus: { $in: ['Resolved', 'Approved'] },
          _id: { $ne: updatedRequest._id }
        });
        if (activeBookingsCount === 0) {
          await Slot.findByIdAndUpdate(request.slotId, { status: 'Available' });
        }
      } else {
        await Slot.findByIdAndUpdate(request.slotId, { status: newSlotStatus });
        if (newSlotStatus === 'Booked') {
          await autoRejectOthers(request.slotId, updatedRequest._id);
        }
      }
      req.app.get('io').emit('slot_updated');
    }

    req.app.get('io').emit('request_updated');
    res.json({ ...updatedRequest.toObject(), id: updatedRequest._id.toString(), slotId: updatedRequest.slotId?.toString() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Approve Request
router.patch('/:id/approve', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.studentStatus = 'Scheduled';
    request.reqStatus = 'Resolved';
    const updatedRequest = await request.save();
    
    if (request.slotId) {
      await Slot.findByIdAndUpdate(request.slotId, { status: 'Booked' });
      await autoRejectOthers(request.slotId, updatedRequest._id);
      req.app.get('io').emit('slot_updated');
    }
    
    req.app.get('io').emit('request_updated');
    res.json({ ...updatedRequest.toObject(), id: updatedRequest._id.toString(), slotId: updatedRequest.slotId?.toString() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Reject Request
router.patch('/:id/reject', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.reqStatus = 'Rejected';
    request.studentStatus = 'Pending';
    const updatedRequest = await request.save();

    if (request.slotId) {
      const activeBookingsCount = await Request.countDocuments({
        slotId: request.slotId,
        reqStatus: { $in: ['Resolved', 'Approved'] },
        _id: { $ne: updatedRequest._id }
      });
      if (activeBookingsCount === 0) {
        await Slot.findByIdAndUpdate(request.slotId, { status: 'Available' });
      }
      req.app.get('io').emit('slot_updated');
    }

    req.app.get('io').emit('request_updated');
    res.json({ ...updatedRequest.toObject(), id: updatedRequest._id.toString(), slotId: updatedRequest.slotId?.toString() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin assign slot manually
router.patch('/:id/assign', async (req, res) => {
  const { slotId } = req.body;
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Free old slot if exists and has no other active bookings
    if (request.slotId && request.slotId.toString() !== slotId) {
      const activeBookingsCount = await Request.countDocuments({
        slotId: request.slotId,
        reqStatus: { $in: ['Resolved', 'Approved'] },
        _id: { $ne: request._id }
      });
      if (activeBookingsCount === 0) {
        await Slot.findByIdAndUpdate(request.slotId, { status: 'Available' });
      }
    }

    // Book new slot
    await Slot.findByIdAndUpdate(slotId, { status: 'Booked' });
    await autoRejectOthers(slotId, request._id);

    request.slotId = slotId;
    request.studentStatus = 'Scheduled';
    request.reqStatus = 'Resolved';
    const updatedRequest = await request.save();

    req.app.get('io').emit('slot_updated');
    req.app.get('io').emit('request_updated');
    res.json({ ...updatedRequest.toObject(), id: updatedRequest._id.toString(), slotId: updatedRequest.slotId?.toString() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
