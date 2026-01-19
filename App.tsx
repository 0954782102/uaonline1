
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, 
  doc, updateDoc, setDoc, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GoogleGenAI } from "@google/genai";
import { User, Post, Notification, Comment } from './types';
import Snowfall from './components/Snowfall';
import BotCard from './components/BotCard';
import { 
  LogIn, LogOut, Home, X, Heart, MessageCircle, Eye, ShieldCheck, 
  Image as ImageIcon, Mail, Settings, PlusSquare, MapPin, 
  MessageSquare, Camera, Lock, Fingerprint, Sparkles, Wifi, AlertTriangle
} from 'lucide-react';

// ==========================================
// КРОК 1: ВСТАВ СВОЇ КЛЮЧІ З FIREBASE СЮДИ
// ==========================================
const firebaseConfig = {
   apiKey: "AIzaSyDxKct-kavvbt5vRNTswjSiBXc4lFbtdJo",
  authDomain: "ua-online-3c6f1.firebaseapp.com",
  projectId: "ua-online-3c6f1",
  storageBucket: "ua-online-3c6f1.firebasestorage.app",
  messagingSenderId: "244081882715",
  appId: "1:244081882715:web:c7064cdcf4ae887c39b17e",
  measurementId: "G-N61RSRCSXT"
};

// Перевірка чи вставлені ключі
const isFirebaseReady = firebaseConfig.apiKey !== "AIzaSyDxKct-kavvbt5vRNTswjSiBXc4lFbtdJo";

