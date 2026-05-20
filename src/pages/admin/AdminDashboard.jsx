import React, { useState } from 'react';
import { useRequestStore, STUDENT_STATUS } from '../../store/requestStore';
import { useSlotStore } from '../../store/slotStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import { Users, CheckCircle2, Clock, Calendar as CalendarIcon, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const requests = useRequestStore(state => state.requests);
  const slots = useSlotStore(state => state.slots);
  const { updateStudentStatus, approveRequest, rejectRequest, adminAssignSlot } = useRequestStore(state => state);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState('All');

  const interviewers = ['All', ...new Set(slots.map(s => s.interviewerName).filter(Boolean))];

  const filteredRequests = requests.filter(req => {
    if (selectedInterviewer === 'All') return true;
    const reqSlot = slots.find(s => s.id === req.slotId);
    return reqSlot && reqSlot.interviewerName === selectedInterviewer;
  });

  const availableSlots = slots.filter(s => s.status === 'Available');

  const handleStatusChange = (reqId, e) => {
    const newStatus = e.target.value;
    updateStudentStatus(reqId, newStatus);
    toast.success(`Status mapped successfully!`);
  };

  const handleApprove = (reqId) => {
    approveRequest(reqId);
    toast.success('Request approved.');
  };

  const handleReject = (reqId) => {
    rejectRequest(reqId);
    toast.success('Request rejected. Slot is now available.');
  };

  const openAssignModal = (reqId) => {
    setSelectedReqId(reqId);
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = (slotId) => {
    if (!selectedReqId) return;
    adminAssignSlot(selectedReqId, slotId);
    toast.success('Slot successfully assigned to candidate!');
    setAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduler Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage booking requests and candidate statuses.</p>
        </div>
        <div>
          <select 
            className="block w-full sm:w-48 pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg border bg-white shadow-sm cursor-pointer"
            value={selectedInterviewer}
            onChange={(e) => setSelectedInterviewer(e.target.value)}
          >
            {interviewers.map(name => (
              <option key={name} value={name}>{name === 'All' ? 'All Interviewers' : name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-white to-blue-50/50">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Requests</div>
            <div className="text-2xl font-bold text-gray-900">{filteredRequests.length}</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-white to-green-50/50">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Approved</div>
            <div className="text-2xl font-bold text-gray-900">{filteredRequests.filter(r => r.reqStatus === 'Approved' || r.reqStatus === 'Resolved').length}</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-white to-orange-50/50">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredRequests.filter(r =>
                r.reqStatus === 'Pending Approval' ||
                (r.reqStatus === 'Rejected' && r.studentStatus === 'Pending')
              ).length}
            </div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-white to-yellow-50/50">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl"><Archive className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Parked</div>
            <div className="text-2xl font-bold text-gray-900">{filteredRequests.filter(r => r.reqStatus === 'Parked').length}</div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Req / Slot Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map(req => {
                const reqSlot = slots.find(s => s.id === req.slotId);
                return (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{req.candidateName}</div>
                      <div className="text-sm text-gray-500">{req.candidateEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reqSlot ? (
                        <>
                          <div className="text-sm text-gray-900">{format(parseISO(reqSlot.date), 'MMM d, yyyy')}</div>
                          <div className="text-sm text-blue-600 font-medium">{format(parseISO(reqSlot.date), 'h:mm a')} - {format(parseISO(reqSlot.endDate), 'h:mm a')}</div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No slot assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req.studentStatus === 'Scheduled' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            🔒 Scheduled
                          </span>
                        </div>
                      ) : (
                        <select
                          className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
                          value={req.studentStatus}
                          onChange={(e) => handleStatusChange(req.id, e)}
                        >
                          {Object.values(STUDENT_STATUS).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2 flex flex-col items-start">
                        <Badge status={req.reqStatus}>Req: {req.reqStatus}</Badge>
                        {reqSlot && req.reqStatus !== 'Rejected' && (
                          <Badge status={reqSlot.status}>Slot: {reqSlot.status}</Badge>
                        )}
                        {req.reqStatus === 'Rejected' && (
                          <Badge status="Released">Slot: Released</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {req.reqStatus === 'Pending Approval' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => handleApprove(req.id)}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(req.id)}>Reject</Button>
                        </>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openAssignModal(req.id)}
                        disabled={req.studentStatus === 'Disinterested' || req.reqStatus === 'Resolved'}
                      >
                        Assign Slot
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Manual Slot Booking">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select an available slot to assign to this candidate.</p>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {availableSlots.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">No available slots.</div>
            ) : (
              availableSlots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 bg-white">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{format(parseISO(slot.date), 'MMM d, yyyy')} | {format(parseISO(slot.date), 'h:mm a')} - {format(parseISO(slot.endDate), 'h:mm a')}</div>
                    <div className="text-xs text-gray-500">Interviewer: {slot.interviewerName}</div>
                  </div>
                  <Button size="sm" onClick={() => handleAssignConfirm(slot.id)}>Assign</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
