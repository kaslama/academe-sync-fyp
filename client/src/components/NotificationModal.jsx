import React, { useEffect } from 'react';
import { X, Bell, Clock, CheckCircle2 } from 'lucide-react';

export default function NotificationModal({ project, onClose }) {
  const notifications = project.notifications ? [...project.notifications].reverse() : [];

  useEffect(() => {
    if (project && project._id) {
      localStorage.setItem(`read_notifs_${project._id}`, (project.notifications || []).length.toString());
    }
  }, [project]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Project Activity &amp; Change Alerts
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[420px] overflow-y-auto space-y-3 text-xs">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <CheckCircle2 className="w-6 h-6 mx-auto text-slate-600" />
              <p>No project notifications logged yet.</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="uppercase text-indigo-400 font-bold">{n.type || 'alert'}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-slate-200 leading-snug">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}