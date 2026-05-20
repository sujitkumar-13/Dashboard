import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/auth/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ROLES } from './store/authStore';
import { useSlotStore } from './store/slotStore';
import { useRequestStore } from './store/requestStore';
import { io } from 'socket.io-client';

// Placeholders for other pages
const BookingPage = React.lazy(() => import('./pages/candidate/BookingPage').catch(() => ({ default: () => <div>Loading...</div> })));
const InterviewerDashboard = React.lazy(() => import('./pages/interviewer/InterviewerDashboard').catch(() => ({ default: () => <div>Loading...</div> })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').catch(() => ({ default: () => <div>Loading...</div> })));

function App() {
  React.useEffect(() => {
    useSlotStore.getState().fetchSlots();
    useRequestStore.getState().fetchRequests();

    const socket = io('http://localhost:5000');
    
    socket.on('slot_updated', () => {
      useSlotStore.getState().fetchSlots();
    });
    
    socket.on('request_updated', () => {
      useRequestStore.getState().fetchRequests();
    });

    return () => socket.disconnect();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        <Toaster position="top-right" />
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Candidate Routes */}
            <Route element={<DashboardLayout allowedRoles={[ROLES.CANDIDATE]} />}>
              <Route path="/candidate/book" element={<BookingPage />} />
            </Route>

            {/* Interviewer Routes */}
            <Route element={<DashboardLayout allowedRoles={[ROLES.INTERVIEWER]} />}>
              <Route path="/interviewer/slots" element={<InterviewerDashboard />} />
              <Route path="/interviewer/settings" element={<div className="p-4">Settings Placeholder</div>} />
            </Route>

            {/* Admin Routes */}
            <Route element={<DashboardLayout allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/requests" element={<div className="p-4">All Requests Placeholder</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </React.Suspense>
      </div>
    </Router>
  );
}

export default App;
