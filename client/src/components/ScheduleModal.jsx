import React, { useState } from 'react';
import { X, Calendar, MapPin, Save, Clock } from 'lucide-react';

export default function ScheduleModal({ project, onClose, onRefresh }) {
  const [scheduledDate, setScheduledDate] = useState(
    project.vivaSchedule?.scheduledDate ? project.vivaSchedule.scheduledDate.substring(0, 16) : ''
  );
  const [venue, setVenue] = useState(project.vivaSchedule?.venue || 'Room 402, CS Seminar Hall');
  const [milestones, setMilestones] = useState(
    project.milestones.map((m) => ({
      deadline: m.deadline ? m.deadline.substring(0, 10) : ''
    }))
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const milestoneDeadlines = milestones.map((m, idx) => ({
        index: idx,
        deadline: m.deadline || null
      }));

      const res = await fetch(`http://localhost:5000/api/projects/${project._id}/schedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          scheduledDate: scheduledDate || null,
          venue,
          milestoneDeadlines
        })
      });

      if (res.ok) {
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Schedule Milestones &amp; Viva Voce
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Viva Schedule */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              Final Viva Voce Examination
            </span>
            <div>
              <label className="block text-slate-400 mb-1">Defense Date &amp; Time</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Defense Venue / Board Room</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g., Board Room 2 or Virtual Conference Link"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Milestone Deadlines */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              Milestone Deadlines
            </span>
            {project.milestones.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center gap-4">
                <span className="text-slate-300 font-medium truncate flex-1">{m.title}</span>
                <input
                  type="date"
                  value={milestones[idx]?.deadline || ''}
                  onChange={(e) => {
                    const copy = [...milestones];
                    copy[idx] = { deadline: e.target.value };
                    setMilestones(copy);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Confirm Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}