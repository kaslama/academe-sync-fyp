import React, { useState } from 'react';
import { Paperclip, MessageSquare, Filter, ExternalLink } from 'lucide-react';

export default function SupervisorDashboard({ currentUser, token, projects, loadData, SERVER_URL, API }) {
  const [commentText, setCommentText] = useState({});
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [selectedDossierProject, setSelectedDossierProject] = useState(null);

  const [filterFaculty, setFilterFaculty] = useState('ALL');
  const [filterBatch, setFilterBatch] = useState('ALL');

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  const formatExternalUrl = (url) => {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/projects/${id}`, { 
      method: 'PATCH', 
      headers: getHeaders(), 
      body: JSON.stringify({ status }) 
    });
    loadData();
  };

  const updateMilestone = async (id, progressMilestone) => {
    await fetch(`${API}/projects/${id}`, { 
      method: 'PATCH', 
      headers: getHeaders(), 
      body: JSON.stringify({ progressMilestone }) 
    });
    loadData();
  };

  const postComment = async (id) => {
    if (!commentText[id]) return;
    await fetch(`${API}/projects/${id}/comments`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ text: commentText[id] }) 
    });
    setCommentText({ ...commentText, [id]: '' });
    loadData();
  };

  const filteredProjects = projects.filter(p => {
    if (filterFaculty !== 'ALL' && p.faculty !== filterFaculty) return false;
    if (filterBatch !== 'ALL' && p.batch !== filterBatch) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase text-indigo-400">Faculty Private Mentorship Workspace</h2>
          <p className="text-xs text-slate-400 mt-1">You are viewing all projects officially allotted to you ({currentUser.name}) by the Department Chair.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-indigo-400 ml-1" />
          <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white outline-none">
            <option value="ALL">All Faculties</option>
            <option value="BCA">BCA</option>
            <option value="BSC.CSIT">BSc.CSIT</option>
            <option value="BIT">BIT</option>
          </select>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white outline-none">
            <option value="ALL">All Batches</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
            No projects found matching the selected filters.
          </div>
        ) : filteredProjects.map(p => (
          <div key={p._id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase text-indigo-400 font-bold">{p.domain}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[9px] font-bold border border-indigo-500/20">{p.faculty} • {p.batch}</span>
                </div>
                <h3 className="font-bold text-white text-base">{p.title}</h3>
                <div className="text-xs text-slate-400 mt-1">
                  <span>Candidate: <strong className="text-slate-200">{p.studentName}</strong></span> • 
                  <span className="ml-1">Team: <strong className="text-slate-200">{p.teamMembers ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setActiveChatProject(p)} className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-indigo-400 rounded-lg transition" title="Open Discussion Chat">
                  <MessageSquare className="w-4 h-4" />
                </button>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.status}</span>
                <button onClick={() => setSelectedDossierProject(p)} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs rounded-lg font-bold transition">
                  Defense Dossier
                </button>
              </div>
            </div>
            
            <p className="text-xs text-slate-400">{p.abstract}</p>
            
            {p.documents && p.documents.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {p.documents.map((doc, idx) => (
                  <a key={idx} href={`${SERVER_URL}${doc.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 text-indigo-400 text-[11px] font-bold rounded-lg">
                    <Paperclip className="w-3.5 h-3.5" /> {doc.name || `File ${idx + 1}`}
                  </a>
                ))}
              </div>
            )}

            {p.links && p.links.length > 0 && (
              <div className="pt-2 space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Submitted Project Links</h4>
                <div className="flex flex-wrap gap-2">
                  {p.links.map(link => (
                    <a 
                      key={link._id} 
                      href={formatExternalUrl(link.url)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-indigo-400 text-xs font-bold hover:bg-slate-900 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[11px] pt-3 border-t border-slate-800 text-slate-500 font-bold gap-2">
              <div className="flex items-center gap-2">
                <span className="uppercase text-[10px] text-slate-400">Milestone Stage:</span>
                <select 
                  value={p.progressMilestone || 'In Progress'} 
                  onChange={e => updateMilestone(p._id, e.target.value)} 
                  className="bg-slate-950 border border-indigo-500/50 text-indigo-400 px-3 py-1 rounded-lg text-xs outline-none font-bold cursor-pointer"
                >
                  <option value="In Progress">⏳ In Progress</option>
                  <option value="Completed">✅ Completed</option>
                </select>
              </div>

              <span className={p.similarityIndex >= 60 ? 'text-rose-400' : 'text-emerald-400'}>{p.similarityIndex}% Match Index</span>
            </div>

            {p.status !== 'Approved' && p.status !== 'Rejected' && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => updateStatus(p._id, 'Approved')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-lg font-bold transition">Approve Proposal</button>
                <button onClick={() => updateStatus(p._id, 'Rejected')} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 rounded-lg font-bold transition">Reject Proposal & Notify Candidate</button>
              </div>
            )}

            <div className="pt-4 space-y-2 mt-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5"/> Feedback Thread</h4>
              {p.comments?.map((c, i) => (
                <div key={i} className="text-[11px] bg-slate-950 p-2 rounded-lg text-slate-300 border border-slate-800/50">
                  <strong className="text-indigo-400">{c.author}:</strong> {c.text}
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input type="text" value={commentText[p._id] || ''} onChange={e => setCommentText({...commentText, [p._id]: e.target.value})} placeholder="Add a comment..." className="flex-1 bg-slate-950 border border-slate-800 text-xs p-2 rounded-lg outline-none focus:border-indigo-500"/>
                <button onClick={() => postComment(p._id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs rounded-lg font-bold transition">Post</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeChatProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase text-indigo-400">Discussion: {activeChatProject.title}</h3>
            <p className="text-xs text-slate-400">Use the feedback thread on the project card to transmit real-time comments directly to the student group workspace.</p>
            <button onClick={() => setActiveChatProject(null)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold">Close Window</button>
          </div>
        </div>
      )}

      {selectedDossierProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase text-indigo-400">Defense Dossier Summary</h3>
            <div className="bg-slate-950 p-4 rounded-xl text-xs space-y-2 border border-slate-800">
              <div><strong className="text-slate-400">Title:</strong> {selectedDossierProject.title}</div>
              <div><strong className="text-slate-400">Domain:</strong> {selectedDossierProject.domain}</div>
              <div><strong className="text-slate-400">Faculty Cohort:</strong> {selectedDossierProject.faculty} - Batch {selectedDossierProject.batch}</div>
              <div><strong className="text-slate-400">Similarity Risk Index:</strong> {selectedDossierProject.similarityIndex}%</div>
              <div><strong className="text-slate-400">Current Standing:</strong> {selectedDossierProject.progressMilestone || 'In Progress'}</div>
            </div>
            <button onClick={() => setSelectedDossierProject(null)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold">Dismiss Dossier</button>
          </div>
        </div>
      )}
    </div>
  );
}