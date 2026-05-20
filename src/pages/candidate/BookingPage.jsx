import React, { useState } from 'react';
import { useSlotStore } from '../../store/slotStore';
import { useRequestStore, STUDENT_STATUS } from '../../store/requestStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { format, parseISO, isFuture } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const user = useAuthStore(state => state.user);
  const slots = useSlotStore(state => state.slots);
  const requests = useRequestStore(state => state.requests);
  const addRequest = useRequestStore(state => state.addRequest);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter logic: Only future, available slots that haven't reached 3 requests
  const availableSlots = slots.filter(slot => {
    const isAvail = slot.status === 'Available';
    const isFut = isFuture(parseISO(slot.date));
    const matchDate = selectedDate ? slot.date.startsWith(selectedDate) : true;
    
    // Count active requests for this slot
    const slotRequestsCount = requests.filter(r => r.slotId === slot.id && r.reqStatus !== 'Rejected').length;
    
    return isAvail && isFut && matchDate && slotRequestsCount < 3;
  });

  const activeRequest = requests.find(r => r.candidateEmail === user.email && r.reqStatus !== 'Rejected');
  const bookedSlot = activeRequest?.slotId ? slots.find(s => s.id === activeRequest.slotId) : null;

  const handleBookClick = (slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedSlot) return;

    addRequest({
      id: Math.random().toString(36).substr(2, 9),
      candidateId: user.id,
      candidateName: user.name,
      candidateEmail: user.email,
      slotId: selectedSlot.id,
      studentStatus: STUDENT_STATUS.PENDING,
      reqStatus: 'Pending Approval',
    });

    toast.success('Your request has been sent to the team/admin. You will receive a response shortly.', { duration: 5000 });
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book an Interview</h1>
          <p className="text-gray-500 mt-1">Select an available slot below to schedule your interview.</p>
        </div>
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {activeRequest ? (
        activeRequest.reqStatus === 'Approved' || activeRequest.reqStatus === 'Resolved' ? (
          <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-green-200 bg-green-50">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 Interview Successfully Scheduled!</h3>
            <p className="text-gray-600 mb-6">Your interview has been finalized. Please be available at the following time:</p>
            
            {bookedSlot && (
              <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm w-full max-w-md text-left space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date</div>
                    <div className="font-semibold text-gray-900">{format(parseISO(bookedSlot.date), 'MMMM d, yyyy')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Time</div>
                    <div className="font-semibold text-gray-900">{format(parseISO(bookedSlot.date), 'h:mm a')} - {format(parseISO(bookedSlot.endDate), 'h:mm a')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interviewer</div>
                    <div className="font-semibold text-gray-900">{bookedSlot.interviewerName}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-orange-200 bg-orange-50">
            <div className="bg-orange-100 p-4 rounded-full mb-4">
              <User className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Request Pending</h3>
            <p className="text-gray-500 mt-1">You already have an active interview request. Waiting for admin approval.</p>
          </Card>
        )
      ) : availableSlots.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <CalendarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No slots available</h3>
          <p className="text-gray-500 mt-1">Check back later or try selecting a different date.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSlots.map(slot => {
            const slotReqCount = requests.filter(r => r.slotId === slot.id && r.reqStatus !== 'Rejected').length;
            
            return (
              <Card key={slot.id} className="p-5 hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <Badge status={slot.status} />
                    {slotReqCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        {slotReqCount}/3 Requested 🔥
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              <div className="space-y-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {format(parseISO(slot.date), 'MMMM d, yyyy')}
                  </div>
                  <div className="text-blue-600 font-medium">
                    {format(parseISO(slot.date), 'h:mm a')} - {format(parseISO(slot.endDate), 'h:mm a')}
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 gap-2">
                  <User className="w-4 h-4" />
                  <span>{slot.interviewerName}</span>
                </div>
                  <Button 
                    className="w-full mt-2" 
                    onClick={() => handleBookClick(slot)}
                  >
                    Select Slot
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Booking"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            You are about to request the following interview slot:
          </p>
          {selectedSlot && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium text-gray-900">{format(parseISO(selectedSlot.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-medium text-gray-900">
                  {format(parseISO(selectedSlot.date), 'h:mm a')} - {format(parseISO(selectedSlot.endDate), 'h:mm a')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Interviewer:</span>
                <span className="font-medium text-gray-900">{selectedSlot.interviewerName}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmBooking}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
