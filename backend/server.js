require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

// Connect to local MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview-scheduler')
.then(() => console.log('Connected to local MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
const slotsRouter = require('./routes/slots');
const requestsRouter = require('./routes/requests');

app.use('/api/slots', slotsRouter);
app.use('/api/requests', requestsRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
