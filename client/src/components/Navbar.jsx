import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Database, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="flex justify-between items-center pb-6 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
          <Database className="text-indigo-400 w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">AcademeSync</h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">FYP Verification Portal</p>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-white font-medium">{user.name}</span>
            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono rounded uppercase font-bold">
              {user.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 rounded-xl transition cursor-pointer"
            title="Log Out Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}