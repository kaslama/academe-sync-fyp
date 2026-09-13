import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ProjectChatModal from './ProjectChatModal';
import NotificationModal from './NotificationModal';
import { AlertTriangle, Send, FileText, Download, UploadCloud, Users, Plus, Trash2, MessageSquare, Calendar, MapPin, Bell } from 'lucide-react';

const API = 'http://localhost:5000/api/projects';

export default function StudentDashboard() {
  const { token, user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    title: '',
    domain: 'Distributed Systems',
    abstract: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberInput, setMemberInput] = useState({ name: '', email: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [similarity, setSimilarity] = useState({ score: 0, flagged: false, matchingTitle: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingMilestone, setUploadingMilestone] = useState(null);
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [activeNotificationProject, setActiveNotificationProject] = useState(null);

  const loadProjects = async () => {
    try {
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

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.title.trim().length > 5 || form.abstract.trim().length > 20) {
        try {
          const res = await fetch(`${API}/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title: form.title, abstract: form.abstract })
          });
          if (res.ok) setSimilarity(await res.json());
        } catch (e) {
          console.error(e);
        }
      } else {
        setSimilarity({ score: 0, flagged: false, matchingTitle: '' });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.title, form.abstract, token]);

  const addTeamMember = () => {
    if (memberInput.name && memberInput.email) {
      setTeamMembers([...teamMembers, memberInput]);
      setMemberInput({ name: '', email: '' });
    }
  };

  const removeTeamMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('domain', form.domain);
    formData.append('abstract', form.abstract);
    formData.append('teamMembers', JSON.stringify(teamMembers));
    if (documentFile) {
      formData.append('document', documentFile);
    }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setForm({ title: '', domain: 'Distributed Systems', abstract: '' });
        setTeamMembers([]);
        setDocumentFile(null);
        setSimilarity({ score: 0, flagged: false, matchingTitle: '' });
        loadProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMilestoneUpload = async (projectId, milestoneIndex, file) => {
    if (!file) return;
    setUploadingMilestone(`${projectId}-${milestoneIndex}`);

    const formData = new FormData();
    formData.append('milestoneFile', file);

    try {
      const res = await fetch(`${API}/${projectId}/milestones/${milestoneIndex}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) loadProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingMilestone(null);
    }
  };

  const getUnreadCount = (p) => {
    const readCount = parseInt(localStorage.getItem(`read_notifs_${p._id}`) || '0', 10);
    const total = (p.notifications || []).length;
    return Math.max(0, total - readCount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Proposal Submission Form */}
      <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 h-fit">
        <h2 className="text-sm font-bold tracking-wider uppercase text-indigo-400 mb-4">
          Submit Capstone Proposal
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Project Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Decentralized Byzantine Fault Tolerant Ledger"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Domain Track</label>
            <select
              value={form.domain}
              onChange={e => setForm({ ...form, domain: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Distributed Systems">Distributed Systems</option>
              <option value="Computer Vision">Computer Vision</option>
              <option value="NLP">NLP</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Cloud">Cloud</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Technical Abstract (min 20 characters)</label>
            <textarea
              required
              rows={4}
              value={form.abstract}
              onChange={e => setForm({ ...form, abstract: e.target.value })}
              placeholder="Detail your system architecture, problem domain, and theoretical methodology..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Multi-Member Student Group Section */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="block text-slate-400 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Member Student Group (Optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Partner Name"
                value={memberInput.name}
                onChange={(e) => setMemberInput({ ...memberInput, name: e.target.value })}
                className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="email"
                placeholder="Partner Email"
                value={memberInput.email}
                onChange={(e) => setMemberInput({ ...memberInput, email: e.target.value })}
                className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addTeamMember}
                className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {teamMembers.length > 0 && (
              <div className="space-y-1 pt-1">
                {teamMembers.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded-lg text-[11px]">
                    <span className="text-slate-200">{m.name} ({m.email})</span>
                    <button type="button" onClick={() => removeTeamMember(i)} className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Proposal Document (.pdf, .doc, .docx)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setDocumentFile(e.target.files[0])}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          {/* Lexical Overlap Index */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Lexical Overlap Index:</span>
              <span className={`font-mono font-bold ${similarity.flagged ? 'text-rose-400' : 'text-emerald-400'}`}>
                {similarity.score}%
              </span>
            </div>
            {similarity.flagged && (
              <div className="flex items-start gap-1.5 text-rose-400/90 text-[11px] mt-1 pt-1 border-t border-slate-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Conflicts with: &quot;{similarity.matchingTitle}&quot; (&ge; 60%)</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Transmitting...' : 'Transmit Proposal'}
          </button>
        </form>
      </div>

      {/* Projects List */}
      <div className="lg:col-span-7 space-y-4">
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">My Submissions</h2>
        {projects.length === 0 ? (
          <div className="p-8 text-center border border-slate-800/80 rounded-2xl text-slate-500 text-xs">
            No proposals filed under this student identity.
          </div>
        ) : (
          projects.map(p => {
            const unread = getUnreadCount(p);
            return (
              <div key={p._id} className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase">{p.domain}</span>
                      {p.teamMembers && p.teamMembers.length > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users className="w-2.5 h-2.5 text-indigo-400" /> {p.teamMembers.length + 1} Team Members
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Activity Bell with Badging */}
                    <button
                      onClick={() => setActiveNotificationProject(p)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition relative cursor-pointer"
                      title="View Changes & Notifications"
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
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition relative cursor-pointer"
                      title="Open Consultation Thread"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {p.messages?.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                    </button>

                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      p.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      p.status === 'Rejected' ? 'bg-slate-800 text-slate-400' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{p.abstract}</p>

                {/* Viva Schedule Info */}
                {p.vivaSchedule?.scheduledDate && (
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-indigo-300">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>Viva Voce: <strong>{new Date(p.vivaSchedule.scheduledDate).toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{p.vivaSchedule.venue}</span>
                    </div>
                  </div>
                )}

                {p.documentPath && (
                  <div className="pt-2">
                    <a
                      href={`http://localhost:5000${p.documentPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Uploaded Proposal Report</span>
                      <Download className="w-3 h-3 ml-1 text-slate-500" />
                    </a>
                  </div>
                )}
                
                {/* Milestones Grid */}
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Milestones &amp; Submissions</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                    {p.milestones && p.milestones.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-slate-300 font-medium truncate block">{m.title}</span>
                          <div className="flex justify-between items-center mt-1">
                            <span className={`text-[9px] font-bold ${
                              m.status === 'Approved' ? 'text-emerald-400' :
                              m.status === 'In Progress' ? 'text-indigo-400' : 'text-slate-500'
                            }`}>
                              {m.status}
                            </span>
                            {m.deadline && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                Due {new Date(m.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/60">
                          {m.documentPath ? (
                            <a
                              href={`http://localhost:5000${m.documentPath}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> Submitted Deliverable
                            </a>
                          ) : (
                            <label className="cursor-pointer inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition">
                              <UploadCloud className="w-3 h-3 text-indigo-400" />
                              <span>{uploadingMilestone === `${p._id}-${idx}` ? 'Uploading...' : 'Upload File'}</span>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleMilestoneUpload(p._id, idx, e.target.files[0])}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeChatProject && (
        <ProjectChatModal
          project={activeChatProject}
          onClose={() => setActiveChatProject(null)}
          onUpdate={loadProjects}
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