import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  User, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Upload, 
  RefreshCw, 
  Plus, 
  Check, 
  History, 
  Trash2, 
  Building,
  Mail,
  Phone,
  FileCheck
} from 'lucide-react';

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
}

const DEFAULT_TEMPLATES = {
  tech: `We are pleased to offer you the position of {position} at buyQk Tech Private Limited. This letter contains the general terms and conditions of your employment.

Your joining date will be {joiningDate}. You will receive a Total Annual Compensation Package (CTC) of {ctc}, details of which are defined in the compensation breakout sheet.

In your capacity as {position}, you will report to the Engineering leadership team and will be responsible for designing, building, and deploying highly secure frontend and backend structures for our hyper-local commerce platforms.

Please review this offer letter and sign below to signify your acceptance of this offer. This offer is valid until the end of day on {expiryDate}. We look forward to welcome you to our innovation crew!`,
  
  operations: `We are pleased to offer you the position of {position} at buyQk Tech Private Limited. This letter contains the general terms and conditions of your onboarding.

Your joining date will be {joiningDate}. You will receive a Total Annual Compensation Package (CTC) of {ctc}.

In this role, you will lead our operations network, onboarding merchants, managing localized seller geofences, and coordinating real-time distribution streams to maximize transaction speed and retail engagement.

Please sign this letter of acceptance below to confirm your confirmation. This offer remains valid till {expiryDate}.`,

  custom: `We are pleased to offer you the position of {position} at buyQk Tech Private Limited. This letter contains the general terms and conditions of your employment.

Your joining date will be {joiningDate}. You will receive a Total Annual Compensation Package (CTC) of {ctc}.

Please review this offer letter and sign below to signify your acceptance. This offer is valid till {expiryDate}.`
};

