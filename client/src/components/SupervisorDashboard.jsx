import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DossierModal from './DossierModal';
import ProjectChatModal from './ProjectChatModal';
import ScheduleModal from './ScheduleModal';
import NotificationModal from './NotificationModal';
import { 
  X, 
  FileText, 
  Download, 
  Filter, 
  FileSpreadsheet, 
  MessageSquare, 
  Calendar, 
  Users, 
  Bell, 
  Lock, 
  ShieldCheck 
} from 'lucide-react';

const API = 'http://localhost:5000/api/projects';

export default function SupervisorDashboard() {
  const { token, user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [filterDomain, setFilterDomain] = useState('All');
  const [selectedDossierProject, setSelectedDossierProject] = useState(null);
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [activeScheduleProject, setActiveScheduleProject] = useState(null);
  const [activeNotificationProject, setActiveNotificationProject] = useState(null);

  const loadProjects = async () => {
    try {
      // Backend guarantees this supervisor only receives projects where supervisorId === user.id
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRejectProposal = async (id) => {
    const reason = window.prompt('Please provide a formal reason for rejecting this candidate proposal (the student will be notified):');
    if (!reason) return;

    try {
      const res = await fetch(`${API}/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) loadProjects();
    } catch (err) {
      console.error('Rejection failed', err);
    }
  };

  const handleMilestoneUpdate = async (id, milestoneIndex, status) => {
    try {
      const res = await fetch(`${API}/${id}/milestones`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ milestoneIndex, status })
      });
      if (res.ok) loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const getUnreadCount = (p) => {
    const readCount = parseInt(localStorage.getItem(`read_notifs_${p._id}`) || '0', 10);
    const total = (p.notifications || []).length;
    return Math.max(0, total - readCount);
  };

  const filteredProjects = filterDomain === 'All'
    ? projects
    : projects.filter(p => p.domain === filterDomain);

  return (
    <div className="space-y-6 text-xs text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Faculty Private Mentorship Workspace</span>
          </h2>
          <p className="text-slate-400 mt-0.5">
            You are viewing only projects officially allotted to you ({user?.name}) by the Department Chair.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Domain Tracks</option>
            <option value="Distributed Systems">Distributed Systems</option>
            <option value="Computer Vision">Computer Vision</option>
            <option value="NLP">NLP</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Cloud">Cloud</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center border border-slate-800/80 rounded-2xl text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-bold text-slate-400">No Allotted Projects Found</p>
            <p className="text-xs max-w-sm mx-auto">
              You do not have any projects assigned under your identity yet. The Department Chair / Admin assigns faculty supervisors to proposals.
            </p>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const unread = getUnreadCount(p);
            return (
              <div key={p._id} className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{p.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="text-indigo-400 font-mono uppercase tracking-wider text-[10px]">{p.domain}</span>
                      <span>&bull;</span>
                      <span>Candidate: <strong className="text-slate-200">{p.studentName}</strong></span>
                      {p.teamMembers && p.teamMembers.length > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-indigo-400" />
                            Team: {p.teamMembers.map(m => m.name).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveNotificationProject(p)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition relative cursor-pointer"
                      title="View Change Notifications"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {unread}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveChatProject(p)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition cursor-pointer"
                      title="Open Candidate Discussion Thread"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setActiveScheduleProject(p)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition cursor-pointer"
                      title="Set Milestones & Viva Schedule"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>

                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      p.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      p.status === 'Rejected' ? 'bg-slate-800 text-slate-400' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {p.status}
                    </span>

                    <button
                      onClick={() => setSelectedDossierProject(p)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Defense Dossier</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  {p.abstract}
                </p>

                {p.vivaSchedule?.scheduledDate && (
                  <div className="p-2.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-indigo-300">
                      Viva Voce Defense Scheduled: <strong>{new Date(p.vivaSchedule.scheduledDate).toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-400 text-[11px]">{p.vivaSchedule.venue}</span>
                  </div>
                )}

                {p.documentPath && (
                  <div>
                    <a
                      href={`http://localhost:5000${p.documentPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Proposal Document</span>
                      <Download className="w-3 h-3 ml-1 text-slate-500" />
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Milestone Progression &amp; Target Deadlines
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {p.milestones && p.milestones.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2 text-xs">
                        <div>
                          <span className="text-slate-300 font-medium block truncate">{m.title}</span>
                          {m.deadline && (
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Target: {new Date(m.deadline).toLocaleDateString()}
                            </span>
                          )}
                          {m.documentPath ? (
                            <a
                              href={`http://localhost:5000${m.documentPath}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              <FileText className="w-3 h-3" /> View Submitted File
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-600 block mt-1">No deliverable uploaded</span>
                          )}
                        </div>
                        <select
                          value={m.status}
                          onChange={(e) => handleMilestoneUpdate(p._id, idx, e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Approved">Approved</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faculty Reject Action */}
                {p.status !== 'Rejected' && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleRejectProposal(p._id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Proposal &amp; Notify Candidate
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedDossierProject && (
        <DossierModal
          project={selectedDossierProject}
          onClose={() => setSelectedDossierProject(null)}
          onRefresh={loadProjects}
        />
      )}

      {activeChatProject && (
        <ProjectChatModal
          project={activeChatProject}
          onClose={() => setActiveChatProject(null)}
          onUpdate={loadProjects}
        />
      )}

      {activeScheduleProject && (
        <ScheduleModal
          project={activeScheduleProject}
          onClose={() => setActiveScheduleProject(null)}
          onRefresh={loadProjects}
        />
      )}

      {activeNotificationProject && (
        <NotificationModal
          project={activeNotificationProject}
          onClose={() => {
            setActiveNotificationProject(null);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}