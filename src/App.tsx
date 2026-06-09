import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HelperView } from './components/HelperView';
import { GigsView } from './components/GigsView';
import { WalletView } from './components/WalletView';
import { AdminView } from './components/AdminView';
import { ProfileView } from './components/ProfileView';
import { ChatView } from './components/ChatView';
import { View, Payment, UserProfile, NotificationItem, Gig } from './types';
import { playSoftChime, playSoftClick } from './lib/audio';
import LiveStorageService, { isSupabaseConfigured } from './lib/supabase';


import { motion, AnimatePresence } from 'motion/react';
import { UserCog, User, ShieldAlert, Bell, Sparkles, Briefcase, Trash2 } from 'lucide-react';

const INITIAL_GIGS: Gig[] = [];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('Helper');
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<number>(1800);
  const [profit, setProfit] = useState<number>(39.99);

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellTrigger, setBellTrigger] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Lucihano',
    surname: 'Matthews',
    email: '21lucihanomatthews@gmail.com',
    location: 'Rondebosch, Cape Town',
    schoolLevel: 'University senior physical sciences',
    contactInfo: '+27 (0) 72 133 4067',
    workExperiences: [
      { title: 'Peer tutor maths physics', company: 'Matthews Private Academy', duration: '12 months' },
      { title: 'Animal daycare caretaker', company: 'Woof sitting Claremont', duration: '6 months' }
    ],
    references: [
      { name: 'Dr. Gregory van Wyk', contact: 'g.vanwyk@stb.ac.za' }
    ],
    certificateUrls: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300'],
    idDocumentUrls: ['https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=300'],
    isVerified: true
  });

  // --- Real-Time Sync & Lazy Backing loaders ---
  useEffect(() => {
    async function loadDynamicBackend() {
      // Load Gigs
      const liveGigs = await LiveStorageService.getGigs(INITIAL_GIGS);
      setGigs(liveGigs);

      // Load Notifications
      const liveNotifs = await LiveStorageService.getNotifications(INITIAL_NOTIFICATIONS);
      setNotifications(liveNotifs);

      // Load Payments
      const livePayments = await LiveStorageService.getPayments([]);
      setPayments(livePayments);

      // Load Profile
      const liveProfile = await LiveStorageService.getProfile('21lucihanomatthews@gmail.com', profile);
      setProfile(liveProfile);

      // Fetch dynamic financial values directly if live backend is connected
      if (isSupabaseConfigured && LiveStorageService.supabase) {
        try {
          const { data, error } = await LiveStorageService.supabase
            .from('profiles')
            .select('balance, profit')
            .eq('email', '21lucihanomatthews@gmail.com')
            .maybeSingle();
          if (data) {
            if (data.balance !== undefined && data.balance !== null) setBalance(Number(data.balance));
            if (data.profit !== undefined && data.profit !== null) setProfit(Number(data.profit));
          }
        } catch (e) {
          console.warn("Could not fetch finance specs from Supabase", e);
        }
      }
    }
    loadDynamicBackend();
  }, []);

  // Sync back balance, profit & profile modifications to DB
  useEffect(() => {
    if (profile && profile.email) {
      LiveStorageService.updateProfile(profile, balance, profit);
    }
  }, [balance, profit, profile]);

  // Intercept state changes to automatically write updates to Supabase
  const handleSetGigs = (value: React.SetStateAction<Gig[]>) => {
    setGigs(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      
      // Sync added ones
      if (next.length > prev.length) {
        const added = next.filter((n: Gig) => !prev.some(p => p.id === n.id));
        added.forEach((item: Gig) => {
          LiveStorageService.addGig(item);
        });
      }
      // Sync deleted ones
      else if (next.length < prev.length) {
        const deleted = prev.filter(p => !next.some((n: Gig) => n.id === p.id));
        deleted.forEach((item: Gig) => {
          if (isSupabaseConfigured && LiveStorageService.supabase) {
            LiveStorageService.supabase.from('gigs').delete().eq('id', item.id).then(({ error }) => {
              if (error) console.error("Could not sync deletion to Supabase for Gig", item.id, error);
            });
          }
        });
      }
      return next;
    });
  };

  const handleSetPayments = (value: React.SetStateAction<Payment[]>) => {
    setPayments(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;

      if (next.length > prev.length) {
        const added = next.filter((n: Payment) => !prev.some(p => p.id === n.id));
        added.forEach((item: Payment) => {
          LiveStorageService.addPayment(item);
        });
      }
      // If a payment is removed from local queue (approved or rejected by Operator)
      else if (next.length < prev.length) {
        const removed = prev.filter(p => !next.some((n: Payment) => n.id === p.id));
        removed.forEach((item: Payment) => {
          // Status might have changed to approved or rejected before deletion from queues
          const nextMatches = next.find((n: Payment) => n.id === item.id);
          const finalStatus = nextMatches ? nextMatches.status : 'approved'; // Usually approved
          LiveStorageService.updatePaymentStatus(item.id, finalStatus);
        });
      }
      return next;
    });
  };

  const handleSetProfile = (value: React.SetStateAction<UserProfile>) => {
    setProfile(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      LiveStorageService.updateProfile(next, balance, profit);
      return next;
    });
  };

  const addNotification = (title: string, message: string, type: 'gig' | 'promotion' | 'system') => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newItem, ...prev]);
    setBellTrigger(prev => prev + 1);
    playSoftChime();
    LiveStorageService.addNotification(newItem);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer');
      if (isInteractive) {
        playSoftClick();
      }
    };

    const handleGlobalInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        playSoftClick();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('input', handleGlobalInput);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('input', handleGlobalInput);
    };
  }, []);


  return (
    isSplashActive ? (
      <div id="splash-container" className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans text-white select-none">
        {/* Sleek aesthetic ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] bg-blue-600/15 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] bg-indigo-500/10 rounded-full blur-[100px] duration-1000" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 z-10 text-center px-6"
        >
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
              className="text-3xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 pl-[0.25em]"
            >
              TimeGiG
            </motion.h1>
          </div>
        </motion.div>

        {/* Elegant minimal loading indicator & status lines */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-[200px] px-4">
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 animate-pulse">Initializing Interface</span>
            <span className="text-[8px] font-mono text-white/20">Matthews Corporate Finance</span>
          </div>
        </div>
      </div>
    ) : (
    <div id="app-container" className="min-h-screen bg-slate-50/35 relative font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Dynamic top bar, styled for elegant desktop/mobile presentation */}
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">TimeGiG</span>
          {isSupabaseConfigured ? (
            <span className="px-1.5 py-0.5 sm:px-2 rounded-full text-[8.5px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center gap-1">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE DB
            </span>
          ) : (
            <span className="px-1.5 py-0.5 sm:px-2 rounded-full text-[8.5px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center gap-1">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-500 animate-pulse" />
              MIGRATED
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Operator mode dashboard pill */}
          <button 
            onClick={() => {
              setCurrentView('Admin');
              setIsNavbarVisible(true);
            }} 
            className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
              currentView === 'Admin' 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:text-slate-800'
            }`}
            title="Operator Panel"
          >
            <UserCog size={15} />
            <span className="hidden sm:inline">Operator Panel</span>
          </button>

          {/* Notification Bell with Dropping List Popover */}
          <div className="relative">
            <motion.button
              animate={bellTrigger > 0 ? {
                rotate: [0, -18, 15, -12, 10, -5, 0],
              } : {}}
              key={bellTrigger}
              transition={{ duration: 0.65, ease: "easeInOut" }}
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className={`p-2 rounded-xl transition-all border relative flex items-center justify-center ${
                isNotifDropdownOpen 
                  ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-slate-200 shadow-md' 
                  : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:text-slate-800'
              }`}
              title="Alert Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white rounded-full flex items-center justify-center font-black text-[9px] border-2 border-white leading-none">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {isNotifDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 shadow-2xl rounded-3xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h4 className="font-black text-xs text-slate-950 uppercase tracking-widest flex items-center gap-1">
                        Alert Center
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{unreadCount} unread system notifications</p>
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(notifications.map(n => ({ ...n, read: true })));
                          LiveStorageService.markAllNotificationsRead();
                        }}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:text-blue-800"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-105">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                        <Bell size={24} className="text-slate-300 stroke-1 mb-2 animate-bounce" />
                        <h5 className="font-bold text-xs text-slate-700">All quiet for now</h5>
                        <p className="text-[10px] mt-1">When admin launches promotions or lists tasks, you will receive real-time alerts.</p>
                      </div>
                    ) : (
                      notifications.map(item => (
                        <div key={item.id} className={`p-4 transition-colors ${item.read ? 'bg-white opacity-75' : 'bg-blue-50/10 hover:bg-slate-50/70'}`} onClick={() => {
                          setNotifications(notifications.map(n => n.id === item.id ? { ...n, read: true } : n));
                          LiveStorageService.markNotificationRead(item.id);
                        }}>
                          <div className="flex gap-3 text-left">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              item.type === 'promotion' ? 'bg-purple-100 text-purple-600' :
                              item.type === 'gig' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {item.type === 'promotion' ? <Sparkles size={14} /> :
                               item.type === 'gig' ? <Briefcase size={14} /> :
                               <ShieldAlert size={14} />}
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start">
                                <h5 className={`text-xs font-bold text-slate-900 leading-tight ${item.read ? 'font-normal' : 'font-black'}`}>
                                  {item.title}
                                </h5>
                                {!item.read && (
                                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                                {item.message}
                              </p>
                              <div className="flex justify-between items-center pt-2 text-[9px] text-slate-400 font-bold">
                                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotifications(notifications.filter(n => n.id !== item.id));
                                    LiveStorageService.deleteNotification(item.id);
                                  }}
                                  className="hover:text-red-500 flex items-center gap-0.5 font-bold uppercase tracking-wider text-red-600"
                                >
                                  <Trash2 size={10} /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Test Dispatcher shortcut in dropdown for instantaneous trial */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-500">Audio feedback active</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addNotification(
                          'Test Announcement',
                          `✨ Audio & Wiggle simulation triggered successfully! All systems are nominal.`,
                          'system'
                        );
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-extrabold rounded-lg transition-all active:scale-95 uppercase tracking-wider text-[9px]"
                    >
                      Test bell tone
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User profile button */}
          <button 
            onClick={() => {
              setCurrentView('Profile');
              setIsNavbarVisible(true);
            }} 
            className={`p-1.5 rounded-full transition-all border ${
              currentView === 'Profile' 
                ? 'ring-2 ring-blue-600 border-white bg-blue-50' 
                : 'border-slate-200/50 bg-slate-105 hover:bg-slate-100'
            }`}
          >
            {profile.facePictureUrl ? (
              <img src={profile.facePictureUrl} className="w-7 h-7 rounded-full object-cover shadow-sm" alt="My Profile avatar" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <User size={14} />
              </div>
            )}
          </button>
        </div>
      </header>
      
      {/* Views routing container */}
      <main id="main-content" className={`pt-16 flex flex-col ${
        currentView === 'Chat' 
          ? (isNavbarVisible ? 'h-[calc(100vh-9rem)] pb-0' : 'h-[calc(100vh-4rem)] pb-0') 
          : 'pb-20 min-h-screen'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex-1 w-full"
          >
            {currentView === 'Helper' && <HelperView profile={profile} />}
            {currentView === 'GiGs' && <GigsView gigs={gigs} setGigs={handleSetGigs} onAddNotification={addNotification} profile={profile} />}
            {currentView === 'Chat' && (
              <ChatView 
                isNavbarVisible={isNavbarVisible} 
                setIsNavbarVisible={setIsNavbarVisible} 
                profile={profile}
              />
            )}
            {currentView === 'Cwallet' && <WalletView onNavigate={setCurrentView} payments={payments} setPayments={handleSetPayments} balance={balance} />}
            {currentView === 'Admin' && <AdminView payments={payments} setPayments={handleSetPayments} setBalance={setBalance} profit={profit} setProfit={setProfit} gigs={gigs} setGigs={handleSetGigs} addNotification={addNotification} />}
            {currentView === 'Profile' && <ProfileView profile={profile} setProfile={handleSetProfile} />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Premium floating tab navbar */}
      <AnimatePresence>
        {isNavbarVisible ? (
          <motion.div
            key="bottom-navbar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-50 w-full"
          >
            <Navbar 
              currentView={currentView} 
              onNavigate={(view) => {
                setCurrentView(view);
              }} 
            />
          </motion.div>
        ) : (
          currentView !== 'Chat' && (
            <motion.button
              key="show-navbar"
              initial={{ y: 50, opacity: 0, x: "-50%" }}
              animate={{ y: 0, opacity: 1, x: "-50%" }}
              exit={{ y: 50, opacity: 0, x: "-50%" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNavbarVisible(true)}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-slate-250 hover:border-slate-300 shadow-xl px-5 py-2.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-wider hover:bg-slate-50 transition-all duration-200 z-50 cursor-pointer"
            >
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
              <span>Show Menu</span>
            </motion.button>
          )
        )}
      </AnimatePresence>
      
      {/* High-contrast smooth ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[450px] h-[450px] bg-blue-100/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[20%] -right-[10%] w-[450px] h-[450px] bg-emerald-100/10 rounded-full blur-[140px]" />
      </div>
    </div>
  )
);
}