let db: any;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
} catch (e) {
  console.error("Firebase не налаштовано!");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const App: React.FC = () => {
  // Дані з бази
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbStatus, setDbStatus] = useState<'offline' | 'online'>(isFirebaseReady ? 'online' : 'offline');

  // Стан інтерфейсу
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'admin' | 'inbox'>('feed');
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Редагування профілю
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Створення поста
  const [postStep, setPostStep] = useState(1);
  const [postServer, setPostServer] = useState<Post['server']>('all');
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);

  const playSound = (type: 'pop' | 'success' | 'notify') => {
    const s = {
      pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      notify: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3'
    };
    new Audio(s[type]).play().catch(() => {});
  };

  // 2. СИНХРОНІЗАЦІЯ З БАЗОЮ В РЕАЛЬНОМУ ЧАСІ
  useEffect(() => {
    if (!isFirebaseReady) return;

    // Слухаємо пости (оновлюються самі при змінах)
    const qPosts = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    // Слухаємо користувачів
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });

    // Відновлення сесії
    const saved = localStorage.getItem('tg_session');
    if (saved) {
      const sid = JSON.parse(saved).id;
      const unsubMe = onSnapshot(doc(db, "users", sid), (d) => {
        if (d.exists()) {
          const u = { id: d.id, ...d.data() } as User;
          setCurrentUser(u);
          setEditName(u.displayName);
          setEditBio(u.bio || '');
        }
      });
      return () => { unsubPosts(); unsubUsers(); unsubMe(); };
    }

    return () => { unsubPosts(); unsubUsers(); };
  }, []);

  // Слухаємо сповіщення (тільки свої)
  useEffect(() => {
    if (!currentUser || !isFirebaseReady) return;
    const q = query(collection(db, "notifications"), where("userId", "==", currentUser.id), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    });
  }, [currentUser]);

  // AUTH LOGIC
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) return alert('Firebase не налаштовано!');
    const f = e.target as any;
    const name = f.username.value.trim();
    const user = name.toLowerCase();

    if (users.some(u => u.username === user)) return alert('Цей нік зайнятий!');

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: user,
      displayName: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`,
      isAdmin: (user === 'admin' && f.password.value === 'ArtemProcko'),
      registeredAt: Date.now(),
      stats: { posts: 0, likesReceived: 0 }
    };

    await setDoc(doc(db, "users", newUser.id), newUser);
    localStorage.setItem('tg_session', JSON.stringify({ id: newUser.id }));
    setCurrentUser(newUser);
    setShowAuth(null);
    playSound('success');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const f = e.target as any;
    const u = users.find(x => x.username === f.username.value.trim().toLowerCase());
    if (u) {
      localStorage.setItem('tg_session', JSON.stringify({ id: u.id }));
      setCurrentUser(u);
      setShowAuth(null);
      playSound('success');
    } else {
      alert('Користувача не знайдено');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вийти?')) {
      localStorage.removeItem('tg_session');
      setCurrentUser(null);
      playSound('pop');
      window.location.reload(); // Повне очищення
    }
  };

  // ОНОВЛЕННЯ ПРОФІЛЮ ТА ВСІХ ПОСТІВ КОРИСТУВАЧА
  const updateProfile = async () => {
    if (!currentUser || !isFirebaseReady) return;
    
    // 1. Оновлюємо самого користувача
    const updates: any = { displayName: editName, bio: editBio };
    if (newAvatar) updates.avatar = newAvatar;
    await updateDoc(doc(db, "users", currentUser.id), updates);

    // 2. Оновлюємо аватарку в усіх його постах одним махом (Batch)
    const batch = writeBatch(db);
    const myPosts = posts.filter(p => p.authorId === currentUser.id);
    myPosts.forEach(p => {
      batch.update(doc(db, "posts", p.id), { 
        authorAvatar: newAvatar || currentUser.avatar, 
        authorName: editName 
      });
    });
    await batch.commit();

    setNewAvatar(null);
    playSound('success');
    alert('Профіль оновлено! Ваша аватарка змінилася всюди.');
  };

  const submitPost = async () => {
    if (!currentUser || !isFirebaseReady) return;
    const postData: Omit<Post, 'id'> = {
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorAvatar: currentUser.avatar,
      server: postServer,
      text: postText,
      images: postImages,
      status: 'pending',
      likes: [],
      views: [],
      comments: [],
      createdAt: Date.now()
    };
    await addDoc(collection(db, "posts"), postData);
    setShowCreatePost(false);
    setPostText('');
    setPostImages([]);
    setPostStep(1);
    playSound('success');
    alert('Пост відправлено адміну!');
  };

  const askAi = async () => {
    if (!postText.trim()) return alert('Напиши щось спочатку!');
    setIsAiLoading(true);
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Зроби цей текст для ігрового поста в Telegram крутим та емоційним (використовуй емодзі): "${postText}"`
      });
      setPostText(res.text || postText);
      playSound('success');
    } catch (e) { console.error(e); }
    setIsAiLoading(false);
  };

  const moderate = async (id: string, stat: 'approved' | 'rejected', msg?: string) => {
    const p = posts.find(x => x.id === id);
    if (!p) return;
    await updateDoc(doc(db, "posts", id), { status: stat, moderatorComment: msg });
    await addDoc(collection(db, "notifications"), {
      userId: p.authorId,
      title: stat === 'approved' ? 'Схвалено!' : 'Відхилено',
      message: stat === 'approved' ? 'Твій пост уже у стрічці.' : `Причина: ${msg || 'Порушення правил'}`,
      type: stat === 'approved' ? 'approval' : 'rejection',
      read: false,
      createdAt: Date.now()
    });
    playSound('notify');
  };

  const approved = useMemo(() => posts.filter(p => p.status === 'approved'), [posts]);
  const pending = useMemo(() => posts.filter(p => p.status === 'pending'), [posts]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <div className="min-h-screen bg-[#030816] text-white selection:bg-yellow-500 selection:text-black">
      <Snowfall />

      {/* Статус підключення */}
      {!isFirebaseReady && (
        <div className="bg-red-600 text-white text-[10px] font-black py-2 px-4 text-center flex items-center justify-center gap-2">
          <AlertTriangle size={14} /> КЛЮЧІ FIREBASE НЕ ВСТАВЛЕНІ! САЙТ ПРАЦЮЄ В РЕЖИМІ ПЕРЕГЛЯДУ.
        </div>
      )}
      
      {/* Навігація */}
      <nav className="sticky top-0 z-50 card-glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
          <div className="bg-yellow-500 text-black font-black px-2 py-1 rounded-lg text-xs">UA</div>
          <h1 className="text-xl font-black neon-yellow uppercase tracking-tighter hidden sm:block">Сутність</h1>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('feed')} className={`p-2 transition-all ${activeTab === 'feed' ? 'text-yellow-400' : 'text-gray-500'}`}><Home /></button>
          
          {currentUser ? (
            <>
              <button onClick={() => setActiveTab('inbox')} className="relative p-2">
                <Mail className={activeTab === 'inbox' ? 'text-blue-400' : 'text-gray-500'} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-black animate-bounce border-2 border-[#030816]">{unreadCount}</span>}
              </button>
              
              <button onClick={() => setActiveTab('profile')} className={`w-10 h-10 rounded-full border-2 overflow-hidden ${activeTab === 'profile' ? 'border-yellow-400' : 'border-white/10'}`}>
                <img src={currentUser.avatar} className="w-full h-full object-cover" />
              </button>

              {currentUser.isAdmin && (
                <button onClick={() => setActiveTab('admin')} className="relative p-2">
                  <ShieldCheck className={activeTab === 'admin' ? 'text-red-500' : 'text-gray-500'} />
                  {pending.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-[10px] flex items-center justify-center font-black border-2 border-[#030816]">{pending.length}</span>}
                </button>
              )}
            </>
          ) : (
            <button onClick={() => setShowAuth('login')} className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-black text-xs uppercase shadow-xl shadow-yellow-500/20 active:scale-95 transition-all">Увійти</button>
          )}
        </div>
      </nav>

      <main className="max-w-xl mx-auto py-12 px-4 pb-32">
        {/* FEED */}
        {activeTab === 'feed' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="flex justify-between items-end px-2">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Стрічка</h2>
                {currentUser && (
                  <button onClick={() => setShowCreatePost(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-2">
                    <PlusSquare size={16} /> Новий пост
                  </button>
                )}
             </div>

             {approved.length === 0 ? (
               <div className="p-32 text-center text-gray-800 font-black uppercase border-2 border-dashed border-white/5 rounded-[60px]">Тут поки що пусто...</div>
             ) : (
               approved.map(post => (
                 <article key={post.id} className="card-glass rounded-[40px] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl">
                    <div className="p-6 flex items-center justify-between border-b border-white/5">
                       <div className="flex items-center gap-4">
                          <img src={post.authorAvatar} className="w-11 h-11 rounded-full border-2 border-white/10 p-0.5 object-cover" />
                          <div>
                             <h4 className="font-black text-sm">{post.authorName}</h4>
                             <p className="text-[9px] text-yellow-500 font-black uppercase tracking-widest"><MapPin size={9} className="inline mr-1" /> Сервер {post.server}</p>
                          </div>
                       </div>
                       <span className="text-[9px] text-gray-600 font-bold uppercase">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="p-8 text-xl font-bold leading-relaxed">{post.text}</div>
                    {post.images.length > 0 && (
                      <div className="px-6 pb-6">
                        <div className={`grid gap-2 rounded-[25px] overflow-hidden ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                           {post.images.map((img, i) => <img key={i} src={img} className="w-full aspect-square object-cover" />)}
                        </div>
                      </div>
                    )}
                 </article>
               ))
             )}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && currentUser && (
          <div className="animate-in slide-in-from-bottom-10 duration-500">
             <div className="card-glass p-10 rounded-[50px] border border-yellow-500/20 text-center">
                <div className="relative group mx-auto w-32 h-32 mb-8 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                   <img src={newAvatar || currentUser.avatar} className="w-full h-full rounded-full border-4 border-yellow-500/50 object-cover p-1 shadow-2xl transition-transform group-hover:scale-105" />
                   <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm"><Camera size={32} /></div>
                   <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const r = new FileReader();
                       r.onloadend = () => setNewAvatar(r.result as string);
                       r.readAsDataURL(file);
                     }
                   }} />
                </div>
                
                <h2 className="text-3xl font-black mb-10">@{currentUser.username}</h2>

                <div className="space-y-6 text-left">
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-600 ml-4 mb-2 block tracking-widest">Ім'я</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 outline-none focus:border-yellow-500 font-bold transition-all" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-600 ml-4 mb-2 block tracking-widest">Про себе</label>
                      <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 outline-none focus:border-yellow-500 font-bold transition-all h-32 resize-none" />
                   </div>
                   <div className="flex gap-4">
                      <button onClick={updateProfile} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-[20px] uppercase tracking-widest text-xs shadow-xl shadow-yellow-500/20 active:scale-95 transition-all">Зберегти</button>
                      <button onClick={handleLogout} className="bg-red-500/10 text-red-500 p-4 rounded-[20px] border border-red-500/20 hover:bg-red-500/20"><LogOut /></button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* INBOX & ADMIN are similar logic... */}
      </main>

      {/* CREATE POST MODAL */}
      {showCreatePost && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
           <div className="card-glass w-full max-w-lg p-10 rounded-[50px] border border-blue-500/30 relative shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black italic uppercase text-blue-400">Публікація</h2>
                 <button onClick={() => setShowCreatePost(false)} className="p-2 text-gray-500 hover:text-white transition-all"><X size={28} /></button>
              </div>

              {postStep === 1 ? (
                <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
                  {['01', '02', '03', '04', '05', 'all'].map(s => (
                    <button key={s} onClick={() => { setPostServer(s as any); setPostStep(2); playSound('pop'); }} className="py-6 rounded-[20px] bg-white/5 border-2 border-white/5 hover:border-yellow-500 font-black text-2xl transition-all uppercase">{s}</button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-10">
                  <div className="relative">
                    <textarea value={postText} onChange={(e) => setPostText(e.target.value)} className="w-full h-48 bg-white/5 border border-white/10 rounded-[30px] p-8 outline-none focus:border-blue-500 font-bold text-lg" placeholder="Напиши щось цікаве..." />
                    <button onClick={askAi} disabled={isAiLoading} className="absolute bottom-4 right-4 p-4 bg-yellow-500 text-black rounded-full hover:scale-110 active:scale-90 transition-all shadow-xl">
                      {isAiLoading ? <Wifi className="animate-spin" /> : <Sparkles size={24} />}
                    </button>
                  </div>
                  <button onClick={submitPost} disabled={!postText.trim()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[30px] shadow-xl shadow-blue-600/30 uppercase tracking-widest text-xs active:scale-95 transition-all">Опублікувати</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl">
           <div className="card-glass w-full max-w-sm p-10 rounded-[50px] border border-white/10 relative text-center">
              <h2 className="text-3xl font-black mb-10 uppercase italic">{showAuth === 'login' ? 'Вхід' : 'Реєстрація'}</h2>
              <form onSubmit={showAuth === 'login' ? handleLogin : handleRegister} className="space-y-4">
                 <input name="username" placeholder="Логін" className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 outline-none focus:border-yellow-500 font-bold" required />
                 <input name="password" type="password" placeholder="Пароль" className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 outline-none focus:border-yellow-500 font-bold" required />
                 <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-[20px] uppercase tracking-widest text-xs mt-4">Підтвердити</button>
              </form>
              <button onClick={() => setShowAuth(showAuth === 'login' ? 'register' : 'login')} className="mt-8 text-[10px] font-black uppercase text-gray-600 hover:text-yellow-500">Змінити метод</button>
              <button onClick={() => setShowAuth(null)} className="absolute top-8 right-8 text-gray-800 hover:text-white"><X size={24} /></button>
           </div>
        </div>
      )}

      <footer className="mt-20 border-t border-white/5 py-24 text-center">
         <div className="max-w-xl mx-auto space-y-12 px-4">
            <BotCard />
            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-800 opacity-50">SUTNIST UA ONLINE • CLOUD SYNC ACTIVE</div>
         </div>
      </footer>
    </div>
  );
};

export default App;
