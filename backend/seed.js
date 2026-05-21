const mongoose = require('mongoose');

// Apne Local MongoDB Database ka URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview-scheduler';

// Schemas define karein directly script ke andar (bina kisi external file ke dependencies ke)
const SlotSchema = new mongoose.Schema({
  interviewerId: String,
  interviewerName: String,
  date: Date,
  endDate: Date,
  status: { type: String, default: 'Available' }
});

const RequestSchema = new mongoose.Schema({
  candidateId: String,
  candidateName: String,
  candidateEmail: String,
  slotId: mongoose.Schema.Types.ObjectId,
  studentStatus: { type: String, default: 'Pending' },
  reqStatus: { type: String, default: 'Pending Approval' }
});

const Slot = mongoose.model('Slot', SlotSchema);
const Request = mongoose.model('Request', RequestSchema);

async function bulkSeed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully!');

    // 1. Purane records ko clean karein (Optional, taki fresh test kar sakein)
    await Slot.deleteMany({});
    await Request.deleteMany({});
    console.log('Purana data database se delete kar diya hai...');

    // Interviewers and Candidates ke realistic random names
    const interviewers = ['Amit Sharma', 'Priya Patel', 'Rohan Verma', 'Sanjay Dutt', 'Neha Kakkar'];
    const candidates = [
      'Rahul Kumar', 'Sneha Gupta', 'Vikram Singh', 'Ananya Roy', 'Rajesh Patel',
      'Pooja Sharma', 'Deepak Verma', 'Kriti Sen', 'Manish Malhotra', 'Ritu Raj',
      'Vijay Dinanth', 'Sunita Rao', 'Arjun Kapoor', 'Preeti Zinta', 'Siddharth'
    ];

    // 2. 20 Dummy Slots generate karein (Strictly in the FUTURE date and time)
    const slotDocs = [];
    for (let i = 1; i <= 20; i++) {
      const interviewer = interviewers[Math.floor(Math.random() * interviewers.length)];

      const date = new Date();
      // Date hamesha future mein hogi (Current date + 1 to 5 days in the future)
      const daysToAdd = Math.floor(Math.random() * 5) + 1;
      date.setDate(date.getDate() + daysToAdd);

      // Time ko clean future slots ke liye set karein (e.g. 10:00 AM, 11:00 AM, etc.)
      date.setHours(10 + (i % 6), 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(date.getHours() + 1); // 1 hour duration

      slotDocs.push({
        interviewerId: `int_${100 + i}`,
        interviewerName: interviewer,
        date: date,
        endDate: endDate,
        status: 'Available'
      });
    }

    const savedSlots = await Slot.insertMany(slotDocs);
    console.log(`✅ Success: ${savedSlots.length} Future Slots add ho chuke hain!`);

    // 3. 50+ Dummy Candidates Requests generate karein
    const requestDocs = [];
    for (let i = 1; i <= 60; i++) {
      const randomSlot = savedSlots[Math.floor(Math.random() * savedSlots.length)];
      const baseName = candidates[Math.floor(Math.random() * candidates.length)];

      // Ensure karein ki kisi single slot pe max limit (3 requests) se zyada na ho
      const slotReqCount = requestDocs.filter(r => r.slotId === randomSlot._id).length;
      if (slotReqCount >= 3) continue;

      requestDocs.push({
        candidateId: `cand_${1000 + i}`,
        candidateName: `${baseName} (ID: ${i})`,
        candidateEmail: `candidate${i}@example.com`,
        slotId: randomSlot._id,
        studentStatus: 'Pending',
        reqStatus: 'Pending Approval'
      });
    }

    const savedRequests = await Request.insertMany(requestDocs);
    console.log(`✅ Success: ${savedRequests.length} Candidate requests add ho chuke hain!`);

    console.log('\n🎉 Seeding complete! Ab aap server start karke website check kijiye.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

bulkSeed();
