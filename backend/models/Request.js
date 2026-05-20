const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  studentStatus: { type: String, default: 'Pending' },
  reqStatus: { type: String, default: 'Pending Approval' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
