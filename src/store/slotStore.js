import { create } from 'zustand';

const API_URL = 'http://localhost:5000/api/slots';

export const useSlotStore = create((set, get) => ({
  slots: [],
  isLoading: false,
  error: null,
  
  fetchSlots: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch slots');
      const data = await response.json();
      set({ slots: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addSlot: async (slot) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slot)
      });
      if (!response.ok) throw new Error('Failed to add slot');
      const newSlot = await response.json();
      set((state) => ({ slots: [...state.slots, newSlot] }));
    } catch (error) {
      console.error(error);
    }
  },

  deleteSlot: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete slot');
      set((state) => ({ slots: state.slots.filter(s => s.id !== id) }));
    } catch (error) {
      console.error(error);
    }
  },

  updateSlotStatus: (id, status) => set((state) => ({
    slots: state.slots.map(s => s.id === id ? { ...s, status } : s)
  }))
}));
