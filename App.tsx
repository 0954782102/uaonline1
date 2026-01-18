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
  const [postPhoto, setPostPhoto] = useState(null);
  const [postPhotoPreview, setPostPhotoPreview] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  const [openComments, setOpenComments] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sutnist_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    loadPosts();
  }, []);

  const getUsers = () => JSON.parse(localStorage.getItem('sutnist_users') || '{}');
  const saveUsers = (users) => localStorage.setItem('sutnist_users', JSON.stringify(users));
  const getPosts = () => JSON.parse(localStorage.getItem('sutnist_posts') || '[]');
  const savePosts = (posts) => localStorage.setItem('sutnist_posts', JSON.stringify(posts));

  const loadPosts = () => {
    setLoading(true);
    setTimeout(() => {
      const allPosts = getPosts();
      setPosts(allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    }, 300);
  };

  const handleRegister = () => {
    setRegError('');
    if (!regUsername || !regFirstName || !regPassword) {
      setRegError('Заповніть всі поля');
      return;
    }

    const users = getUsers();
    if (users[regUsername.toLowerCase()]) {
      setRegError('Цей логін вже занятий');
      return;
    }

    const userId = Date.now();
    users[regUsername.toLowerCase()] = {
      id: userId,
      username: regUsername.toLowerCase(),
      first_name: regFirstName,
      password: regPassword
    };

    saveUsers(users);
    const newUser = {
      id: userId,
      username: regUsername.toLowerCase(),
      first_name: regFirstName
    };
    setUser(newUser);
    localStorage.setItem('sutnist_user', JSON.stringify(newUser));
    setShowAuth(null);
    setRegUsername('');
    setRegFirstName('');
    setRegPassword('');
  };

  const handleLogin = () => {
    setRegError('');
    if (!regUsername || !regPassword) {
      setRegError('Введіть логін та пароль');
      return;
    }

    const users = getUsers();
    const userKey = regUsername.toLowerCase();

    if (!users[userKey] || users[userKey].password !== regPassword) {
      setRegError('Невірний логін/пароль');
      return;
    }

    const userData = users[userKey];
    const newUser = {
      id: userData.id,
      username: userData.username,
      first_name: userData.first_name
    };
    setUser(newUser);
    localStorage.setItem('sutnist_user', JSON.stringify(newUser));
    setShowAuth(null);
    setRegUsername('');
    setRegPassword('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => setPostPhotoPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPost = () => {
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

    const allPosts = getPosts();
    allPosts.push(newPost);
    savePosts(allPosts);

    alert('✅ Пост опублікований!');
    setPostText('');
    setPostPhoto(null);
    setPostPhotoPreview('');
    setPostServer('01');
    setPage('posts');
    loadPosts();
    setPostSubmitting(false);
  };

  const toggleLike = (postId) => {
    if (!user) {
      setRegError('Авторизуйтесь!');
      return;
    }

    const allPosts = getPosts();
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    if (post.likes.includes(user.id)) {
      post.likes = post.likes.filter(id => id !== user.id);
    } else {
      post.likes.push(user.id);
    }

    savePosts(allPosts);
    loadPosts();
  };

  const addComment = (postId) => {
    if (!user || !commentText.trim()) return;

    const allPosts = getPosts();
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
      id: Date.now(),
      user_id: user.id,
      username: user.username,
      text: commentText,
      created_at: new Date().toISOString()
    };

    post.comments.push(newComment);
    savePosts(allPosts);
    setCommentText('');
    loadPosts();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sutnist_user');
    setPage('home');
  };

  const filteredPosts = filterServer === 'ALL' 
    ? posts 
    : posts.filter(p => p.server === filterServer);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-900 text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
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

        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-xl font-bold">
            <button onClick={() => { setPage('home'); setMenuOpen(false); }} className="flex items-center gap-4 text-white">
              <Home /> Головна
            </button>
            <button onClick={() => { setPage('posts'); setMenuOpen(false); }} className="flex items-center gap-4 text-white">
              <Newspaper /> Новини
            </button>
            {user && (
              <button onClick={() => { setPage('submit'); setMenuOpen(false); }} className="flex items-center gap-4 text-yellow-400">
                <Zap /> Надіслати
              </button>
            )}
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-4 text-red-500">
                <LogOut /> Вийти
              </button>
            ) : (
              <button onClick={() => { setShowAuth('login'); setMenuOpen(false); }} className="flex items-center gap-4 text-yellow-500">
                <LogIn /> Увійти
              </button>
            )}
          </div>
        </div>
      )}

      {page === 'home' && (
        <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8">
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
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-yellow-400">📰 Новини</h2>
            <button onClick={loadPosts} className="px-4 py-2 rounded-xl border transition flex items-center gap-2" style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}>
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
                <div key={post.id} className="rounded-3xl overflow-hidden transition-all group hover:scale-[1.02]" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {post.photo_url && (
                    <div className="relative h-64 overflow-hidden">
                      <img src={post.photo_url} alt="Post" className="w-full h-full object-cover" />
                      <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-lg font-bold text-sm">🎮 {post.server}</div>
                    </div>
                  )}

                  <div className="p-6">
                    {!post.photo_url && (
                      <div className="mb-4">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg font-bold text-sm inline-block">🎮 {post.server}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <span className="font-bold text-yellow-400">{post.username}</span>
                      <div className="text-gray-500 text-xs">{formatDate(post.created_at)}</div>
                    </div>

                    <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">{post.text}</p>

                    <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition">
                        <Heart size={18} fill={post.likes.includes(user?.id) ? 'currentColor' : 'none'} />
                        <span className="text-sm">{post.likes.length}</span>
                      </button>
                      <button onClick={() => setOpenComments(openComments === post.id ? null : post.id)} className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition">
                        <MessageCircle size={18} />
                        <span className="text-sm">{post.comments.length}</span>
                      </button>
                    </div>

                    {openComments === post.id && (
                      <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                          {post.comments.map((c) => (
                            <div key={c.id} className="text-sm">
                              <span className="font-bold text-yellow-400">{c.username}</span>
                              <p className="text-gray-300">{c.text}</p>
                            </div>
                          ))}
                        </div>
                        {user && (
                          <div className="flex gap-2">
                            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Коментар..." className="flex-1 px-3 py-2 rounded-lg text-black text-sm border-0 outline-none" />
                            <button onClick={() => { addComment(post.id); setCommentText(''); }} className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-bold text-sm hover:bg-yellow-400">Відправити</button>
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
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h2 className="text-4xl font-black text-yellow-400 mb-12 text-center">📝 Надіслати Новину</h2>

          {!user ? (
            <div className="p-8 rounded-3xl text-center" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <AlertCircle size={48} className="mx-auto mb-4 text-yellow-400" />
              <p className="text-gray-300 text-lg mb-6">Авторизуйтесь</p>
              <button onClick={() => setShowAuth('login')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl">Увійти</button>
            </div>
          ) : (
            <div className="space-y-6" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '32px', borderRadius: '24px' }}>
              {postError && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">
                  {postError}
                </div>
              )}

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
                <label className="block text-sm font-bold text-gray-400 mb-3">ТЕКСТ (МІНІМУМ 10 СИМВОЛІВ)</label>
                <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Напиши новину..." className="w-full px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 resize-none h-40 outline-none" />
                <p className="text-xs text-gray-400 mt-2">{postText.length} символів</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3">ФОТО (ОПЦІОНАЛЬНО)</label>
                <label className="flex items-center justify-center gap-2 px-6 py-8 rounded border-2 border-dashed border-gray-600 hover:border-yellow-500 cursor-pointer transition">
                  <Upload size={24} />
                  <span>Вибір фото</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
                {postPhotoPreview && (
                  <div className="mt-4 relative">
                    <img src={postPhotoPreview} alt="Preview" className="w-full rounded max-h-80 object-cover" />
                    <button onClick={() => { setPostPhoto(null); setPostPhotoPreview(''); }} className="absolute top-2 right-2 bg-red-600 p-2 rounded">
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>

              <button onClick={handleSubmitPost} disabled={postSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold py-3 rounded">
                {postSubmitting ? 'Публікується...' : '✅ ОПУБЛІКУВАТИ'}
              </button>
            </div>
          )}
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md space-y-6 relative">
            <button onClick={() => setShowAuth(null)} className="absolute top-4 right-4 hover:bg-gray-700 p-2 rounded">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-black">{showAuth === 'login' ? 'Вхід' : 'Реєстрація'}</h2>

            {regError && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                {regError}
              </div>
            )}

            <div className="space-y-4">
              {showAuth === 'register' && (
                <div>
                  <label className="block text-sm font-bold mb-2">Ім'я</label>
                  <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} placeholder="Ваше ім'я" className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 outline-none" />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2">Логін</label>
                <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="Ваш нік" className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Пароль</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Пароль" className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 outline-none" />
              </div>

              <button onClick={showAuth === 'login' ? handleLogin : handleRegister} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded">
                {showAuth === 'login' ? 'Увійти' : 'Зареєструватися'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-400">
              {showAuth === 'login' ? (
                <p>Ще немає? <button onClick={() => { setShowAuth('register'); setRegError(''); }} className="text-yellow-400 font-bold">Реєстр</button></p>
              ) : (
                <p>Вже є? <button onClick={() => { setShowAuth('login'); setRegError(''); }} className="text-yellow-400 font-bold">Вхід</button></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
