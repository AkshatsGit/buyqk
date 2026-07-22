import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { ChatWindow } from '../components/chat/ChatWindow';
import { EmployeeProfile, ChatGroup } from '../types';
import { 
  Search, MessageSquare, FolderKanban, Users, Pin, 
  Plus, ShieldCheck, Sparkles, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { db, rtdb } from '@buyqk/firebase';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';

export const ChatPage: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeChatId, setActiveChatId] = useState<string>('');
  const [activeChatName, setActiveChatName] = useState<string>('');
  const [activeChatAvatar, setActiveChatAvatar] = useState<string>('');
  const [isGroupChat, setIsGroupChat] = useState<boolean>(false);
  const [activeGroupObj, setActiveGroupObj] = useState<ChatGroup | undefined>(undefined);
  const [activeRecipientObj, setActiveRecipientObj] = useState<EmployeeProfile | undefined>(undefined);

  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // 1. Listen to all employees
    const unsubscribeEmployees = onSnapshot(collection(db, 'users'), (snap) => {
      const list: EmployeeProfile[] = [];
      snap.forEach(d => list.push(d.data() as EmployeeProfile));
      setEmployees(list.filter(e => e.uid !== currentUser?.uid));
    });

    // 2. Listen to groups
    const unsubscribeGroups = onSnapshot(collection(db, 'groups'), (snap) => {
      const list: ChatGroup[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ChatGroup));
      setGroups(list);
    });

    // 3. Realtime presence map
    const presenceRef = ref(rtdb, 'presence');
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const map: Record<string, boolean> = {};
        Object.keys(data).forEach(uid => {
          map[uid] = data[uid]?.online === true;
        });
        setOnlineStatusMap(map);
      }
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeGroups();
      unsubscribePresence();
    };
  }, [currentUser?.uid]);

  // Handle URL param ?uid=... or default selection
  useEffect(() => {
    const targetUid = searchParams.get('uid');
    if (targetUid && employees.length > 0) {
      const targetEmp = employees.find(e => e.uid === targetUid);
      if (targetEmp) {
        selectDirectChat(targetEmp);
        return;
      }
    }

    if (!activeChatId && employees.length > 0) {
      selectDirectChat(employees[0]);
    }
  }, [searchParams, employees]);

  const selectDirectChat = (emp: EmployeeProfile) => {
    if (!currentUser) return;
    // Standard direct chat ID: sorted combination of 2 UIDs
    const sortedIds = [currentUser.uid, emp.uid].sort();
    const chatId = `direct_${sortedIds.join('_')}`;

    setActiveChatId(chatId);
    setActiveChatName(emp.fullName);
    setActiveChatAvatar(emp.photoUrl);
    setIsGroupChat(false);
    setActiveGroupObj(undefined);
    setActiveRecipientObj(emp);
  };

  const selectGroupChat = (grp: ChatGroup) => {
    setActiveChatId(`group_${grp.id}`);
    setActiveChatName(grp.name);
    setActiveChatAvatar(grp.icon || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150');
    setIsGroupChat(true);
    setActiveGroupObj(grp);
    setActiveRecipientObj(undefined);
  };

  const filteredEmployees = searchQuery
    ? employees.filter(e => e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || e.designation.toLowerCase().includes(searchQuery.toLowerCase()))
    : employees;

  const filteredGroups = searchQuery
    ? groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : groups;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] p-4 sm:p-6 gap-4 font-sans overflow-hidden">
      
      {/* Left Chat Channels Sidebar */}
      <aside className="w-full md:w-80 bg-slate-950/60 border border-blue-900/20 rounded-2xl flex flex-col p-4 gap-4 shrink-0 shadow-2xl overflow-y-auto scrollbar-thin">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search channels & teammates..."
            className="w-full bg-slate-900 border border-blue-900/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* Group Channels Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-purple-400" /> Group Channels ({groups.length})
          </span>

          <div className="flex flex-col gap-1">
            {filteredGroups.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic px-3 py-2">No group channels available.</p>
            ) : (
              filteredGroups.map((grp) => {
                const isSelected = activeChatId === `group_${grp.id}`;
                return (
                  <button
                    key={grp.id}
                    onClick={() => selectGroupChat(grp)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg' 
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg overflow-hidden border border-purple-500/30 shrink-0 bg-slate-800">
                        <img src={grp.icon || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150'} alt={grp.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate">#{grp.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="flex flex-col gap-1.5 mt-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-yellow-500" /> Direct Messages ({employees.length})
          </span>

          <div className="flex flex-col gap-1 max-h-[350px] overflow-y-auto pr-1">
            {filteredEmployees.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic px-3 py-2">No teammates found.</p>
            ) : (
              filteredEmployees.map((emp) => {
                const isOnline = onlineStatusMap[emp.uid] === true;
                const sortedIds = [currentUser?.uid || '', emp.uid].sort();
                const isSelected = activeChatId === `direct_${sortedIds.join('_')}`;

                return (
                  <button
                    key={emp.uid}
                    onClick={() => selectDirectChat(emp)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-gold-glow/10' 
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-xl overflow-hidden border border-yellow-500/30 bg-slate-800">
                          <img src={emp.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={emp.fullName} className="w-full h-full object-cover" />
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950 ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="truncate text-slate-100">{emp.fullName}</span>
                        <span className="text-[9px] text-slate-400 truncate">{emp.designation}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeChatId ? (
          <ChatWindow
            chatId={activeChatId}
            chatName={activeChatName}
            chatAvatar={activeChatAvatar}
            isGroup={isGroupChat}
            groupObj={activeGroupObj}
            recipientObj={activeRecipientObj}
          />
        ) : (
          <div className="flex-1 bg-slate-950/40 border border-blue-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 p-6">
            <MessageSquare className="w-12 h-12 text-slate-600 animate-bounce" />
            <p className="text-sm font-bold text-slate-300">Select a teammate or channel to start chatting</p>
          </div>
        )}
      </main>

    </div>
  );
};
