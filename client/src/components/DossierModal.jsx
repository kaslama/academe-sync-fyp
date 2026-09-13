import React, { useState } from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DossierModal({ project, onClose, onRefresh }) {
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!project) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDecision = async (decision) => {
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${project._id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          comments: comments || (decision === 'Approved' ? 'Formally endorsed by viva board.' : 'Revisions requested.'),
          decision
        })
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-200">
        
        {/* Sticky Header Action Bar */}
        <div className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Institutional Viva Defense Dossier
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF / Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div id="printable-dossier" className="p-6 md:p-8 space-y-6 bg-slate-900 text-slate-100 print:text-black print:bg-white">
          <div className="border-b-2 border-indigo-500/40 pb-4 text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white print:text-black uppercase">
              AcademeSync Final Year Capstone Portal
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Board of Academic Examinations &bull; Project Verification &amp; Redundancy Audit
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 print:text-indigo-800">
                  {project.domain} Track
                </span>
                <h2 className="text-base font-bold text-white print:text-black mt-0.5">
                  {project.title}
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                project.status === 'Approved'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-black print:text-black'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 print:border-black print:text-black'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed pt-2 border-t border-slate-800 print:border-slate-300">
              {project.abstract}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Candidate Identity</span>
              <p className="font-semibold text-white print:text-black">{project.studentName}</p>
              <p className="text-slate-400 print:text-slate-600 text-[11px]">{project.studentEmail}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Faculty Supervisor</span>
              <p className="font-semibold text-white print:text-black">{project.supervisorName || 'Unassigned'}</p>
              <p className="text-slate-400 print:text-slate-600 text-[11px]">Primary Research Mentor</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 space-y-2 text-xs">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">VSM Cosine Similarity Engine Audit</span>
            <div className="flex justify-between items-center">
              <span>Lexical Overlap Against Cohort Corpus:</span>
              <span className={`font-mono font-bold text-sm ${
                project.similarityIndex >= 60 ? 'text-rose-400 print:text-rose-700' : 'text-emerald-400 print:text-emerald-700'
              }`}>
                {project.similarityIndex}%
              </span>
            </div>
            {project.matchingTitle && (
              <div className="text-[11px] text-slate-400 print:text-slate-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Nearest lexical match: &quot;{project.matchingTitle}&quot;</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Academic Progression Milestones</span>
            <div className="space-y-2 text-xs">
              {project.milestones && project.milestones.map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 rounded-lg bg-slate-950/40 print:bg-slate-50 border border-slate-800 print:border-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${
                      m.status === 'Approved' ? 'text-emerald-400 print:text-emerald-600' : 'text-slate-600'
                    }`} />
                    <span className="font-medium text-slate-200 print:text-black">{m.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    m.status === 'Approved' ? 'text-emerald-400 print:text-black' : 'text-slate-400'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 mt-6 border-t-2 border-slate-800 print:border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <div className="border-b border-slate-700 print:border-black h-8"></div>
              <span className="text-[10px] uppercase text-slate-400 print:text-black block">Project Supervisor</span>
            </div>
            <div className="space-y-8">
              <div className="border-b border-slate-700 print:border-black h-8"></div>
              <span className="text-[10px] uppercase text-slate-400 print:text-black block">Internal Examiner</span>
            </div>
            <div className="space-y-8">
              <div className="border-b border-slate-700 print:border-black h-8"></div>
              <span className="text-[10px] uppercase text-slate-400 print:text-black block">External Defense Chair</span>
            </div>
          </div>
        </div>

        {/* Action Tray */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-4 print:hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Viva Board Decision &amp; Feedback Entry
          </h3>
          <div className="space-y-3">
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter comprehensive viva voce feedback, defense recommendations, or revision prerequisites..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button
                disabled={submitting}
                onClick={() => handleDecision('Flagged Conflict')}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Require Revisions
              </button>
              <button
                disabled={submitting}
                onClick={() => handleDecision('Approved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Endorse &amp; Pass Proposal
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}