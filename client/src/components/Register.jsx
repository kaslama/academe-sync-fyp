import React, { useState } from 'react';
import { Database, UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';

export default function Register({ API, switchToLogin, onRegisterSuccess }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    faculty: 'BCA',
    batch: '2022'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Omit faculty and batch if role is not student
    const submissionData = { ...form };
    if (form.role !== 'student') {
      delete submissionData.faculty;
      delete submissionData.batch;
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      onRegisterSuccess('Registration successful! Please log in with your credentials.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-6 font-sans selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden my-8">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl shadow-inner">
            <Database className="text-red-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">AcademeSync</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">FYP Verification Portal</p>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-500">Register your institutional credentials for project tracking & VSM verification.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="Kashmir Lama"
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Institutional Email</label>
              <input 
                type="email" 
                required 
                placeholder="email@univ.edu"
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Secure Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">System Role</label>
            <select 
              value={form.role} 
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm cursor-pointer"
            >
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* CONDITIONAL FIELDS: Only shown if role is student */}
          {form.role === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Faculty</label>
                <select 
                  value={form.faculty} 
                  onChange={e => setForm({...form, faculty: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm cursor-pointer"
                >
                  <option value="BCA">BCA</option>
                  <option value="BSC.CSIT">BSc.CSIT</option>
                  <option value="BIT">BIT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Batch</label>
                <select 
                  value={form.batch} 
                  onChange={e => setForm({...form, batch: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm cursor-pointer"
                >
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2 text-xs mt-2"
          >
            {loading ? 'Creating Account...' : 'Register Workspace Account'} <UserPlus className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-center">
          <button 
            onClick={switchToLogin} 
            className="text-xs text-slate-600 hover:text-red-600 font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}