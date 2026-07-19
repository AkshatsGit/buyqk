import React, { useState, useEffect } from 'react';
import { 
  auth, db, HR_EMAILS
} from '@buyqk/firebase';
import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { 
  Github, Linkedin, User, Mail, Phone, ShieldAlert, Search, 
  FileText, Plus, Trash2, Edit2, Download, LogOut, Users, 
  CheckCircle2, PlusCircle, Briefcase, FileUp, Sparkles, Save, X, Ban
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  employeeCode: string;
  githubUrl: string;
  linkedinUrl: string;
  phone: string;
  email: string;
  status: 'candidate' | 'employee';
  resumeText: string;
  details: string;
  bankDetails: string;
  createdAt: string;
  updatedAt: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Real-time synchronization of auth status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!user.email || !HR_EMAILS.includes(user.email)) {
          auth.signOut();
          setErrorMsg("Access Denied. You are not authorized to view the Team & Talent portal.");
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
          setErrorMsg('');
        }
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      const user = await auth.signInWithGoogle('admin');
      if (!user.email || !HR_EMAILS.includes(user.email)) {
        await auth.signOut();
        setErrorMsg("Access Denied. You are not authorized to access the Team & Talent Hub.");
      } else {
        setCurrentUser(user);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentUser(null);
  };

  if (authChecking) {
    return (
      <div className="flex-1 min-h-screen bg-navy-950 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center animate-spin">
            <svg className="absolute w-full h-full text-yellow-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6.5">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
            </svg>
          </div>
          <p className="text-slate-400 text-xs font-mono tracking-widest uppercase animate-pulse">Initializing Security Protocol...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-1 min-h-screen bg-navy-950 flex flex-col items-center justify-center font-sans px-4">
        <div className="w-full max-w-sm bg-slate-900/60 border border-blue-900/30 rounded-3xl p-8 shadow-premium text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-[40%] h-[3px] bg-gradient-to-r from-yellow-500 to-amber-600"></div>
          
          <div className="relative w-18 h-18 mx-auto flex items-center justify-center mb-6">
            <svg className="absolute w-full h-full text-yellow-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
            </svg>
            <Users className="w-8 h-8 text-white relative z-10" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-sans">
            buy<span className="text-yellow-550 text-yellow-500">Qk</span> Team Hub
          </h2>
          <p className="text-slate-400 text-xs tracking-wide leading-relaxed font-sans mb-6">
            Authorized Administrator portal to manage candidate resumes, GitHub/LinkedIn references, employee codes, and payroll logs.
          </p>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/20 text-red-300 text-[11px] leading-relaxed p-3.5 rounded-xl mb-5 flex items-start gap-2.5 text-left font-mono">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#081C3A] hover:bg-blue-950/60 border border-blue-800/40 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md select-none cursor-pointer"
          >
            <span className="text-yellow-500">G</span> Sign In With Google Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-navy-950 flex flex-col font-sans">
      <header className="no-print bg-slate-900/60 border-b border-blue-900/25 px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="absolute w-full h-full text-yellow-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
            </svg>
            <Users className="w-5 h-5 text-white relative z-10" />
          </div>
          <div className="text-left">
            <span className="text-lg font-black tracking-tight text-white block">buy<span className="text-yellow-550 text-yellow-500">Qk</span> Team Hub</span>
            <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block">INTERNAL TALENT & ROLLS NET</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
            <span className="text-[9px] font-mono text-emerald-450 tracking-wider text-emerald-400 uppercase select-none">Super Administrator Mode</span>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out Session" 
            className="flex items-center gap-2 bg-[#102A4C]/40 hover:bg-[#1a4478]/40 border border-blue-900/30 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-yellow-500" /> Log out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8">
        <TeamConsole />
      </main>
    </div>
  );
}

