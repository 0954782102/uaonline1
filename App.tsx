import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Home, Newspaper, Zap, Menu, X, Heart, MessageCircle, Upload, AlertCircle, RefreshCw } from 'lucide-react';

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

  useEffect(() => {
    loadUserData();
    loadPosts();
    loadPendingPosts();
  }, []);

  const loadUserData = async () => {
    try {
      const result = await window.storage.get('current_user');
      if (result) setUser(JSON.parse(result.value));
    } catch (error) {
      console.log('No user');
    }
  };

  const loadPendingPosts = async () => {
    try {
      const result = await window.storage.get('pending_posts');
      setPendingPosts(result ? JSON.parse(result.value) : []);
    } catch {
      setPendingPosts([]);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const result = await window.storage.get('approved_posts');
      const allPosts = result ? JSON.parse(result.value) : [];
      setPosts(allPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch {
      setPosts([]);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regUsername || !regFirstName || !regPassword) {
      setRegError('Заповніть всі поля');
      return;
    }

    try {
      const usersResult = await window.storage.get('users_db');
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

      await window.storage.set('users_db', JSON.stringify(users));
      
      const newUser = { id: userId, username: regUsername.toLowerCase(), first_name: regFirstName, is_admin: isAdmin };
      setUser(newUser);
      await window.storage.set('current_user', JSON.stringify(newUser));
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
      const usersResult = await window.storage.get('users_db');
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
      await window.storage.set('current_user', JSON.stringify(newUser));
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
      username: user.username,
      user_id: user.id,
      created_at: new Date().toISOString(),
      photo_url: postPhotoPreview || null,
      likes: [],
      comments: []
    };

    try {
      const pendingResult = await window.storage.get('pending_posts');
      const pending = pendingResult ? JSON.parse(pendingResult.value) : [];
      pending.push(newPost);
      await window.storage.set('pending_posts', JSON.stringify(pending));

      alert('✅ Пост відправлено на модерацію!');
      setPostText('');
      setPostPhotoPreview('');
      setPostServer('01');
      setPage('posts');
    } catch {
      setPostError('Помилка публікації');
    }
    
    setPostSubmitting(false);
  };

  const toggleLike = async (postId) => {
    if (!user) {
      alert('Авторизуйтесь!');
      return;
    }

    try {
      const result = await window.storage.get('approved_posts');
      const allPosts = result ? JSON.parse(result.value) : [];
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;

      if (post.likes.includes(user.id)) {
        post.likes = post.likes.filter(id => id !== user.id);
      } else {
        post.likes.push(user.id);
      }

      await window.storage.set('approved_posts', JSON.stringify(allPosts));
      loadPosts();
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const addComment = async (postId) => {
    if (!user || !commentText.trim()) return;

    try {
      const result = await window.storage.get('approved_posts');
      const allPosts = result ? JSON.parse(result.value) : [];
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;

      post.comments.push({
        id: Date.now(),
        user_id: user.id,
        username: user.username,
        text: commentText,
        created_at: new Date().toISOString()
      });

      await window.storage.set('approved_posts', JSON.stringify(allPosts));
      setCommentText('');
      loadPosts();
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const approvePost = async (postId) => {
    try {
      const pendingResult = await window.storage.get('pending_posts');
      const pending = pendingResult ? JSON.parse(pendingResult.value) : [];
      const postIndex = pending.findIndex(p => p.id === postId);
      
      if (postIndex === -1) return;
      
      const post = pending[postIndex];
      
      const approvedResult = await window.storage.get('approved_posts');
      const approved = approvedResult ? JSON.parse(approvedResult.value) : [];
      approved.push(post);
      
      pending.splice(postIndex, 1);
      
      await window.storage.set('approved_posts', JSON.stringify(approved));
      await window.storage.set('pending_posts', JSON.stringify(pending));
      
      setPendingPosts(pending);
      loadPosts();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const rejectPost = async (postId) => {
    try {
      const pendingResult = await window.storage.get('pending_posts');
      const pending = pendingResult ? JSON.parse(pendingResult.value) : [];
      const filtered = pending.filter(p => p.id !== postId);
      
      await window.storage.set('pending_posts', JSON.stringify(filtered));
      setPendingPosts(filtered);
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    try {
      await window.storage.delete('current_user');
    } catch (error) {
      console.log('Logout error:', error);
    }
    setPage('home');
  };

  const filteredPosts = filterServer === 'ALL' ? posts : posts.filter(p => p.server === filterServer);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden text-white" style={{ 
      fontFamily: 'Montserrat, sans-serif',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)'
    }}>
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full filter blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between" style={{ 
        background: 'rgba(10, 14, 39, 0.8)', 
        backdropFilter: 'blur(20px)', 
        borderBottom: '1px solid rgba(250, 204, 21, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-black font-black px-2 py-1 rounded-lg text-sm">UA</div>
          <h1 className="text-xl font-black tracking-tighter uppercase" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>Сутність UA</h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setPage('home')} className={`flex items-center gap-2 transition ${page === 'home' ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
            <Home size={18} /> Головна
          </button>
          <button onClick={() => setPage('posts')} className={`flex items-center gap-2 transition ${page === 'posts' ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
            <Newspaper size={18} /> Новини
          </button>
          {user && (
            <button onClick={() => setPage('submit')} className={`flex items-center gap-2 transition ${page === 'submit' ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
              <Zap size={18} /> Надіслати
            </button>
          )}
          {user?.is_admin && (
            <button onClick={() => setPage('moderation')} className={`flex items-center gap-2 transition ${page === 'moderation' ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
              🛡️ Модерація ({pendingPosts.length})
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-yellow-500">{user.username}</span>
              <button onClick={handleLogout} className="px-4 py-2 rounded-xl border transition" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth('login')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-xl transition flex items-center gap-2">
              <LogIn size={18} /> Увійти
            </button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-xl font-bold">
            <button onClick={() => { setPage('home'); setMenuOpen(false); }} className="flex items-center gap-4"><Home /> Головна</button>
            <button onClick={() => { setPage('posts'); setMenuOpen(false); }} className="flex items-center gap-4"><Newspaper /> Новини</button>
            {user && <button onClick={() => { setPage('submit'); setMenuOpen(false); }} className="flex items-center gap-4 text-yellow-400"><Zap /> Надіслати</button>}
            {user?.is_admin && <button onClick={() => { setPage('moderation'); setMenuOpen(false); }} className="flex items-center gap-4 text-yellow-400">🛡️ Модерація</button>}
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-4 text-red-500"><LogOut /> Вийти</button>
            ) : (
              <button onClick={() => { setShowAuth('login'); setMenuOpen(false); }} className="flex items-center gap-4 text-yellow-500"><LogIn /> Увійти</button>
            )}
          </div>
        </div>
      )}

      {page === 'home' && (
        <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            СВЯТКОВА <span className="text-yellow-400" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>СУТНІСТЬ</span>
            <br />
            <span className="text-3xl md:text-5xl">UA ONLINE 2025</span>
          </h2>
          <p className="text-gray-400 text-lg">Публікуй новини, лайкай та коментуй разом зі спільнотою!</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setPage('posts')} className="px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition hover:bg-white/10 transform hover:scale-105" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Newspaper /> Переглянути Новини
            </button>
            {!user && (
              <button onClick={() => setShowAuth('register')} className="px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition hover:bg-white/10 transform hover:scale-105" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                Реєстрація
              </button>
            )}
          </div>
        </div>
      )}

      {page === 'posts' && (
        <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-yellow-400">📰 Новини</h2>
            <button onClick={loadPosts} className="px-4 py-2 rounded-xl flex items-center gap-2" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
              <RefreshCw size={16} /> Оновити
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {['ALL', '01', '02', '03', '04', '05'].map(srv => (
              <button key={srv} onClick={() => setFilterServer(srv)} className={`px-4 py-2 rounded-xl font-bold transition ${filterServer === srv ? 'bg-yellow-500 text-black' : 'text-white'}`} style={filterServer !== srv ? { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' } : {}}>
                {srv === 'ALL' ? '🌐 Всі' : `🎮 ${srv}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">⏳ Завантаження...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 rounded-3xl text-center" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <p className="text-gray-400 text-lg">Поки немає новин 📭</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPosts.map(post => (
                <div key={post.id} className="rounded-3xl overflow-hidden transition-all group hover:scale-[1.02] relative" style={{ 
                  background: 'linear-gradient(145deg, rgba(26, 31, 58, 0.6), rgba(15, 20, 25, 0.8))',
                  border: '1px solid rgba(250, 204, 21, 0.2)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                    background: 'radial-gradient(circle at center, rgba(250, 204, 21, 0.1), transparent 70%)'
                  }}></div>

                  {post.photo_url && (
                    <div className="relative h-64 overflow-hidden">
                      <img src={post.photo_url} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-4 left-4 px-4 py-2 rounded-xl font-bold text-sm backdrop-blur-md" style={{
                        background: 'rgba(250, 204, 21, 0.9)',
                        color: '#000',
                        boxShadow: '0 4px 15px rgba(250, 204, 21, 0.4)'
                      }}>
                        🎮 Сервер {post.server}
                      </div>
                    </div>
                  )}

                  <div className="p-6 relative z-10">
                    {!post.photo_url && (
                      <div className="mb-4">
                        <span className="px-4 py-2 rounded-xl font-bold text-sm inline-block" style={{
                          background: 'rgba(250, 204, 21, 0.2)',
                          color: '#facc15',
                          border: '1px solid rgba(250, 204, 21, 0.3)'
                        }}>
                          🎮 Сервер {post.server}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(250, 204, 21, 0.1)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{
                          background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                          color: '#000'
                        }}>
                          {post.username[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-yellow-400">{post.username}</span>
                      </div>
                      <div className="text-gray-500 text-xs">{formatDate(post.created_at)}</div>
                    </div>

                    <p className="text-gray-200 leading-relaxed mb-4 whitespace-pre-wrap">{post.text}</p>

                    <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid rgba(250, 204, 21, 0.1)' }}>
                      <button onClick={() => toggleLike(post.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-110" style={{
                        background: post.likes.includes(user?.id) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: post.likes.includes(user?.id) ? '#ef4444' : '#9ca3af'
                      }}>
                        <Heart size={18} fill={post.likes.includes(user?.id) ? 'currentColor' : 'none'} />
                        <span className="text-sm font-bold">{post.likes.length}</span>
                      </button>
                      <button onClick={() => setOpenComments(openComments === post.id ? null : post.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-110" style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6'
                      }}>
                        <MessageCircle size={18} />
                        <span className="text-sm font-bold">{post.comments.length}</span>
                      </button>
                    </div>

                    {openComments === post.id && (
                      <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(250, 204, 21, 0.1)' }}>
                        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                          {post.comments.map((c) => (
                            <div key={c.id} className="p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <span className="font-bold text-yellow-400">{c.username}</span>
                              <p className="text-gray-300 text-sm mt-1">{c.text}</p>
                            </div>
                          ))}
                        </div>
                        {user && (
                          <div className="flex gap-2">
                            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Коментар..." className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none" style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(250, 204, 21, 0.2)'
                            }} />
                            <button onClick={() => { addComment(post.id); setCommentText(''); }} className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{
                              background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                              color: '#000'
                            }}>
                              Відправити
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {page === 'submit' && (
        <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
          <h2 className="text-4xl font-black text-yellow-400 mb-12 text-center">📝 Надіслати Новину</h2>

          {!user ? (
            <div className="p-8 rounded-3xl text-center" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <AlertCircle size={48} className="mx-auto mb-4 text-yellow-400" />
              <p className="text-gray-300 text-lg mb-6">Авторизуйтесь</p>
              <button onClick={() => setShowAuth('login')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl">Увійти</button>
            </div>
          ) : (
            <div className="space-y-6 p-8 rounded-3xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              {postError && <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">{postError}</div>}

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3">ОБЕРІТЬ СЕРВЕР</label>
                <div className="grid grid-cols-3 gap-2">
                  {['01', '02', '03', '04', '05', 'ALL'].map(srv => (
                    <button key={srv} onClick={() => setPostServer(srv)} className={`py-2 rounded font-bold ${postServer === srv ? 'bg-yellow-500 text-black' : 'text-white'}`} style={postServer !== srv ? { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' } : {}}>
                      {srv === 'ALL' ? '🌐' : srv}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3">ТЕКСТ</label>
                <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Напиши новину..." className="w-full px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 resize-none h-40 outline-none" />
                <p className="text-xs text-gray-400 mt-2">{postText.length} символів</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3">ФОТО</label>
                <label className="flex items-center justify-center gap-2 px-6 py-8 rounded border-2 border-dashed border-gray-600 hover:border-yellow-500 cursor-pointer transition">
                  <Upload size={24} />
                  <span>Вибір фото</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
                {postPhotoPreview && (
                  <div className="mt-4 relative">
                    <img src={postPhotoPreview} alt="Preview" className="w-full rounded max-h-80 object-cover" />
                    <button onClick={() => setPostPhotoPreview('')} className="absolute top-2 right-2 bg-red-600 p-2 rounded">