export default function App() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [activeId, setActiveId] = useState<string>('new');

  // Input states
  const [name, setName] = useState('John Doe');
  const [position, setPosition] = useState('Lead Software Engineer');
  const [email, setEmail] = useState('john.doe@example.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [joiningDate, setJoiningDate] = useState('2026-08-01');
  const [ctc, setCtc] = useState('INR 12,00,000 Per Annum');
  const [expiryDate, setExpiryDate] = useState('2026-07-25');
  const [date, setDate] = useState('2026-07-15');
  const [refNo, setRefNo] = useState('BQ/2026/HR-089');
  
  // Custom templates & body
  const [templateKey, setTemplateKey] = useState<'tech' | 'operations' | 'custom'>('tech');
  const [customText, setCustomText] = useState(DEFAULT_TEMPLATES.tech);

  // Signatures State (base64 cached to localStorage)
  const [founderSign, setFounderSign] = useState<string>('');
  const [cofounderSign, setCofounderSign] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);

  // Load history & signature images from local storage
  useEffect(() => {
    const saved = localStorage.getItem('bq_hr_candidates');
    if (saved) {
      try {
        setCandidates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed loading candidate records:", e);
      }
    }
    const fSign = localStorage.getItem('bq_founder_sign');
    if (fSign) setFounderSign(fSign);
    
    const coSign = localStorage.getItem('bq_cofounder_sign');
    if (coSign) setCofounderSign(coSign);
  }, []);

  // Update body text when inputs compile
  useEffect(() => {
    // Check if body content matches one of the templates with old params
    // If user changes template, reset text base
    const base = DEFAULT_TEMPLATES[templateKey];
    setCustomText(base);
  }, [templateKey]);

  const saveToHistory = () => {
    const record: CandidateRecord = {
      id: activeId === 'new' ? Math.random().toString(36).substring(2, 9) : activeId,
      name,
      position,
      email,
      phone,
      joiningDate,
      ctc,
      expiryDate,
      date,
      refNo,
      customText
    };

    let updated: CandidateRecord[];
    if (activeId === 'new') {
      updated = [record, ...candidates];
      setActiveId(record.id);
    } else {
      updated = candidates.map(c => c.id === activeId ? record : c);
    }

    setCandidates(updated);
    localStorage.setItem('bq_hr_candidates', JSON.stringify(updated));
  };

  const loadRecord = (rec: CandidateRecord) => {
    setActiveId(rec.id);
    setName(rec.name);
    setPosition(rec.position);
    setEmail(rec.email);
    setPhone(rec.phone);
    setJoiningDate(rec.joiningDate);
    setCtc(rec.ctc);
    setExpiryDate(rec.expiryDate);
    setDate(rec.date);
    setRefNo(rec.refNo);
    setCustomText(rec.customText);
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

  const deleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = candidates.filter(c => c.id !== id);
    setCandidates(updated);
    localStorage.setItem('bq_hr_candidates', JSON.stringify(updated));
    if (activeId === id) {
      createNewDraft();
    }
  };

  // Signature image uploads
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

  // Convert raw templates with values
  const compiledText = () => {
    let t = customText;
    t = t.replace(/{name}/g, name || "[Candidate Name]");
    t = t.replace(/{position}/g, position || "[Position]");
    t = t.replace(/{joiningDate}/g, joiningDate || "[Joining Date]");
    t = t.replace(/{ctc}/g, ctc || "[CTC Compensation]");
    t = t.replace(/{expiryDate}/g, expiryDate || "[Expiry Date]");
    return t;
  };

  // Native Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Client-Side PDF Generation using dynamic script injection
  const handleDownloadPDF = () => {
    saveToHistory();

    const element = document.getElementById('offer-letter-print-zone');
    if (!element) return;

    // Inject html2pdf dynamically if it is not already loaded
    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        executePDFDownload(element);
      };
      document.body.appendChild(script);
    } else {
      executePDFDownload(element);
    }
  };

  const executePDFDownload = (element: HTMLElement) => {
    const filename = `Offer_Letter_${(name || "Candidate").trim().replace(/\s+/g, '_')}.pdf`;
    
    // Config for standard A4 exact layout PDF download
    const options = {
      margin: [0.3, 0.4, 0.4, 0.4], // [top, left, bottom, right] in inches
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2.5, 
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    (window as any).html2pdf().set(options).from(element).save();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Navigation Header */}
      <header className="no-print bg-slate-950/80 border-b border-blue-900/30 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/assets/logoimg.png" alt="buyQk logo" className="h-9 w-auto object-contain" />
          <div className="h-5 w-[1px] bg-slate-800" />
          <div>
            <h1 className="font-bold text-slate-100 uppercase tracking-widest text-xs">Human Resources</h1>
            <p className="text-[10px] text-yellow-500 font-semibold uppercase tracking-wider">Candidate Offer Center</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={createNewDraft} 
            className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-xs font-semibold hover:bg-yellow-500/20 transition-all font-sans"
          >
            <Plus className="w-3.5 h-3.5" /> New Offer
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold hover:border-slate-700 transition-all font-sans"
          >
            <Printer className="w-3.5 h-3.5" /> Print Layout
          </button>

          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold shadow-gold-glow transition-all font-sans"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </header>

      {/* Main split dashboard content */}
      <main className="flex-1 w-full max-w-8xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Form parameters & History */}
        <section className="no-print lg:col-span-5 flex flex-col gap-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
          
          {/* History / Drafts */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-yellow-500" /> Offer History & Drafts
            </h3>
            
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
              {candidates.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                  No records stored yet. Save your draft to see it listed here.
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
                        <p className="text-xs font-bold text-slate-200 truncate">{c.name || 'Untitled Agent'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.position} &bull; {c.date}</p>
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
              <FileCheck className="w-4 h-4 text-yellow-500" /> 1. Candidate Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Reference No.</label>
                <input 
                  type="text" 
                  value={refNo} 
                  onChange={e => setRefNo(e.target.value)}
                  className="bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Offer Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Candidate Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={name} 
                  placeholder="e.g. Priyanshu Sharma"
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Candidate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="email" 
                    value={email} 
                    placeholder="name@example.com"
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Candidate Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={phone} 
                    placeholder="+91 99999 99999"
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Job Title / Designation</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={position} 
                  placeholder="e.g. Lead Software Engineer"
                  onChange={e => setPosition(e.target.value)}
                  className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Joining Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="date" 
                    value={joiningDate} 
                    onChange={e => setJoiningDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Annual package (CTC)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={ctc} 
                    placeholder="e.g. INR 18,00,000 P.A"
                    onChange={e => setCtc(e.target.value)}
                    className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Offer Acceptance Expiry</label>
              <input 
                type="date" 
                value={expiryDate} 
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Letter Body / Custom Copy Editor */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-500" /> 2. Content & Templates
              </h3>
              
              <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 scale-90">
                <button 
                  onClick={() => setTemplateKey('tech')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${templateKey === 'tech' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Tech
                </button>
                <button 
                  onClick={() => setTemplateKey('operations')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${templateKey === 'operations' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Ops
                </button>
                <button 
                  onClick={() => setTemplateKey('custom')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${templateKey === 'custom' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-slate-400">Offer Letter Body</label>
                <span className="text-[9px] text-slate-500 italic">Supports variables: &#123;name&#125;, &#123;position&#125;, &#123;joiningDate&#125;, &#123;ctc&#125;, &#123;expiryDate&#125;</span>
              </div>
              
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                rows={9}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-mono leading-relaxed"
                placeholder="Compose offer letter..."
              />
            </div>
            
            <button 
              onClick={saveToHistory}
              className="flex items-center justify-center gap-2 bg-[#081C3A] hover:bg-blue-950/70 border border-blue-800/40 text-slate-250 py-3 rounded-xl text-xs font-bold transition-all"
            >
              <FileCheck className="w-4 h-4 text-yellow-500" /> Save Record & Changes
            </button>
          </div>

          {/* HR Signature Authorization */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-5 mb-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="w-4 h-4 text-yellow-500" /> 3. Executive Signatures (PNG)
            </h3>

            {/* Founder Sign */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350">Founder: Ankit Shrivastava</span>
                {founderSign && (
                  <button 
                    onClick={() => clearSignature('founder')}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                  >
                    Clear PNG
                  </button>
                )}
              </div>
              
              {founderSign ? (
                <div className="h-16 w-32 border border-slate-800 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                  <img src={founderSign} alt="Founder Signature" className="h-full w-auto object-contain" />
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center hover:border-slate-700 transition-all cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files?.[0] && handleSignatureUpload('founder', e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 text-slate-500 mb-1" />
                  <p className="text-[10px] text-slate-400 text-center">Click to upload <code className="text-yellow-500 font-mono text-[9px]">foundersign.png</code></p>
                </div>
              )}
            </div>

            {/* Cofounder Sign */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350">Co-Founder: Akshat Srivastava</span>
                {cofounderSign && (
                  <button 
                    onClick={() => clearSignature('cofounder')}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                  >
                    Clear PNG
                  </button>
                )}
              </div>
              
              {cofounderSign ? (
                <div className="h-16 w-32 border border-slate-800 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                  <img src={cofounderSign} alt="Co-Founder Signature" className="h-full w-auto object-contain" />
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center hover:border-slate-700 transition-all cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files?.[0] && handleSignatureUpload('cofounder', e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 text-slate-500 mb-1" />
                  <p className="text-[10px] text-slate-400 text-center">Click to upload <code className="text-yellow-500 font-mono text-[9px]">cofoundersign.png</code></p>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* Right Side: Live A4 PDF Preview */}
        <section className="lg:col-span-7 flex flex-col items-center justify-start overflow-x-auto min-h-screen">
          
          <span className="no-print text-xs uppercase tracking-wider text-slate-450 font-bold mb-3 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-yellow-500" /> A4 High-Fidelity Letterhead Preview (Scaled)
          </span>

          <div
            id="offer-letter-print-zone"
            ref={previewRef}
            className="a4-page bg-white text-slate-900 border border-slate-200 shadow-2xl p-[0.75in] w-[8.27in] min-h-[11.69in] max-w-[8.27in] flex flex-col text-left font-serif relative overflow-hidden"
            style={{ 
              boxSizing: 'border-box',
              fontFamily: "'Inter', 'Georgia', serif",
              lineHeight: '1.6',
              fontSize: '11pt'
            }}
          >
            {/* Header Letterhead Background Graphics inside A4 print element */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#081C3A] via-yellow-500 to-[#0b2545]" />
            
            {/* Company Info Logo Header block */}
            <div className="flex items-start justify-between border-b pb-4 mb-6" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <img 
                  src="/assets/logoimg.png" 
                  alt="buyQk logo" 
                  className="h-10 w-auto object-contain block mb-2" 
                />
                <h2 className="text-[#081C3A]" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '15pt', letterSpacing: '0.05em' }}>buyQk</h2>
                <p className="text-[7pt] text-slate-450 uppercase tracking-widest font-bold font-sans">Hyperlocal Commerce Engine</p>
              </div>

              <div className="text-right text-[8.5pt] text-slate-500 font-sans leading-tight">
                <p className="font-bold text-slate-800">buyQk Tech Private Limited</p>
                <p>CIN: U72900DL2024PTC413245</p>
                <p>Reg Office: Sector-62, Noida, NCR</p>
                <p>Email: hr@buyqk.com | Website: buyqk.com</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-start">
              
              {/* Reference and Date block */}
              <div className="flex items-center justify-between text-[9pt] text-slate-600 mb-6 font-sans">
                <div>
                  <span className="font-bold text-slate-700">Ref:</span> {refNo || "BQ/2026/HR-XXX"}
                </div>
                <div>
                  <span className="font-bold text-slate-700">Date:</span> {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Salutation */}
              <div className="mb-4">
                <p className="font-bold text-slate-800">To,</p>
                <p className="font-bold text-[#081C3A] text-[11.5pt]">{name || "[Candidate Name]"}</p>
                {(email || phone) && (
                  <p className="text-[8.5pt] text-slate-500 font-sans mt-0.5">
                    {email && <span>{email}</span>}
                    {email && phone && <span> &bull; </span>}
                    {phone && <span>{phone}</span>}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <p className="font-bold text-slate-800 text-[10.5pt] border-b pb-1 inline-block uppercase tracking-wider" style={{ borderColor: '#cbd5e1' }}>
                  SUBJECT: OFFER OF EMPLOYMENT - {position ? position.toUpperCase() : "[POSITION]"}
                </p>
              </div>

              {/* Letter Paragraphs */}
              <div 
                className="text-[10pt] text-slate-700 leading-relaxed text-justify mb-5"
                style={{ whiteSpace: 'pre-line', fontSize: '10.5pt' }}
              >
                {compiledText()}
              </div>

              {/* Compensation Breakout block (if CTC entered) */}
              {ctc && (
                <div className="mb-6 font-sans">
                  <h4 className="text-[9pt] font-semibold text-slate-800 uppercase tracking-wider mb-2">Compensation Overview</h4>
                  <table className="w-full border border-slate-200 text-[9pt] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700">
                        <th className="border border-slate-200 px-3 py-1.5 text-left font-bold font-sans">Component</th>
                        <th className="border border-slate-200 px-3 py-1.5 text-right font-bold font-sans">Details / Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-205 px-3 py-1.5 text-slate-650">Job Designation</td>
                        <td className="border border-slate-205 px-3 py-1.5 text-right text-slate-800 font-medium">{position || "TBD"}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-205 px-3 py-1.5 text-slate-650">Annual Salary package (CTC)</td>
                        <td className="border border-slate-205 px-3 py-1.5 text-right text-slate-800 font-bold">{ctc}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-205 px-3 py-1.5 text-slate-650">Joining Date</td>
                        <td className="border border-slate-205 px-3 py-1.5 text-right text-slate-800 font-medium">
                          {joiningDate ? new Date(joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "On mutual agreement"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-[10pt] text-slate-700 leading-relaxed italic mb-8">
                Kindly sign and return a scanned copy of this letter token as a statement of acceptance of the offer guidelines.
              </p>
            </div>

            {/* Signature Block Area */}
            <div className="mt-auto">
              <p className="text-[9.5pt] font-sans text-slate-850 font-bold mb-10">For buyQk Tech Private Limited</p>
              
              <div className="grid grid-cols-2 gap-8 items-end w-full">
                
                {/* Founder Sign Col */}
                <div className="flex flex-col text-left font-sans">
                  <div className="h-14 relative flex items-end mb-1">
                    {founderSign ? (
                      <img 
                        src={founderSign} 
                        alt="Ankit Shrivastava Signature" 
                        className="h-12 w-auto object-contain block max-w-full"
                      />
                    ) : (
                      <div className="italic text-[16pt] text-slate-350 opacity-90 select-none pb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Ankit Shrivastava
                      </div>
                    )}
                  </div>
                  <div className="w-full border-t border-slate-300 my-1" />
                  <p className="text-[9.5pt] font-bold text-slate-800">Ankit Shrivastava</p>
                  <p className="text-[8pt] text-slate-500">Founder & CEO</p>
                </div>

                {/* Cofounder Sign Col */}
                <div className="flex flex-col text-left font-sans">
                  <div className="h-14 relative flex items-end mb-1">
                    {cofounderSign ? (
                      <img 
                        src={cofounderSign} 
                        alt="Akshat Srivastava Signature" 
                        className="h-12 w-auto object-contain block max-w-full"
                      />
                    ) : (
                      <div className="italic text-[16.5pt] text-slate-350 opacity-90 select-none pb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Akshat Srivastava
                      </div>
                    )}
                  </div>
                  <div className="w-full border-t border-slate-300 my-1" />
                  <p className="text-[9.5pt] font-bold text-slate-800">Akshat Srivastava</p>
                  <p className="text-[8pt] text-slate-500">Co-Founder & CFO</p>
                </div>

              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="mt-8 border-t pt-2 text-center text-[7.5pt] text-slate-400 font-sans" style={{ borderColor: '#e2e8f0' }}>
              buyQk Hyperlocal Retail Networks &bull; Confidential &bull; Standard Employment Agreement
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
