import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, LogOut, User as UserIcon, Shield, Sparkles, 
  Users, HelpCircle, CheckCircle2, ChevronDown, X 
} from 'lucide-react';
import { rtdb, db } from '@buyqk/firebase';
import { ref, onValue } from 'firebase/database';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Announcement } from '../../types';

export const Navbar: React.FC = () => {
  const { profile, currentUser, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<boolean>(true);

  useEffect(() => {
    // Listen to online users presence count
    const presenceRef = ref(rtdb, 'presence');
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const onlineUsers = Object.values(data).filter((p: any) => p?.online === true);
        setOnlineCount(onlineUsers.length || 1);
      }
    });

    // Listen to latest company announcements
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeAnnouncements = onSnapshot(q, (snap) => {
      const list: Announcement[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(list);
    });

    return () => {
      unsubscribePresence();
      unsubscribeAnnouncements();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-blue-900/20 px-4 lg:px-6 h-16 flex items-center justify-between font-sans">
      
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <Link to="/teams/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 p-0.5 shadow-gold-glow flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-yellow-500 text-lg tracking-tighter">bQ</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-sm tracking-wide uppercase">BUYQK TEAMS</h1>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                Workspace
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Internal Collaboration Engine</p>
          </div>
        </Link>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button 
          onClick={() => navigate('/teams/employees')}
          className="w-full flex items-center gap-2.5 bg-slate-900/60 hover:bg-slate-900/90 border border-blue-900/30 px-3.5 py-2 rounded-xl text-slate-400 text-xs transition-all shadow-inner group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-yellow-500 transition-colors" />
          <span>Search teammates, skills, or departments...</span>
          <kbd className="ml-auto text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">

        {/* Live Online Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{onlineCount} Online</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadAnnouncements(false);
            }}
            className="relative p-2 rounded-xl bg-slate-900/60 border border-blue-900/30 text-slate-300 hover:text-white hover:border-yellow-500/40 transition-all"
            title="Announcements & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAnnouncements && announcements.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-950 border border-blue-900/40 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <h4 className="text-xs font-extrabold uppercase text-slate-200 tracking-wider">Company Broadcasts</h4>
                </div>
                <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">No broadcasts published yet.</p>
                ) : (
                  announcements.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900/60 border border-blue-900/20 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-yellow-400">{item.title}</span>
                        <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">{item.content}</p>
                      <span className="text-[9px] text-slate-500 font-mono mt-1">&bull; {item.author || 'Super Admin'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Popover */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl bg-slate-900/60 border border-blue-900/30 hover:border-yellow-500/40 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-yellow-500/40 shrink-0 bg-slate-800">
              <img 
                src={profile?.photoUrl || currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden lg:flex flex-col text-left pr-1">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{profile?.fullName || currentUser?.displayName || 'Team Member'}</span>
              <span className="text-[10px] text-yellow-500 font-semibold truncate max-w-[120px]">{profile?.designation || 'BuyQK Employee'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-slate-950 border border-blue-900/40 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 font-sans">
              <div className="p-3 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white truncate">{profile?.fullName || currentUser?.displayName || 'Team Member'}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-mono font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded-md">
                    ID: {profile?.employeeId || '089'}
                  </span>
                  {isSuperAdmin && (
                    <span className="text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Super Admin
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <Link 
                  to="/teams/profile" 
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
                >
                  <UserIcon className="w-4 h-4 text-yellow-500" /> My Profile
                </Link>

                {isSuperAdmin && (
                  <Link 
                    to="/teams/admin" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-purple-300 hover:text-white hover:bg-purple-950/40 rounded-xl transition-all font-semibold"
                  >
                    <Shield className="w-4 h-4 text-purple-400" /> Admin Control Center
                  </Link>
                )}

                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-all w-full text-left font-semibold mt-1"
                >
                  <LogOut className="w-4 h-4 text-red-400" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
