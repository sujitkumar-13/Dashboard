import { create } from 'zustand';
import { useSlotStore } from './slotStore';

export const STUDENT_STATUS = {
  PENDING: 'Pending',
  NOT_RESPONDING: 'Not Responding',
  DISINTERESTED: 'Disinterested',
  CALL_BACK: 'Call Back',
  SCHEDULED: 'Scheduled',
  UNREACHABLE: 'Unreachable'
};

const API_URL = 'http://localhost:5000/api/requests';

export const useRequestStore = create((set, get) => ({
  requests: [],
  isLoading: false,
  
  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      set({ requests: data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  addRequest: async (request) => {
    try {
      // Optimistically update the slot in frontend immediately for better UX
      useSlotStore.getState().updateSlotStatus(request.slotId, 'Booked');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!response.ok) throw new Error('Failed to add request');
      const newRequest = await response.json();
      
      set((state) => ({ requests: [...state.requests, newRequest] }));
    } catch (error) {
      console.error(error);
      // Revert optimism if failed?
    }
  },
  
  updateStudentStatus: async (reqId, newStudentStatus) => {
    try {
      const response = await fetch(`${API_URL}/${reqId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentStatus: newStudentStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
      const updatedReq = await response.json();

      set((state) => ({
        requests: state.requests.map(req => req.id === reqId ? updatedReq : req)
      }));
      
      // Refresh slots since backend updated it
      useSlotStore.getState().fetchSlots();
      
    } catch (error) {
      console.error(error);
    }
  },

  approveRequest: async (reqId) => {
    try {
      const response = await fetch(`${API_URL}/${reqId}/approve`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to approve');
      const updatedReq = await response.json();
      set((state) => ({
        requests: state.requests.map(req => req.id === reqId ? updatedReq : req)
      }));
    } catch (error) {
      console.error(error);
    }
  },

  rejectRequest: async (reqId) => {
    try {
      const response = await fetch(`${API_URL}/${reqId}/reject`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to reject');
      const updatedReq = await response.json();
      set((state) => ({
        requests: state.requests.map(req => req.id === reqId ? updatedReq : req)
      }));
      
      // Refresh slots because rejected request frees the slot
      useSlotStore.getState().fetchSlots();
    } catch (error) {
      console.error(error);
    }
  },

  adminAssignSlot: async (reqId, slotId) => {
    try {
      const response = await fetch(`${API_URL}/${reqId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId })
      });
      if (!response.ok) throw new Error('Failed to assign slot');
      const updatedReq = await response.json();
      
      set((state) => ({
        requests: state.requests.map(r => r.id === reqId ? updatedReq : r)
      }));

      // Refresh slots
      useSlotStore.getState().fetchSlots();
    } catch (error) {
      console.error(error);
    }
  }
}));
