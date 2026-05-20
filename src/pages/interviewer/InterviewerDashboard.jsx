import React, { useState } from 'react';
import { useSlotStore } from '../../store/slotStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { Trash2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InterviewerDashboard() {
  const user = useAuthStore(state => state.user);
  const slots = useSlotStore(state => state.slots.filter(s => s.interviewerId === user.id));
  const addSlot = useSlotStore(state => state.addSlot);
  const deleteSlot = useSlotStore(state => state.deleteSlot);

  const [dateStr, setDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!dateStr || !startTimeStr || !endTimeStr) {
      toast.error('Please select date, start time, and end time.');
      return;
    }

    const startDateTimeStr = `${dateStr}T${startTimeStr}:00`;
    const endDateTimeStr = `${dateStr}T${endTimeStr}:00`;
    const slotStartDate = new Date(startDateTimeStr);
    const slotEndDate = new Date(endDateTimeStr);

    if (isPast(slotStartDate)) {
      toast.error('Cannot create slots for past dates/times.');
      return;
    }
    
    if (slotEndDate <= slotStartDate) {
      toast.error('End time must be after start time.');
      return;
    }

    // Check for duplicates
    const isDuplicate = slots.some(s => s.date === slotStartDate.toISOString());
    if (isDuplicate) {
      toast.error('You already have a slot starting at this time.');
      return;
    }

    addSlot({
      id: Math.random().toString(36).substr(2, 9),
      interviewerId: user.id,
      interviewerName: user.name,
      date: slotStartDate.toISOString(),
      endDate: slotEndDate.toISOString(),
      status: 'Available'
    });

    toast.success('Slot added successfully!');
    setDateStr('');
    setStartTimeStr('');
    setEndTimeStr('');
  };

  const handleDelete = (id, status) => {
    if (status === 'Booked') {
      toast.error('Cannot delete a booked slot.');
      return;
    }
    deleteSlot(id);
    toast.success('Slot deleted.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Interview Slots</h1>
        <p className="text-gray-500 mt-1">Manage your availability for upcoming candidate interviews.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add New Slot
            </h2>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <Input
                label="Date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Start Time"
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full mt-2">Create Slot</Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {slots.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No slots created yet</h3>
                <p className="text-gray-500 mt-1 max-w-sm">Use the form on the left to add your available time slots for candidates.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {slots.sort((a, b) => new Date(a.date) - new Date(b.date)).map((slot) => (
                      <tr key={slot.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {format(parseISO(slot.date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(parseISO(slot.date), 'h:mm a')} - {format(parseISO(slot.endDate), 'h:mm a')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge status={slot.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(slot.id, slot.status)}
                            disabled={slot.status === 'Booked'}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
