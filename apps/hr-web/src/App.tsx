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
            className="a4-page bg-white text-slate-950 shadow-2xl p-[0.75in] w-[8.27in] min-h-[11.69in] max-w-[8.27in] flex flex-col text-left font-serif relative overflow-hidden shrink-0"
            style={{ 
              boxSizing: 'border-box',
              fontFamily: "'Inter', 'Georgia', serif",
              lineHeight: '1.6',
              fontSize: '11pt'
            }}
          >
            {/* Header Letterhead Background Line */}
            {!useDarkHeader && (
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#081C3A] via-yellow-500 to-[#0b2545] no-print" />
            )}
            
            {/* Company Info Logo Header block */}
            <div className={`flex items-start justify-between border-b pb-4 mb-6 ${
              useDarkHeader 
                ? 'bg-slate-950 text-white p-6 -mx-[0.75in] -mt-[0.75in] mb-6 border-none' 
                : 'border-slate-200'
            }`}>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center font-bold text-slate-950 font-sans text-lg tracking-tight select-none">
                    q
                  </div>
                  <h2 className={`font-bold ${useDarkHeader ? 'text-white' : 'text-[#081C3A]'}`} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '15pt', letterSpacing: '0.05em' }}>
                    {companyName.split(' ')[0]}
                  </h2>
                </div>
                <p className={`text-[7pt] uppercase tracking-widest font-extrabold font-sans ${useDarkHeader ? 'text-yellow-500' : 'text-slate-400'}`}>
                  {companyTagline}
                </p>
              </div>

              <div className={`text-right text-[8pt] font-sans leading-tight ${useDarkHeader ? 'text-slate-350' : 'text-slate-500'}`}>
                <p className={`font-bold ${useDarkHeader ? 'text-white font-semibold' : 'text-slate-800'}`}>{companyName}</p>
                <p>{companyCIN}</p>
                {companyAddress && <p>{companyAddress}</p>}
                <p>Email: {companyEmail} | Website: {companyWebsite}</p>
                {companyPhone && <p>Phone: {companyPhone}</p>}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-start">
              
              {/* Reference and Date block */}
              <div className="flex items-center justify-between text-[9pt] text-slate-500 mb-6 font-sans">
                <div>
                  <span className="font-bold text-slate-800">Ref:</span> {refNo || "BQ/2026/HR-XXX"}
                </div>
                <div>
                  <span className="font-bold text-slate-800">Date:</span> {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Salutation */}
              <div className="mb-4">
                <p className="font-bold text-slate-800">To,</p>
                <p className="font-bold text-[#081C3A] text-[11pt]">{name || "[Candidate Name]"}</p>
                {(email || phone) && (
                  <p className="text-[8.5pt] text-slate-500 font-sans mt-0.5">
                    {email && <span>{email}</span>}
                    {email && phone && <span> &bull; </span>}
                    {phone && <span>{phone}</span>}
                  </p>
                )}
              </div>

              <div className="mb-4 text-left">
                <p className="font-bold text-slate-800 text-[10pt] border-b pb-1 inline-block uppercase tracking-wider border-slate-300">
                  SUBJECT: OFFER OF EMPLOYMENT - {position ? position.toUpperCase() : "[POSITION]"}
                </p>
              </div>

              {/* Letter Paragraphs */}
              <div 
                className="text-[10pt] text-slate-700 leading-relaxed text-justify mb-5 font-sans"
                style={{ whiteSpace: 'pre-line', fontSize: '10pt' }}
              >
                {compiledText()}
              </div>

              {/* Compensation Breakout block (if CTC entered) */}
              {ctc && (
                <div className="mb-6 font-sans text-left">
                  <h4 className="text-[9pt] font-semibold text-slate-800 uppercase tracking-wider mb-2">Compensation Overview</h4>
                  <table className="w-full border border-slate-200 text-[9pt] border-collapse bg-slate-50/20">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-200 px-3 py-1.5 text-left font-bold font-sans">Component</th>
                        <th className="border border-slate-200 px-3 py-1.5 text-right font-bold font-sans">Valuation ({currencySymbol})</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-200 px-3 py-1.5 text-slate-650">Job Designation</td>
                        <td className="border border-slate-200 px-3 py-1.5 text-right text-slate-800 font-medium">{position || "TBD"}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-1.5 text-slate-650">Offered Stated Package (CTC/Stipend)</td>
                        <td className="border border-slate-200 px-3 py-1.5 text-right text-slate-800 font-bold">{ctc}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-1.5 text-slate-650">Joining Date</td>
                        <td className="border border-slate-200 px-3 py-1.5 text-right text-slate-850 font-medium">
                          {joiningDate ? new Date(joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "On mutual agreement"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-[9.5pt] text-slate-700 leading-relaxed italic mb-8 font-sans text-left">
                Kindly sign and return a scanned copy of this letter token as a statement of acceptance of the offer guidelines.
              </p>
            </div>

            {/* Signature Block Area */}
            <div className="mt-auto">
              <p className="text-[9.5pt] font-sans text-slate-850 font-bold mb-8 text-left">For {companyName}</p>
              
              <div className="grid grid-cols-2 gap-8 items-end w-full">
                
                {/* Founder Sign Col */}
                <div className="flex flex-col text-left font-sans">
                  <div className="h-12 relative flex items-end mb-1">
                    {founderSign ? (
                      <img 
                        src={founderSign} 
                        alt="Ankit Shrivastava Signature" 
                        className="h-10 w-auto object-contain block max-w-full"
                      />
                    ) : (
                      <div className="italic text-[15pt] text-slate-350 opacity-90 select-none pb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Ankit Shrivastava
                      </div>
                    )}
                  </div>
                  <div className="w-full border-t border-slate-300 my-1" />
                  <p className="text-[9pt] font-bold text-slate-800">Ankit Shrivastava</p>
                  <p className="text-[7.5pt] text-slate-500">Founder & CEO</p>
                </div>

                {/* Cofounder Sign Col */}
                <div className="flex flex-col text-left font-sans">
                  <div className="h-12 relative flex items-end mb-1">
                    {cofounderSign ? (
                      <img 
                        src={cofounderSign} 
                        alt="Akshat Srivastava Signature" 
                        className="h-10 w-auto object-contain block max-w-full"
                      />
                    ) : (
                      <div className="italic text-[15.5pt] text-slate-350 opacity-90 select-none pb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Akshat Srivastava
                      </div>
                    )}
                  </div>
                  <div className="w-full border-t border-slate-300 my-1" />
                  <p className="text-[9pt] font-bold text-slate-800">Akshat Srivastava</p>
                  <p className="text-[7.5pt] text-slate-500">Co-Founder & CFO</p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="mt-8 border-t pt-2 text-center text-[7pt] text-slate-400 font-sans border-slate-200">
              {companyName} &bull; Confidential &bull; Standard Employment Agreement
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
