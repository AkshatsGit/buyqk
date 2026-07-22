import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Download, Printer, User, Calendar, DollarSign, 
  Briefcase, Upload, Plus, Trash2, Building, Mail, Phone, 
  FileCheck, LogOut, Check, X, ShieldAlert, Layout, Sliders
} from 'lucide-react';
import { auth, db, ADMIN_EMAILS, HR_EMAILS } from '@buyqk/firebase';
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
  headerTitle?: string;
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

  founding_ownership: `Building Owners. Not Employees.
Classification: Internal & Confidential
Issued by: BUYQK (Currently Operating as a Sole Proprietorship)

Founders:
Ankit Shrivastav (Founder & Chief Executive Officer)
Akshat Srivastava (Co-Founder & Chief Technology Officer)

⸻

“People don’t build great companies because they are paid to.
They build them because they believe they are building something worth owning.”

⸻

A MESSAGE FROM THE FOUNDERS

Dear Builder,
Thank you for believing in BuyQK.
When companies are young, they rarely have abundant capital, luxurious offices, or globally recognized brands. What they do have is belief.
Belief that a meaningful problem deserves to be solved.
Belief that ordinary people can create extraordinary impact.
Belief that the future belongs to those willing to build it before anyone else believes it exists.

BuyQK was founded on one simple idea:
The people who help build the company should have the opportunity to participate in the value they help create.

Ownership, however, is not a joining bonus. It is not a hiring incentive. It is not a reward for titles.
Ownership represents trust. Trust is earned through consistency. Through difficult days. Through solving problems. Through making sacrifices. Through staying when quitting would have been easier.

This document exists because we want every individual joining BuyQK to understand one important principle:
We are building owners—not employees.

Some people will stay for months. Some for years. Some may become future leaders of this company. Wherever your journey leads, we want every opportunity within BuyQK to be guided by fairness, transparency, integrity, and long-term thinking.

Thank you for choosing to build with us. We look forward to building the future together.

Founders:
Ankit Shrivastav (Founder & CEO)
Akshat Srivastava (Co-Founder & CTO)

⸻

CHAPTER 1: WHY THIS DOCUMENT EXISTS

Every startup says: “We’ll give ESOPs.” Very few explain what that truly means.
At BuyQK, we believe ownership deserves clarity.
This document exists to explain:
• Why BuyQK believes in ownership.
• How ownership will be viewed.
• What values are expected.
• How long-term contribution matters.
• How future ownership opportunities may be evaluated.

This document is built upon one simple philosophy:
Ownership should never be promised casually. Ownership should be earned.

CHAPTER 2: WHAT OWNERSHIP MEANS AT BUYQK

Ownership is not merely receiving equity. Ownership is a mindset.
At BuyQK, ownership means:
• Taking responsibility before being asked.
• Protecting company resources.
• Thinking beyond your assigned role.
• Making decisions that benefit the company rather than personal convenience.
• Documenting your work.
• Helping teammates succeed.
• Improving systems.
• Leaving every project better than you found it.
• Owning mistakes.
• Celebrating team success over personal recognition.

Ownership begins long before equity does.

⸻

CHAPTER 3: WHY WE BELIEVE IN SHARING SUCCESS

Many organisations compensate individuals solely through salaries. While salaries reward time and effort, ownership recognizes long-term value creation.
BuyQK believes that individuals who dedicate themselves to building the company should have the opportunity to participate in its future success.

This philosophy encourages:
• Long-term thinking.
• Better decision-making.
• Higher accountability.
• Innovation.
• Greater collaboration.
• A stronger company.

However—
Ownership is meaningful only when it reflects genuine contribution.
For this reason, BuyQK does not believe in automatic ownership. Every future ownership decision must balance fairness to contributors with the long-term health of the company.

CHAPTER 4: OUR OWNERSHIP PHILOSOPHY

At BuyQK, ownership is guided by the following principles:

Integrity before Incentives:
Character will always matter more than titles.

Contribution before Compensation:
Value created is more important than promises made.

Commitment before Ownership:
Long-term builders create long-term companies.

Merit before Politics:
Recognition is earned through performance—not influence.

Team before Individual:
Great companies are built together.

Future before Immediate Reward:
We choose sustainable growth over short-term decisions.

Transparency before Assumptions:
We believe people deserve clarity about how opportunities are created.

⸻

CHAPTER 5: WHO MAY BE CONSIDERED

As BuyQK grows and establishes an appropriate corporate structure, individuals who demonstrate exceptional long-term contribution may be considered for future ownership opportunities.

Potential categories may include:
• Founding Leadership.
• Core Employees.
• Exceptional Long-Term Contributors.
• High-Impact Technical Leaders.
• Future Executives.
• Outstanding Interns who continue their journey with BuyQK.
• Strategic Advisors.
• External Experts making significant long-term contributions.

Eligibility alone does not guarantee participation. Every decision will depend upon multiple factors including business requirements, company stage, applicable law, governance approvals, and individual contribution.

CHAPTER 6: OUR COMMITMENT

As founders, we make the following commitment to every builder who joins BuyQK:
• We will strive to evaluate opportunities fairly.
• We will communicate transparently.
• We will reward long-term contribution over short-term appearances.
• We will build systems that recognize genuine builders.
• We will never use ownership as a false promise to attract people.

Trust, once broken, is difficult to rebuild. We choose honesty over convenience.

⸻

CHAPTER 13: IMPORTANT CLARIFICATION

BuyQK is currently operating as a sole proprietorship and is in the early stages of building its business. This document has been created to communicate BuyQK’s philosophy regarding long-term ownership and recognition of meaningful contribution. It is intended to provide transparency around our values and future direction.

This document does not constitute:
• A grant of shares or stock options.
• An employment contract.
• A partnership agreement.
• A legally enforceable promise of equity.
• A guarantee of future ownership.

Any future ownership opportunities, including any Employee Stock Option Plan (ESOP), shall be considered only after BuyQK adopts an appropriate corporate structure, establishes a formal equity program, and completes all required legal and governance processes.
Participation in any future ownership program, if introduced, shall always remain subject to applicable laws, company policies, performance, long-term commitment, business requirements, and the necessary approvals at that time.

⸻

PART 5 — Commitment & Acknowledgement

CHAPTER 27: Founders’ Commitment

Every company begins with an idea.
Great companies are built by people.
At BuyQK, we recognize that every individual who chooses to build with us contributes to something much larger than a product or a business.

As founders, we make the following commitments to every member of the BuyQK family.
We commit to:
• Build BuyQK with integrity and transparency.
• Create an environment where people are respected, trusted, and empowered.
• Recognize meaningful contribution over titles or hierarchy.
• Encourage continuous learning, innovation, and collaboration.
• Communicate honestly, especially during difficult times.
• Build systems that reward long-term commitment fairly.
• Protect the interests of the company while respecting every builder.
• Never use ownership or future opportunities as false promises.
• Continuously improve our culture as BuyQK grows.

We understand that trust is earned—not requested.
Our responsibility as founders is to earn that trust every single day.

⸻

CHAPTER 28: The BuyQK Builder’s Oath

By becoming a part of BuyQK, I choose to become more than an employee or an intern.
I choose to become a Builder.
I understand that meaningful companies are not built overnight.
They are built through consistency, courage, integrity, and long-term commitment.

Therefore, I pledge that I will:
• Build with honesty and integrity.
• Take ownership of my responsibilities.
• Protect the trust placed in me.
• Respect every teammate, customer, merchant, delivery partner, and stakeholder.
• Learn continuously and share knowledge openly.
• Act professionally in every interaction.
• Protect BuyQK’s confidential information and intellectual property.
• Represent BuyQK responsibly inside and outside the workplace.
• Leave every project, every process, and every person better than I found them.
• Contribute towards building a company that creates meaningful impact for society.

I understand that my contribution today helps shape the future of BuyQK.

⸻

CHAPTER 29: Builder’s Acknowledgement

I acknowledge that I have carefully read and understood the BuyQK Founding Ownership Policy.
I understand that this document communicates BuyQK’s philosophy regarding ownership, long-term contribution, and future opportunities.
I acknowledge that this document does not constitute an equity grant, stock option, employment guarantee, partnership agreement, or legally enforceable promise of ownership.
I understand that any future ownership opportunity, if introduced, will be governed by separate legal documentation, applicable laws, company policies, and necessary approvals.
By signing below, I confirm my understanding of the principles described in this document and my commitment to uphold the values and culture of BuyQK.

Builder Details
Name: {name}
Department: [Insert Department]
Role: {position}
Builder ID: [Insert Builder ID]
Signature: 
Date: {date}

⸻

Closing Message

Years from now, when BuyQK has grown far beyond what it is today, success will not be measured only by revenue, funding, technology, or market share.
It will be measured by the character of the people who chose to believe when success was uncertain.
By those who solved problems before they had titles.
By those who stayed committed when the path was difficult.
By those who chose integrity over shortcuts, collaboration over ego, and purpose over comfort.

Every great company has a beginning.
Every beginning has a few people who choose to believe before the world does.
Thank you for choosing to become one of those people.

Together, we are not just building a company.
We are building the future of local commerce.

BuyQK
“Believe. Build. Belong.”`,

  nda: `BUYQK
CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT (NDA)

Version: 1.0
Classification: Confidential

Issued By:
BUYQK
(Currently Operating as a Sole Proprietorship)

Founders:
Ankit Shrivastav (Founder & CEO)
Akshat Srivastava (Co-Founder & CTO)

⸻

Protecting What We Build Together

At BuyQK, ideas, technology, relationships, research, and innovation are among our most valuable assets. Every person who joins BuyQK is trusted with information that contributes to building the company. This agreement exists to protect that trust.

⸻

1. Purpose
The purpose of this Agreement is to ensure that confidential information shared within BuyQK is used solely for the benefit of BuyQK and is not disclosed, copied, misused, or shared without proper authorization. This agreement helps protect our technology, business strategy, merchant relationships, customer information, research, and other proprietary information.

⸻

2. Scope
This Agreement applies to every individual associated with BuyQK, including but not limited to: Founders, Co-Founders, Leadership Team, Employees, Interns, Consultants, Advisors, Freelancers, Contractors, and Volunteers.

⸻

3. What Is Confidential Information
Confidential Information includes, but is not limited to:
• Business plans and strategy
• Product roadmap
• Source code
• AI models and datasets
• Technical architecture
• Research and development
• Financial information
• Investor discussions
• Merchant information
• Customer information
• Delivery partner information
• Internal documents
• Marketing strategies
• Pricing models
• Vendor information
• Internal meetings and discussions
• Passwords and credentials
• Company documents and reports
• Any information marked confidential

Information shared verbally and identified as confidential should also be treated as confidential.

⸻

4. Your Responsibilities
As a member of BuyQK, you agree to:
• Keep confidential information secure.
• Use confidential information only for BuyQK-related work.
• Avoid sharing confidential information with anyone outside BuyQK unless authorized.
• Protect company accounts, passwords, and systems.
• Inform the founders immediately if confidential information is lost, leaked, or accessed without authorization.
• Return or delete confidential information when requested.

⸻

5. Information That Is Not Confidential
This Agreement does not apply to information that:
• Is already publicly available through lawful means.
• Was lawfully known to you before joining BuyQK.
• Is received lawfully from another source without confidentiality obligations.
• Is approved by BuyQK for public disclosure.

⸻

6. During and After Your Association
Your responsibility to protect BuyQK’s confidential information continues during your association with the company and after your association ends, unless the information has lawfully become public.

⸻

7. Company Property
All documents, files, research, reports, presentations, software, designs, credentials, databases, and other materials created or shared specifically for BuyQK remain the property of BuyQK. Upon request or at the end of your association, you agree to return or permanently delete BuyQK property in your possession, unless otherwise instructed.

⸻

8. Security Expectations
To help protect BuyQK’s information, you agree to:
• Use strong passwords.
• Enable two-factor authentication wherever available.
• Avoid sharing company credentials.
• Use only approved tools and platforms.
• Report suspicious activity immediately.
• Avoid downloading company information onto unsecured devices.

⸻

9. Respect for Privacy
BuyQK is committed to protecting the privacy of customers, merchants, delivery partners, employees, interns, and business partners. Any personal information accessed during your work must be handled responsibly and only for legitimate business purposes.

⸻

10. Questions and Reporting
If you are ever unsure whether information is confidential, treat it as confidential until clarification is provided by the founders or an authorized representative. If you suspect a security incident, accidental disclosure, or misuse of company information, report it immediately.

⸻

11. Our Shared Commitment
Confidentiality is not only a legal responsibility. It is a reflection of trust. Every person at BuyQK contributes to protecting the ideas, technology, and relationships that enable the company to grow. By protecting confidential information, we protect the future we are building together.

⸻

Acknowledgement
I confirm that I have read and understood this Confidentiality & Non-Disclosure Agreement. I agree to uphold the responsibilities described in this document and to protect BuyQK’s confidential information throughout my association with the company and thereafter, as applicable.

Builder Name: {name}
Builder Signature: 
Date: {date}`,

  ip_agreement: `INTELLECTUAL PROPERTY & WORK PRODUCT AGREEMENT

Version: 1.0
Classification: Confidential

Issued By:
BUYQK
(Currently Operating as a Sole Proprietorship)

Founders:
Ankit Shrivastav (Founder & CEO)
Akshat Srivastava (Co-Founder & CTO)

⸻

Protecting What We Create Together

Innovation is the foundation of BuyQK. Every line of code, every design, every strategy, every document, every AI model, every research paper, and every idea contributes to the future of the company. This agreement ensures that everything created for BuyQK remains available for BuyQK to use, improve, and grow.

⸻

1. Purpose
The purpose of this Agreement is to clearly establish that intellectual property and work products created specifically for BuyQK during the course of your association are intended for BuyQK’s business and may be used, modified, improved, and commercialized by BuyQK.

⸻

2. Scope
This Agreement applies to all individuals associated with BuyQK, including: Creators, Founders, Co-Founders, Leadership Team, Employees, Interns, Consultants, Advisors, Freelancers, Contractors, and Volunteers.

⸻

3. What Is Considered Work Product
Work Product includes, but is not limited to:
• Software and source code
• APIs and backend services
• Mobile and web applications
• User Interface (UI) designs
• User Experience (UX) designs
• Wireframes
• Databases
• AI models
• Machine learning models
• Prompts and prompt libraries
• Datasets prepared for BuyQK
• Technical documentation
• Research reports
• Business strategies
• Marketing campaigns
• Sales material
• Logos
• Brand assets
• Product names
• Videos
• Graphics
• Presentations
• Training material
• Standard Operating Procedures (SOPs)
• Workflows
• Internal tools
• Automation scripts
• Dashboards
• Any other material created specifically for BuyQK.

⸻

4. Ownership
Unless otherwise agreed in writing, all Work Product created specifically for BuyQK as part of your assigned responsibilities is intended for BuyQK’s use and business. You agree to cooperate in signing any additional documentation reasonably required in the future to formalize ownership if BuyQK adopts a different legal structure or registration.

⸻

5. Pre-Existing Intellectual Property
BuyQK respects work that you created before joining the company. Any software, designs, inventions, research, or other intellectual property that you developed independently before your association with BuyQK remains yours, unless you voluntarily contribute it to BuyQK under a separate written agreement.

⸻

6. Open Source Software
BuyQK encourages the responsible use of open-source technologies. Before introducing third-party libraries, frameworks, datasets, or software into BuyQK projects, you should ensure that their licenses permit the intended use and comply with company guidelines.

⸻

7. AI-Assisted Development
BuyQK embraces responsible use of Artificial Intelligence. You may use AI tools to assist with development, research, documentation, design, or analysis where approved.
However:
• You remain responsible for the quality and originality of your work.
• Sensitive company information should not be shared with external AI platforms unless approved.
• AI-generated work intended for BuyQK projects should be reviewed before use.

⸻

8. Moral Rights & Attribution
Where applicable, BuyQK will acknowledge meaningful contributions to projects internally. However, BuyQK may modify, improve, combine, adapt, or use Work Product without requiring further approval from the original contributor.

⸻

9. Return of Company Materials
Upon request or at the end of your association, you agree to return or securely delete BuyQK materials in your possession, including:
• Source code
• Internal documents
• Research
• Credentials
• Designs
• Proprietary datasets
• Company devices (if provided)
• Any confidential files

⸻

10. Continuing Cooperation
If BuyQK reasonably requires your assistance to protect, register, maintain, or clarify ownership of Work Product created during your association, you agree to cooperate in good faith, subject to mutually reasonable arrangements.

⸻

11. Respect for Innovation
Innovation thrives when creators trust that their work will be used responsibly. BuyQK is committed to respecting contributors, recognising meaningful work, and fostering an environment where ideas are encouraged, documented, and transformed into products that create value for society.

⸻

Acknowledgement
I confirm that I have read and understood this Intellectual Property & Work Product Agreement. I acknowledge my responsibilities regarding work created specifically for BuyQK and agree to cooperate in protecting the company’s intellectual assets in accordance with this Agreement.

Builder Name: {name}
Builder Signature: 
Date: {date}`,

  code_of_conduct: `BUYQK
CODE OF CONDUCT

Building with Integrity

Version: 1.0
Classification: Internal

Issued By:
BUYQK
(Currently Operating as a Sole Proprietorship)

Founders:
Ankit Shrivastav (Founder & CEO)
Akshat Srivastava (Co-Founder & CTO)

⸻

A Message From The Founders

Technology can be copied. Ideas can be copied. Products can be copied. Culture cannot.
At BuyQK, we believe the way we build is just as important as what we build. This Code of Conduct is not written to restrict people. It is written to help us create a workplace built on trust, respect, ownership, curiosity and integrity.
Whether you’re an intern, engineer, designer, marketer, department head or founder—these principles apply equally to all of us. The culture we create today will define BuyQK tomorrow.

Welcome to the team. Let’s build responsibly.

⸻

1. Our Values
Every decision at BuyQK should reflect these values:
• Integrity
• Ownership
• Respect
• Accountability
• Innovation
• Continuous Learning
• Transparency
• Customer First
• Merchant First
• Team Before Ego

⸻

2. The BuyQK Way
• We don’t blame. We solve.
• We don’t hide mistakes. We learn from them.
• We don’t create politics. We build trust.
• We don’t compete against teammates. We compete against yesterday.
• We don’t seek credit. We seek impact.

⸻

3. Professional Behaviour
Every member of BuyQK is expected to act with high ethical standards, keep communications professional, support their colleagues, and keep the team's objectives in sight.

⸻

Acknowledgement
I confirm that I have read and understood this Code of Conduct. I agree to uphold these values and behaviors in my day-to-day engagement with BuyQK.

Builder Name: {name}
Builder Signature: 
Date: {date}`,

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
  const [headerTitle, setHeaderTitle] = useState('OFFER LETTER');
  const [currentTab, setCurrentTab] = useState<'v1' | 'v2' | 'v3'>('v1');

  // Signatures State & Alignment Settings
  const [founderSign, setFounderSign] = useState<string>('');
  const [cofounderSign, setCofounderSign] = useState<string>('');

  const [founderXOffset, setFounderXOffset] = useState<number>(0);
  const [founderYOffset, setFounderYOffset] = useState<number>(0);
  const [founderScale, setFounderScale] = useState<number>(1.0);
  const [founderPixelated, setFounderPixelated] = useState<boolean>(false);

  const [cofounderXOffset, setCofounderXOffset] = useState<number>(0);
  const [cofounderYOffset, setCofounderYOffset] = useState<number>(0);
  const [cofounderScale, setCofounderScale] = useState<number>(1.0);
  const [cofounderPixelated, setCofounderPixelated] = useState<boolean>(false);

  // Chapters Policy Content from content.txt
  const [chaptersText, setChaptersText] = useState<string>('');
  const [textAlign, setTextAlign] = useState<'justify' | 'left'>('justify');
  
  // Document customization state (Adjustable Font Size)
  const [documentFontSize, setDocumentFontSize] = useState<number>(() => {
    const val = localStorage.getItem('bq_doc_font_size');
    return val ? parseFloat(val) : 9.5;
  });

  const updateDocumentFontSize = (size: number) => {
    setDocumentFontSize(size);
    localStorage.setItem('bq_doc_font_size', String(size));
  };

  // Load content.txt once at mount
  useEffect(() => {
    fetch('/assets/content.txt')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then(text => {
        setChaptersText(text);
      })
      .catch(err => {
        console.error("Error loading /assets/content.txt:", err);
      });
  }, []);

  const previewRef = useRef<HTMLDivElement>(null);

  // Auth Hook listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email && (ADMIN_EMAILS.includes(user.email) || HR_EMAILS.includes(user.email))) {
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

    // Load signature alignments
    const fX = localStorage.getItem('bq_founder_x');
    if (fX) setFounderXOffset(parseInt(fX) || 0);
    const fY = localStorage.getItem('bq_founder_y');
    if (fY) setFounderYOffset(parseInt(fY) || 0);
    const fScale = localStorage.getItem('bq_founder_scale');
    if (fScale) setFounderScale(parseFloat(fScale) || 1.0);
    const fPix = localStorage.getItem('bq_founder_pix');
    if (fPix) setFounderPixelated(fPix === 'true');

    const coX = localStorage.getItem('bq_cofounder_x');
    if (coX) setCofounderXOffset(parseInt(coX) || 0);
    const coY = localStorage.getItem('bq_cofounder_y');
    if (coY) setCofounderYOffset(parseInt(coY) || 0);
    const coScale = localStorage.getItem('bq_cofounder_scale');
    if (coScale) setCofounderScale(parseFloat(coScale) || 1.0);
    const coPix = localStorage.getItem('bq_cofounder_pix');
    if (coPix) setCofounderPixelated(coPix === 'true');

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
      const email = authEmail?.trim().toLowerCase();
      if (!email || (!ADMIN_EMAILS.includes(email) && !HR_EMAILS.includes(email))) {
        throw new Error("Access Denied: You are not authorized to access the HR Panel.");
      }
      const u = await auth.signIn({ email: email, password: authPassword });
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
      if (!u.email || (!ADMIN_EMAILS.includes(u.email) && !HR_EMAILS.includes(u.email))) {
        throw new Error("Access Denied: You are not authorized to access the HR Panel.");
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
      headerTitle: headerTitle || 'OFFER LETTER',
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
    setHeaderTitle(rec.headerTitle || 'OFFER LETTER');
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
    setHeaderTitle('OFFER LETTER');
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

  const updateFounderSignOffset = (x: number, y: number, scale: number, pixelated: boolean) => {
    setFounderXOffset(x);
    setFounderYOffset(y);
    setFounderScale(scale);
    setFounderPixelated(pixelated);
    localStorage.setItem('bq_founder_x', x.toString());
    localStorage.setItem('bq_founder_y', y.toString());
    localStorage.setItem('bq_founder_scale', scale.toString());
    localStorage.setItem('bq_founder_pix', pixelated.toString());
  };

  const updateCofounderSignOffset = (x: number, y: number, scale: number, pixelated: boolean) => {
    setCofounderXOffset(x);
    setCofounderYOffset(y);
    setCofounderScale(scale);
    setCofounderPixelated(pixelated);
    localStorage.setItem('bq_cofounder_x', x.toString());
    localStorage.setItem('bq_cofounder_y', y.toString());
    localStorage.setItem('bq_cofounder_scale', scale.toString());
    localStorage.setItem('bq_cofounder_pix', pixelated.toString());
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
      updateFounderSignOffset(0, 0, 1.0, false);
    } else {
      setCofounderSign('');
      localStorage.removeItem('bq_cofounder_sign');
      updateCofounderSignOffset(0, 0, 1.0, false);
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

  const renderDocumentHeader = () => (
    <div className="relative w-full h-[1.55in] bg-[#010f24] text-white flex items-center justify-between px-[0.6in] overflow-hidden shrink-0">
      <div className="absolute top-0 right-0 w-[38%] h-full bg-[#fbbc04] transform skew-x-[-30deg] translate-x-[20%]" style={{ borderLeft: '6px solid #010f24' }} />
      <div className="absolute top-2.5 right-3 flex gap-1 z-20">
        <div className="w-1.5 h-1.5 bg-[#010f24]/30 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-[#010f24]/40 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-[#010f24]/50 rounded-full"></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#fbbc04] transform z-10" style={{ clipPath: 'polygon(0 80%, 35% 0, 100% 100%, 0 100%)' }}></div>
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#010f24] transform z-10" style={{ clipPath: 'polygon(0 85%, 33% 20%, 100% 100%, 0 100%)' }} />
      <div className="relative z-20 flex items-start h-full pt-2.5 pb-5">
        <img 
          src="/assets/image.png" 
          alt="buyQk Logo" 
          className="h-[1.15in] w-auto object-contain" 
        />
      </div>
      <div className="relative z-20 flex flex-col items-end justify-center h-full pt-1 pb-5 pr-6 font-sans text-right select-none">
        <span className="text-[7pt] font-black tracking-[0.25em] uppercase text-[#010f24] leading-none block mb-1">THE</span>
        <span className="text-[11pt] font-black tracking-[0.18em] uppercase text-[#010f24] leading-none block mb-1">UNIVERSAL</span>
        <span className="text-[7pt] font-black tracking-[0.12em] uppercase text-[#010f24] leading-none block">LOCAL SUPPLY NETWORK</span>
      </div>
    </div>
  );

  const renderDocumentFooter = (pageNumber?: number, totalPages?: number) => (
    <div className="relative w-full h-[0.9in] bg-[#010f24] text-white flex items-center justify-between pl-0 pr-[0.6in] overflow-hidden shrink-0 mt-auto">
      <div className="relative h-full w-[22%] bg-[#fbbc04] flex items-center justify-center pr-3 shrink-0" style={{ clipPath: 'polygon(0 0, 84% 0, 100% 100%, 0 100%)' }}>
        <div className="flex items-center gap-1.5 text-[#010f24] font-sans">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="font-black text-xs uppercase tracking-wider">buyQk</span>
        </div>
      </div>
      <div className="text-left leading-tight shrink-0 font-sans">
        <span className="text-[7.5pt] font-black text-white block">FIND ANYTHING.</span>
        <span className="text-[7.5pt] font-black text-[#fbbc04] block">DELIVER ANYTHING.</span>
        <span className="text-[7.5pt] font-black text-white font-mono tracking-wider block">INSTANTLY.</span>
      </div>
      <div className="w-[1px] h-8 bg-white/15 shrink-0"></div>
      <div className="flex items-center gap-5 font-sans shrink-0">
        <div className="flex flex-col items-center text-center gap-0.5">
          <svg className="w-4 h-4 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[5.5pt] font-bold uppercase text-slate-200 tracking-wider leading-tight">Local<br/>Sellers</span>
        </div>
        <div className="w-[1px] h-7 bg-white/10 shrink-0"></div>
        <div className="flex flex-col items-center text-center gap-0.5">
          <svg className="w-4 h-4 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span className="text-[5.5pt] font-bold uppercase text-slate-200 tracking-wider leading-tight">Happy<br/>Customers</span>
        </div>
        <div className="w-[1px] h-7 bg-white/10 shrink-0"></div>
        <div className="flex flex-col items-center text-center gap-0.5">
          <svg className="w-4 h-4 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span className="text-[5.5pt] font-bold uppercase text-[#fbbc04] tracking-wider leading-tight">Fast & Reliable<br/>Delivery</span>
        </div>
        <div className="w-[1px] h-7 bg-white/10 shrink-0"></div>
        <div className="flex flex-col items-center text-center gap-0.5">
          <svg className="w-4 h-4 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-[5.5pt] font-bold uppercase text-slate-200 tracking-wider leading-tight">Safe &<br/>Secure</span>
        </div>
      </div>
      {pageNumber && totalPages && (
        <>
          <div className="w-[1px] h-8 bg-white/15 shrink-0"></div>
          <div className="text-right font-sans font-mono shrink-0">
            <span className="text-[7pt] font-extrabold text-[#fbbc04] block">PAGE {pageNumber} OF {totalPages}</span>
            <span className="text-[5pt] font-bold text-slate-400 block tracking-widest uppercase">CONFIDENTIAL</span>
          </div>
        </>
      )}
    </div>
  );

  const estimateVisualLines = (line: string): number => {
    const trimmed = line.trim();
    if (!trimmed) return 0.4;
    if (trimmed.startsWith('# ') || /^CHAPTER\s+\d+/i.test(trimmed)) return 2.2;
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ') || (/^[A-Z0-9\s&()’,.—]+$/.test(trimmed) && trimmed.length > 3 && trimmed === trimmed.toUpperCase())) return 1.8;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ') || /^\d+\.\s*/.test(trimmed)) {
      const textOnly = trimmed.replace(/^[-*•\d\.]+\s*/, '');
      return Math.max(1, Math.ceil(textOnly.length / 80)) + 0.3;
    }
    return Math.max(1, Math.ceil(trimmed.length / 85)) + 0.35;
  };

  const getPagesList = () => {
    const basic = compiledText();
    const explicitPages = basic.split('⸻').map(p => p.trim()).filter(p => p.length > 0);
    
    const finalPages: string[] = [];

    explicitPages.forEach((page) => {
      const lines = page.split('\n');
      let currentChunk: string[] = [];
      let currentVisualLines = 0;

      lines.forEach((line) => {
        const lineWeight = estimateVisualLines(line);
        // Page 1 capacity is ~32 visual lines (due to date, ref, header title, CTC table).
        // Middle/later pages capacity is ~44 visual lines.
        const activeCapacity = (finalPages.length === 0) ? 32 : 44;

        if (currentVisualLines + lineWeight > activeCapacity && currentChunk.length > 0) {
          finalPages.push(currentChunk.join('\n'));
          currentChunk = [line];
          currentVisualLines = lineWeight;
        } else {
          currentChunk.push(line);
          currentVisualLines += lineWeight;
        }
      });

      if (currentChunk.length > 0) {
        finalPages.push(currentChunk.join('\n'));
      }
    });

    return finalPages.length > 0 ? finalPages : [''];
  };

  const handleDownloadHandbook = () => {
    if (!chaptersText) {
      alert("Policies handbook is still loading. Please wait a moment.");
      return;
    }

    // Create a temporary container for handbook generation
    const printContainer = document.createElement('div');
    printContainer.id = 'policies-handbook-print-container';
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';
    printContainer.style.width = '210mm';
    printContainer.style.background = 'white';
    printContainer.style.color = '#1e293b';
    document.body.appendChild(printContainer);

    // Split chaptersText by page divider
    const handbookChapters = chaptersText.split('⸻').map(c => c.trim()).filter(c => c.length > 0);

    // Populate the container with page cards
    handbookChapters.forEach((chapterContent, index) => {
      const isFirstPage = index === 0;
      const isLastPage = index === handbookChapters.length - 1;

      // Create the page card element
      const pageCard = document.createElement('div');
      pageCard.className = 'a4-page-card bg-white text-slate-900 border-none m-0 shadow-none';
      pageCard.style.width = '210mm';
      pageCard.style.height = '297mm';
      pageCard.style.minHeight = '297mm';
      pageCard.style.maxHeight = '297mm';
      pageCard.style.display = 'flex';
      pageCard.style.flexDirection = 'column';
      pageCard.style.justifyContent = 'space-between';
      pageCard.style.boxSizing = 'border-box';
      pageCard.style.overflow = 'hidden';
      pageCard.style.pageBreakAfter = 'always';
      pageCard.style.pageBreakInside = 'avoid';

      // 1. Render Header
      const headerDiv = document.createElement('div');
      headerDiv.className = 'relative w-full h-[1.55in] bg-[#010f24] text-white flex items-center justify-between px-[0.6in] overflow-hidden shrink-0';
      headerDiv.innerHTML = `
        <div class="absolute top-0 right-0 w-[38%] h-full bg-[#fbbc04] transform skew-x-[-30deg] translate-x-[20%]" style="border-left: 6px solid #010f24;"></div>
        <div class="absolute top-2.5 right-3 flex gap-1 z-20">
          <div class="w-1.5 h-1.5 bg-[#010f24]/30 rounded-full"></div>
          <div class="w-1.5 h-1.5 bg-[#010f24]/40 rounded-full"></div>
          <div class="w-1.5 h-1.5 bg-[#010f24]/50 rounded-full"></div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-4 bg-[#fbbc04] transform z-10" style="clip-path: polygon(0 80%, 35% 0, 100% 100%, 0 100%);"></div>
        <div class="absolute bottom-0 left-0 right-0 h-3 bg-[#010f24] transform z-10" style="clip-path: polygon(0 85%, 33% 20%, 100% 100%, 0 100%);"></div>
        <div class="relative z-20 flex items-start h-full pt-2.5 pb-5">
          <img src="/assets/image.png" alt="buyQk Logo" style="height: 1.15in; width: auto; object-fit: contain;" />
        </div>
        <div class="relative z-20 flex flex-col items-end justify-center h-full pt-1 pb-5 pr-6 font-sans text-right">
          <span style="font-size: 7pt; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: #010f24; line-height: 1; display: block; margin-bottom: 3px;">THE</span>
          <span style="font-size: 11pt; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: #010f24; line-height: 1; display: block; margin-bottom: 3px;">UNIVERSAL</span>
          <span style="font-size: 7pt; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #010f24; line-height: 1; display: block;">LOCAL SUPPLY NETWORK</span>
        </div>
      `;
      pageCard.appendChild(headerDiv);

      // 2. Render Page Content
      const contentDiv = document.createElement('div');
      contentDiv.className = 'flex-1 flex flex-col justify-start px-[0.8in] py-4 overflow-hidden relative font-sans';
      contentDiv.style.flex = '1';
      contentDiv.style.display = 'flex';
      contentDiv.style.flexDirection = 'column';
      contentDiv.style.justifyContent = 'start';
      contentDiv.style.padding = '16px 0.8in';
      contentDiv.style.overflow = 'hidden';
      contentDiv.style.boxSizing = 'border-box';

      // Parse chapter content line by line
      const lines = chapterContent.split('\n');
      let parsedHTML = '<div style="flex: 1;">';

      if (isFirstPage) {
        parsedHTML += `
          <div class="text-center my-6 flex flex-col items-center shrink-0" style="text-align: center; margin-bottom: 24px;">
            <h1 class="text-[22pt] font-black tracking-tight text-[#021835] uppercase m-0 leading-tight" style="font-size: 22pt; font-weight: 900; color: #021835; text-transform: uppercase;">FOUNDING OWNERSHIP PROGRAM</h1>
            <p class="text-[12pt] text-slate-500 font-bold mt-1" style="font-size: 11pt; color: #64748b; font-weight: bold; margin: 4px 0 0 0;">Policies, Guiding Principles & Oath Handbook</p>
            <div style="display: flex; align-items: center; justify-content: center; width: 100%; max-width: 200px; margin: 12px auto 0 auto; position: relative;">
              <div style="width: 100%; height: 2px; background-color: #fbbc04;"></div>
            </div>
          </div>
        `;
      }

      lines.forEach(lineStr => {
        const line = lineStr.trim();
        if (!line) return;

        const isChapterTitle = /^CHAPTER\s+\d+/i.test(line);
        const isMainTitle = /^[A-Z0-9\s&()’,.—]+$/.test(line) && line.length > 3 && line === line.toUpperCase();

        let processedLine = line;
        if (line.includes('Builder Name:')) {
          processedLine = `Builder Name: <strong>${(name || "_____________________")}</strong>`;
        } else if (line.includes('Corporate Role:')) {
          processedLine = `Corporate Role: <strong>${(position || "_____________________")}</strong>`;
        } else if (line.includes('Department / Team:')) {
          processedLine = `Department / Team: <strong>Engineering / Operations</strong>`;
        }

        if (isChapterTitle) {
          parsedHTML += `<h2 style="font-size: 12pt; font-weight: 900; color: #021835; text-transform: uppercase; margin-top: 16px; margin-bottom: 8px; font-family: sans-serif;">${processedLine}</h2>`;
        } else if (isMainTitle) {
          parsedHTML += `<h3 style="font-size: 11pt; font-weight: 800; color: #021835; margin-top: 12px; margin-bottom: 6px; font-family: sans-serif;">${processedLine}</h3>`;
        } else if (processedLine.startsWith('*') || processedLine.startsWith('•')) {
          parsedHTML += `
            <div style="display: flex; align-items: start; gap: 8px; font-size: 9.5pt; color: #334155; line-height: 1.5; margin-bottom: 4px; padding-left: 16px; font-family: sans-serif; text-align: justify;">
              <span style="color: #fbbc04; font-weight: bold; margin-top: 2px; font-size: 10px;">•</span>
              <span style="flex: 1;">${processedLine.replace(/^[\*•]\s*/, '')}</span>
            </div>
          `;
        } else if (/^\d+\.\s*/.test(processedLine)) {
          const matchedNum = processedLine.match(/^\d+\./)?.[0] || '';
          parsedHTML += `
            <div style="display: flex; align-items: start; gap: 8px; font-size: 9.5pt; color: #334155; line-height: 1.5; margin-bottom: 4px; padding-left: 16px; font-family: sans-serif; text-align: justify;">
              <span style="color: #021835; font-weight: 900; margin-top: 2px; font-size: 10px;">${matchedNum}</span>
              <span style="flex: 1;">${processedLine.replace(/^\d+\.\s*/, '')}</span>
            </div>
          `;
        } else if (processedLine.includes('[BUILDER DETAILS]') || processedLine.includes('[AUTHORIZED CORPORATE SIGNATORIES]')) {
          parsedHTML += `<h4 style="font-size: 10pt; font-weight: 900; color: #021835; text-transform: uppercase; margin-top: 16px; margin-bottom: 8px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-family: sans-serif;">${processedLine}</h4>`;
        } else {
          parsedHTML += `<p style="font-size: 9.5pt; color: #334155; line-height: 1.5; margin-bottom: 8px; font-family: sans-serif; text-align: justify;">${processedLine}</p>`;
        }
      });

      // Acknowledgement Signatures Block
      if (isLastPage) {
        parsedHTML += `
          <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="font-family: sans-serif; font-size: 8.5pt; color: #475569;">
              <p style="font-weight: bold; color: #0f172a; margin: 0 0 4px 0;">Ankit Shrivastav</p>
              <p style="margin: 0 0 8px 0; font-size: 7.5pt;">Founder & CEO</p>
              <div style="height: 35px; display: flex; align-items: end; margin-bottom: 4px;">
                ${founderSign ? `<img src="${founderSign}" style="height: 30px; object-fit: contain; transform: translate(${founderXOffset}px, ${founderYOffset}px) scale(${founderScale}); image-rendering: ${founderPixelated ? 'pixelated' : 'auto'};" />` : '<span style="font-style: italic; color: #cbd5e1;">[Pending]</span>'}
              </div>
              <div style="border-top: 1.5px solid #021835; margin-top: 4px;"></div>
              <p style="font-size: 7pt; uppercase; tracking-wider; font-weight: 800; color: #021835;">Signature of Authorized Signatory</p>
            </div>
            <div style="font-family: sans-serif; font-size: 8.5pt; color: #475569;">
              <p style="font-weight: bold; color: #0f172a; margin: 0 0 4px 0;">Akshat Srivastava</p>
              <p style="margin: 0 0 8px 0; font-size: 7.5pt;">Co-Founder & CTO</p>
              <div style="height: 35px; display: flex; align-items: end; margin-bottom: 4px;">
                ${cofounderSign ? `<img src="${cofounderSign}" style="height: 30px; object-fit: contain; transform: translate(${cofounderXOffset}px, ${cofounderYOffset}px) scale(${cofounderScale}); image-rendering: ${cofounderPixelated ? 'pixelated' : 'auto'};" />` : '<span style="font-style: italic; color: #cbd5e1;">[Pending]</span>'}
              </div>
              <div style="border-top: 1.5px solid #021835; margin-top: 4px;"></div>
              <p style="font-size: 7pt; uppercase; tracking-wider; font-weight: 800; color: #021835;">Signature of Authorized Signatory</p>
            </div>
          </div>
        `;
      }

      parsedHTML += '</div>';
      contentDiv.innerHTML = parsedHTML;
      pageCard.appendChild(contentDiv);

      // 3. Render Footer
      const footerDiv = document.createElement('div');
      footerDiv.className = 'relative w-full h-[0.9in] bg-[#010f24] text-white flex items-center justify-between pl-0 pr-[0.6in] overflow-hidden shrink-0';
      footerDiv.innerHTML = `
        <div class="relative h-full w-[22%] bg-[#fbbc04] flex items-center justify-center pr-3 shrink-0" style="clip-path: polygon(0 0, 84% 0, 100% 100%, 0 100%);">
          <div class="flex items-center gap-1.5 text-[#010f24] font-sans">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span class="font-black text-xs uppercase tracking-wider">buyQk</span>
          </div>
        </div>
        <div class="text-left leading-tight shrink-0 font-sans">
          <span class="text-[7.5pt] font-black text-white block">BUILD. BELIEVE. BELONG.</span>
          <span class="text-[7.5pt] font-black text-[#fbbc04] block">BUYQK CORPORATE POLICIES.</span>
        </div>
        <div style="width: 1px; height: 32px; background-color: rgba(255, 255, 255, 0.15);"></div>
        <div class="text-[#fbbc04] font-black text-xs font-mono tracking-wider shrink-0" style="font-size: 8.5pt; color: #fbbc04; font-weight: 900; font-family: monospace;">
          PAGE ${index + 1} OF ${handbookChapters.length}
        </div>
      `;
      pageCard.appendChild(footerDiv);

      printContainer.appendChild(pageCard);
    });

    const handbookFilename = `BuyQK_Corporate_Handbook_${(name || "Candidate").trim().replace(/\s+/g, '_')}.pdf`;
    const options = {
      margin: [0, 0, 0, 0],
      filename: handbookFilename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2.2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const doDownload = () => {
      (window as any).html2pdf().set(options).from(printContainer).save().then(() => {
        document.body.removeChild(printContainer);
      });
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = doDownload;
      document.body.appendChild(script);
    } else {
      doDownload();
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`)/g);
    return parts.map((part, index) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        const inner = part.slice(2, -2);
        return <strong key={index} className="font-black text-[#021835]">{inner}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1);
        return <code key={index} className="font-mono bg-slate-100 text-slate-900 px-1 py-0.5 rounded text-[0.9em]">{inner}</code>;
      }
      return part;
    });
  };

  const renderPageContent = (pageText: string, isFirstPage: boolean, isLastPage: boolean) => {
    const lines = pageText.split('\n');
    const renderedElements: React.ReactNode[] = [];
    
    let keyCounter = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const isH1 = line.startsWith('# ');
      const isH2 = line.startsWith('## ');
      const isH3 = line.startsWith('### ');
      const isChapterTitle = /^CHAPTER\s+\d+/i.test(line);
      const isMainTitle = /^[A-Z0-9\s&()’,.—]+$/.test(line) && line.length > 3 && line === line.toUpperCase();
      
      if (isH1) {
        renderedElements.push(
          <h1 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize + 3.5}pt` }}
            className="font-black text-[#021835] uppercase tracking-wide mt-3 mb-1.5 font-sans border-b border-slate-200 pb-0.5"
          >
            {renderFormattedText(line.replace(/^#\s+/, ''))}
          </h1>
        );
      } else if (isH2) {
        renderedElements.push(
          <h2 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize + 2}pt` }}
            className="font-black text-[#021835] uppercase tracking-wider mt-2.5 mb-1 font-sans"
          >
            {renderFormattedText(line.replace(/^##\s+/, ''))}
          </h2>
        );
      } else if (isH3) {
        renderedElements.push(
          <h3 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize + 1}pt` }}
            className="font-extrabold text-[#021835] mt-2 mb-1 font-sans"
          >
            {renderFormattedText(line.replace(/^###\s+/, ''))}
          </h3>
        );
      } else if (isChapterTitle) {
        renderedElements.push(
          <h2 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize + 2.5}pt` }}
            className="font-black text-[#021835] uppercase tracking-wider mt-3 mb-1.5 font-sans border-b border-slate-100 pb-0.5"
          >
            {renderFormattedText(line)}
          </h2>
        );
      } else if (isMainTitle) {
        renderedElements.push(
          <h3 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize + 1.5}pt` }}
            className="font-extrabold text-[#021835] mt-2 mb-1.5 font-sans"
          >
            {renderFormattedText(line)}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        renderedElements.push(
          <div 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize}pt` }}
            className={`flex items-start gap-2 text-slate-700 leading-hyper-tight mb-1 pl-3 font-sans ${textAlign === 'left' ? 'text-left' : 'text-justify'}`}
          >
            <span className="text-[#fbbc04] font-black text-xs select-none mt-0.5">•</span>
            <span className="flex-1">{renderFormattedText(line.replace(/^[-*•]\s*/, ''))}</span>
          </div>
        );
      } else if (/^\d+\.\s*/.test(line)) {
        renderedElements.push(
          <div 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize}pt` }}
            className={`flex items-start gap-2 text-slate-700 leading-hyper-tight mb-1 pl-3 font-sans ${textAlign === 'left' ? 'text-left' : 'text-justify'}`}
          >
            <span className="text-[#021835] font-extrabold text-xs select-none mt-0.5">{line.match(/^\d+\./)?.[0]}</span>
            <span className="flex-1">{renderFormattedText(line.replace(/^\d+\.\s*/, ''))}</span>
          </div>
        );
      } else {
        renderedElements.push(
          <p 
            key={keyCounter++} 
            style={{ fontSize: `${documentFontSize}pt` }}
            className={`text-slate-700 leading-hyper-tight mb-1 font-sans ${textAlign === 'left' ? 'text-left' : 'text-justify'}`}
          >
            {renderFormattedText(line)}
          </p>
        );
      }
    }

    return (
      <div className="flex-1 flex flex-col justify-start px-[0.75in] py-3.5 overflow-hidden relative">
        <div className="flex-1">
          {isFirstPage && (
            <>
              {/* Reference and Date block */}
              <div 
                style={{ fontSize: `${documentFontSize - 0.5}pt` }}
                className="flex flex-col gap-1 items-end justify-start text-[#021835] font-sans mt-[0.1in] mb-3 w-full shrink-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#021835] text-white rounded-md flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-3 h-3 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <span className="font-bold text-slate-700">Date:</span>
                  <span className="pl-1 font-medium text-slate-900 font-mono">
                    {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#021835] text-white rounded-md flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-3 h-3 text-[#fbbc04]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <span className="font-bold text-slate-700">Ref:</span>
                  <span className="pl-1 font-medium text-slate-900 font-mono">
                    REF: {refNo || "BQ/"}
                  </span>
                </div>
              </div>
              
              {/* Document Header Title block */}
              <div className="text-center my-3 flex flex-col items-center shrink-0">
                <h1 className="text-[20pt] font-black tracking-tight text-[#021835] font-sans m-0 uppercase">
                  {headerTitle || "OFFER LETTER"}
                </h1>
                <div className="flex items-center justify-center w-full max-w-[180px] mt-0.5 relative">
                  <div className="w-full h-[1.5px] bg-[#fbbc04]"></div>
                  <div className="absolute bg-white px-2">
                    <svg className="w-3 h-3 text-[#fbbc04]" viewBox="0 0 100 100" fill="currentColor">
                      <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="mb-3 text-left" style={{ fontSize: `${documentFontSize + 0.5}pt` }}>
                <p className="font-bold text-slate-755 m-0">Dear <span className="font-black text-[#021835]">{name || "____________________"}</span>,</p>
              </div>
            </>
          )}

          {renderedElements}

          {/* Conditional CTC Breakup Table on Page 0 */}
          {isFirstPage && ctc && (
            <div className="mt-3 font-sans text-left shrink-0">
              <h4 
                style={{ fontSize: `${documentFontSize - 1.0}pt` }}
                className="font-extrabold text-slate-700 uppercase tracking-widest mb-1.5"
              >
                Salary Breakup Guidelines
              </h4>
              <table 
                className="w-full border border-slate-200 border-collapse bg-slate-50/20"
                style={{ fontSize: `${documentFontSize - 0.5}pt` }}
              >
                <thead>
                  <tr className="bg-slate-100/60 text-slate-750 border-b border-slate-200">
                    <th className="border-r border-slate-200 px-3 py-1 text-left font-bold uppercase tracking-wider" style={{ fontSize: `${documentFontSize - 2.0}pt` }}>Designation / Package detail</th>
                    <th className="px-3 py-1 text-right font-bold uppercase tracking-wider" style={{ fontSize: `${documentFontSize - 2.0}pt` }}>Structure ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-150">
                    <td className="border-r border-slate-200 px-3 py-1 text-slate-600">Assigned Corporate Role</td>
                    <td className="px-3 py-1 text-right text-slate-900 font-bold">{position || "TBD"}</td>
                  </tr>
                  <tr className="border-b border-slate-150">
                    <td className="border-r border-slate-200 px-3 py-1 text-slate-600 font-sans">Monthly Remuneration / Annual CTC</td>
                    <td className="px-3 py-1 text-right text-slate-950 font-black font-sans">{ctc}</td>
                  </tr>
                  {joiningDate && (
                    <tr>
                      <td className="border-r border-slate-200 px-3 py-1 text-slate-600 font-sans">Start Date / Date of Joining</td>
                      <td className="px-3 py-1 text-right text-slate-900 font-semibold font-sans">
                        {new Date(joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* If last page, render e-signatures block */}
        {isLastPage && (
          <div className="mt-auto pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 w-full sticky bottom-0 bg-white z-20">
            <div className="relative flex flex-col items-center text-center font-sans">
              <div className="absolute -top-[1.2in] left-4 w-9 h-9 flex items-center justify-center shrink-0">
                <svg className="absolute w-full h-full text-[#fbbc04]" viewBox="0 0 100 100" fill="currentColor">
                  <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                </svg>
                <svg className="relative w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="text-left w-full pl-2">
                <h3 className="text-[10pt] font-black text-slate-800 mb-0.5">Ankit Shrivastav</h3>
                <p className="text-[8pt] text-slate-500 font-semibold mb-2">Founder & CEO</p>
              </div>
              <div className="h-12 flex items-end justify-center w-full relative mb-1">
                {founderSign ? (
                  <img src={founderSign} alt="Founder Signature" className="h-10 w-auto object-contain block max-w-full z-10"
                    style={{ transform: `translate(${founderXOffset}px, ${founderYOffset}px) scale(${founderScale})`, imageRendering: founderPixelated ? 'pixelated' : 'auto' }}
                  />
                ) : (
                  <div className="italic text-[10pt] text-slate-350 select-none pb-1 font-serif">[Pending Signature]</div>
                )}
              </div>
              <div className="w-full border-t-2 border-[#021835] my-1" />
              <p className="text-[7.5pt] uppercase tracking-widest text-[#021835] font-extrabold mt-0.5">Signature</p>
            </div>

            <div className="relative flex flex-col items-center text-center font-sans">
              <div className="absolute -top-[1.2in] left-4 w-9 h-9 flex items-center justify-center shrink-0">
                <svg className="absolute w-full h-full text-[#fbbc04]" viewBox="0 0 100 100" fill="currentColor">
                  <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                </svg>
                <svg className="relative w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="text-left w-full pl-2">
                <h3 className="text-[10pt] font-black text-slate-800 mb-0.5">Akshat Srivastava</h3>
                <p className="text-[8pt] text-slate-500 font-semibold mb-2">Co-Founder & CTO</p>
              </div>
              <div className="h-12 flex items-end justify-center w-full relative mb-1">
                {cofounderSign ? (
                  <img src={cofounderSign} alt="Co-Founder Signature" className="h-10 w-auto object-contain block max-w-full z-10"
                    style={{ transform: `translate(${cofounderXOffset}px, ${cofounderYOffset}px) scale(${cofounderScale})`, imageRendering: cofounderPixelated ? 'pixelated' : 'auto' }}
                  />
                ) : (
                  <div className="italic text-[10pt] text-slate-350 select-none pb-1 font-serif">[Pending Signature]</div>
                )}
              </div>
              <div className="w-full border-t-2 border-[#021835] my-1" />
              <p className="text-[7.5pt] uppercase tracking-widest text-[#021835] font-extrabold mt-0.5">Signature</p>
            </div>
          </div>
        )}
      </div>
    );
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
    const titlePrefix = (headerTitle || "Offer_Letter").trim().replace(/\s+/g, '_');
    const filename = `${titlePrefix}_${(name || "Candidate").trim().replace(/\s+/g, '_')}.pdf`;
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

        {/* Premium switcher for V1, V2, V3 */}
        <div className="flex items-center gap-1 border border-blue-900/30 bg-slate-950/80 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => setCurrentTab('v1')}
            className={`px-3 py-1.5 font-sans font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer ${
              currentTab === 'v1' 
                ? 'bg-yellow-500 text-slate-950 shadow-gold-glow font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
            }`}
          >
            Offer Generator V1
          </button>
          
          <button 
            type="button"
            onClick={() => setCurrentTab('v2')}
            className={`px-3 py-1.5 font-sans font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer ${
              currentTab === 'v2' 
                ? 'bg-yellow-500 text-slate-950 shadow-gold-glow font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
            }`}
          >
            Offer letter generator V2
          </button>

          <button 
            type="button"
            onClick={() => setCurrentTab('v3')}
            className={`px-3 py-1.5 font-sans font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer ${
              currentTab === 'v3' 
                ? 'bg-yellow-500 text-slate-950 shadow-gold-glow font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
            }`}
          >
            Offer letter generator V3
          </button>
        </div>
        
        <div className="flex items-center gap-3 font-sans">
          {(currentTab === 'v1' || currentTab === 'v3') && (
            <>
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
            </>
          )}

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
      {(currentTab === 'v1' || currentTab === 'v3') ? (
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

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-455">Document Header Title (e.g. OFFER LETTER)</label>
              <input 
                type="text" 
                value={headerTitle} 
                placeholder="e.g. OFFER LETTER, APPOINTMENT LETTER, AGREEMENT"
                onChange={e => setHeaderTitle(e.target.value)}
                className="w-full bg-slate-950/60 border border-blue-900/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-xs font-semibold uppercase tracking-wider"
              />
            </div>

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
                <option value="founding_ownership">Founding Ownership Program</option>
                <option value="nda">Non-Disclosure Agreement (NDA)</option>
                <option value="ip_agreement">Intellectual Property Agreement</option>
                <option value="code_of_conduct">Code of Conduct</option>
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

          {/* Document Font & Layout Settings */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-[#fbbc04]" /> 3.5. Document Font & Spacing Settings
            </h3>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="font-semibold">Offer Letter Font Size</span>
                <span className="text-yellow-500 font-mono font-bold">{documentFontSize.toFixed(1)} pt</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans mb-1">
                Dynamically scale the font size to adjust page layout and avoid overflowing content to extra pages.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-bold">8.0 pt</span>
                <input 
                  type="range"
                  min="8.0"
                  max="12.5"
                  step="0.5"
                  value={documentFontSize}
                  onChange={(e) => updateDocumentFontSize(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <span className="text-[10px] text-slate-500 font-bold">12.5 pt</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Paragraph Text Alignment</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTextAlign('justify')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    textAlign === 'justify'
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-extrabold shadow-gold-glow'
                      : 'bg-slate-950/60 text-slate-400 border-blue-900/30 hover:text-white'
                  }`}
                >
                  Justified Align
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign('left')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    textAlign === 'left'
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-extrabold shadow-gold-glow'
                      : 'bg-slate-950/60 text-slate-400 border-blue-900/30 hover:text-white'
                  }`}
                >
                  Left Align
                </button>
              </div>
            </div>
          </div>

          {/* HR Signature Authorization */}
          <div className="bg-slate-900/40 border border-blue-900/20 rounded-2xl p-5 shadow-premium flex flex-col gap-5 mb-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="w-4 h-4 text-yellow-500" /> 4. Signature Tuning & Alignment Console
            </h3>

            {/* Founder Sign */}
            <div className="flex flex-col gap-3 p-4 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Founder: Ankit Shrivastav</span>
                {founderSign && (
                  <button onClick={() => clearSignature('founder')} className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors">Clear</button>
                )}
              </div>
              {founderSign ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-32 border border-slate-800 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1 shrink-0 relative">
                      <img 
                        src={founderSign} 
                        alt="Founder Signature" 
                        className="h-full w-auto object-contain" 
                        style={{
                          transform: `translate(${founderXOffset}px, ${founderYOffset}px) scale(${founderScale})`,
                          imageRendering: founderPixelated ? 'pixelated' : 'auto'
                        }}
                      />
                    </div>
                    {/* Pixelate toggle & Scale Slider */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={founderPixelated} 
                          onChange={(e) => updateFounderSignOffset(founderXOffset, founderYOffset, founderScale, e.target.checked)}
                          className="rounded border-slate-700 bg-slate-850 text-yellow-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">Pixelate / Sharp Ink</span>
                      </label>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Zoom (Scale)</span>
                          <span className="text-yellow-500 font-mono font-bold">{founderScale.toFixed(2)}x</span>
                        </div>
                        <input 
                          type="range"
                          min="0.3"
                          max="2.5"
                          step="0.05"
                          value={founderScale}
                          onChange={(e) => updateFounderSignOffset(founderXOffset, founderYOffset, parseFloat(e.target.value), founderPixelated)}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Positioning Joystick Pad Layout */}
                  <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Align Signature</span>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-400 font-mono">
                        <div>X Offset: <span className="text-slate-200">{founderXOffset}px</span></div>
                        <div>Y Offset: <span className="text-slate-200">{founderYOffset}px</span></div>
                      </div>
                    </div>

                    {/* D-Pad controls */}
                    <div className="flex items-center gap-1 shrink-0 bg-slate-950/80 p-1 rounded-lg border border-slate-850">
                      <button 
                        onClick={() => updateFounderSignOffset(founderXOffset - 1, founderYOffset, founderScale, founderPixelated)}
                        title="Move Left 1px"
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                      >
                        ←
                      </button>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => updateFounderSignOffset(founderXOffset, founderYOffset - 1, founderScale, founderPixelated)}
                          title="Move Up 1px"
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => updateFounderSignOffset(founderXOffset, founderYOffset + 1, founderScale, founderPixelated)}
                          title="Move Down 1px"
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          ↓
                        </button>
                      </div>
                      <button 
                        onClick={() => updateFounderSignOffset(founderXOffset + 1, founderYOffset, founderScale, founderPixelated)}
                        title="Move Right 1px"
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                      >
                        →
                      </button>
                      <button 
                        onClick={() => updateFounderSignOffset(0, 0, 1.0, founderPixelated)}
                        title="Reset Alignment"
                        className="w-6 h-6 flex items-center justify-center rounded bg-red-955/50 hover:bg-red-900/50 text-red-200 text-[9px] font-bold transition-all border border-red-900/20 ml-1"
                      >
                        Rst
                      </button>
                    </div>
                  </div>
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
            <div className="flex flex-col gap-3 p-4 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Co-Founder: Akshat Srivastava</span>
                {cofounderSign && (
                  <button onClick={() => clearSignature('cofounder')} className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors">Clear</button>
                )}
              </div>
              {cofounderSign ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-32 border border-slate-800 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1 shrink-0 relative">
                      <img 
                        src={cofounderSign} 
                        alt="Co-Founder Signature" 
                        className="h-full w-auto object-contain" 
                        style={{
                          transform: `translate(${cofounderXOffset}px, ${cofounderYOffset}px) scale(${cofounderScale})`,
                          imageRendering: cofounderPixelated ? 'pixelated' : 'auto'
                        }}
                      />
                    </div>
                    {/* Pixelate toggle & Scale Slider */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={cofounderPixelated} 
                          onChange={(e) => updateCofounderSignOffset(cofounderXOffset, cofounderYOffset, cofounderScale, e.target.checked)}
                          className="rounded border-slate-700 bg-slate-850 text-yellow-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">Pixelate / Sharp Ink</span>
                      </label>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Zoom (Scale)</span>
                          <span className="text-yellow-500 font-mono font-bold">{cofounderScale.toFixed(2)}x</span>
                        </div>
                        <input 
                          type="range"
                          min="0.3"
                          max="2.5"
                          step="0.05"
                          value={cofounderScale}
                          onChange={(e) => updateCofounderSignOffset(cofounderXOffset, cofounderYOffset, parseFloat(e.target.value), cofounderPixelated)}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Positioning Joystick Pad Layout */}
                  <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Align Signature</span>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-400 font-mono">
                        <div>X Offset: <span className="text-slate-200">{cofounderXOffset}px</span></div>
                        <div>Y Offset: <span className="text-slate-200">{cofounderYOffset}px</span></div>
                      </div>
                    </div>

                    {/* D-Pad controls */}
                    <div className="flex items-center gap-1 shrink-0 bg-slate-950/80 p-1 rounded-lg border border-slate-850">
                      <button 
                        onClick={() => updateCofounderSignOffset(cofounderXOffset - 1, cofounderYOffset, cofounderScale, cofounderPixelated)}
                        title="Move Left 1px"
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                      >
                        ←
                      </button>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => updateCofounderSignOffset(cofounderXOffset, cofounderYOffset - 1, cofounderScale, cofounderPixelated)}
                          title="Move Up 1px"
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => updateCofounderSignOffset(cofounderXOffset, cofounderYOffset + 1, cofounderScale, cofounderPixelated)}
                          title="Move Down 1px"
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          ↓
                        </button>
                      </div>
                      <button 
                        onClick={() => updateCofounderSignOffset(cofounderXOffset + 1, cofounderYOffset, cofounderScale, cofounderPixelated)}
                        title="Move Right 1px"
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                      >
                        →
                      </button>
                      <button 
                        onClick={() => updateCofounderSignOffset(0, 0, 1.0, cofounderPixelated)}
                        title="Reset Alignment"
                        className="w-6 h-6 flex items-center justify-center rounded bg-red-953/50 hover:bg-red-900/50 text-red-200 text-[9px] font-bold transition-all border border-red-900/20 ml-1"
                      >
                        Rst
                      </button>
                    </div>
                  </div>
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

          {/* Corporate Policies Handbook Download Section */}
          <div className="bg-slate-900/40 border border-[#0d3b22]/30 rounded-2xl p-5 shadow-premium flex flex-col gap-4 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3 font-sans">
              <FileText className="w-4 h-4 text-emerald-450" /> 5. Corporate Policies Handbook
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Generate the separate 29-chapter **BuyQK Corporate Policies & Founding Oath Handbook** with built-in candidate details pre-filled.
            </p>
            <button 
              onClick={handleDownloadHandbook}
              className="flex items-center justify-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/40 text-emerald-250 py-3 rounded-xl text-xs font-bold transition-all w-full cursor-pointer uppercase tracking-wider font-sans select-none"
            >
              <Download className="w-4 h-4 text-emerald-400 animate-pulse" /> Download Policies Handbook
            </button>
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
            className="flex flex-col gap-6 items-center w-full no-print-gap"
          >
            {getPagesList().map((pageText, pageIndex) => {
              const pages = getPagesList();
              const isFirstPage = pageIndex === 0;
              const isLastPage = pageIndex === pages.length - 1;
              
              return (
                <div 
                  key={pageIndex} 
                  className="a4-page-card bg-white text-slate-900 shadow-2xl p-0 w-[8.27in] h-[11.69in] min-h-[11.69in] max-h-[11.69in] flex flex-col justify-between text-left relative overflow-hidden shrink-0"
                  style={{ boxSizing: 'border-box' }}
                >
                  {renderDocumentHeader()}
                  {renderPageContent(pageText, isFirstPage, isLastPage)}
                  {renderDocumentFooter(pageIndex + 1, pages.length)}
                </div>
              );
            })}
          </div>
        </section>
      </div>
      ) : (
        <div className="w-full h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden relative">
          <iframe 
            src="/offerlettergenerater/index.html" 
            title="Offer letter generator V2" 
            className="w-full h-full border-none bg-slate-950 block" 
          />
        </div>
      )}
    </div>
  );
}
