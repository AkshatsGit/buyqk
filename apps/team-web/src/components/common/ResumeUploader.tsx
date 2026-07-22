import React, { useState } from 'react';
import { FileUp, Sparkles, FileText, CheckCircle2, Link as LinkIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { storageService } from '@buyqk/firebase';

interface ExtractedData {
  fullName?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  linkedin?: string;
  github?: string;
  experience?: string;
  education?: string;
}

interface Props {
  uid: string;
  initialResumeUrl?: string;
  onResumeUploaded: (resumeUrl: string, fileName: string, parsedData?: ExtractedData) => void;
}

// Smoothening Tool: Cleans, sanitizes and compresses extracted PDF text into a lightweight text file format
export const smoothAndCleanResumeText = (rawText: string, originalFileName: string): string => {
  if (!rawText || rawText.trim().length === 0) {
    return `==================================================
 BUYQK RESUME TEXT DOCUMENT (${originalFileName})
 Generated: ${new Date().toISOString()}
==================================================

[Notice: PDF contained no readable text layer.]`;
  }

  // 1. Strip non-printable control characters
  let cleaned = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');

  // 2. Normalize whitespace, remove double tabs and spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // 3. Remove excessive empty lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');

  // 4. Split lines and filter noise
  const lines = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // 5. Add structured header metadata
  const header = [
    `==================================================`,
    ` BUYQK SMOOTHED RESUME TEXT DOCUMENT (${originalFileName})`,
    ` Processed & Storage-Optimized on ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`,
    `==================================================\n`
  ].join('\n');

  return header + lines.join('\n');
};

export const ResumeUploader: React.FC<Props> = ({ uid, initialResumeUrl, onResumeUploaded }) => {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [resumeLink, setResumeLink] = useState<string>(initialResumeUrl || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Dynamic loader for PDF.js library to guarantee client-side text scanning
  const ensurePdfJsLoaded = async (): Promise<any> => {
    if ((window as any).pdfjsLib) {
      const lib = (window as any).pdfjsLib;
      if (!lib.GlobalWorkerOptions?.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      return lib;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve(lib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js parser library"));
      document.body.appendChild(script);
    });
  };

  // Client-side PDF text extraction via PDF.js worker
  const parsePdfText = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await ensurePdfJsLoaded();
      if (!pdfjsLib) return "";

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (err) {
      console.error("PDF.js text parsing error:", err);
      return "";
    }
  };

  const extractDataFromText = (text: string): ExtractedData => {
    if (!text) return {};
    const extracted: ExtractedData = {};

    // 1. Name Extraction
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      const match = line.match(/^(?:Name|Candidate Name|Full Name)\s*:\s*(.+)$/i);
      if (match) {
        extracted.fullName = match[1].trim();
        break;
      }
    }
    if (!extracted.fullName) {
      for (const line of lines) {
        const val = line.toLowerCase();
        if (val.includes('@') || val.includes('/') || val.includes(':') || /\d{5,}/.test(line)) continue;
        if (val.includes('resume') || val.includes('curriculum') || val.includes('experience') || val.includes('education') || val.includes('skills')) continue;
        if (line.length > 3 && line.length < 32 && /^[a-zA-Z\s]{4,30}$/.test(line)) {
          extracted.fullName = line;
          break;
        }
      }
    }

    // 2. Email & Phone
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) extracted.email = emailMatch[0];

    const phoneMatch = text.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3,4}\)?[- ]?\d{3,4}[- ]?\d{3,4}/);
    if (phoneMatch) extracted.phone = phoneMatch[0];

    // 3. Socials
    const ghMatch = text.match(/(?:github\.com)\/([a-zA-Z0-9_\-\.]+)/i);
    if (ghMatch) extracted.github = `https://github.com/${ghMatch[1]}`;

    const liMatch = text.match(/(?:linkedin\.com\/in)\/([a-zA-Z0-9_\-\.]+)/i);
    if (liMatch) extracted.linkedin = `https://linkedin.com/in/${liMatch[1]}`;

    // 4. Skills Tags
    const knownSkills = [
      'React', 'React.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express',
      'Python', 'Java', 'C++', 'TailwindCSS', 'Firebase', 'Next.js', 'SQL',
      'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Git', 'Redux', 'GraphQL',
      'HTML', 'CSS', 'Figma', 'Go', 'Rust', 'Flutter', 'REST API', 'Vite'
    ];
    const foundSkills = knownSkills.filter(sk => 
      new RegExp(`\\b${sk}\\b`, 'i').test(text)
    );
    if (foundSkills.length > 0) extracted.skills = foundSkills;

    // 5. Education & Experience excerpts
    if (text.toLowerCase().includes('education')) {
      const eduIdx = text.toLowerCase().indexOf('education');
      extracted.education = text.substring(eduIdx, eduIdx + 150).replace(/\s+/g, ' ').trim();
    }
    if (text.toLowerCase().includes('experience')) {
      const expIdx = text.toLowerCase().indexOf('experience');
      extracted.experience = text.substring(expIdx, expIdx + 180).replace(/\s+/g, ' ').trim();
    }

    return extracted;
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    setError('');
    setFile(selectedFile);
    setUploading(true);
    setStatusText('Extracting PDF text & auto-filling profile...');

    try {
      // 1. Extract text via pdf.js
      const rawText = await parsePdfText(selectedFile);
      const parsedData = extractDataFromText(rawText);

      // 2. Smoothen PDF text into lightweight clean text format
      setStatusText('Smoothening & Compressing PDF Text Document...');
      const smoothedText = smoothAndCleanResumeText(rawText, selectedFile.name);

      // 3. Upload lightweight text file (.txt) to Firebase Storage
      setStatusText('Storing Smoothened Text File into Firebase Storage...');
      const txtFileName = selectedFile.name.replace(/\.pdf$/i, '') + '_resume.txt';
      const filePath = `resumes/${uid}_${Date.now()}_${txtFileName}`;
      
      const downloadUrl = await storageService.uploadTextFile(filePath, smoothedText);

      setUploading(false);
      setStatusText('');
      onResumeUploaded(downloadUrl, txtFileName, parsedData);

    } catch (err: any) {
      console.error("Resume upload/parsing error:", err);
      setError(err.message || 'Error processing resume. Please try again.');
      setUploading(false);
    }
  };

  const handleSaveLink = () => {
    if (!resumeLink.startsWith('http://') && !resumeLink.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setError('');
    onResumeUploaded(resumeLink, 'Resume Link');
  };

  return (
    <div className="bg-slate-900/50 border border-blue-900/30 rounded-2xl p-4 flex flex-col gap-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-yellow-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Mandatory Resume Document</h4>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-blue-900/20">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              mode === 'upload' ? 'bg-yellow-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              mode === 'link' ? 'bg-yellow-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resume URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="flex flex-col gap-3">
          <label className="border-2 border-dashed border-blue-900/40 hover:border-yellow-500/60 bg-slate-950/40 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group">
            <FileUp className="w-8 h-8 text-slate-400 group-hover:text-yellow-500 transition-colors" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-200">Click to upload Resume PDF</p>
              <p className="text-[10px] text-slate-500">Auto AI Extraction & Auto-fill form enabled</p>
            </div>
            <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploading} />
          </label>

          {uploading && (
            <div className="flex items-center justify-center gap-2 text-xs text-yellow-400 font-bold bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
              <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
              <span>{statusText}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-400">External Resume / Portfolio Link</label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
              placeholder="https://drive.google.com/... or https://domain.com/resume.pdf"
              className="flex-1 bg-slate-950 border border-blue-900/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
            />
            <button
              type="button"
              onClick={handleSaveLink}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-gold-glow transition-all"
            >
              Attach Link
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 font-semibold bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
