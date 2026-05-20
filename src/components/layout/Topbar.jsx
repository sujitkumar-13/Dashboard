import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const Topbar = () => {
  const user = useAuthStore(state => state.user);

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center text-sm font-medium text-gray-500">
        {/* Breadcrumb placeholder */}
        {user ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal` : 'Portal'}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
            <div className="text-xs text-gray-500">{user?.role}</div>
          </div>
          <UserCircle className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    </header>
  );
};
