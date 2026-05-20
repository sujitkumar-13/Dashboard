import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({ className, status, children, ...props }) => {
  // Available -> Green
  // Booked -> Red
  // Parked -> Yellow
  // Scheduled -> Blue
  // Disinterested -> Gray
  
  const statusColors = {
    'Available': 'bg-green-100 text-green-800 border-green-200',
    'Booked': 'bg-red-100 text-red-800 border-red-200',
    'Released': 'bg-purple-100 text-purple-800 border-purple-200',
    'Parked': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
    'Resolved': 'bg-blue-100 text-blue-800 border-blue-200',
    'Disinterested': 'bg-gray-100 text-gray-800 border-gray-200',
    'Approved': 'bg-green-100 text-green-800 border-green-200',
    'Rejected': 'bg-red-100 text-red-800 border-red-200',
    'Pending Approval': 'bg-orange-100 text-orange-800 border-orange-200',
    'Pending': 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
};
