import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageSquare, FolderKanban, ShieldCheck, Sparkles, 
  UserCheck, Building2, Cake, ArrowRight, Zap, Bell, CheckCircle2, 
  Activity, Calendar, FileText, CheckSquare, Clock 
} from 'lucide-react';
import { db, rtdb } from '@buyqk/firebase';
import { collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { EmployeeProfile, Announcement, ChatGroup } from '../types';

export const DashboardPage: React.FC = () => {
  const { profile, currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [totalEmployees, setTotalEmployees] = useState<number>(24);
  const [onlineCount, setOnlineCount] = useState<number>(2);
  const [departmentCount, setDepartmentCount] = useState<number>(1);
  const [groupCount, setGroupCount] = useState<number>(0);
  
  const [recentTeammates, setRecentTeammates] = useState<EmployeeProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);

  useEffect(() => {
    // 1. Fetch total employees count
    const fetchEmployees = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (snap.size > 0) setTotalEmployees(snap.size);
        const list: EmployeeProfile[] = [];
        snap.forEach(d => list.push(d.data() as EmployeeProfile));
        setRecentTeammates(list.slice(0, 6));

        const depts = new Set(list.map(m => m.department).filter(Boolean));
        if (depts.size > 0) setDepartmentCount(depts.size);
      } catch (err) {
        console.error("Fetch employees dashboard error:", err);
      }
    };
    fetchEmployees();

    // 2. Realtime presence count
    const presenceRef = ref(rtdb, 'presence');
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const onlineUsers = Object.values(data).filter((p: any) => p?.online === true);
        setOnlineCount(Math.max(2, onlineUsers.length));
      }
    });

    // 3. Company announcements
    const qAnn = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribeAnn = onSnapshot(qAnn, (snap) => {
      const list: Announcement[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(list);
    });

    // 4. Groups count
    const qGroup = collection(db, 'groups');
    const unsubscribeGroup = onSnapshot(qGroup, (snap) => {
      const list: ChatGroup[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ChatGroup));
      setGroups(list);
      setGroupCount(snap.size || 0);
    });

    return () => {
      unsubscribePresence();
      unsubscribeAnn();
      unsubscribeGroup();
    };
  }, []);

  const sampleActivity = [
    { id: 1, type: 'join', text: 'Ankit Shrivastav joined #development', time: '10m ago', icon: 'L' },
    { id: 2, type: 'file', text: 'Vaishnavi uploaded a file in #designs', time: '1h ago', icon: 'D' },
    { id: 3, type: 'task', text: 'Suman Bhowmik completed a task', time: '2h ago', icon: 'T' },
    { id: 4, type: 'sys', text: 'System maintenance scheduled', time: '5h ago', icon: 'S' },
    { id: 5, type: 'update', text: 'Rasul Ahmed updated project status', time: '1d ago', icon: 'U' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 font-sans overflow-y-auto bg-slate-950 select-none">
      
      {/* 1. Hero Glass Banner (Matching Dashboard Screenshot Inspiration) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#090d16] via-[#101728] to-[#0d1322] border border-yellow-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl -top-20 -right-20 pointer-events-none" />
        
        {/* City skyline glow backdrop */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Welcome Back, {profile?.fullName?.split(' ')[0] || 'Akshat'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Good to see you, {profile?.fullName?.split(' ')[0] || 'Akshat'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Let's build, collaborate and grow together.
            </p>
            <p className="text-xs font-bold text-yellow-500 mt-0.5">
              {profile?.designation || 'CTO'} &bull; {profile?.department || 'Engineering'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto z-10">
            <button
              onClick={() => navigate('/teams/chat')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-gold-glow transition-all hover:scale-105 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Open Chat
            </button>
            <button
              onClick={() => navigate('/teams/employees')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" /> Directory
            </button>
          </div>
        </div>
      </div>

      {/* 2. Statistics Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/60 border border-blue-900/30 rounded-2xl p-4 flex items-center justify-between shadow-premium">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">{totalEmployees}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">TOTAL TEAMMATES</p>
            <span className="text-[10px] font-bold text-emerald-400 mt-1 flex items-center gap-1">&uarr; 12% vs last month</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-premium">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">{onlineCount}</span>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">ONLINE NOW</p>
            <div className="flex items-center -space-x-2 mt-2">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Online" className="w-6 h-6 rounded-full border-2 border-slate-950 object-cover" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Online" className="w-6 h-6 rounded-full border-2 border-slate-950 object-cover" />
              <span className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800 text-[9px] font-bold text-slate-300 flex items-center justify-center">+1</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-blue-900/30 rounded-2xl p-4 flex items-center justify-between shadow-premium">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">{departmentCount}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">DEPARTMENTS</p>
            <span className="text-[9px] font-mono text-yellow-500 mt-2 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20 w-fit">Engineering</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between shadow-premium">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">{groupCount}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ACTIVE CHANNELS</p>
            <span className="text-[9px] text-slate-500 mt-2">Start a conversation</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Teammates, Activity Feed, Broadcasts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* BUYQK TEAMMATES Grid */}
          <div className="bg-slate-900/60 border border-blue-900/30 rounded-3xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-500" />
                <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">BUYQK TEAMMATES</h3>
              </div>
              <button onClick={() => navigate('/teams/employees')} className="text-xs font-bold text-yellow-500 hover:underline flex items-center gap-1 cursor-pointer">
                View All &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentTeammates.map((m) => (
                <div key={m.uid} className="bg-slate-950/80 p-3 rounded-2xl border border-blue-900/20 flex items-center gap-3 hover:border-yellow-500/40 transition-all group">
                  <img src={m.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={m.fullName} className="w-10 h-10 rounded-xl object-cover border border-yellow-500/40 shrink-0" />
                  <div className="overflow-hidden flex-1 text-left">
                    <p className="text-xs font-extrabold text-slate-100 truncate group-hover:text-yellow-400 transition-colors">{m.fullName}</p>
                    <p className="text-[10px] text-yellow-500 font-bold truncate">{m.designation || 'Engineer'}</p>
                  </div>
                  <button onClick={() => navigate(`/teams/chat?uid=${m.uid}`)} className="p-2 rounded-xl bg-slate-900 hover:bg-yellow-500 hover:text-slate-950 text-slate-400 transition-all cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITY FEED Widget */}
          <div className="bg-slate-900/60 border border-blue-900/30 rounded-3xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">ACTIVITY FEED</h3>
              </div>
              <span className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer">View All &rarr;</span>
            </div>

            <div className="flex flex-col gap-2">
              {sampleActivity.map((act) => (
                <div key={act.id} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {act.icon}
                    </div>
                    <span className="text-slate-300 font-medium truncate">{act.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COMPANY BROADCASTS Widget */}
          <div className="bg-slate-900/60 border border-blue-900/30 rounded-3xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">COMPANY BROADCASTS</h3>
            </div>

            <div className="flex flex-col gap-3">
              {announcements.length === 0 ? (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">📢</div>
                    <div>
                      <h4 className="text-xs font-extrabold text-yellow-400">Q2 Townhall Summary</h4>
                      <p className="text-[11px] text-slate-400">Here's what happened in our Q2 Townhall. Check out key highlights.</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">2h ago &rarr;</span>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/20 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-yellow-400">{ann.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Quick Actions, Birthdays & Upcoming Events */}
        <div className="flex flex-col gap-6">
          
          {/* QUICK ACTIONS Panel */}
          <div className="bg-slate-900/60 border border-blue-900/30 rounded-3xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">QUICK ACTIONS</h3>
            </div>

            <div className="flex flex-col gap-2.5">
              <button onClick={() => navigate('/teams/chat')} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 transition-all cursor-pointer group">
                <span className="flex items-center gap-2.5"><MessageSquare className="w-4 h-4 text-yellow-500" /> Open Realtime Chat</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button onClick={() => navigate('/teams/employees')} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 transition-all cursor-pointer group">
                <span className="flex items-center gap-2.5"><Users className="w-4 h-4 text-blue-400" /> Employee Directory</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button onClick={() => navigate('/teams/groups')} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 transition-all cursor-pointer group">
                <span className="flex items-center gap-2.5"><FolderKanban className="w-4 h-4 text-purple-400" /> Group Channels</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* BIRTHDAYS & ANNIVERSARIES Card */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-950 border border-yellow-500/20 rounded-3xl p-5 shadow-premium flex flex-col gap-3">
            <div className="flex items-center justify-between text-yellow-500">
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 animate-bounce" />
                <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">BIRTHDAYS & ANNIVERSARIES</h3>
              </div>
              <span className="text-[10px] text-yellow-500 font-bold hover:underline cursor-pointer">View All &rarr;</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Akash" className="w-8 h-8 rounded-xl object-cover border border-yellow-500/30" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Akash Anand</p>
                    <p className="text-[10px] text-slate-400">Work Anniversary</p>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-md border border-yellow-500/20">2 Years</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" alt="Meenal" className="w-8 h-8 rounded-xl object-cover border border-purple-500/30" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Meenal Sharma</p>
                    <p className="text-[10px] text-slate-400">Birthday Tomorrow</p>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20">Birthday</span>
              </div>
            </div>
          </div>

          {/* UPCOMING EVENTS Widget */}
          <div className="bg-slate-900/60 border border-blue-900/30 rounded-3xl p-5 shadow-premium flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">UPCOMING EVENTS</h3>
              </div>
              <span className="text-[10px] text-blue-400 font-bold hover:underline cursor-pointer">View All &rarr;</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">May</span>
                    <span className="text-sm font-black text-white">24</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Team Standup</p>
                    <p className="text-[10px] text-slate-400">Daily &bull; 10:00 AM</p>
                  </div>
                </div>
                <button onClick={() => navigate('/teams/chat')} className="px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[10px] font-bold transition-all cursor-pointer">
                  Join
                </button>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">May</span>
                    <span className="text-sm font-black text-white">25</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Product Review Meeting</p>
                    <p className="text-[10px] text-slate-400">May 25 &bull; 02:00 PM</p>
                  </div>
                </div>
                <button onClick={() => navigate('/teams/chat')} className="px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[10px] font-bold transition-all cursor-pointer">
                  Join
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
