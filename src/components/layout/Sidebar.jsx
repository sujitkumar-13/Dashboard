import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore, ROLES } from '../../store/authStore';
import { Calendar, LayoutDashboard, Users, Clock, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const getLinks = () => {
    if (!user) return [];
    if (user.role === ROLES.CANDIDATE) {
      return [
        { name: 'Book Interview', path: '/candidate/book', icon: Calendar },
      ];
    }
    if (user.role === ROLES.INTERVIEWER) {
      return [
        { name: 'My Slots', path: '/interviewer/slots', icon: Calendar },
        { name: 'Settings', path: '/interviewer/settings', icon: Settings },
      ];
    }
    if (user.role === ROLES.ADMIN) {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'All Requests', path: '/admin/requests', icon: Users },
      ];
    }
    return [];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <Calendar className="w-6 h-6" />
          <span>Scheduler</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-blue-50 text-blue-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <link.icon className="w-5 h-5" />
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
