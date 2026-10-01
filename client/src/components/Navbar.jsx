import React, { useEffect } from 'react';
import { Database, LogOut, Bell, User as UserIcon } from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  handleLogout, 
  notifications = [], 
  showNotifications, 
  toggleNotifications 
}) {
  if (!currentUser) return null;

  const sortedNotifications = [...notifications].reverse();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notif-container')) {
        toggleNotifications();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center pb-6 mb-6 border-b border-slate-200 print:border-black gap-4 bg-white px-6 rounded-2xl shadow-sm print:hidden">
      <div className="flex items-center gap-3 mt-4 sm:mt-0">
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-2xl shadow-inner">
          <Database className="text-red-600 w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">AcademeSync</h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">FYP Verification Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <UserIcon className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-left flex flex-col pr-2">
            <span className="text-xs text-slate-900 font-bold leading-none">{currentUser.name}</span>
            <span className="text-[9px] uppercase text-red-600 font-mono tracking-wider mt-0.5">
              {currentUser.role} {currentUser.faculty ? `• ${currentUser.faculty}` : ''}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* NOTIFICATION WRAPPER WITH RELATIVE POSITIONING */}
          <div className="relative notif-container">
            <button 
              onClick={toggleNotifications} 
              className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition relative shadow-sm cursor-pointer block" 
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[99999] py-3 max-h-80 overflow-y-auto text-slate-800">
                <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center mb-1">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notifications</h3>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                    {notifications.filter(n => !n.read).length} Unread
                  </span>
                </div>
                {sortedNotifications.length === 0 ? (
                  <div className="text-xs text-slate-500 px-4 py-3">No recent activity.</div>
                ) : sortedNotifications.map((n, i) => (
                  <div key={i} className={`px-4 py-2.5 text-xs border-b border-slate-100 last:border-0 ${n.read ? 'text-slate-500' : 'bg-slate-50 text-slate-900 font-semibold'}`}>
                    <p>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="p-2.5 bg-white border border-slate-200 text-red-600 rounded-2xl hover:bg-red-50 hover:border-red-200 transition shadow-sm cursor-pointer" title="Log Out Session">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}