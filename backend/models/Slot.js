const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  interviewerId: { type: String, required: true },
  interviewerName: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, default: 'Available', enum: ['Available', 'Booked'] }
}, { timestamps: true });

module.exports = mongoose.model('Slot', slotSchema);
