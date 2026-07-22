import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageSquare, FolderKanban, ShieldCheck, Sparkles, 
  UserCheck, Building2, Cake, ArrowRight, Zap, Bell, CheckCircle2 
} from 'lucide-react';
import { db, rtdb } from '@buyqk/firebase';
import { collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { EmployeeProfile, Announcement, ChatGroup } from '../types';

export const DashboardPage: React.FC = () => {
  const { profile, currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [departmentCount, setDepartmentCount] = useState<number>(5);
  const [groupCount, setGroupCount] = useState<number>(0);
  
  const [recentTeammates, setRecentTeammates] = useState<EmployeeProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);

  useEffect(() => {
    // 1. Fetch total employees count
    const fetchEmployees = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setTotalEmployees(snap.size || 1);
        const list: EmployeeProfile[] = [];
        snap.forEach(d => list.push(d.data() as EmployeeProfile));
        setRecentTeammates(list.slice(0, 5));

        const depts = new Set(list.map(m => m.department).filter(Boolean));
        setDepartmentCount(depts.size || 5);
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
        setOnlineCount(onlineUsers.length || 1);
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

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 font-sans overflow-y-auto">
      
      {/* Hero Glass Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 border border-yellow-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl -top-20 -right-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Welcome Back
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Hello, {profile?.fullName || currentUser?.displayName || 'Team Member'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {profile?.designation || 'BuyQK Employee'} &bull; <span className="text-yellow-400 font-bold">{profile?.department || 'Engineering'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/teams/chat')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-gold-glow transition-all hover:scale-105"
            >
              <MessageSquare className="w-4 h-4" /> Open Chat
            </button>
            <button
              onClick={() => navigate('/teams/employees')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-5 py-3 rounded-2xl transition-all"
            >
              <Users className="w-4 h-4" /> Directory
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/50 border border-blue-900/20 rounded-2xl p-4 flex items-center gap-4 shadow-premium">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{totalEmployees}</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Teammates</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-premium">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{onlineCount}</span>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Online Now</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-blue-900/20 rounded-2xl p-4 flex items-center gap-4 shadow-premium">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{departmentCount}</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-premium">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{groupCount}</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Channels</p>
          </div>
        </div>

      </div>

      {/* Main Widgets Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Teammates & Announcements */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Teammates Directory Quick Access */}
          <div className="bg-slate-900/50 border border-blue-900/20 rounded-3xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">BuyQK Teammates</h3>
              </div>
              <button onClick={() => navigate('/teams/employees')} className="text-xs font-bold text-yellow-500 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentTeammates.map((m) => (
                <div key={m.uid} className="bg-slate-950/60 p-3 rounded-2xl border border-blue-900/20 flex items-center gap-3">
                  <img src={m.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={m.fullName} className="w-10 h-10 rounded-xl object-cover border border-yellow-500/40" />
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-extrabold text-slate-100 truncate">{m.fullName}</p>
                    <p className="text-[10px] text-yellow-500 font-semibold truncate">{m.designation}</p>
                  </div>
                  <button onClick={() => navigate(`/teams/chat?uid=${m.uid}`)} className="p-2 rounded-xl bg-slate-900 hover:bg-yellow-500 hover:text-slate-950 text-slate-400 transition-all">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Widget */}
          <div className="bg-slate-900/50 border border-blue-900/20 rounded-3xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">Company Broadcasts</h3>
            </div>

            <div className="flex flex-col gap-3">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-950/40 rounded-2xl text-center">No company broadcasts published yet.</p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/20 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-yellow-400">{ann.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{ann.content}</p>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">&bull; Published by {ann.author || 'Super Admin'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Quick Actions & Birthdays */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-slate-900/50 border border-blue-900/20 rounded-3xl p-5 shadow-premium flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">Quick Actions</h3>
            </div>

            <div className="flex flex-col gap-2.5">
              <button onClick={() => navigate('/teams/chat')} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 transition-all group">
                <span className="flex items-center gap-2.5"><MessageSquare className="w-4 h-4 text-yellow-500" /> Open Realtime Chat</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button onClick={() => navigate('/teams/employees')} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 transition-all group">
                <span className="flex items-center gap-2.5"><Users className="w-4 h-4 text-blue-400" /> Employee Directory</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button onClick={() => navigate('/teams/groups')} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 transition-all group">
                <span className="flex items-center gap-2.5"><FolderKanban className="w-4 h-4 text-purple-400" /> Group Channels</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {isSuperAdmin && (
                <button onClick={() => navigate('/teams/admin')} className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-950/80 border border-purple-800/40 text-xs font-bold text-purple-300 transition-all group">
                  <span className="flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-purple-400" /> Super Admin Control</span>
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Celebrations Widget */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-950 border border-yellow-500/20 rounded-3xl p-5 shadow-premium flex flex-col gap-3">
            <div className="flex items-center gap-2 text-yellow-500">
              <Cake className="w-4 h-4 animate-bounce" />
              <h3 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">Birthdays & Anniversaries</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Celebrate work milestones and birthdays with your BuyQK teammates!
            </p>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold text-xs">🎉</div>
              <div>
                <p className="text-xs font-bold text-white">Akash Anand &bull; Work Anniversary</p>
                <p className="text-[10px] text-slate-500 font-mono">Engineering Team</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