function TeamConsole() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'employee' | 'candidate'>('all');
  
  // Modals & Editors
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);
  
  // Extraction parser states
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);
  const [extractFeedback, setExtractFeedback] = useState<{ type: 'info' | 'success' | 'error', text: string } | null>(null);

  // Firestore list subscriber
  useEffect(() => {
    const q = query(collection(db, 'team_members'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: TeamMember[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as any);
      });
      setMembers(records);
    }, (err) => {
      console.error("Firestore database subscription error:", err);
    });
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingMember({
      id: 'member_' + Math.random().toString(36).substr(2, 9),
      name: '',
      employeeCode: '',
      githubUrl: '',
      linkedinUrl: '',
      phone: '',
      email: '',
      status: 'candidate',
      resumeText: '',
      details: '',
      bankDetails: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setExtractFeedback(null);
    setIsEditorOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember({ ...member });
    setExtractFeedback(null);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete the record of ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'team_members', id));
      } catch (err) {
        console.error("Failed to delete record:", err);
        alert("Failed to delete record");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.id || !editingMember.name || !editingMember.name.trim()) return;

    try {
      const payload = {
        ...editingMember,
        name: editingMember.name.trim(),
        employeeCode: editingMember.employeeCode?.trim() || '',
        githubUrl: editingMember.githubUrl?.trim() || '',
        linkedinUrl: editingMember.linkedinUrl?.trim() || '',
        phone: editingMember.phone?.trim() || '',
        email: editingMember.email?.trim() || '',
        status: editingMember.status || 'candidate',
        resumeText: editingMember.resumeText || '',
        details: editingMember.details || '',
        bankDetails: editingMember.bankDetails || '',
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'team_members', editingMember.id), payload, { merge: true });
      setIsEditorOpen(false);
      setEditingMember(null);
    } catch (err) {
      console.error("Failed to save team member details:", err);
      alert("Error occurred while saving candidate/employee information.");
    }
  };

  // Dynamically load PDF.js client-side and extract name, GitHub and LinkedIn links
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMember) return;

    setIsExtractingText(true);
    setExtractFeedback({ type: 'info', text: 'Initializing browser PDF extractor module...' });

    try {
      // 1. Read binary content
      const text = await new Promise<string>((resolve, reject) => {
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
          script.onload = () => {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            parsePdfFile(file, resolve, reject);
          };
          script.onerror = () => {
            reject(new Error("Unable to load client-side PDF.js bundle"));
          };
          document.body.appendChild(script);
        } else {
          parsePdfFile(file, resolve, reject);
        }
      });

      // 2. Parse text and auto-extract Name, GitHub and LinkedIn profiles
      const parsedName = extractNameFromText(text);
      const parsedGithub = extractGithubFromText(text);
      const parsedLinkedin = extractLinkedinFromText(text);
      const parsedPhone = extractPhoneFromText(text);
      const parsedEmail = extractEmailFromText(text);

      setEditingMember(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          resumeText: text,
          name: prev.name || parsedName,
          githubUrl: prev.githubUrl || parsedGithub,
          linkedinUrl: prev.linkedinUrl || parsedLinkedin,
          phone: prev.phone || parsedPhone,
          email: prev.email || parsedEmail
        };
      });

      setExtractFeedback({
        type: 'success',
        text: `Extracted successfully! Identified Name: "${parsedName}", GitHub: "${parsedGithub || 'Not found'}", LinkedIn: "${parsedLinkedin || 'Not found'}".`
      });

    } catch (err: any) {
      console.error(err);
      setExtractFeedback({ type: 'error', text: `Extraction failed: ${err.message || err}` });
    } finally {
      setIsExtractingText(false);
    }
  };

  const parsePdfFile = (file: File, resolve: (text: string) => void, reject: (err: any) => void) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error("Empty file reader buffer"));
          return;
        }
        const pdfjsLib = (window as any).pdfjsLib;
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        resolve(fullText);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  };

  // Autonomous Extraction Helpers
  const extractNameFromText = (text: string): string => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Scan matching name labels
    for (const line of lines) {
      const match = line.match(/^Name\s*:\s*(.+)$/i);
      if (match) return match[1].trim();
    }

    // Heuristics: search for the first descriptive line that has no emails, urls, or special tech characters
    for (const line of lines) {
      const val = line.toLowerCase();
      if (val.includes('@') || val.includes('/') || val.includes(':') || /\d{5,}/.test(line)) continue;
      if (val.includes('resume') || val.includes('curriculum') || val.includes('vitae') || val.includes('experience') || val.includes('education')) continue;
      // Skip typical short label lines
      if (line.length > 3 && line.length < 32 && /^[a-zA-Z\s]{4,30}$/.test(line)) {
        return line;
      }
    }
    return "Candidate Name";
  };

  const extractGithubFromText = (text: string): string => {
    const match = text.match(/(?:github\.com)\/([a-zA-Z0-9_\-\.]+)/i);
    return match ? `https://github.com/${match[1]}` : '';
  };

  const extractLinkedinFromText = (text: string): string => {
    const match = text.match(/(?:linkedin\.com\/(in|pub))\/([a-zA-Z0-9_\-\.]+)/i);
    return match ? `https://linkedin.com/${match[0].match(/in\/[a-zA-Z0-9_\-\.]+/i)?.[0] || 'in/' + match[2]}` : '';
  };

  const extractEmailFromText = (text: string): string => {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : '';
  };

  const extractPhoneFromText = (text: string): string => {
    const match = text.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/);
    return match ? match[0] : '';
  };

  // Text File Downloader Helper
  const downloadResume = (member: TeamMember) => {
    if (!member.resumeText) {
      alert("No resume text content available for download.");
      return;
    }
    const cleanName = member.name.replace(/\s+/g, '_');
    const filename = `Resume_${cleanName}.txt`;
    const headerBanner = `========================================================\n` +
                         `BUYQK OFFICIAL TEAM HUB - CANDIDATE RESUME DATABANK\n` +
                         `========================================================\n` +
                         `NAME: ${member.name}\n` +
                         `EMPLOYEE CODE: ${member.employeeCode || 'N/A'}\n` +
                         `EMAIL: ${member.email || 'N/A'}\n` +
                         `PHONE: ${member.phone || 'N/A'}\n` +
                         `GITHUB: ${member.githubUrl || 'N/A'}\n` +
                         `LINKEDIN: ${member.linkedinUrl || 'N/A'}\n` +
                         `CREATION DATE: ${new Date(member.createdAt).toLocaleString()}\n` +
                         `========================================================\n\n` +
                         `[DECODED PDF TEXT CONTENT]:\n\n`;
    
    const fileContent = headerBanner + member.resumeText;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMembers = members.filter(m => {
    const matchedSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.employeeCode && m.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchedStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchedSearch && matchedStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 backdrop-blur-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input 
            type="text"
            placeholder="Search by name, email or employee code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-blue-900/30 rounded-xl py-2.5 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500/50 text-xs font-sans transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <div className="flex rounded-lg overflow-hidden border border-blue-900/30 bg-slate-950 p-1">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wide rounded-md transition-all cursor-pointer ${filterStatus === 'all' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterStatus('employee')}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wide rounded-md transition-all cursor-pointer ${filterStatus === 'employee' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Employees
            </button>
            <button 
              onClick={() => setFilterStatus('candidate')}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wide rounded-md transition-all cursor-pointer ${filterStatus === 'candidate' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Candidates
            </button>
          </div>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-450 hover:bg-yellow-600/90 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-premium"
          >
            <PlusCircle className="w-4 h-4 shrink-0" /> Parse & Add Team Member
          </button>
        </div>
      </div>

      {/* Grid listing */}
      {filteredMembers.length === 0 ? (
        <div className="bg-slate-900/20 border border-blue-900/10 rounded-2xl p-16 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-sans mb-1">No team members or candidate logs found matching criteria.</p>
          <p className="text-[10px] text-slate-500 font-mono">Use "Parse & Add Team Member" to populate records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-slate-900/50 border border-blue-900/20 rounded-2xl p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all shadow-lg hover:shadow-premium relative overflow-hidden group/card"
            >
              {/* Card Accent Top */}
              <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${member.status === 'employee' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
              
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-white font-sans">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {member.status === 'employee' ? (
                        <span className="bg-emerald-950/60 border border-emerald-900/30 text-emerald-450 text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase">
                          Employee: {member.employeeCode || "N/A"}
                        </span>
                      ) : (
                        <span className="bg-blue-950/60 border border-blue-900/30 text-blue-450 text-[9px] px-2 py-0.5 rounded font-bold tracking-wider uppercase">
                          Candidate
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(member)}
                      title="Edit Profile"
                      className="p-2 bg-slate-950 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(member.id, member.name)}
                      title="Delete Record"
                      className="p-2 bg-slate-950 text-red-400 hover:text-red-300 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details layout */}
                <div className="flex flex-col gap-2 mt-4 text-xs font-sans text-left text-slate-350">
                  {/* Email & Phone */}
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{member.email || <span className="italic text-slate-500">No email defined</span>}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* GitHub & LinkedIn Links */}
                  <div className="flex items-center gap-2 mt-1">
                    {member.githubUrl ? (
                      <a 
                        href={member.githubUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] bg-slate-955 bg-[#081325] hover:bg-blue-950/50 border border-blue-900/35 text-slate-300 py-1 px-2 rounded-lg transition-all"
                      >
                        <Github className="w-3.5 h-3.5 text-yellow-500" /> GitHub
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 border border-slate-800/40 py-1 px-2 rounded-lg pointer-events-none select-none">
                        <Github className="w-3.5 h-3.5 opacity-30" /> GitHub
                      </span>
                    )}

                    {member.linkedinUrl ? (
                      <a 
                        href={member.linkedinUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] bg-slate-955 bg-[#081325] hover:bg-blue-950/50 border border-blue-900/35 text-slate-300 py-1 px-2 rounded-lg transition-all"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 border border-slate-800/40 py-1 px-2 rounded-lg pointer-events-none select-none">
                        <Linkedin className="w-3.5 h-3.5 opacity-30" /> LinkedIn
                      </span>
                    )}
                  </div>

                  {/* Resume state message info */}
                  <div className="mt-3 p-3 bg-slate-950/50 rounded-xl border border-blue-950/20 flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Resume Details & Bio</span>
                    {member.resumeText ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-emerald-450 check text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Resume text decoded
                        </span>
                        <button 
                          onClick={() => downloadResume(member)}
                          className="flex items-center gap-1 hover:text-yellow-405 text-[10px] text-yellow-500 font-black cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-yellow-500" /> Download Resume
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 text-slate-500 leading-normal">
                        <span className="text-[10px] text-amber-500 italic font-mono flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Resume not parsed, fallback to bio
                        </span>
                        <p className="text-[10px] line-clamp-2">{member.details || "No bio description entered."}</p>
                      </div>
                    )}
                  </div>

                  {/* Bank Details section if present (always optional) */}
                  {member.bankDetails && (
                    <div className="mt-2 p-2 bg-slate-950/30 rounded-xl border border-slate-900 border-dashed text-[10px]">
                      <span className="font-bold text-slate-400 text-[9px] uppercase tracking-widest block mb-0.5">Bank Information</span>
                      <p className="text-slate-450 font-mono truncate">{member.bankDetails}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Record Created: {new Date(member.createdAt).toLocaleDateString()}</span>
                <span className="group-hover/card:text-yellow-500 transition-colors uppercase tracking-wider select-none text-[8px]">ID: {member.id.substring(7, 13)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Editor / Parser Modal */}
      {isEditorOpen && editingMember && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-900/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="bg-slate-950/80 px-6 py-4 border-b border-blue-900/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">
                  {editingMember.name ? `Edit Profile: ${editingMember.name}` : 'Parse New Candidate Resume & Profile'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">ID: {editingMember.id}</p>
              </div>
              <button 
                onClick={() => { setIsEditorOpen(false); setEditingMember(null); }}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
              {/* PDF Parser Area */}
              <div className="bg-[#081222] border border-blue-900/35 rounded-2xl p-5 text-left flex flex-col gap-3 relative">
                <div className="absolute top-0 right-0 w-[40px] h-[3px] bg-gradient-to-r from-yellow-500 to-amber-500"></div>
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <Sparkles className="w-4 h-4 text-yellow-500" /> Resume Auto-Extraction Wizard
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans mb-1">
                  Upload a candidate resume PDF. Our client-side wizard will extract the text, identify their full name, GitHub URL, LinkedIn URL, email, and phone number, and automatically fill out the form fields below.
                </p>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={isExtractingText}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 flex items-center justify-center gap-2 hover:bg-slate-950 transition-colors">
                      <FileUp className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-slate-200 font-semibold">{isExtractingText ? 'Processing File...' : 'Upload & Parse PDF Resume'}</span>
                    </div>
                  </div>
                </div>

                {extractFeedback && (
                  <div className={`text-[11px] p-3 rounded-lg border leading-relaxed font-sans flex items-start gap-2 ${
                    extractFeedback.type === 'success' ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-350' : 
                    extractFeedback.type === 'error' ? 'bg-red-950/30 border-red-500/20 text-red-350' : 
                    'bg-slate-900 border-slate-700 text-slate-350 animate-pulse'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{extractFeedback.text}</span>
                  </div>
                )}
              </div>

              {/* Main Fields Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Full name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
                  <input 
                    type="text"
                    required
                    value={editingMember.name || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, name: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans"
                    placeholder="Candidate full name"
                  />
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address (Optional)</label>
                  <input 
                    type="email"
                    value={editingMember.email || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, email: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans"
                    placeholder="candidate@gmail.com"
                  />
                </div>

                {/* Telephone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number (Optional)</label>
                  <input 
                    type="text"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, phone: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                {/* Status selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hub Status *</label>
                  <select 
                    value={editingMember.status || 'candidate'}
                    onChange={(e) => setEditingMember(v => v ? { ...v, status: e.target.value as any } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans cursor-pointer"
                  >
                    <option value="candidate">Candidate (Offer / Resume Stage)</option>
                    <option value="employee">Active Employee (Boarded)</option>
                  </select>
                </div>

                {/* Employee Code (Enabled dynamically if status is employee) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Employee Code {editingMember.status === 'employee' && '*'}
                  </label>
                  <input 
                    type="text"
                    required={editingMember.status === 'employee'}
                    value={editingMember.employeeCode || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, employeeCode: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="BQ-ENG-0XX"
                    disabled={editingMember.status !== 'employee'}
                  />
                </div>

                {/* Bank Information details (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank Details (Optional)</label>
                  <input 
                    type="text"
                    value={editingMember.bankDetails || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, bankDetails: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans"
                    placeholder="HDFC Bank - A/C 502XXXXXXXXXXX - IFSC HDFC000XXXX"
                  />
                </div>

                {/* GitHub link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#fbbc04] flex items-center gap-1">
                    <Github className="w-3.5 h-3.5" /> GitHub Profile URL
                  </label>
                  <input 
                    type="url"
                    value={editingMember.githubUrl || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, githubUrl: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans"
                    placeholder="https://github.com/username"
                  />
                </div>

                {/* LinkedIn link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile URL
                  </label>
                  <input 
                    type="url"
                    value={editingMember.linkedinUrl || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, linkedinUrl: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              {/* Bio & Details fallback text */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bio & Interview Feedback (Used if Resume PDF is absent)</label>
                <textarea 
                  value={editingMember.details || ''}
                  onChange={(e) => setEditingMember(v => v ? { ...v, details: e.target.value } : v)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-all font-sans"
                  placeholder="Insert candidate bio, comments, skills, or interview scorecards here..."
                />
              </div>

              {/* Extracted Resume Text (Editable text format representation) */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Extracted Decoded Resume Text Corpus</label>
                <textarea 
                  value={editingMember.resumeText || ''}
                  onChange={(e) => setEditingMember(v => v ? { ...v, resumeText: e.target.value } : v)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-all font-mono leading-relaxed"
                  placeholder="[Extracted Text Content will appear here after pdf parsing...]"
                />
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsEditorOpen(false); setEditingMember(null); }}
                  className="bg-transparent hover:bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-sans shadow-premium"
                >
                  <Save className="w-4 h-4 shrink-0" /> Commit Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
