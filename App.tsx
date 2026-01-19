
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Post, Notification, Comment } from './types';
import Snowfall from './components/Snowfall';
import BotCard from './components/BotCard';
import { 
  LogIn, LogOut, UserPlus, CheckCircle, Home, Zap, Menu, X, Star, Users, 
  Info, Heart, MessageCircle, Eye, ShieldCheck, Send, Image as ImageIcon,
  Mail, Settings, ChevronRight, Bell, Trash2, Edit3, PlusSquare, MapPin,
  MessageSquare, Camera, ShieldAlert, Lock, Fingerprint, Volume2
} from 'lucide-react';

const App: React.FC = () => {
  // DB States
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'admin' | 'inbox'>('feed');
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Post Creation Form
  const [postStep, setPostStep] = useState(1);
  const [postServer, setPostServer] = useState<Post['server']>('all');
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editUser, setEditUser] = useState('');
  const [editBio, setEditBio] = useState('');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Audio Logic
  const playSound = (type: 'pop' | 'success' | 'notify') => {
    const sounds = {
      pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      notify: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(() => console.log("Sound blocked by browser"));
  };

  // 1. Initial Load
  useEffect(() => {
    const dUsers = JSON.parse(localStorage.getItem('s_users') || '[]');
    const dPosts = JSON.parse(localStorage.getItem('s_posts') || '[]');
    const dNotifs = JSON.parse(localStorage.getItem('s_notifs') || '[]');
    const dSession = JSON.parse(localStorage.getItem('s_session') || 'null');

    if (dUsers.length) setUsers(dUsers);
    if (dPosts.length) setPosts(dPosts);
    if (dNotifs.length) setNotifications(dNotifs);
    
    if (dSession) {
      const found = dUsers.find((u: User) => u.id === dSession.id);
      if (found) {
        setCurrentUser(found);
        setEditName(found.displayName);
        setEditUser(found.username);
        setEditBio(found.bio || '');
      } else {
        localStorage.removeItem('s_session');
      }
    }
  }, []);

  // Save to DB (Persistent storage)
  useEffect(() => {
    if (users.length) localStorage.setItem('s_users', JSON.stringify(users));
    if (posts.length) localStorage.setItem('s_posts', JSON.stringify(posts));
    if (notifications.length) localStorage.setItem('s_notifs', JSON.stringify(notifications));
  }, [users, posts, notifications]);

  // Handle Reading Notifications
  useEffect(() => {
    if (activeTab === 'inbox' && currentUser) {
      const hasUnread = notifications.some(n => n.userId === currentUser.id && !n.read);
      if (hasUnread) {
        setNotifications(prev => {
          const updated = prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n);
          localStorage.setItem('s_notifs', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [activeTab, currentUser]);

  // Auth Logic
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const username = form.username.value.trim();
    const password = form.password.value;

    if (username.length < 3) return alert('Юзернейм занадто короткий!');
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return alert('Цей юзернейм вже зайнятий!');

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      displayName: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: '',
      isAdmin: (username === 'Admin' && password === 'ArtemProcko'),
      registeredAt: Date.now(),
      stats: { posts: 0, likesReceived: 0 }
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    localStorage.setItem('s_users', JSON.stringify(updatedUsers));
    localStorage.setItem('s_session', JSON.stringify(newUser));
    setShowAuth(null);
    playSound('success');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const user = users.find(u => u.username === form.username.value);
    
    if (form.username.value === 'Admin' && form.password.value === 'ArtemProcko') {
      const adminUser = user || {
          id: 'admin-1',
          username: 'Admin',
          displayName: 'Admin',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
          isAdmin: true,
          registeredAt: Date.now(),
          stats: { posts: 0, likesReceived: 0 }
      };
      if (!user) setUsers([...users, adminUser]);
      setCurrentUser(adminUser);
      localStorage.setItem('s_session', JSON.stringify(adminUser));
      setShowAuth(null);
      playSound('success');
      return;
    }

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('s_session', JSON.stringify(user));
      setShowAuth(null);
      playSound('success');
    } else {
      alert('Користувача не знайдено або дані невірні');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Ви впевнені, що хочете вийти з акаунту?')) {
      localStorage.removeItem('s_session');
      setCurrentUser(null);
      setActiveTab('feed');
      playSound('pop');
      // Force reload state for clean exit
      setTimeout(() => window.location.reload(), 100);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result as string);
        playSound('pop');
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = () => {
    if (!currentUser) return;
    let updated = { ...currentUser };
    
    if (editName && editName !== currentUser.displayName) {
      if (!canUpdateName()) return alert('Змінити ім\'я можна раз на 7 днів!');
      updated.displayName = editName;
      updated.lastNameChange = Date.now();
    }

    if (editUser && editUser !== currentUser.username) {
      if (!canUpdateUsername()) return alert('Змінити юзернейм можна раз на 30 днів!');
      if (users.some(u => u.username === editUser && u.id !== currentUser.id)) return alert('Цей юзернейм вже зайнятий!');
      updated.username = editUser;
      updated.lastUsernameChange = Date.now();
    }

    updated.bio = editBio;
    if (newAvatar) updated.avatar = newAvatar;

    // Update global user list
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
    setUsers(updatedUsers);
    setCurrentUser(updated);
    
    // SYNC AVATAR AND NAME IN ALL POSTS
    const updatedPosts = posts.map(p => p.authorId === updated.id ? { 
      ...p, 
      authorAvatar: updated.avatar,
      authorName: updated.displayName 
    } : p);
    setPosts(updatedPosts);

    localStorage.setItem('s_session', JSON.stringify(updated));
    setNewAvatar(null);
    playSound('success');
    alert('Профіль успішно оновлено! Ваші дані змінено всюди.');
  };

  const canUpdateName = () => {
    if (!currentUser?.lastNameChange) return true;
    return (Date.now() - currentUser.lastNameChange) > 7 * 24 * 60 * 60 * 1000;
  };

  const canUpdateUsername = () => {
    if (!currentUser?.lastUsernameChange) return true;
    return (Date.now() - currentUser.lastUsernameChange) > 30 * 24 * 60 * 60 * 1000;
  };

  // Post & Comment Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length + postImages.length > 5) return alert('Максимум 5 фото!');
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImages(prev => [...prev, reader.result as string]);
        playSound('pop');
      };
      reader.readAsDataURL(file);
    });
  };

  const submitPost = () => {
    if (!currentUser) return;
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9),
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
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
    setPostStep(1);
    setPostText('');
    setPostImages([]);
    playSound('success');
    alert('Відправлено на модерацію!');
  };

  const handleLike = (postId: string) => {
    if (!currentUser) return setShowAuth('login');
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const isLiked = p.likes.includes(currentUser.id);
        const newLikes = isLiked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id];
        if (!isLiked) playSound('pop');
        return { ...p, likes: newLikes };
      }
      return p;
    }));
  };

  const handleComment = (postId: string) => {
    if (!currentUser) return setShowAuth('login');
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      text: commentText,
      createdAt: Date.now()
    };

    setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    setCommentText('');
    playSound('pop');
  };

  const trackView = (postId: string) => {
    const viewerId = currentUser?.id || 'guest_' + Math.random();
    setPosts(prev => prev.map(p => {
      if (p.id === postId && !p.views.includes(viewerId)) {
        return { ...p, views: [...p.views, viewerId] };
      }
      return p;
    }));
  };

  const moderatePost = (postId: string, status: 'approved' | 'rejected', modComment?: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setPosts(posts.map(p => p.id === postId ? { ...p, status, moderatorComment: modComment } : p));
    const notif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId: post.authorId,
      title: status === 'approved' ? 'Пост схвалено!' : 'Пост відхилено',
      message: status === 'approved' ? 'Вітаємо! Ваш пост у стрічці.' : `Причина: ${modComment || 'Порушення правил'}`,
      type: status === 'approved' ? 'approval' : 'rejection',
      read: false,
      createdAt: Date.now()
    };
    setNotifications([notif, ...notifications]);
    playSound('notify');
  };

  const approvedPosts = useMemo(() => posts.filter(p => p.status === 'approved'), [posts]);
  const pendingPosts = useMemo(() => posts.filter(p => p.status === 'pending'), [posts]);
  const userNotifs = useMemo(() => notifications.filter(n => n.userId === currentUser?.id), [notifications, currentUser]);
  const unreadNotifsCount = useMemo(() => userNotifs.filter(n => !n.read).length, [userNotifs]);

  return (
    <div className="min-h-screen bg-[#050b18] text-white selection:bg-yellow-500 selection:text-black">
      <Snowfall />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 card-glass border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveTab('feed'); playSound('pop'); }}>
          <div className="bg-yellow-400 text-black font-black px-2 py-1 rounded-lg text-xs group-hover:scale-110 transition-transform">UA</div>
          <h1 className="text-xl font-black neon-yellow uppercase tracking-tighter hidden sm:block">Сутність UA</h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => { setActiveTab('feed'); playSound('pop'); }} className={`p-2 rounded-xl transition-all ${activeTab === 'feed' ? 'text-yellow-400 scale-110' : 'text-gray-400 hover:text-white'}`}><Home /></button>
          
          {currentUser && (
            <>
              <button onClick={() => { setActiveTab('inbox'); playSound('pop'); }} className={`relative p-2 transition-all ${activeTab === 'inbox' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}>
                <Mail />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-[#050b18] animate-bounce font-black">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
              <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
              <button onClick={() => { setActiveTab('profile'); playSound('pop'); }} className={`w-9 h-9 rounded-full border-2 transition-all overflow-hidden ${activeTab === 'profile' ? 'border-yellow-400 scale-110 shadow-lg shadow-yellow-500/20' : 'border-white/20 hover:border-white/40'}`}>
                <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </button>
              {currentUser.isAdmin && (
                <button onClick={() => { setActiveTab('admin'); playSound('pop'); }} className={`relative p-2 rounded-xl transition-all ${activeTab === 'admin' ? 'text-red-500' : 'text-gray-400'}`}>
                  <ShieldCheck />
                  {pendingPosts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-[#050b18] font-black">
                      {pendingPosts.length}
                    </span>
                  )}
                </button>
              )}
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
            </>
          )}

          {!currentUser && (
            <button onClick={() => { setShowAuth('login'); playSound('pop'); }} className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 sm:px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/20 active:scale-95">Увійти</button>
          )}
        </div>
      </nav>

      <main className="max-w-xl mx-auto py-10 px-4">
        
        {/* TAB: FEED */}
        {activeTab === 'feed' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-3xl font-black tracking-tighter italic uppercase">Стрічка</h2>
              {currentUser && (
                <button onClick={() => { setShowCreatePost(true); playSound('pop'); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 active:scale-95">
                  <PlusSquare size={18} /> Створити
                </button>
              )}
            </div>

            {approvedPosts.length === 0 ? (
              <div className="card-glass p-24 text-center rounded-[50px] border-dashed border-white/10 text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                Порожньо...
              </div>
            ) : (
              approvedPosts.map(post => (
                <div key={post.id} className="card-glass rounded-[40px] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl" onMouseEnter={() => trackView(post.id)}>
                  <div className="p-6 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full border-2 border-white/10 p-0.5 shadow-lg"><img src={post.authorAvatar} className="w-full h-full rounded-full object-cover" alt="A" /></div>
                      <div>
                        <div className="font-black text-sm tracking-tight">{post.authorName}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-yellow-500/80 uppercase font-black tracking-widest"><MapPin size={10} /> Сервер {post.server}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="px-8 pt-8 pb-4">
                    <p className="text-xl sm:text-2xl font-bold leading-[1.3] text-white tracking-tight break-words">{post.text}</p>
                  </div>
                  {post.images.length > 0 && (
                    <div className="px-6 pb-6">
                       <div className={`grid gap-2 rounded-[30px] overflow-hidden ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {post.images.map((img, i) => <img key={i} src={img} className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-700" alt="Content" />)}
                       </div>
                    </div>
                  )}
                  <div className="px-8 pb-8 flex items-center gap-8">
                      <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2.5 transition-all group ${post.likes.includes(currentUser?.id || '') ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}`}>
                        <div className={`p-2.5 rounded-2xl transition-all ${post.likes.includes(currentUser?.id || '') ? 'bg-red-500/10' : 'bg-white/5'}`}><Heart size={22} className={post.likes.includes(currentUser?.id || '') ? 'fill-current' : ''} /></div>
                        <span className="text-sm font-black tracking-widest">{post.likes.length}</span>
                      </button>
                      <button onClick={() => { setExpandedComments(expandedComments === post.id ? null : post.id); playSound('pop'); }} className={`flex items-center gap-2.5 transition-all hover:text-blue-400 ${expandedComments === post.id ? 'text-blue-500' : 'text-gray-400'}`}>
                        <div className={`p-2.5 rounded-2xl transition-all ${expandedComments === post.id ? 'bg-blue-500/10' : 'bg-white/5'}`}><MessageSquare size={22} /></div>
                        <span className="text-sm font-black tracking-widest">{post.comments.length}</span>
                      </button>
                      <div className="flex items-center gap-2.5 text-gray-500 ml-auto"><Eye size={18} /><span className="text-[10px] font-black uppercase tracking-widest">{post.views.length}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === 'profile' && currentUser && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
             <div className="card-glass p-10 rounded-[50px] border border-yellow-500/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-8 text-yellow-500/[0.03] rotate-12"><Settings size={280} /></div>
                
                <div className="flex flex-col items-center mb-10">
                   <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-32 h-32 rounded-full border-4 border-yellow-500/50 p-1.5 mb-6 relative group cursor-pointer shadow-2xl transition-all hover:scale-105 active:scale-95"
                   >
                      <img src={newAvatar || currentUser.avatar} className="w-full h-full rounded-full object-cover" alt="Av" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center rounded-full backdrop-blur-sm">
                         <Camera size={28} className="text-yellow-400 mb-1" />
                         <span className="text-[8px] font-black uppercase tracking-widest text-white">Змінити фото</span>
                      </div>
                      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                   </div>
                   <h2 className="text-3xl font-black tracking-tight">{currentUser.displayName}</h2>
                   <p className="text-gray-500 text-[10px] font-black tracking-[0.3em] uppercase mt-1 italic">@{currentUser.username}</p>
                </div>

                <div className="space-y-6">
                   <div className="group">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-6 mb-2 block tracking-[0.3em]">Ім'я в профілі</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-4 outline-none focus:border-yellow-500 transition-all font-bold" />
                   </div>
                   <div className="group">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-6 mb-2 block tracking-[0.3em]">Про себе</label>
                      <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-4 outline-none focus:border-yellow-500 transition-all font-bold h-28 resize-none" placeholder="Розкажіть щось цікаве про себе..." />
                   </div>
                   
                   <div className="flex gap-4 pt-4">
                      <button onClick={updateProfile} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-[24px] transition-all shadow-2xl shadow-yellow-500/30 active:scale-95 uppercase tracking-widest text-xs">Зберегти всюди</button>
                      <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-5 rounded-[24px] border border-red-500/20 transition-all"><LogOut /></button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* TAB: INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-400">
            <h2 className="text-3xl font-black flex items-center gap-4 italic tracking-tighter uppercase">Вхідні</h2>
            {userNotifs.length === 0 ? (
              <div className="card-glass p-28 text-center rounded-[50px] text-gray-600 border-dashed border-white/10 font-bold uppercase tracking-widest text-[10px]">Листів немає</div>
            ) : userNotifs.map(n => (
                <div key={n.id} className={`card-glass p-8 rounded-[35px] border-l-[6px] shadow-xl ${n.type === 'approval' ? 'border-green-500 bg-green-500/[0.02]' : 'border-red-500 bg-red-500/[0.02]'} relative group transition-all hover:bg-white/[0.05]`}>
                  {!n.read && <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>}
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-black text-lg tracking-tight">{n.title}</h4>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">{n.message}</p>
                </div>
            ))}
          </div>
        )}

        {/* TAB: ADMIN */}
        {activeTab === 'admin' && currentUser?.isAdmin && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-red-500 flex items-center gap-4 italic tracking-tighter uppercase"><ShieldCheck size={32} /> Модерація</h2>
            {pendingPosts.length === 0 ? <div className="card-glass p-28 text-center rounded-[50px] text-gray-600 font-bold uppercase tracking-widest text-[10px] border border-white/5">Черга порожня</div> : pendingPosts.map(post => (
                <div key={post.id} className="card-glass rounded-[40px] overflow-hidden border border-red-500/20 shadow-2xl">
                  <div className="p-6 bg-red-500/5 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3"><img src={post.authorAvatar} className="w-8 h-8 rounded-full border border-white/10" alt="A" /><span className="font-black text-xs uppercase tracking-widest text-red-400">{post.authorName}</span></div>
                    <span className="text-[10px] uppercase font-black tracking-widest bg-red-500/20 px-3 py-1 rounded-lg">Сервер: {post.server}</span>
                  </div>
                  <div className="p-8">
                    <p className="text-xl font-bold mb-6 leading-snug">{post.text}</p>
                    <div className="flex gap-4">
                      <button onClick={() => moderatePost(post.id, 'approved')} className="flex-1 bg-green-500 text-black py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-green-400 transition-all active:scale-95">Схвалити</button>
                      <button onClick={() => {
                        const reason = prompt('Причина відхилення:');
                        if (reason) moderatePost(post.id, 'rejected', reason);
                      }} className="flex-1 bg-red-500/20 text-red-500 py-5 rounded-[24px] border border-red-500/30 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/40 transition-all active:scale-95">Відхилити</button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: AUTH */}
      {showAuth && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="card-glass w-full max-w-md p-10 rounded-[60px] border border-white/10 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
              <div className="flex justify-center mb-8">
                 <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl flex items-center justify-center shadow-lg shadow-yellow-500/5">
                    {showAuth === 'login' ? <Lock className="text-yellow-500" size={32} /> : <Fingerprint className="text-yellow-500" size={32} />}
                 </div>
              </div>
              <h2 className="text-3xl font-black text-center mb-10 uppercase tracking-tighter italic">
                {showAuth === 'login' ? 'Авторизація' : 'Створити акаунт'}
              </h2>
              <form onSubmit={showAuth === 'login' ? handleLogin : handleRegister} className="space-y-5">
                 <input name="username" placeholder="Юзернейм" className="w-full bg-white/[0.03] border border-white/10 rounded-[25px] px-8 py-5 outline-none focus:border-yellow-500 transition-all font-bold" required />
                 <input name="password" type="password" placeholder="Пароль" className="w-full bg-white/[0.03] border border-white/10 rounded-[25px] px-8 py-5 outline-none focus:border-yellow-500 transition-all font-bold" required />
                 <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-[25px] uppercase tracking-widest shadow-2xl shadow-yellow-500/30 transform active:scale-95 transition-all text-xs mt-4">
                    {showAuth === 'login' ? "Увійти" : "Зареєструватись"}
                 </button>
              </form>
              <div className="mt-8 text-center">
                 <button onClick={() => { setShowAuth(showAuth === 'login' ? 'register' : 'login'); playSound('pop'); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-yellow-500 transition-colors">
                    Змінити метод входу
                 </button>
              </div>
              <button onClick={() => setShowAuth(null)} className="absolute top-8 right-8 p-2 text-gray-800 hover:text-white transition-all"><X size={24} /></button>
           </div>
        </div>
      )}

      {/* MODAL: CREATE POST */}
      {showCreatePost && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="card-glass w-full max-w-lg p-10 rounded-[60px] border border-blue-500/30 relative shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black tracking-tighter italic uppercase text-blue-400">Публікація</h2>
              <button onClick={() => setShowCreatePost(false)} className="p-3 text-gray-400 hover:text-white transition-all"><X size={28} /></button>
            </div>

            {postStep === 1 ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-4">
                <p className="text-center text-gray-500 font-black uppercase tracking-widest text-[10px]">Оберіть сервер</p>
                <div className="grid grid-cols-3 gap-4">
                  {['01', '02', '03', '04', '05', 'all'].map(s => (
                    <button key={s} onClick={() => { setPostServer(s as any); setPostStep(2); playSound('pop'); }} className={`py-6 rounded-[24px] font-black text-2xl transition-all border-2 ${postServer === s ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-white/5 text-white border-white/5 hover:border-yellow-500/50'}`}>{s.toUpperCase()}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-8">
                <textarea className="w-full h-48 bg-white/5 border border-white/10 rounded-[35px] p-8 outline-none focus:border-blue-500 transition-all font-bold" placeholder="Що сталось?" value={postText} onChange={(e) => setPostText(e.target.value)} />
                <div className="flex items-center gap-4">
                   <label className="flex-1 flex items-center justify-center gap-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 py-5 rounded-[24px] font-black text-[10px] uppercase cursor-pointer hover:bg-blue-600/20 transition-all">
                      <ImageIcon size={20} /> Фото ({postImages.length}/5)
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                   </label>
                </div>
                <button onClick={submitPost} disabled={!postText.trim()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[35px] transition-all disabled:opacity-30 shadow-2xl shadow-blue-600/30 active:scale-95 text-xs uppercase tracking-widest">Надіслати</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-24 border-t border-white/10 py-20 px-6">
        <div className="max-w-xl mx-auto space-y-16 text-center">
           <BotCard />
           <div className="text-gray-700 text-[9px] font-black uppercase tracking-[0.4em] opacity-50">Sutnist UA Online &copy; 2024-2025 • Syncing Profile Active</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
