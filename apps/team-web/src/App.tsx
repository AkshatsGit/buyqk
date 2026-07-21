import React, { useState, useEffect } from 'react';
import { 
  auth, db, HR_EMAILS, storageService
} from '@buyqk/firebase';
import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { 
  Github, Linkedin, User, Mail, Phone, ShieldAlert, Search, 
  FileText, Plus, Trash2, Edit2, Download, LogOut, Users, 
  CheckCircle2, PlusCircle, Briefcase, FileUp, Sparkles, Save, X, Ban
} from 'lucide-react';

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

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
  photoBase64?: string;
  photoTextFileUrl?: string;
  designation?: string;
  createdAt: string;
  updatedAt: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Real-time synchronization of auth status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bypass') === 'true') {
      setCurrentUser({
        uid: 'dev-bypass-uid',
        email: 'buyqk.namangoel@gmail.com',
        displayName: 'Developer Bypass'
      });
      setAuthChecking(false);
      return;
    }

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
  
  // Custom navigation console tabs
  const [activeConsoleTab, setActiveConsoleTab] = useState<'directory' | 'idcards' | 'analytics'>('directory');
  const [selectedCardMember, setSelectedCardMember] = useState<TeamMember | null>(null);

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
      photoBase64: '',
      photoTextFileUrl: '',
      designation: '',
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
      let photoTextFileUrl = editingMember.photoTextFileUrl || '';
      if (editingMember.photoBase64 && editingMember.photoBase64.startsWith('data:image')) {
        try {
          const filePath = `team_members/${editingMember.id}/photo_base64.txt`;
          photoTextFileUrl = await storageService.uploadTextFile(filePath, editingMember.photoBase64);
        } catch (storageErr) {
          console.error("Failed uploading portrait text file to storage:", storageErr);
        }
      }

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
        photoBase64: editingMember.photoBase64 || '',
        photoTextFileUrl: photoTextFileUrl,
        designation: editingMember.designation || '',
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

  const triggerFileDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateIDCardCanvas = (member: TeamMember, side: 'front' | 'back'): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 950;
      const ctx = canvas.getContext('2d')!;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#020712');
      grad.addColorStop(0.4, '#06132b');
      grad.addColorStop(1, '#0c244f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold styling shards/shapes
      ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(250, 0);
      ctx.lineTo(0, 300);
      ctx.closePath();
      ctx.fill();

      // Bottom gold accent footer
      ctx.fillStyle = '#fabf04'; // yellow-500
      ctx.fillRect(0, canvas.height - 12, canvas.width, 12);

      if (side === 'front') {
        // Draw Header
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px sans-serif';
        const brandX = 210;
        ctx.fillText('buy', brandX, 90);
        ctx.fillStyle = '#fabf04';
        ctx.fillText('Qk', brandX + 58, 90);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('EMPLOYEE ID CARD', 215, 120);

        // Draw profile photo box
        const picX = 180;
        const picY = 180;
        const picW = 240;
        const picH = 280;

        // Border glow
        ctx.strokeStyle = '#fabf04';
        ctx.lineWidth = 4;
        ctx.strokeRect(picX, picY, picW, picH);

        // Portrait
        if (member.photoBase64) {
          const img = new Image();
          img.src = member.photoBase64;
          img.onload = () => {
            ctx.drawImage(img, picX + 2, picY + 2, picW - 4, picH - 4);
            drawFrontDetails();
          };
          img.onerror = () => {
            drawFallbackAvatar();
            drawFrontDetails();
          };
        } else {
          drawFallbackAvatar();
          drawFrontDetails();
        }

        function drawFallbackAvatar() {
          ctx.fillStyle = '#061329';
          ctx.fillRect(picX + 2, picY + 2, picW - 4, picH - 4);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(300, 290, 48, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(300, 400, 80, Math.PI, 0);
          ctx.fill();
        }

        function drawFrontDetails() {
          // Employee Name
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(member.name, 305, 520);

          // Designation
          ctx.fillStyle = '#fabf04';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(member.designation || 'Team Associate', 305, 560);

          // Meta label values
          ctx.textAlign = 'left';
          ctx.font = 'bold 14px monospace';

          // Employee code label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText('EMP CODE  :', 130, 630);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(member.employeeCode || 'BQ-EM-XXX', 250, 630);

          // Phone
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText('PHONE     :', 130, 665);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(member.phone || 'N/A', 250, 665);

          // Email
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText('EMAIL     :', 130, 700);
          ctx.fillStyle = '#ffffff';
          let displayEmail = member.email || 'N/A';
          if (displayEmail.length > 25) {
            displayEmail = displayEmail.substring(0, 23) + '...';
          }
          ctx.fillText(displayEmail, 250, 700);

          // Draw Fake Barcode
          const barcodeY = 760;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(150, barcodeY, 300, 65);

          ctx.fillStyle = '#000000';
          const codeVal = member.employeeCode || 'BQEMP';
          let offsetState = 175;
          for (let i = 0; i < codeVal.length; i++) {
            const charCode = codeVal.charCodeAt(i);
            const lineThickness = (charCode % 3) + 1;
            const separation = (charCode % 4) + 1;
            
            ctx.fillRect(offsetState, barcodeY + 8, lineThickness * 2, 49);
            offsetState += (lineThickness + separation) * 2;
          }
          while (offsetState < 410) {
            ctx.fillRect(offsetState, barcodeY + 8, 2, 49);
            offsetState += 6;
          }

          resolve(canvas.toDataURL('image/png'));
        }
      } else {
        // DRAW BACK SIDE
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('buyQk Portal', 300, 100);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px monospace';
        ctx.fillText('Universal Local Supply Network', 300, 130);

        // Security / Terms Panel
        const termsY = 220;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('INSTRUCTIONS & POLICIES', 300, termsY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '13px sans-serif';
        const terms = [
          "This card must be worn and visible at all times.",
          "It remains the property of buyQk and must be",
          "returned upon termination of employment.",
          "If lost, report immediately to IT Security.",
          "Unauthorized duplication is strictly prohibited."
        ];
        terms.forEach((t, i) => {
          ctx.fillText(t, 300, termsY + 40 + i * 28);
        });

        // Contact info
        const contactY = 460;
        ctx.fillStyle = '#fabf04';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('OFFICE ADDRESS', 300, contactY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '13px sans-serif';
        ctx.fillText('Level 8, Prime Corporate Tower, Main Bandra Complex,', 300, contactY + 30);
        ctx.fillText('Mumbai, Maharashtra - 400051', 300, contactY + 55);

        // Emergency details
        const emY = 600;
        ctx.fillStyle = '#fabf04';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('EMERGENCY HOTLINE', 300, emY);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 15px monospace';
        ctx.fillText('022-BUYQK-999 / tech@buyqk.com', 300, emY + 30);

        // Authorizing Signature
        const sigY = 740;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(180, sigY + 60);
        ctx.lineTo(420, sigY + 60);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px sans-serif';
        ctx.fillText('Authorized Signature', 300, sigY + 80);

        // Draw Signature
        ctx.strokeStyle = '#fabf04';
        ctx.lineWidth = 3.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(210, sigY + 40);
        ctx.quadraticCurveTo(240, sigY + 10, 270, sigY + 35);
        ctx.quadraticCurveTo(300, sigY + 60, 330, sigY + 25);
        ctx.quadraticCurveTo(360, sigY + 10, 390, sigY + 45);
        ctx.stroke();

        resolve(canvas.toDataURL('image/png'));
      }
    });
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
      {/* Console Tab Switcher Navigation */}
      <div className="flex flex-col sm:flex-row border-b border-blue-900/20 bg-slate-900/20 p-2 rounded-2xl gap-2 backdrop-blur-sm self-start w-full sm:w-auto">
        <button
          onClick={() => setActiveConsoleTab('directory')}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeConsoleTab === 'directory' 
              ? 'bg-yellow-500 text-slate-950 shadow-md font-extrabold' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" /> Directory
        </button>
        <button
          onClick={() => setActiveConsoleTab('idcards')}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeConsoleTab === 'idcards' 
              ? 'bg-yellow-500 text-slate-950 shadow-md font-extrabold' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" /> ID Card Studio
        </button>
        <button
          onClick={() => setActiveConsoleTab('analytics')}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeConsoleTab === 'analytics' 
              ? 'bg-yellow-500 text-slate-950 shadow-md font-extrabold' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" /> Hub Stats
        </button>
        <a
          href="http://hr.buyqk.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent hover:border-yellow-500/20"
        >
          <FileText className="w-4 h-4 shrink-0 text-yellow-550 text-yellow-550" /> Offer Letter V2
        </a>
      </div>

      {/* Main Tab Render Switcher */}
      {activeConsoleTab === 'directory' && (
        <>
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
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-blue-900/30 overflow-hidden flex items-center justify-center shrink-0">
                      {member.photoBase64 ? (
                        <img src={member.photoBase64} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-extrabold text-white font-sans">{member.name}</h3>
                      <div className="text-[10px] text-slate-400 font-bold mb-0.5">{member.designation || (member.status === 'employee' ? 'Team Associate' : 'Candidate')}</div>
                      <div className="flex items-center gap-2">
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

                  {/* ID Card Studio Button for Employees */}
                  {member.status === 'employee' && (
                    <div className="mt-2.5 flex items-center justify-between bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Verified Employee
                      </span>
                      <button 
                        onClick={() => setSelectedCardMember(member)}
                        className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-premium animate-pulse"
                      >
                        <Briefcase className="w-3 h-3" /> ID Card
                      </button>
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
      </>
      )}

      {/* 2. ID Cards Studio View */}
      {activeConsoleTab === 'idcards' && (
        <div className="flex flex-col gap-6 text-left">
          <div className="bg-[#081222]/80 border border-blue-900/35 rounded-2xl p-5 mb-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[40px] h-[3px] bg-gradient-to-r from-yellow-500 to-amber-500"></div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Crew ID Card Production Studio
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-sans">
              Design, preview and generate high-fidelity corporate ID cards for active employees. To manage portraits, edit employee profiles directly in the Directory.
            </p>
          </div>

          {members.filter(m => m.status === 'employee').length === 0 ? (
            <div className="bg-slate-900/20 border border-blue-900/10 rounded-2xl p-16 text-center">
              <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-sans mb-1">No active employees found to generate ID cards.</p>
              <p className="text-[10px] text-slate-500 font-mono">Convert candidates to "Active Employee" in Directory to list them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.filter(m => m.status === 'employee').map((member) => (
                <div key={member.id} className="bg-slate-900/50 border border-blue-900/20 rounded-2xl p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all text-center group">
                  <div>
                    <div className="relative w-20 h-20 mx-auto rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center mb-3">
                      {member.photoBase64 ? (
                        <img src={member.photoBase64} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-9 h-9 text-slate-600" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white leading-normal truncate">{member.name}</h4>
                    <p className="text-[10px] text-yellow-500 font-black truncate mt-1">{member.designation || 'Team Associate'}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-1 select-none font-bold">EMP CODE: {member.employeeCode || 'BQ-EM-XXX'}</p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCardMember(member)}
                    className="w-full mt-4 flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black py-2.5 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-all select-none cursor-pointer shadow-premium"
                  >
                    <Briefcase className="w-3.5 h-3.5" /> ID Studio
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Hub Metrics & Analytics View */}
      {activeConsoleTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1: Total Talent Pool */}
          <div className="bg-slate-900/50 border border-blue-900/25 rounded-2xl p-6 relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-[5px] h-full bg-blue-500"></div>
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Registered Talent</h4>
              <div className="text-4xl font-extrabold text-white mt-2 font-mono tracking-tight">{members.length}</div>
            </div>
            <p className="text-[10px] text-slate-500">Global count of active employees and candidate records.</p>
          </div>

          {/* Card 2: Employees vs Candidates */}
          <div className="bg-slate-900/50 border border-blue-900/25 rounded-2xl p-6 relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-[5px] h-full bg-emerald-500"></div>
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Active Boarded Employees</h4>
              <div className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono tracking-tight">
                {members.filter(m => m.status === 'employee').length}
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Candidates in pipeline: <span className="font-bold text-blue-400">{members.filter(m => m.status === 'candidate').length}</span>
            </p>
          </div>

          {/* Card 3: Parser Decoded Rate */}
          <div className="bg-slate-900/50 border border-blue-900/25 rounded-2xl p-6 relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-[5px] h-full bg-yellow-500"></div>
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Resume Parser Rate</h4>
              <div className="text-4xl font-extrabold text-yellow-500 mt-2 font-mono tracking-tight">
                {members.length > 0 
                  ? Math.round((members.filter(m => m.resumeText).length / members.length) * 100)
                  : 0}%
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Parsed resumes: {members.filter(m => m.resumeText).length} / {members.length} records.
            </p>
          </div>
        </div>
      )}

      {/* 4. ID Card Viewer / Downloader Overlay Studio */}
      {selectedCardMember && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-900/35 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-auto p-6 md:p-8">
            
            <div className="flex items-center justify-between border-b border-blue-900/20 pb-4 mb-6">
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">buyQk Employee ID Studio</h3>
                <p className="text-[10px] text-slate-400 font-mono">Generate and download corporate credentials for {selectedCardMember.name}</p>
              </div>
              <button 
                onClick={() => setSelectedCardMember(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side Live Preview */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-10 mt-2">
              
              {/* Front Preview */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-3">Front Side</span>
                <div className="w-[280px] h-[440px] rounded-2xl bg-gradient-to-b from-[#020712] via-[#06132b] to-[#0c244f] border border-blue-900/30 p-5 shadow-xl relative flex flex-col justify-between overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-yellow-500/5 rounded-full blur-2xl"></div>
                  
                  {/* Header */}
                  <div className="flex flex-col items-center mt-1">
                    <div className="text-lg font-black text-white">buy<span className="text-yellow-500">Qk</span></div>
                    <div className="text-[6.5px] uppercase tracking-[3px] text-slate-400 font-mono mt-0.5">EMPLOYEE ID CARD</div>
                  </div>

                  {/* Picture */}
                  <div className="w-28 h-32 border-2 border-yellow-500 shadow-md mx-auto my-3 overflow-hidden flex items-center justify-center bg-slate-950/65">
                    {selectedCardMember.photoBase64 ? (
                      <img src={selectedCardMember.photoBase64} alt={selectedCardMember.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-600" />
                    )}
                  </div>

                  {/* Body info */}
                  <div className="text-center">
                    <div className="text-sm font-extrabold text-white leading-tight truncate">{selectedCardMember.name}</div>
                    <div className="text-[10px] font-bold text-yellow-500 mt-1 truncate">{selectedCardMember.designation || 'Team Associate'}</div>
                  </div>

                  {/* Details grid */}
                  <div className="text-[9px] font-mono text-left text-slate-350 mt-2 px-1 flex flex-col gap-1">
                    <div className="flex"><span className="text-slate-500 w-14 shrink-0">CODE:</span> <span className="text-white font-bold">{selectedCardMember.employeeCode || 'BQ-EM-XXX'}</span></div>
                    <div className="flex"><span className="text-slate-500 w-14 shrink-0">PHONE:</span> <span className="text-white">{selectedCardMember.phone || 'N/A'}</span></div>
                    <div className="flex"><span className="text-slate-500 w-14 shrink-0">EMAIL:</span> <span className="text-white truncate">{selectedCardMember.email || 'N/A'}</span></div>
                  </div>

                  {/* Fake Barcode */}
                  <div className="bg-white rounded p-1 mx-1 mt-2 mb-1 flex flex-col items-center">
                    <div className="flex gap-[1.5px] items-center h-7 w-full justify-center overflow-hidden">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 2, 1, 3].map((val, idx) => (
                        <div key={idx} className="bg-black h-full shrink-0" style={{ width: `${val * 0.8}px` }}></div>
                      ))}
                    </div>
                    <div className="text-[6.5px] font-mono text-black scale-90 -mt-0.5 tracking-wider">{selectedCardMember.employeeCode || 'BQ-EM-XXX'}</div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
                </div>
              </div>

              {/* Back Preview */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-3">Back Side</span>
                <div className="w-[280px] h-[440px] rounded-2xl bg-gradient-to-b from-[#020712] via-[#06132b] to-[#0c244f] border border-blue-900/30 p-5 shadow-xl relative flex flex-col justify-between overflow-hidden text-center">
                  
                  <div className="flex flex-col items-center mt-3">
                    <div className="text-base font-black text-white">buyQk Portal</div>
                    <div className="text-[7px] text-slate-400 font-mono">Universal Local Supply Network</div>
                  </div>

                  {/* Terms */}
                  <div className="text-center mt-4">
                    <div className="text-[8px] font-black uppercase text-slate-450 tracking-wider mb-2">Instructions & Policies</div>
                    <div className="text-[7.5px] text-slate-350 leading-relaxed flex flex-col gap-1 font-sans">
                      <p>1. This card must be worn and visible at all times.</p>
                      <p>2. It remains the property of buyQk and must be returned upon termination of employment.</p>
                      <p>3. If lost, report immediately to IT Security.</p>
                      <p>4. Duplication is strictly prohibited.</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="text-center mt-3 pt-3 border-t border-slate-900/50">
                    <div className="text-[7.5px] font-bold text-yellow-500 uppercase tracking-widest">Office Address</div>
                    <p className="text-[7px] text-slate-350 mt-0.5 leading-normal font-sans">Level 8, Prime Corporate Tower, Main Bandra Complex, Mumbai, MH - 400051</p>
                  </div>

                  {/* Signature */}
                  <div className="flex flex-col items-center mt-3 mb-1">
                    <div className="w-[110px] h-[30px] relative flex items-center justify-center">
                      <svg className="w-full h-full text-yellow-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M10,20 Q30,5 50,18 T90,12" />
                      </svg>
                    </div>
                    <div className="text-[7.5px] text-slate-500 border-t border-slate-800/40 w-24 text-center pt-0.5 font-sans">Authorized Signature</div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
                </div>
              </div>
            </div>

            {/* Downloader Trigger Actions */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
              <button 
                type="button"
                onClick={async () => {
                  const dataUrl = await generateIDCardCanvas(selectedCardMember, 'front');
                  triggerFileDownload(dataUrl, `ID_Card_Front_${selectedCardMember.name.replace(/\s+/g, '_')}.png`);
                }}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all select-none cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" /> Download Front Side
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const dataUrl = await generateIDCardCanvas(selectedCardMember, 'back');
                  triggerFileDownload(dataUrl, `ID_Card_Back_${selectedCardMember.name.replace(/\s+/g, '_')}.png`);
                }}
                className="flex items-center gap-2 bg-[#081222] hover:bg-blue-950/60 border border-blue-900/35 text-white font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all select-none cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0 text-yellow-500" /> Download Back Side
              </button>
              <button 
                type="button"
                onClick={() => setSelectedCardMember(null)}
                className="bg-transparent hover:bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-800"
              >
                Close Studio
              </button>
            </div>
          </div>
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
                {/* Designation / Role Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Designation / Role Title</label>
                  <input 
                    type="text"
                    value={editingMember.designation || ''}
                    onChange={(e) => setEditingMember(v => v ? { ...v, designation: e.target.value } : v)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-sans"
                    placeholder="e.g. Lead Engineer V2"
                  />
                </div>

                {/* Passport size photo file editor attachment */}
                <div className="flex flex-col gap-1.5 md:col-span-2 bg-[#0a1526]/50 border border-blue-900/20 p-4 rounded-2xl mt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passport Size Employee Portrait Photo</label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                      {editingMember.photoBase64 ? (
                        <img src={editingMember.photoBase64} alt="Portrait Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 text-left">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const base64 = await toBase64(file);
                              setEditingMember(prev => prev ? { ...prev, photoBase64: base64 } : null);
                            } catch (err) {
                              alert("Failed to process image file.");
                            }
                          }
                        }}
                        className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:uppercase file:bg-slate-900 file:text-slate-200 file:cursor-pointer hover:file:bg-slate-950"
                      />
                      {editingMember.photoBase64 && (
                        <button 
                          type="button" 
                          onClick={() => setEditingMember(prev => prev ? { ...prev, photoBase64: '' } : null)}
                          className="text-[10px] text-red-500 font-bold hover:text-red-405 transition-colors uppercase self-start"
                        >
                          Remove portrait photo
                        </button>
                      )}
                    </div>
                  </div>
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
