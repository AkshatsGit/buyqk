import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, MessageSquare, Users, FolderKanban, 
  UserCircle, ShieldCheck, Settings, Sparkles 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isSuperAdmin, profile } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/teams/dashboard', icon: LayoutDashboard },
    { label: 'Realtime Chat', path: '/teams/chat', icon: MessageSquare },
    { label: 'Directory', path: '/teams/employees', icon: Users },
    { label: 'Groups', path: '/teams/groups', icon: FolderKanban },
    { label: 'My Profile', path: '/teams/profile', icon: UserCircle },
  ];

  if (isSuperAdmin) {
    navItems.push({ label: 'Admin Panel', path: '/teams/admin', icon: ShieldCheck });
  }

  navItems.push({ label: 'Settings', path: '/teams/settings', icon: Settings });

  return (
    <aside className="no-print w-64 bg-slate-950/60 border-r border-blue-900/20 flex flex-col justify-between p-4 shrink-0 font-sans min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-6">
        
        {/* User Quick Info */}
        <div className="bg-slate-900/50 border border-blue-900/30 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-yellow-500/40 shrink-0 bg-slate-800">
            <img 
              src={profile?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-100 truncate">{profile?.fullName || 'Employee'}</p>
            <p className="text-[10px] text-yellow-500 font-semibold truncate">{profile?.department || 'Engineering'}</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1">Navigation</span>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-yellow-500 text-slate-950 shadow-gold-glow font-black scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

      </div>

      {/* Footer Branding Card */}
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-950 border border-yellow-500/20 rounded-2xl p-3.5 text-center flex flex-col items-center gap-1.5 shadow-premium">
        <Sparkles className="w-4 h-4 text-yellow-500 animate-bounce" />
        <span className="text-[10px] font-black uppercase text-yellow-500 tracking-wider">BuyQK Hyperlocal Engine</span>
        <p className="text-[9px] text-slate-400 font-medium">Internal Collaboration & Operations Portal</p>
      </div>

    </aside>
  );
};
