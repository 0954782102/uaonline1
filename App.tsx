import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Home, Newspaper, Zap, Menu, X, Heart, MessageCircle, Upload, AlertCircle, RefreshCw, CheckCircle, XCircle, Trash2, User, Eye } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterServer, setFilterServer] = useState('ALL');
  const [showAuth, setShowAuth] = useState(null);
  const [regUsername, setRegUsername] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [postServer, setPostServer] = useState('01');
  const [postText, setPostText] = useState('');
  const [postPhotoPreview, setPostPhotoPreview] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');
  const [openComments, setOpenComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [pendingPosts, setPendingPosts] = useState([]);
  const [userStats, setUserStats] = useState({ posts: 0, views: 0 });

  useEffect(() => {
    loadUserData();
    loadPosts();
  }, []);

  useEffect(() => {
    if (user?.is_admin) loadPendingPosts();
    if (user) loadUserStats();
  }, [user]);

  const loadUserData = async () => {
    try {
      const result = await window.storage.get('current_user', true);
      if (result) setUser(JSON.parse(result.value));
    } catch (error) {
      console.log('No user');
    }
  };

  const loadPendingPosts = async () => {
    try {
      const result = await window.storage.get('pending_posts', true);
      setPendingPosts(result ? JSON.parse(result.value) : []);
    } catch {
      setPendingPosts([]);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const result = await window.storage.get('approved_posts', true);
      const allPosts = result ? JSON.parse(result.value) : [];
      setPosts(allPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch {
      setPosts([]);
    }
    setLoading(false);
  };

  const loadUserStats = async () => {
    if (!user) return;
    try {
      const postsResult = await window.storage.get('approved_posts', true);
      const allPosts = postsResult ? JSON.parse(postsResult.value) : [];
      const userPosts = allPosts.filter(p => p.user_id === user.id);
      const totalViews = userPosts.reduce((sum, post) => sum + (post.views?.length || 0), 0);
      setUserStats({ posts: userPosts.length, views: totalViews });
    } catch {
      setUserStats({ posts: 0, views: 0 });
    }
  };

  const incrementView = async (postId) => {
    if (!user) return;
    try {
      const result = await window.storage.get('approved_posts', true);
      const allPosts = result ? JSON.parse(result.value) : [];
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;
      if (!post.views) post.views = [];
      const viewKey = `${user.id}_${postId}`;
      const viewsResult = await window.storage.get('post_views', true);
      const viewsLog = viewsResult ? JSON.parse(viewsResult.value) : {};
      if (!viewsLog[viewKey]) {
        post.views.push(user.id);
        viewsLog[viewKey] = true;
        await window.storage.set('approved_posts', JSON.stringify(allPosts), true);
        await window.storage.set('post_views', JSON.stringify(viewsLog), true);
        setPosts([...allPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (error) {
      console.error('View error:', error);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regUsername || !regFirstName || !regPassword) {
      setRegError('Заповніть всі поля');
      return;
    }
    try {
      const usersResult = await window.storage.get('users_db', true);
      const users = usersResult ? JSON.parse(usersResult.value) : {};
      if (users[regUsername.toLowerCase()]) {
        setRegError('Цей логін вже занятий');
        return;
      }
      const userId = Date.now();
      const isAdmin = regUsername.toLowerCase() === 'admin' && regPassword === 'ArtemProcko';
      users[regUsername.toLowerCase()] = {
        id: userId,
        username: regUsername.toLowerCase(),
        first_name: regFirstName,
        password: regPassword,
        is_admin: isAdmin
      };
      await window.storage.set('users_db', JSON.stringify(users), true);
      const newUser = { id: userId, username: regUsername.toLowerCase(), first_name: regFirstName, is_admin: isAdmin };
      setUser(newUser);
      await window.storage.set('current_user', JSON.stringify(newUser), true);
      setShowAuth(null);
      setRegUsername('');
      setRegFirstName('');
      setRegPassword('');
    } catch {
      setRegError('Помилка реєстрації');
    }
  };

  const handleLogin = async () => {
    setRegError('');
    if (!regUsername || !regPassword) {
      setRegError('Введіть логін та пароль');
      return;
    }
    try {
      const usersResult = await window.storage.get('users_db', true);
      const users = usersResult ? JSON.parse(usersResult.value) : {};
      const userKey = regUsername.toLowerCase();
      if (!users[userKey] || users[userKey].password !== regPassword) {
        setRegError('Невірний логін/пароль');
        return;
      }
      const userData = users[userKey];
      const newUser = {
        id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        is_admin: userData.is_admin || false
      };
      setUser(newUser);
      await window.storage.set('current_user', JSON.stringify(newUser), true);
      setShowAuth(null);
      setRegUsername('');
      setRegPassword('');
      if (newUser.is_admin) await loadPendingPosts();
    } catch {
      setRegError('Помилка входу');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPostPhotoPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPost = async () => {
    setPostError('');
    if (!user) {
      setPostError('Авторизуйтесь');
      return;
    }
    if (postText.trim().length < 10) {
      setPostError('Мінімум 10 символів');
      return;
    }
    setPostSubmitting(true);
    const newPost = {
      id: Date.now(),
      server: postServer,
      text: postText.trim(),
      username: user.first_name,
      user_id: user.id,
      created_at: new Date().toISOString(),
      photo_url: postPhotoPreview || null,
      likes: [],
      comments: [],
      views: []
    };
    try {
      const pendingResult = await window.storage.get('pending_posts', true);
      const pending = pendingResult ? JSON.parse(pendingResult.value) : [];
      pending.push(newPost);
      await window.storage.set('pending_posts', JSON.stringify(pending), true);
      alert('✅ Пост відправлено на модерацію!');
      setPostText('');
      setPostPhotoPreview('');
      setPostServer('01');
      setPage('posts');
      if (user.is_admin) loadPendingPosts();
    } catch {
      setPostError('Помилка публікації');
    }
    setPostSubmitting(false);
  };

  const deletePost = async (postId) => {
    if (!user) return;
    if (!confirm('Видалити цей пост?')) return;
    try {
      const result = await window.storage.get('approved_posts', true);
      const allPosts = result ? JSON.parse(result.value) : [];
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;
      if (post.user_id !== user.id && !user.is_admin) {
        alert('Ви можете видаляти тільки свої пости!');
        return;
      }
      const filtered = allPosts.filter(p => p.id !== postId);
      await window.storage.set('approved_posts', JSON.stringify(filtered), true);
      setPosts(filtered);
      loadUserStats();
      alert('✅ Пост видалено');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Помилка видалення');
    }
  };

  const toggleLike = async (postId) => {
    if (!user) {
      alert('Авторизуйтесь для лайку!');
      return;
    }
    try {
      const result = await window.storage.get('approved_posts', true);
      const allPosts = result ? JSON.parse(result.value) : [];
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;
      const likeIndex = post.likes.findIndex(like => like === user.id);
      if (likeIndex !== -1) {
        post.likes.splice(likeIndex, 1);
      } else {
        post.likes.push(user.id);
      }
      await window.storage.set('approved_posts', JSON.stringify(allPosts), true);
      setPosts([...allPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Like error:', error);
      alert('Помилка лайку');
    }
  };

  const addComment = async (postId) => {
    if (!user || !commentText.trim()) return;
    try {
      const result = await window.storage.get('approved_posts', true);
      const allPosts = result ? JSON.parse(result.value) : [];
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;
      post.comments.push({
        id: Date.now(),
        user_id: user.id,
        username: user.first_name,
        text: commentText.trim(),
        created_at: new Date().toISOString()
      });
      await window.storage.set('approved_posts', JSON.stringify(allPosts), true);
      setCommentText('');
      setPosts([...allPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const approvePost = async (postId) => {
    try {
      const pendingResult = await window.storage.get('pending_posts', true);
      const pending = pendingResult ? JSON.parse(pendingResult.value) : [];
      const postIndex = pending.findIndex(p => p.id === postId);
      if (postIndex === -1) return;
      const post = pending[postIndex];
      const approvedResult = await window.storage.get('approved_posts', true);
      const approved = approvedResult ? JSON.parse(approvedResult.value) : [];
      approved.unshift(post);
      pending.splice(postIndex, 1);
      await window.storage.set('approved_posts', JSON.stringify(approved), true);
      await window.storage.set('pending_posts', JSON.stringify(pending), true);
      setPendingPosts(pending);
      loadPosts();
      alert('✅ Пост схвалено!');
    } catch (error) {
      console.error('Approve error:', error);
      alert('Помилка схвалення');
    }
  };

  const rejectPost = async (postId) => {
    try {
      const pendingResult = await window.storage.get('pending_posts', true);
      const pending = pendingResult ? JSON.parse(pendingResult.value) : [];
      const filtered = pending.filter(p => p.id !== postId);
      await window.storage.set('pending_posts', JSON.stringify(filtered), true);
      setPendingPosts(filtered);
      alert('❌ Пост відхилено');
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    try {
      await window.storage.delete('current_user', true);
    } catch (error) {
      console.log('Logout error:', error);
    }
    setPage('home');
  };

  const filteredPosts = filterServer === 'ALL' ? posts : posts.filter(p => p.server === filterServer);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'щойно';
    if (diff < 3600) return `${Math.floor(diff / 60)}хв тому`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}год тому`;
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden text-white" style={{fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0e27'}}>
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full filter blur-[150px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <nav className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b border-yellow-500/20 bg-black/40">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-black font-black px-2 py-1 rounded text-sm">UA</div>
          <h1 className="text-lg font-black tracking-tight">Сутність UA</h1>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => setPage('home')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${page === 'home' ? 'bg-yellow-500 text-black' : 'hover:bg-white/10'}`}>
            <Home size={16} /> Головна
          </button>
          <button onClick={() => setPage('posts')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${page === 'posts' ? 'bg-yellow-500 text-black' : 'hover:bg-white/10'}`}>
            <Newspaper size={16} /> Новини
          </button>
          {user && (
            <button onClick={() => setPage('submit')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${page === 'submit' ? 'bg-yellow-500 text-black' : 'hover:bg-white/10'}`}>
              <Zap size={16} /> Надіслати
            </button>
          )}
          {user && (
            <button onClick={() => setPage('profile')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${page === 'profile' ? 'bg-yellow-500 text-black' : 'hover:bg-white/10'}`}>
              <User size={16} /> Профіль
            </button>
          )}
          {user?.is_admin && (
            <button onClick={() => setPage('moderation')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${page === 'moderation' ? 'bg-red-500 text-white' : 'hover:bg-white/10'}`}>
              🛡️ Модерація {pendingPosts.length > 0 && `(${pendingPosts.length})`}
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-yellow-400">{user.first_name}</span>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-500/20 transition">
                <LogOut size={16} className="text-red-400" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth('login')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg transition flex items-center gap-2">
              <LogIn size={16} /> Увійти
            </button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-20 px-6 md:hidden">
          <div className="flex flex-col gap-4 text-lg font-bold">
            <button onClick={() => { setPage('home'); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10"><Home /> Головна</button>
            <button onClick={() => { setPage('posts'); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10"><Newspaper /> Новини</button>
            {user && <button onClick={() => { setPage('submit'); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-yellow-400"><Zap /> Надіслати</button>}
            {user && <button onClick={() => { setPage('profile'); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-yellow-400"><User /> Профіль</button>}
            {user?.is_admin && <button onClick={() => { setPage('moderation'); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-red-400">🛡️ Модерація</button>}
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-red-500"><LogOut /> Вийти</button>
            ) : (
              <button onClick={() => { setShowAuth('login'); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-yellow-500"><LogIn /> Увійти</button>
            )}
          </div>
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowAuth(null)}>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl max-w-md w-full border border-yellow-500/30" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black mb-6 text-yellow-400">{showAuth === 'login' ? 'Вхід' : 'Реєстрація'}</h3>
            {regError && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-300 text-sm">{regError}</div>}
            <div className="space-y-4">
              {showAuth === 'register' && (
                <input type="text" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} placeholder="Ім'я" className="w-full px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 outline-none focus:border-yellow-500 transition" />
              )}
              <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="Логін" className="w-full px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 outline-none focus:border-yellow-500 transition" />
              <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Пароль" className="w-full px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 outline-none focus:border-yellow-500 transition" />
              <button onClick={showAuth === 'login' ? handleLogin : handleRegister} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition">
                {showAuth === 'login' ? 'Увійти' : 'Зареєструватись'}
              </button>
              <button onClick={() => setShowAuth(showAuth === 'login' ? 'register' : 'login')} className="w-full text-gray-400 hover:text-yellow-400 text-sm transition">
                {showAuth === 'login' ? 'Немає акаунту? Реєстрація' : 'Вже є акаунт? Увійти'}
              </button>
            </div>
          </div>
        </div>
      )}

      {page === 'home' && (
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            СВЯТКОВА <span className="text-yellow-400">СУТНІСТЬ</span><br />
            <span className="text-2xl md:text-4xl text-gray-400">UA ONLINE 2025</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Публікуй новини з серверів, лайкай, коментуй та спілкуйся зі спільнотою гравців!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setPage('posts')} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold flex items-center gap-2 transition transform hover:scale-105">
              <Newspaper /> Переглянути Новини
            </button>
            {!user && (
              <button onClick={() => setShowAuth('register')} className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center gap-2 transition transform hover:scale-105 border border-white/20">
                Реєстрація
              </button>
            )}
          </div>
        </div>
      )}

      {page === 'posts' && (
        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-yellow-400">📰 Новини</h2>
            <button onClick={loadPosts} className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg flex items-center gap-2 text-blue-400 transition">
              <RefreshCw size={16} /> Оновити
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {['ALL', '01', '02', '03', '04', '05'].map(srv => (
              <button key={srv} onClick={() => setFilterServer(srv)} className={`px-4 py-2 rounded-lg font-bold transition ${filterServer === srv ? 'bg-yellow-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>
                {srv === 'ALL' ? '🌐 Всі' : `🎮 ${srv}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">⏳ Завантаження...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 rounded-2xl text-center bg-white/5"><p className="text-gray-400 text-lg">Поки немає новин 📭</p></div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => {
                const isOwner = user?.id === post.user_id;
                const isLiked = post.likes.includes(user?.id);
                return (
                <div key={post.id} className="rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/10 backdrop-blur-sm hover:border-yellow-500/30 transition shadow-xl" onClick={() => incrementView(post.id)}>
                  {post.photo_url && (
                    <div className="relative h-96 overflow-hidden bg-black">
                      <img src={post.photo_url} alt="Post" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-black text-xl text-black shadow-lg">
                          {post.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{post.username}</p>
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold border border-yellow-500/30">
                              🎮 {post.server}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                        </div>
                      </div>
                      {(isOwner || user?.is_admin) && (
                        <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition" title="Видалити пост">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-100 leading-relaxed mb-4 whitespace-pre-wrap break-words text-base">{post.text}</p>
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                      <button onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${isLiked ? 'bg-red-500/20 text-red-400 scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2.5} />
                        <span className="font-bold">{post.likes.length}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setOpenComments(openComments === post.id ? null : post.id); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 font-semibold hover:bg-blue-500/30 transition">
                        <MessageCircle size={20} strokeWidth={2.5} />
                        <span className="font-bold">{post.comments.length}</span>
                      </button>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-semibold">
                        <Eye size={20} strokeWidth={2.5} />
                        <span className="font-bold">{post.views?.length || 0}
