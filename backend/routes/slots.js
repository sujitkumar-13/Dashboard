const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');

// Get all slots
router.get('/', async (req, res) => {
  try {
    const slots = await Slot.find();
    // Maps _id to id for frontend compatibility
    res.json(slots.map(s => ({ ...s.toObject(), id: s._id.toString() })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a slot
router.post('/', async (req, res) => {
  const slot = new Slot({
    interviewerId: req.body.interviewerId,
    interviewerName: req.body.interviewerName,
    date: req.body.date,
    endDate: req.body.endDate,
    status: req.body.status
  });

  try {
    const newSlot = await slot.save();
    req.app.get('io').emit('slot_updated');
    res.status(201).json({ ...newSlot.toObject(), id: newSlot._id.toString() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a slot
router.delete('/:id', async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (slot == null) {
      return res.status(404).json({ message: 'Cannot find slot' });
    }
    if (slot.status === 'Booked') {
      return res.status(400).json({ message: 'Cannot delete a booked slot' });
    }
    await slot.deleteOne();
    req.app.get('io').emit('slot_updated');
    res.json({ message: 'Deleted Slot' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
