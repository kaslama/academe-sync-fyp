import React, { useState, useEffect } from 'react';
import { Send, Paperclip, Trash2, MessageSquare, ExternalLink, Plus } from 'lucide-react';

export default function StudentDashboard({ currentUser, token, projects, loadData, SERVER_URL, API }) {
  const [form, setForm] = useState({ title: '', domain: 'Distributed Systems', abstract: '', partnerEmail: '', document: null });
  const [similarity, setSimilarity] = useState({ similarityIndex: 0, flagged: false, matchingTitle: '' });
  const [commentText, setCommentText] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [linkForms, setLinkForms] = useState({});

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  // Utility to handle missing http/https prefixes for external links
  const formatExternalUrl = (url) => {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.title.length > 2) {
        try {
          const res = await fetch(`${API}/projects/analyze`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ title: form.title })
          });
          if (res.ok) {
            setSimilarity(await res.json());
          }
        } catch(e) {}
      } else { 
        setSimilarity({ similarityIndex: 0, flagged: false, matchingTitle: '' }); 
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.title]);

  const submitProposal = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('domain', form.domain);
    formData.append('abstract', form.abstract);
    formData.append('partnerEmail', form.partnerEmail);
    formData.append('similarityIndex', similarity.similarityIndex || 0);
    if (form.document) formData.append('document', form.document);

    try {
      const res = await fetch(`${API}/projects`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: formData 
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit proposal.');
        return;
      }
      
      setForm({ title: '', domain: 'Distributed Systems', abstract: '', partnerEmail: '', document: null });
      setSimilarity({ similarityIndex: 0, flagged: false, matchingTitle: '' });
      
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      loadData();
    } catch (err) {
      setSubmitError('Network error during submission.');
    }
  };

  const uploadExistingProjectDocument = async (projectId, file, inputElement) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    await fetch(`${API}/projects/${projectId}/document`, { 
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${token}` }, 
      body: formData 
    });
    if (inputElement) inputElement.value = '';
    loadData();
  };

  const removeDocument = async (projectId, fileUrl) => {
    if (!window.confirm("Are you sure you want to remove this file?")) return;
    const filename = fileUrl.split('/').pop();
    await fetch(`${API}/projects/${projectId}/document/${filename}`, { method: 'DELETE', headers: getHeaders() });
    loadData();
  };

  const addProjectLink = async (projectId) => {
    const linkData = linkForms[projectId];
    if (!linkData || !linkData.title || !linkData.url) return;

    // Auto format URL before sending
    const formattedUrl = formatExternalUrl(linkData.url);

    await fetch(`${API}/projects/${projectId}/links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title: linkData.title, url: formattedUrl })
    });

    setLinkForms({ ...linkForms, [projectId]: { title: '', url: '' } });
    loadData();
  };

  const removeProjectLink = async (projectId, linkId) => {
    if (!window.confirm("Remove this link?")) return;
    await fetch(`${API}/projects/${projectId}/links/${linkId}`, {
      method: 'DELETE',
      headers: getHeaders()
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <section className="lg:col-span-4 bg-slate-900/60 p-6 border border-slate-800 rounded-2xl space-y-4 h-fit">
        <h2 className="text-sm font-bold uppercase">Submit Capstone Proposal</h2>
        {submitError && <div className="p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl font-bold">{submitError}</div>}
        
        <form onSubmit={submitProposal} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Project Title</label>
            <input type="text" placeholder="Enter title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Domain Track</label>
            <select value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none">
              <option>Distributed Systems</option>
              <option>Machine Learning</option>
              <option>Cybersecurity</option>
              <option>Web Development</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Technical Abstract (min 20 characters)</label>
            <textarea placeholder="Abstract & Methodology" rows={4} required value={form.abstract} onChange={e => setForm({...form, abstract: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none" />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Multi-Member Student Group (Optional)</label>
            <input 
              type="email" 
              placeholder="Partner Institutional Email" 
              value={form.partnerEmail} 
              onChange={e => setForm({...form, partnerEmail: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none" 
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Proposal Document (.pdf, .doc, .docx)</label>
            <input 
              id="file-upload"
              type="file" 
              accept=".pdf,.doc,.docx,.zip"
              onChange={e => setForm({...form, document: e.target.files[0]})}
              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 outline-none cursor-pointer"
            />
          </div>
          
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between font-bold">
              <span className="text-slate-400">Lexical Overlap Index:</span>
              <span className={similarity.flagged ? 'text-rose-400' : 'text-emerald-400'}>{similarity.similarityIndex || 0}%</span>
            </div>
            {similarity.flagged && <div className="text-rose-400 text-[11px]">Conflict with existing title: "{similarity.matchingTitle}"</div>}
          </div>

          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold flex justify-center items-center gap-2"><Send className="w-4 h-4"/> Transmit Proposal</button>
        </form>
      </section>

      <section className="lg:col-span-8 space-y-4">
        <h2 className="text-lg font-bold">My Submissions</h2>
        
        {projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
            No proposals filed under this student identity.
          </div>
        ) : projects.map(p => (
          <div key={p._id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase text-indigo-400 font-bold">{p.domain}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[9px] font-bold border border-indigo-500/20">{p.faculty} • {p.batch}</span>
                </div>
                <h3 className="font-bold text-white text-base">{p.title}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold h-fit ${p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.status}</span>
            </div>
            <p className="text-xs text-slate-400">{p.abstract}</p>
            
            {p.documents && p.documents.length > 0 && (
              <div className="pt-3 space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Attached Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {p.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1.5 pr-3">
                      <a href={`${SERVER_URL}${doc.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-900 text-indigo-400 text-[11px] font-bold rounded transition">
                        <Paperclip className="w-3.5 h-3.5" /> 
                        <span className="truncate max-w-[150px]">{doc.name || `File ${idx + 1}`}</span>
                      </a>
                      <button onClick={() => removeDocument(p._id, doc.url)} className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition" title="Remove File">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.status === 'Approved' && (
              <div className="pt-3 space-y-2 border-t border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Project Links (GitHub / Deployed App)</h4>
                
                {p.links && p.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.links.map(link => (
                      <div key={link._id} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <a href={formatExternalUrl(link.url)} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs font-bold hover:underline">
                          {link.title}
                        </a>
                        <button onClick={() => removeProjectLink(p._id, link._id)} className="text-rose-400 hover:text-rose-300 ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <input 
                    type="text" 
                    placeholder="Link Title (e.g., GitHub Repo)" 
                    value={linkForms[p._id]?.title || ''}
                    onChange={e => setLinkForms({...linkForms, [p._id]: { ...linkForms[p._id], title: e.target.value }})}
                    className="bg-slate-950 border border-slate-800 text-xs p-2 rounded-lg outline-none w-1/3 text-white"
                  />
                  <input 
                    type="text" 
                    placeholder="github.com/... or https://..." 
                    value={linkForms[p._id]?.url || ''}
                    onChange={e => setLinkForms({...linkForms, [p._id]: { ...linkForms[p._id], url: e.target.value }})}
                    className="bg-slate-950 border border-slate-800 text-xs p-2 rounded-lg outline-none flex-1 text-white"
                  />
                  <button onClick={() => addProjectLink(p._id)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5"/> Add Link
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[11px] pt-3 border-t border-slate-800 text-slate-500 font-bold gap-2">
              <div className="flex items-center gap-4">
                <span>Team: {p.teamMembers ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</span>
                <span>Guide: {p.supervisor}</span>
              </div>
              <span className={p.similarityIndex >= 60 ? 'text-rose-400' : 'text-emerald-400'}>{p.similarityIndex}% Match</span>
            </div>

            <div className="pt-3 border-t border-slate-800 mt-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Attach Final Document / Update File</label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.zip"
                onChange={(e) => uploadExistingProjectDocument(p._id, e.target.files[0], e.target)}
                className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer w-full outline-none"
              />
            </div>

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
      </section>
    </div>
  );
}