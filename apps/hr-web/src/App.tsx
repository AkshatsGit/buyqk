import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Download, Printer, User, Calendar, DollarSign, 
  Briefcase, Upload, Plus, Trash2, Building, Mail, Phone, 
  FileCheck, LogOut, Check, X, ShieldAlert, Layout
} from 'lucide-react';
import { auth, db } from '@buyqk/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface CandidateRecord {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  joiningDate: string;
  ctc: string;
  expiryDate: string;
  date: string;
  refNo: string;
  customText: string;
  companyName?: string;
  companyCIN?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  companyTagline?: string;
  currencySymbol?: string;
  useDarkHeader?: boolean;
}

const DEFAULT_TEMPLATES = {
  tech: `We are pleased to offer you the position of {position} at buyQk. This letter contains the general terms and conditions of your employment.

Your joining date will be {joiningDate}. You will receive a Total Annual Compensation Package (CTC) of {ctc}, details of which are defined in the compensation breakout sheet.

In your capacity as {position}, you will report to the Engineering leadership team and will be responsible for designing and deploying software backend and frontend systems.

Please review this offer letter and sign below to signify your acceptance of this offer. This offer is valid until {expiryDate}. We look forward to welcome you!`,
  
  web_development_intern: `We are pleased to offer you the position of Web Development Intern at buyQk. During this internship, you will be working closely with our engineering team to construct and design next-generation hyper-local commerce web systems.

Your joining date will be {joiningDate}. You will receive a monthly stipend of {ctc}.

Your internship tenure will be for a duration of 3 to 6 months, subject to performance reviews. Please review this letter and sign below to signify your acceptance. This offer is valid until {expiryDate}.`,

  test_engineer: `We are pleased to offer you the position of Test Engineer at buyQk Tech Private Limited. In this role, you will be executing automated regression suites, monitoring API integrations, and confirming quality thresholds across all buyQk seller and customer nodes.

Your joining date will be {joiningDate}. You will receive a Total Annual Compensation Package (CTC) of {ctc}.

Please review this offer letter and sign below to confirm acceptance before the expiry on {expiryDate}. We look forward to welcome you to our Quality Assurance team!`,

  operations: `We are pleased to offer you the position of {position} at buyQk. This letter contains the general terms and conditions of your onboarding.

Your joining date will be {joiningDate}. You will receive a Total Annual Compensation Package (CTC) of {ctc}.

In this role, you will lead our operations network, onboarding merchants, managing localized seller geofences, and coordinating real-time distribution streams to maximize transaction speed and retail engagement.

Please sign this letter of acceptance below to confirm your confirmation. This offer remains valid till {expiryDate}.`,

  custom: `We are pleased to offer you the position of {position} at buyQk. This letter contains the general terms and conditions of your employment.

Your joining date will be {joiningDate}. You will receive a Total Annual Compensation Package (CTC) of {ctc}.

Please review this offer letter and sign below to signify your acceptance. This offer is valid till {expiryDate}.`
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authChecking, setAuthChecking] = useState(true);

  // Offers Data list
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [activeId, setActiveId] = useState<string>('new');

  // Input states
  const [name, setName] = useState('John Doe');
  const [position, setPosition] = useState('Lead Software Engineer');
  const [email, setEmail] = useState('john.doe@example.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [joiningDate, setJoiningDate] = useState('2026-08-01');
  const [ctc, setCtc] = useState('12,00,000 Per Annum');
  const [expiryDate, setExpiryDate] = useState('2026-07-25');
  const [date, setDate] = useState('2026-07-15');
  const [refNo, setRefNo] = useState('BQ/2026/HR-089');

  // Corporate Settings details
  const [companyName, setCompanyName] = useState('buyQk Tech Private Limited');
  const [companyCIN, setCompanyCIN] = useState('CIN: U72900DL2024PTC413245');
  const [companyEmail, setCompanyEmail] = useState('hr@buyqk.com');
  const [companyPhone, setCompanyPhone] = useState('+91 98765 43210');
  const [companyAddress, setCompanyAddress] = useState(''); // Default empty
  const [companyWebsite, setCompanyWebsite] = useState('buyqk.com');
  const [companyTagline, setCompanyTagline] = useState('HYPERLOCAL COMMERCE ENGINE');
  const [currencySymbol, setCurrencySymbol] = useState('INR (₹)');
  const [useDarkHeader, setUseDarkHeader] = useState(false);
  
  // Custom templates & body
  const [templateKey, setTemplateKey] = useState<keyof typeof DEFAULT_TEMPLATES>('tech');
  const [customText, setCustomText] = useState(DEFAULT_TEMPLATES.tech);

  // Signatures State
  const [founderSign, setFounderSign] = useState<string>('');
  const [cofounderSign, setCofounderSign] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);

  // Auth Hook listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email === 'akshat.srivastava098@gmail.com') {
          user.role = 'admin';
        }
        if (user.role === 'hr' || user.role === 'admin') {
          setCurrentUser(user);
          setAuthError('');
        } else {
          setAuthError("Access Denied: Your account role is not HR Manager or Admin.");
          auth.signOut();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });
    
    // Load local signs
    const fSign = localStorage.getItem('bq_founder_sign');
    if (fSign) setFounderSign(fSign);
    const coSign = localStorage.getItem('bq_cofounder_sign');
    if (coSign) setCofounderSign(coSign);

    return () => unsubscribe();
  }, []);

  // Firebase Real-time sync for Candidate records list
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'hr_offers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: CandidateRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as any);
      });
      setCandidates(records);
    }, (err) => {
      console.error("Firestore loading error:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Update body text when templates switch
  useEffect(() => {
    setCustomText(DEFAULT_TEMPLATES[templateKey]);
  }, [templateKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authEmail !== 'akshat.srivastava098@gmail.com') {
        throw new Error("Access Denied: Only akshat.srivastava098@gmail.com is authorized to access the HR Panel.");
      }
      const u = await auth.signIn({ email: authEmail, password: authPassword });
      if (u.role !== 'hr' && u.role !== 'admin') {
        throw new Error("Access Denied: You do not possess HR system access permissions.");
      }
      setCurrentUser(u);
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.");
      auth.signOut();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const u = await auth.signInWithGoogle('hr');
      if (u.email !== 'akshat.srivastava098@gmail.com') {
        throw new Error("Access Denied: Only akshat.srivastava098@gmail.com is authorized to access the HR Panel.");
      }
      setCurrentUser({ ...u, role: 'admin' });
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in with Google.");
      auth.signOut();
    } finally {
      setAuthLoading(false);
    }
  };

  const saveToHistory = async () => {
    if (!currentUser || !name.trim()) return;
    const record = {
      name,
      position,
      email,
      phone,
      joiningDate,
      ctc,
      expiryDate,
      date,
      refNo,
      customText,
      companyName,
      companyCIN,
      companyEmail,
      companyPhone,
      companyAddress,
      companyWebsite,
      companyTagline,
      currencySymbol,
      useDarkHeader,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const docId = activeId === 'new' ? Math.random().toString(36).substring(2, 9) : activeId;
      await setDoc(doc(db, 'hr_offers', docId), record, { merge: true });
      setActiveId(docId);
    } catch (e: any) {
      alert("Failed syncing with Firebase: " + e.message);
    }
  };

  const loadRecord = (rec: CandidateRecord) => {
    setActiveId(rec.id);
    setName(rec.name || '');
    setPosition(rec.position || '');
    setEmail(rec.email || '');
    setPhone(rec.phone || '');
    setJoiningDate(rec.joiningDate || '');
    setCtc(rec.ctc || '');
    setExpiryDate(rec.expiryDate || '');
    setDate(rec.date || '');
    setRefNo(rec.refNo || '');
    setCustomText(rec.customText || '');
    if (rec.companyName) setCompanyName(rec.companyName);
    if (rec.companyCIN) setCompanyCIN(rec.companyCIN);
    if (rec.companyEmail) setCompanyEmail(rec.companyEmail);
    if (rec.companyPhone) setCompanyPhone(rec.companyPhone);
    if (rec.companyAddress !== undefined) setCompanyAddress(rec.companyAddress || '');
    if (rec.companyWebsite) setCompanyWebsite(rec.companyWebsite);
    if (rec.companyTagline) setCompanyTagline(rec.companyTagline);
    if (rec.currencySymbol) setCurrencySymbol(rec.currencySymbol);
    if (rec.useDarkHeader !== undefined) setUseDarkHeader(rec.useDarkHeader);
  };

  const createNewDraft = () => {
    setActiveId('new');
    setName('');
    setPosition('');
    setEmail('');
    setPhone('');
    setJoiningDate('');
    setCtc('');
    setExpiryDate('');
    setDate(new Date().toISOString().split('T')[0]);
    setRefNo(`BQ/${new Date().getFullYear()}/HR-${Math.floor(100 + Math.random() * 900)}`);
    setCustomText(DEFAULT_TEMPLATES.tech);
  };

  const deleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this offer letter draft?")) return;
    try {
      await deleteDoc(doc(db, 'hr_offers', id));
      if (activeId === id) createNewDraft();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSignatureUpload = (person: 'founder' | 'cofounder', file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (person === 'founder') {
        setFounderSign(b64);
        localStorage.setItem('bq_founder_sign', b64);
      } else {
        setCofounderSign(b64);
        localStorage.setItem('bq_cofounder_sign', b64);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSignature = (person: 'founder' | 'cofounder') => {
    if (person === 'founder') {
      setFounderSign('');
      localStorage.removeItem('bq_founder_sign');
    } else {
      setCofounderSign('');
      localStorage.removeItem('bq_cofounder_sign');
    }
  };

  const compiledText = () => {
    let t = customText;
    t = t.replace(/{name}/g, name || "[Candidate Name]");
    t = t.replace(/{position}/g, position || "[Position]");
    t = t.replace(/{joiningDate}/g, joiningDate || "[Joining Date]");
    t = t.replace(/{ctc}/g, ctc ? `${ctc} (${currencySymbol})` : "[Stipend/Salary]");
    t = t.replace(/{expiryDate}/g, expiryDate || "[Expiry Date]");
    return t;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    saveToHistory();
    const element = document.getElementById('offer-letter-print-zone');
    if (!element) return;
    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => executePDFDownload(element);
      document.body.appendChild(script);
    } else {
      executePDFDownload(element);
    }
  };

  const executePDFDownload = (element: HTMLElement) => {
    const filename = `Offer_Letter_${(name || "Candidate").trim().replace(/\s+/g, '_')}.pdf`;
    const options = {
      margin: [0.3, 0.4, 0.4, 0.4],
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2.5, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    (window as any).html2pdf().set(options).from(element).save();
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Checking credentials session...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render credentials portal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />
        <div className="w-full max-w-md bg-slate-900/40 border border-blue-900/30 rounded-3xl p-8 backdrop-blur-xl shadow-premium">
          <div className="flex flex-col items-center gap-3 text-center mb-8">
            <img src="/assets/logoimg.png" className="w-20 h-auto object-contain block hover:scale-105 transition-all duration-300" alt="buyqk logo" />
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase tracking-widest text-sm">
              buyQk HR Portal
            </h2>
            <p className="text-xs text-slate-400">Restricted administrative sign in</p>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5 mb-6 text-left">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed font-semibold">{authError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
              <input 
                type="email" 
                placeholder="hr@buyqk.com" 
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
              />
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-slate-950 py-3 rounded-xl text-xs font-bold shadow-gold-glow transition-all duration-300 mt-4 uppercase tracking-wider"
            >
              {authLoading ? 'Authorizing Login Session...' : 'Authenticate Account'}
            </button>

            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-blue-900/30"></div>
              <span className="px-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">or secure provider</span>
              <div className="flex-1 border-t border-blue-900/30"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full bg-slate-950 border border-blue-900/40 hover:border-yellow-500/50 hover:bg-slate-900 text-slate-200 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign Up / Sign In via Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
      
      {/* Navigation Header */}
      <header className="no-print bg-slate-950 border-b border-blue-900/30 px-6 h-16 flex items-center justify-between shrink-0 relative z-50">
        <div className="flex items-center gap-3">
          <img src="/assets/logoimg.png" alt="buyQk logo" className="h-9 w-auto object-contain" />
          <div className="h-5 w-[1px] bg-slate-800" />
          <div>
            <h1 className="font-bold text-slate-100 uppercase tracking-widest text-[#FFF] text-xs">Human Resources</h1>
            <p className="text-[10px] text-yellow-500 font-semibold uppercase tracking-wider">Candidate Offer Center</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 font-sans">
          <button 
            onClick={createNewDraft} 
            className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-xs font-semibold hover:bg-yellow-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Offer
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold hover:border-slate-700 transition-all z-20"
          >
            <Printer className="w-3.5 h-3.5" /> Print Layout
          </button>

          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold shadow-gold-glow transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          {/* User Signout */}
          <button 
            onClick={() => auth.signOut()}
            className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main split dashboard content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Form parameters & History */}
        <section className="no-print w-full lg:w-[42%] flex flex-col gap-6 overflow-y-auto p-6 border-r border-blue-900/10 bg-slate-950/40">
          
          {/* History / Drafts */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-yellow-500" /> Offer History & Drafts ({candidates.length})
            </h3>
            
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
              {candidates.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                  No records stored in Firebase yet. Set a candidate details sheet to save.
                </p>
              ) : (
                candidates.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => loadRecord(c)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                      activeId === c.id 
                        ? 'bg-yellow-500/10 border-yellow-500/40' 
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-[#081C3A] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-xs font-bold text-slate-200 truncate">{c.name || 'Untitled Draft'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.position || 'No Role'} &bull; {c.date}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => deleteRecord(c.id, e)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form details Panel */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-yellow-500" /> 1. Candidate Custom Fields
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Reference No.</label>
                <input 
                  type="text" 
                  value={refNo} 
                  onChange={e => setRefNo(e.target.value)}
                  className="bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Offer Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-455">Candidate Name</label>
              <input 
                type="text" 
                value={name} 
                placeholder="e.g. Akash Anand"
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Candidate Email</label>
                <input 
                  type="email" 
                  value={email} 
                  placeholder="name@example.com"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Candidate Phone</label>
                <input 
                  type="text" 
                  value={phone} 
                  placeholder="+91 99999 99999"
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-455">Job Title / Designation</label>
              <input 
                type="text" 
                value={position} 
                placeholder="e.g. Web Development Intern"
                onChange={e => setPosition(e.target.value)}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Joining Date</label>
                <input 
                  type="date" 
                  value={joiningDate} 
                  onChange={e => setJoiningDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold font-sans"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-455">CTC (Optional)</label>
                  {ctc && (
                    <button onClick={() => setCtc('')} className="text-[9px] text-red-400 hover:underline">Clear</button>
                  )}
                </div>
                <input 
                  type="text" 
                  value={ctc} 
                  placeholder="e.g. 15,00,000 Per Annum (Leave empty if none)"
                  onChange={e => setCtc(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Currency Symbol</label>
                <input 
                  type="text" 
                  value={currencySymbol} 
                  placeholder="e.g. INR (₹), USD ($)"
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455 font-sans">Expiry Date</label>
                <input 
                  type="date" 
                  value={expiryDate} 
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold font-sans"
                />
              </div>
            </div>
          </div>

          {/* Corporate Settings parameters */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building className="w-4 h-4 text-yellow-500" /> 2. Company Info (Address / Phone)
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-455">Company Legal Name</label>
              <input 
                type="text" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Registration CIN</label>
                <input 
                  type="text" 
                  value={companyCIN} 
                  onChange={e => setCompanyCIN(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60 text-xs font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455 font-sans">Website URL</label>
                <input 
                  type="text" 
                  value={companyWebsite} 
                  onChange={e => setCompanyWebsite(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60 text-xs font-medium font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455">Support Email</label>
                <input 
                  type="email" 
                  value={companyEmail} 
                  onChange={e => setCompanyEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60 text-xs font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-455 font-sans">Support Phone</label>
                <input 
                  type="text" 
                  value={companyPhone} 
                  onChange={e => setCompanyPhone(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60 text-xs font-medium font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-455">Company Office Address (Omit to hide)</label>
              <textarea 
                value={companyAddress} 
                onChange={e => setCompanyAddress(e.target.value)}
                placeholder="No office? Leave empty; only CIN, Phone/Email metrics will show."
                rows={2}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500/60 text-xs font-semibold leading-normal font-sans"
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
              <input 
                type="checkbox" 
                id="use-dark-header" 
                checked={useDarkHeader} 
                onChange={e => setUseDarkHeader(e.target.checked)}
                className="rounded text-yellow-500 focus:ring-yellow-500 text-slate-950" 
              />
              <label htmlFor="use-dark-header" className="text-xs text-slate-350 cursor-pointer font-medium select-none">
                Apply premium solid dark navy header band
              </label>
            </div>
          </div>

          {/* Letter Body / Custom Copy Editor */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-500" /> 3. Templates & Rich Copy
              </h3>
              
              <select
                value={templateKey}
                onChange={e => setTemplateKey(e.target.value as any)}
                className="bg-slate-950 text-[10px] font-bold text-yellow-500 border border-slate-800 rounded px-2 py-1 focus:outline-none"
              >
                <option value="tech">Tech SDE Fulltime</option>
                <option value="web_development_intern">Web Dev Intern</option>
                <option value="test_engineer">Test Engineer</option>
                <option value="operations">Operations Associate</option>
                <option value="custom">Custom Template</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                rows={8}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-mono leading-relaxed"
                placeholder="Compose offer letter..."
              />
            </div>
            
            <button 
              onClick={saveToHistory}
              className="flex items-center justify-center gap-2 bg-[#081C3A] hover:bg-blue-950/70 border border-blue-800/40 text-slate-200 py-3 rounded-xl text-xs font-bold transition-all"
            >
              <FileCheck className="w-4 h-4 text-yellow-500" /> Save Offer to Firebase Cloud
            </button>
          </div>

          {/* HR Signature Authorization */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-5 mb-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="w-4 h-4 text-yellow-500" /> 4. Signature Assets
            </h3>

            {/* Founder Sign */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350">Founder: Ankit Shrivastava</span>
                {founderSign && (
                  <button onClick={() => clearSignature('founder')} className="text-[10px] text-red-400 hover:text-red-300 font-semibold">Clear</button>
                )}
              </div>
              {founderSign ? (
                <div className="h-16 w-32 border border-slate-800 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                  <img src={founderSign} alt="Founder Signature" className="h-full w-auto object-contain" />
                </div>
              ) : (
                <div className="relative border border-dashed border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center hover:border-slate-700 transition-all cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files?.[0] && handleSignatureUpload('founder', e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 text-slate-500 mb-1" />
                  <p className="text-[10px] text-slate-450 text-center">Upload founder sign</p>
                </div>
              )}
            </div>

            {/* Cofounder Sign */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350">Co-Founder: Akshat Srivastava</span>
                {cofounderSign && (
                  <button onClick={() => clearSignature('cofounder')} className="text-[10px] text-red-400 hover:text-red-300 font-semibold">Clear</button>
                )}
              </div>
              {cofounderSign ? (
                <div className="h-16 w-32 border border-slate-800 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                  <img src={cofounderSign} alt="Co-Founder Signature" className="h-full w-auto object-contain" />
                </div>
              ) : (
                <div className="relative border border-dashed border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center hover:border-slate-700 transition-all cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files?.[0] && handleSignatureUpload('cofounder', e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 text-slate-500 mb-1" />
                  <p className="text-[10px] text-slate-450 text-center">Upload cofounder sign</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Live A4 PDF Preview (Zone isolated scroll) */}
        <section className="w-full lg:w-[58%] flex flex-col items-center justify-start overflow-y-auto p-8 bg-slate-900/60 border-l border-[#0B1528]/80 scrollbar-thin">
          <span className="no-print text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5 font-sans">
            <Layout className="w-4 h-4 text-yellow-500" /> A4 Scaled Letterhead preview template
          </span>

          <div
            id="offer-letter-print-zone"
            ref={previewRef}
            className="a4-page bg-white text-slate-900 shadow-2xl p-0 w-[8.27in] min-h-[11.7in] max-w-[8.27in] flex flex-col justify-between text-left relative overflow-hidden shrink-0"
            style={{ 
              boxSizing: 'border-box',
              fontFamily: "'Inter', sans-serif",
              lineHeight: '1.5',
              fontSize: '10.5pt'
            }}
          >
            {/* Header Block with Skewed Gold Slice */}
            <div className="relative w-full h-[1.3in] bg-[#021835] text-white flex items-center justify-between px-[0.8in] overflow-hidden shrink-0">
              {/* Golden slanted corner highlight */}
              <div className="absolute top-0 right-0 w-[38%] h-full bg-[#fbbc04] transform skew-x-[-30deg] translate-x-[20%]" style={{ borderLeft: '6px solid #021835' }} />
              
              {/* Corner decor */}
              <div className="absolute top-2 right-2 flex gap-1 z-20">
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/25 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
              </div>

              {/* Diagonal sweeping yellow/navy under-lines */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#fbbc04] transform" style={{ clipPath: 'polygon(0 80%, 35% 0, 100% 100%, 0 100%)' }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#021835] transform" style={{ clipPath: 'polygon(0 85%, 33% 20%, 100% 100%, 0 100%)' }} />

              <div className="relative z-10 flex items-center gap-4">
                {/* Logo Hexagon Outline */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="absolute w-full h-full text-[#fbbc04]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6.5">
                      <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                    </svg>
                    {/* Cart with lines */}
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 4h1.5l1.5 10h10l1.5-6H7.5" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="6" y1="9" x2="16" y2="9" strokeLinecap="round" />
                      <circle cx="8" cy="18" r="1.5" fill="currentColor" />
                      <circle cx="16" cy="18" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                  {/* brand title */}
                  <div className="text-left font-sans">
                    <span className="text-3xl font-extrabold tracking-tight text-white">
                      buy<span className="text-[#fbbc04]">Qk</span>
                    </span>
                  </div>
                </div>

                {/* Vertical Divider line */}
                <div className="w-[1.5px] h-9 bg-white/20"></div>

                {/* Tagline stacked details */}
                <div className="text-left leading-normal font-sans">
                  <p className="text-[7pt] tracking-[0.18em] font-black uppercase text-slate-200">
                    THE UNIVERSAL<br/>LOCAL SUPPLY<br/>NETWORK
                  </p>
                </div>
              </div>
            </div>

            {/* Reference and Date block */}
            <div className="flex flex-col gap-2 items-end justify-start text-[9pt] text-slate-800 font-sans mt-[0.35in] px-[0.8in] w-full shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#021835] text-white rounded-md flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <span className="font-bold text-slate-800">Date:</span>
                <span className="border-b border-slate-300 min-w-[200px] text-left pl-2 font-medium text-slate-900">
                  {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-6 h-6 bg-[#021835] text-white rounded-md flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <span className="font-bold text-slate-800">Ref:</span>
                <span className="border-b border-slate-300 min-w-[200px] text-left pl-2 font-medium text-slate-900 font-mono">
                  REF: {refNo || "BQ/"}
                </span>
              </div>
            </div>

            {/* Document Header Title block */}
            <div className="text-center my-5 flex flex-col items-center shrink-0">
              <h1 className="text-[23pt] font-black tracking-tight text-[#021835] font-sans m-0">OFFER LETTER</h1>
              {/* Divider with hexagon */}
              <div className="flex items-center justify-center w-full max-w-[200px] mt-1 relative">
                <div className="w-full h-[1.5px] bg-[#fbbc04]"></div>
                <div className="absolute bg-white px-2">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04]" viewBox="0 0 100 100" fill="currentColor">
                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Letter Body Area */}
            <div className="flex-1 flex flex-col justify-start px-[0.8in] text-slate-800">
              {/* Recipient details */}
              <div className="mb-5 text-left text-[10.5pt]">
                <p className="font-bold text-slate-700 m-0">Dear <span className="border-b border-slate-300 px-4 font-black text-[#021835]">{name || "____________________"}</span>,</p>
              </div>

              {/* Main content paragraph */}
              <div className="mb-4 text-left leading-relaxed text-justify text-[10pt] text-slate-700">
                we are pleased to offer you the position of <span className="border-b border-slate-300 px-4 font-bold text-slate-950">{position || "____________________"}</span> at <span className="font-extrabold text-[#021835]">buyQk</span>.
              </div>

              <div 
                className="text-[10pt] text-slate-750 leading-relaxed text-justify mb-5 font-sans"
                style={{ whiteSpace: 'pre-line' }}
              >
                {compiledText()}
              </div>

              {/* Optional CTC details overview grid table */}
              {ctc && (
                <div className="mb-5 font-sans text-left shrink-0">
                  <h4 className="text-[8.5pt] font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Salary Breakup Guidelines</h4>
                  <table className="w-full border border-slate-200 text-[9pt] border-collapse bg-slate-50/20">
                    <thead>
                      <tr className="bg-slate-100/60 text-slate-700 border-b border-slate-200">
                        <th className="border-r border-slate-200 px-3 py-1 text-left font-bold uppercase tracking-wider text-[7.5pt]">Designation / Package detail</th>
                        <th className="px-3 py-1 text-right font-bold uppercase tracking-wider text-[7.5pt]">Structure ({currencySymbol})</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-150">
                        <td className="border-r border-slate-200 px-3 py-1.5 text-slate-600">Assigned Corporate Role</td>
                        <td className="px-3 py-1.5 text-right text-slate-900 font-bold">{position || "TBD"}</td>
                      </tr>
                      <tr className="border-b border-slate-150">
                        <td className="border-r border-slate-200 px-3 py-1.5 text-slate-600">Monthly Remuneration / Annual CTC</td>
                        <td className="px-3 py-1.5 text-right text-slate-950 font-black">{ctc}</td>
                      </tr>
                      {joiningDate && (
                        <tr>
                          <td className="border-r border-slate-200 px-3 py-1.5 text-slate-600">Start Date / Date of Joining</td>
                          <td className="px-3 py-1.5 text-right text-slate-900 font-semibold">
                            {new Date(joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Signature Block Area with vertical separator line */}
            <div className="mt-auto px-[0.8in] py-4 w-full shrink-0">
              <div className="relative grid grid-cols-2 gap-12 w-full pt-8 border-t border-slate-200">
                {/* Vertical Divider line with golden hexagon */}
                <div className="absolute top-[10%] bottom-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-[1px] bg-slate-200">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04] bg-white rounded-full p-0.5" viewBox="0 0 100 100" fill="currentColor">
                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                  </svg>
                </div>

                {/* Founder Column */}
                <div className="relative flex flex-col items-center text-center font-sans">
                  {/* Silhouette icon on gold Hexagon */}
                  <div className="absolute -top-[1.2in] left-4 w-11 h-11 flex items-center justify-center shrink-0">
                    <svg className="absolute w-full h-full text-[#fbbc04]" viewBox="0 0 100 100" fill="currentColor">
                      <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                    </svg>
                    <svg className="relative w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  
                  {/* Name and Designation */}
                  <div className="text-left w-full pl-2">
                    <h3 className="text-[11pt] font-black text-slate-800 mb-0.5">Ankit Shrivastava</h3>
                    <p className="text-[8.5pt] text-slate-500 font-semibold mb-3">Founder</p>
                  </div>

                  {/* Sign Image Zone */}
                  <div className="h-14 flex items-end justify-center w-full relative mb-1">
                    {founderSign ? (
                      <img 
                        src={founderSign} 
                        alt="Ankit Signature" 
                        className="h-12 w-auto object-contain block max-w-full z-10"
                      />
                    ) : (
                      <div className="italic text-[12pt] text-slate-350 select-none pb-1 font-serif">
                        [Pending Signature]
                      </div>
                    )}
                  </div>

                  {/* Navy border and label */}
                  <div className="w-full border-t-2 border-[#021835] my-1" />
                  <p className="text-[8pt] uppercase tracking-widest text-[#021835] font-extrabold mt-1">Signature</p>
                </div>

                {/* Co-Founder Column */}
                <div className="relative flex flex-col items-center text-center font-sans">
                  {/* Co-Founder Silhouette icon on gold Hexagon */}
                  <div className="absolute -top-[1.2in] left-4 w-11 h-11 flex items-center justify-center shrink-0">
                    <svg className="absolute w-full h-full text-[#fbbc04]" viewBox="0 0 100 100" fill="currentColor">
                      <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                    </svg>
                    <svg className="relative w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  
                  {/* Name and Designation */}
                  <div className="text-left w-full pl-2">
                    <h3 className="text-[11pt] font-black text-slate-800 mb-0.5">Akshat Srivastava</h3>
                    <p className="text-[8.5pt] text-slate-500 font-semibold mb-3">Co-Founder</p>
                  </div>

                  {/* Sign Image Zone */}
                  <div className="h-14 flex items-end justify-center w-full relative mb-1">
                    {cofounderSign ? (
                      <img 
                        src={cofounderSign} 
                        alt="Akshat Signature" 
                        className="h-12 w-auto object-contain block max-w-full z-10"
                      />
                    ) : (
                      <div className="italic text-[12pt] text-slate-350 select-none pb-1 font-serif">
                        [Pending Signature]
                      </div>
                    )}
                  </div>

                  {/* Navy border and label */}
                  <div className="w-full border-t-2 border-[#021835] my-1" />
                  <p className="text-[8pt] uppercase tracking-widest text-[#021835] font-extrabold mt-1">Signature</p>
                </div>
              </div>
            </div>

            {/* Page Footer Block with metrics */}
            <div className="relative w-full h-[0.9in] bg-[#021835] text-white flex items-center justify-between pl-0 pr-[0.8in] overflow-hidden shrink-0 mt-6">
              
              {/* Rocket yellow accent slant left */}
              <div className="relative h-full w-[20%] bg-[#fbbc04] flex items-center justify-center pr-3 shrink-0" style={{ clipPath: 'polygon(0 0, 82% 0, 100% 100%, 0 100%)' }}>
                <svg className="w-8 h-8 text-[#021835]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 2 1 3.5 1 3.5s1.5-1 3.5-1c3 0 5.5-2.5 5.5-5.5" />
                  <path d="M22 2l-3 3-5-2-4 4 3 3-3 3 2 2 3-3 3 3 4-4-2-5 3-3z" />
                </svg>
              </div>

              {/* Slogan details block */}
              <div className="text-left leading-normal shrink-0 font-sans tracking-wide">
                <span className="text-[7.5pt] font-black text-white">FIND ANYTHING.<br/></span>
                <span className="text-[7.5pt] font-black text-[#fbbc04]">DELIVER ANYTHING.<br/></span>
                <span className="text-[7.5pt] font-black text-white font-mono">INSTANTLY.</span>
              </div>

              {/* Gold vertical line separator */}
              <div className="w-[1px] h-9 bg-white/10 shrink-0"></div>

              {/* Metric links block */}
              <div className="flex items-center gap-6 font-sans shrink-0">
                {/* 1. Local Sellers */}
                <div className="flex flex-col items-center gap-0.5">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M3 11L12 2l9 9" />
                  </svg>
                  <span className="text-[5pt] font-black uppercase text-slate-300 tracking-wider">Local<br/>Sellers</span>
                </div>

                <div className="w-[1px] h-7 bg-white/10 shrink-0"></div>

                {/* 2. Happy Customers */}
                <div className="flex flex-col items-center gap-0.5">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <span className="text-[5pt] font-black uppercase text-slate-300 tracking-wider">Happy<br/>Customers</span>
                </div>

                <div className="w-[1px] h-7 bg-white/10 shrink-0"></div>

                {/* 3. Fast & Reliable */}
                <div className="flex flex-col items-center gap-0.5">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[5pt] font-black uppercase text-[#fbbc04] tracking-wider font-semibold">Fast & Reliable<br/>Delivery</span>
                </div>

                <div className="w-[1px] h-7 bg-white/10 shrink-0"></div>

                {/* 4. Safe & Secure */}
                <div className="flex flex-col items-center gap-0.5">
                  <svg className="w-3.5 h-3.5 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-[5pt] font-black uppercase text-slate-300 tracking-wider">Safe &<br/>Secure</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
