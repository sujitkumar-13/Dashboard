import React, { useState } from 'react';
import { useRequestStore, STUDENT_STATUS } from '../../store/requestStore';
import { useSlotStore } from '../../store/slotStore';
import { useAuthStore } from '../../store/authStore';
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
  const user = useAuthStore(state => state.user);
  const schedulerName = user?.name || 'Unknown Scheduler';

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [modalMode, setModalMode] = useState('assign'); // 'assign' | 'schedule'
  const [selectedInterviewer, setSelectedInterviewer] = useState('All');
  const [filterStudentStatus, setFilterStudentStatus] = useState('All');
  const [filterReqStatus, setFilterReqStatus] = useState('All');
  const [filterSlotStatus, setFilterSlotStatus] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');

  const interviewers = ['All', ...new Set(slots.map(s => s.interviewerName).filter(Boolean))];

  const filteredRequests = requests.filter(req => {
    // 1. Interviewer filter
    if (selectedInterviewer !== 'All') {
      const reqSlot = slots.find(s => s.id === req.slotId);
      if (!reqSlot || reqSlot.interviewerName !== selectedInterviewer) return false;
    }

    // 2. Student Status filter
    if (filterStudentStatus !== 'All' && req.studentStatus !== filterStudentStatus) return false;

    // 3. Request Status filter
    if (filterReqStatus !== 'All' && req.reqStatus !== filterReqStatus) return false;

    // 4. Slot Status filter
    const reqSlotForStatus = slots.find(s => s.id === req.slotId);
    if (filterSlotStatus !== 'All') {
      let currentSlotStatus = '—';
      if (reqSlotForStatus) {
        currentSlotStatus = reqSlotForStatus.status;
      }
      if (currentSlotStatus !== filterSlotStatus) return false;
    }

    // 5. Date Range Filter
    if (filterDateFrom || filterDateTo) {
      if (!reqSlotForStatus) return false; // If no slot, it doesn't have a date
      const slotDate = new Date(reqSlotForStatus.date);
      // Reset time for proper date comparison
      slotDate.setHours(0, 0, 0, 0);

      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (slotDate < fromDate) return false;
      }

      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(0, 0, 0, 0);
        if (slotDate > toDate) return false;
      }
    }

    // 6. Time Range Filter
    if (filterTimeFrom || filterTimeTo) {
      if (!reqSlotForStatus) return false; // If no slot, it doesn't have a time
      const slotDate = new Date(reqSlotForStatus.date);
      const slotMinutes = slotDate.getHours() * 60 + slotDate.getMinutes();

      if (filterTimeFrom) {
        const [fromHours, fromMinutes] = filterTimeFrom.split(':').map(Number);
        const fromTimeMinutes = fromHours * 60 + fromMinutes;
        if (slotMinutes < fromTimeMinutes) return false;
      }

      if (filterTimeTo) {
        const [toHours, toMinutes] = filterTimeTo.split(':').map(Number);
        const toTimeMinutes = toHours * 60 + toMinutes;
        if (slotMinutes > toTimeMinutes) return false;
      }
    }

    return true;
  });

  const availableSlots = slots.filter(s => s.status === 'Available');

  const handleStatusChange = (reqId, e) => {
    const newStatus = e.target.value;

    // If admin selects 'Scheduled', don't directly update —
    // open Assign Slot modal so admin picks a proper new slot first
    if (newStatus === 'Scheduled') {
      openAssignModal(reqId, 'schedule');
      return;
    }

    updateStudentStatus(reqId, newStatus, schedulerName);
    toast.success(`Status mapped successfully!`);
  };

  const handleApprove = (reqId) => {
    approveRequest(reqId, schedulerName);
    toast.success('Request approved.');
  };

  const handleReject = (reqId) => {
    rejectRequest(reqId, schedulerName);
    toast.success('Request rejected. Slot is now available.');
  };

  const openAssignModal = (reqId, mode = 'assign') => {
    setSelectedReqId(reqId);
    setModalMode(mode);
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = (slotId) => {
    if (!selectedReqId) return;
    adminAssignSlot(selectedReqId, slotId, schedulerName);
    const msg = modalMode === 'schedule'
      ? 'Candidate scheduled on new slot successfully!'
      : 'Slot successfully assigned to candidate!';
    toast.success(msg);
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

      {/* Filter Bar */}
      <Card className="p-4 bg-gray-50 border border-gray-100">
        <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Student Status</label>
            <select
              className="block w-full py-1.5 px-3 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
              value={filterStudentStatus}
              onChange={(e) => setFilterStudentStatus(e.target.value)}
            >
              <option value="All">All</option>
              {Object.values(STUDENT_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Req Status</label>
            <select
              className="block w-full py-1.5 px-3 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
              value={filterReqStatus}
              onChange={(e) => setFilterReqStatus(e.target.value)}
            >
              <option value="All">All</option>
              {['Pending Approval', 'Approved', 'Rejected', 'Parked', 'Resolved'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Slot Status</label>
            <select
              className="block w-full py-1.5 px-3 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
              value={filterSlotStatus}
              onChange={(e) => setFilterSlotStatus(e.target.value)}
            >
              <option value="All">All</option>
              {['Available', 'Booked'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              className="block w-full py-1.5 px-3 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              className="block w-full py-1.5 px-3 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">From Time</label>
            <input
              type="time"
              className="block w-full py-1.5 px-3 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
              value={filterTimeFrom}
              onChange={(e) => setFilterTimeFrom(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">To Time</label>
            <input
              type="time"
              className="block w-full py-1.5 px-3 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
              value={filterTimeTo}
              onChange={(e) => setFilterTimeTo(e.target.value)}
            />
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              className="h-[34px] text-gray-500"
              onClick={() => {
                setFilterStudentStatus('All');
                setFilterReqStatus('All');
                setFilterSlotStatus('All');
                setFilterDateFrom('');
                setFilterDateTo('');
                setFilterTimeFrom('');
                setFilterTimeTo('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full min-w-[1250px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px] min-w-[180px]">Student Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Req Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[220px] min-w-[220px]">Audit Info</th>
                <th className="sticky right-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map(req => {
                const reqSlot = slots.find(s => s.id === req.slotId);
                return (
                  <tr key={req.id} className="group hover:bg-gray-50/50 transition-colors">
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
                    <td className="px-6 py-4 whitespace-nowrap w-[180px] min-w-[180px]">
                      {req.studentStatus === 'Scheduled' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            🔒 Scheduled
                          </span>
                        </div>
                      ) : (
                        <select
                          className="block w-full min-w-[150px] pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white shadow-sm"
                          value={req.studentStatus}
                          onChange={(e) => handleStatusChange(req.id, e)}
                        >
                          {Object.values(STUDENT_STATUS).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    {/* Req Status — separate column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={req.reqStatus}>{req.reqStatus}</Badge>
                    </td>
                    {/* Slot Status — separate column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reqSlot ? (
                        <Badge status={reqSlot.status}>{reqSlot.status}</Badge>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>
                    {/* Audit Info — separate column */}
                    <td className="px-6 py-4 whitespace-nowrap w-[220px] min-w-[220px]">
                      {req.auditInfo && req.auditInfo.updatedBy ? (
                        <div className="flex flex-col gap-0.5 leading-tight">
                          <span className="text-xs font-semibold text-gray-900">
                            Updated: {format(parseISO(req.auditInfo.updatedAt), 'MMM d, yyyy, h:mm a')}
                          </span>
                          <span className="text-gray-500 text-xs">By: {req.auditInfo.updatedBy}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50/50">
                      <div className="flex items-center justify-end gap-2">
                        {/* Fixed-width area for Approve/Reject — stays empty if not needed */}
                        <div className="flex items-center gap-1 min-w-[150px] justify-end">
                          {req.reqStatus === 'Pending Approval' && (
                            <>
                              <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => handleApprove(req.id)}>Approve</Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(req.id)}>Reject</Button>
                            </>
                          )}
                        </div>
                        {/* Assign Slot — always in same fixed position */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignModal(req.id)}
                          disabled={req.studentStatus === 'Disinterested' || req.reqStatus === 'Resolved'}
                        >
                          Assign Slot
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={modalMode === 'schedule' ? 'Select Slot to Schedule' : 'Manual Slot Booking'}
      >
        <div className="space-y-4">
          {modalMode === 'schedule' ? (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-blue-500 text-base mt-0.5">ℹ️</span>
              <p className="text-sm text-blue-700">
                Student ko schedule karne ke liye pehle ek available slot select karein. Purana slot already book hai.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Select an available slot to assign to this candidate.</p>
          )}
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
