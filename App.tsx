import React, { useState, useEffect } from 'react';
import { 
  LogIn, LogOut, UserPlus, CheckCircle, Home, Zap, Menu, X, Star, Users, Info, 
  Newspaper, Clock, RefreshCw, Heart, MessageCircle, Share2, Upload, AlertCircle
} from 'lucide-react';

const API_BASE = 'https://artem324.pythonanywhere.com/api';

interface User {
  id: number;
  username: string;
  first_name: string;
  isAdmin: boolean;
  adminLevel: number;
}

interface Post {
  id: number;
  server: string;
  text: string;
  user_id: number;
  username: string;
  created_at: string;
  channel_link: string;
  photo_url?: string;
  status: string;
  likes: number;
  comments: number;
}

interface Comment {
  id: number;
  user_id: number;
  username: string;
  text: string;
  created_at: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'posts' | 'submit'>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterServer, setFilterServer] = useState<string>('ALL');
  
  // Auth
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Submit post
  const [selectedServer, setSelectedServer] = useState('01');
  const [postText, setPostText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comments
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [comments, setComments] = useState<{[key: number]: Comment[]}>({});
  const [commentText, setCommentText] = useState('');
  const [userLikes, setUserLikes] = useState<number[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('sutnist_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('sutnist_user');
      }
    }
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/posts`);
      const data = await response.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Помилка завантаження постів:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !firstName || !password) {
      setError('Заповніть всі поля!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, first_name: firstName, password })
      });
      
      const data = await response.json();
      if (data.success) {
        const newUser: User = {
          id: data.user_id,
          username,
          first_name: firstName,
          isAdmin: false,
          adminLevel: 0
        };
        setUser(newUser);
        localStorage.setItem('sutnist_user', JSON.stringify(newUser));
        setShowAuthModal(null);
        setUsername('');
        setFirstName('');
        setPassword('');
      } else {
        setError(data.message || 'Помилка реєстрації');
      }
    } catch (err) {
      setError('Помилка підключення');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (data.success) {
        const loggedUser: User = {
          id: data.user_id,
          username: data.username,
          first_name: data.first_name,
          isAdmin: data.is_admin,
          adminLevel: data.admin_level || 0
        };
        setUser(loggedUser);
        localStorage.setItem('sutnist_user', JSON.stringify(loggedUser));
        setShowAuthModal(null);
        setUsername('');
        setPassword('');
      } else {
        setError(data.message || 'Невірний логін/пароль');
      }
    } catch (err) {
      setError('Помилка підключення');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sutnist_user');
    setCurrentPage('home');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Ви не авторизовані!');
      return;
    }

    if (!postText || postText.length < 10) {
      setError('Мінімум 10 символів!');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', user.id.toString());
      formData.append('username', user.username);
      formData.append('first_name', user.first_name);
      formData.append('server', selectedServer);
      formData.append('text', postText);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await fetch(`${API_BASE}/submit-post`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setPostText('');
        setPhotoFile(null);
        setPhotoPreview('');
        setError('');
        alert('✅ Новину відправлено на модерацію!');
        setCurrentPage('posts');
        loadPosts();
      } else {
        setError(data.message || 'Помилка відправки');
      }
    } catch (err) {
      setError('Помилка підключення');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId: number) => {
    if (!user) {
      setError('Авторизуйтесь!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/like-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_id: user.id })
      });

      const data = await response.json();
      if (data.success) {
        const newLikes = userLikes.includes(postId)
          ? userLikes.filter(id => id !== postId)
          : [...userLikes, postId];
        setUserLikes(newLikes);
        loadPosts();
      }
    } catch (err) {
      console.error('Помилка лайку:', err);
    }
  };

  const addComment = async (postId: number) => {
    if (!user || !commentText.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/add-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          user_id: user.id,
          username: user.username,
          text: commentText
        })
      });

      const data = await response.json();
      if (data.success) {
        setCommentText('');
        loadPosts();
      }
    } catch (err) {
      console.error('Помилка коментаря:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPosts = filterServer === 'ALL' 
    ? posts 
    : posts.filter(p => p.server === filterServer);

  return (
    <div className="min-h-screen pb-20" style={{ fontFamily: "'Montserrat', sans-serif", backgroundColor: '#050b18', color: 'white' }}>
      {/* Сніжинки */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-10">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-80"
            style={{
              width: Math.random() * 5 + 2 + 'px',
              height: Math.random() * 5 + 2 + 'px',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 3 + 2 + 's',
              animationDelay: Math.random() * 2 + 's',
              animation: 'fall linear infinite'
            }}
          />
        ))}
      </div>

      {/* Гірлянди */}
      <div className="fixed top-0 left-0 w-full flex justify-around pointer-events-none z-20">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${i % 2 === 0 ? 'bg-red-500 shadow-red-500' : 'bg-yellow-400 shadow-yellow-400'}`} 
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* Навігація */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-black font-black px-2 py-1 rounded-lg text-sm">UA</div>
          <h1 className="text-xl font-black tracking-tighter uppercase" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>Сутність UA</h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setCurrentPage('home')}
            className={`flex items-center gap-2 transition ${currentPage === 'home' ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
          >
            <Home size={18} /> Головна
          </button>
          <button 
            onClick={() => setCurrentPage('posts')}
            className={`flex items-center gap-2 transition ${currentPage === 'posts' ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
          >
            <Newspaper size={18} /> Новини
          </button>
          {user && (
            <button 
              onClick={() => setCurrentPage('submit')}
              className={`flex items-center gap-2 transition ${currentPage === 'submit' ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
            >
              <Zap size={18} /> Надіслати
            </button>
          )}
          <a href="https://t.me/sutnistua" target="_blank" rel="noopener" className="flex items-center gap-2 text-gray-300 hover:text-yellow-400">
            <Zap size={18} /> Канал
          </a>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-yellow-500 flex items-center gap-1">
                <CheckCircle size={14} /> {user.username}
              </span>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 rounded-xl border transition"
                style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal('login')} 
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-xl transition flex items-center gap-2"
            >
              <LogIn size={18} /> Увійти
            </button>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Мобільне меню */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-xl font-bold">
            <button onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }} className="flex items-center gap-4 text-white">
              <Home /> Головна
            </button>
            <button onClick={() => { setCurrentPage('posts'); setIsMenuOpen(false); }} className="flex items-center gap-4 text-white">
              <Newspaper /> Новини
            </button>
            {user && (
              <button onClick={() => { setCurrentPage('submit'); setIsMenuOpen(false); }} className="flex items-center gap-4 text-yellow-400">
                <Zap /> Надіслати новину
              </button>
            )}
            <a href="https://t.me/sutnistua" target="_blank" rel="noopener" className="flex items-center gap-4 text-white">
              <Zap /> Канал
            </a>
            {user ? (
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center gap-4 text-red-500">
                <LogOut /> Вийти
              </button>
            ) : (
              <button onClick={() => { setShowAuthModal('login'); setIsMenuOpen(false); }} className="flex items-center gap-4 text-yellow-500">
                <LogIn /> Увійти
              </button>
            )}
          </div>
        </div>
      )}

      {/* ГОЛОВНА */}
      {currentPage === 'home' && (
        <>
          <header className="pt-16 pb-12 px-6 text-center" style={{ background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.3) 0%, rgba(5, 11, 24, 0) 70%)' }}>
            <div className="max-w-4xl mx-auto relative">
              <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                СВЯТКОВА <span className="text-yellow-400" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>СУТНІСТЬ</span>
                <br />
                <span className="text-3xl md:text-5xl">UA ONLINE 2025</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Офіційний портал спільноти. Надсилай новини через сайт, модератори перевіряють та публікують у каналі!
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="https://t.me/sutnistua" 
                  target="_blank" 
                  rel="noopener" 
                  className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition transform hover:scale-105"
                >
                  <Zap /> Наш Канал
                </a>
                <button 
                  onClick={() => setCurrentPage('posts')} 
                  className="px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition hover:bg-white/10 transform hover:scale-105"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                >
                  <Newspaper /> Переглянути Новини
                </button>
                {!user && (
                  <button 
                    onClick={() => setShowAuthModal('register')} 
                    className="px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition hover:bg-white/10 transform hover:scale-105"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                  >
                    <UserPlus /> Реєстрація
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-6 space-y-12">
            <section className="space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-3 justify-center mb-8">
                <Star className="text-yellow-400" /> Як працює сайт
              </h3>
              <div className="p-8 rounded-3xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <ol className="space-y-4 text-gray-300">
                  <li>✅ <strong>Реєстрація:</strong> Створи акаунт на сайті</li>
                  <li>📝 <strong>Новина:</strong> Перейди на вкладку "Надіслати" та напиши новину</li>
                  <li>👀 <strong>Модерація:</strong> Адміністратори перевірять твій контент</li>
                  <li>📺 <strong>Публікація:</strong> Схвалена новина з'явиться у каналі та на сайті</li>
                  <li>💬 <strong>Обговорення:</strong> Лайкай і коментуй новини на сайті</li>
                </ol>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              <div className="p-8 rounded-3xl transition-all group" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-blue-400 transition group-hover:scale-110" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Users size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3">Активна Спільнота</h4>
                <p className="text-gray-400 text-sm">Сутність UA — це місце, де кожен голос має значення. Приєднуйтесь до тисяч однодумців!</p>
              </div>

              <div className="p-8 rounded-3xl transition-all group" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-yellow-400 transition group-hover:scale-110" style={{ background: 'rgba(250, 204, 21, 0.2)' }}>
                  <Info size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3">Чесна Модерація</h4>
                <p className="text-gray-400 text-sm">Ми публікуємо найцікавіший контент та забезпечуємо чесну модерацію.</p>
              </div>
            </section>
          </main>
        </>
      )}

      {/* НОВИНИ */}
      {currentPage === 'posts' && (
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-3xl md:text-4xl font-black text-yellow-400" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>
              📰 Останні Новини
            </h2>
            <button 
              onClick={loadPosts}
              className="px-4 py-2 rounded-xl border transition flex items-center gap-2"
              style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}
            >
              <RefreshCw size={16} /> Оновити
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {['ALL', '01', '02', '03', '04', '05'].map(srv => (
              <button
                key={srv}
                onClick={() => setFilterServer(srv)}
                className={`px-4 py-2 rounded-xl font-bold transition ${
                  filterServer === srv
                    ? 'bg-yellow-500 text-black'
                    : 'text-white hover:bg-white/10'
                }`}
                style={filterServer !== srv ? { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' } : {}}
              >
                {srv === 'ALL' ? '🌐 Всі сервери' : `🎮 Сервер ${srv}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 rounded-3xl text-center" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <p className="text-gray-400 text-lg">Поки немає новин 📭</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPosts.map(post => (
                <div 
                  key={post.id}
                  className="rounded-3xl overflow-hidden transition-all group hover:scale-[1.02]"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  {post.photo_url && (
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={post.photo_url} 
                        alt="Post" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-lg font-bold text-sm">
                        🎮 Сервер {post.server}
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {!post.photo_url && (
                      <div className="mb-4">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg font-bold text-sm inline-block">
                          🎮 Сервер {post.server}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <UserIcon size={14} />
                        <span>{post.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Clock size={14} />
                        {formatDate(post.created_at)}
                      </div>
                    </div>

                    <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.text}
                    </p>

                    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition">
                          <Heart size={18} fill={userLikes.includes(post.id) ? 'currentColor' : 'none'} />
                          <span className="text-sm">{post.likes}</span>
                        </button>
                        <button onClick={() => setOpenComments(openComments === post.id ? null : post.id)} className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition">
                          <MessageCircle size={18} />
                          <span className="text-sm">{post.comments}</span>
                        </button>
                      </div>
                      <a
                        href={post.channel_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl border transition flex items-center gap-2 text-sm font-bold"
                        style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}
                      >
                        <Zap size={14} /> Канал
                      </a>
                    </div>

                    {openComments === post.id && (
                      <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                          {comments[post.id]?.map(c => (
                            <div key={c.id} className="text-sm">
                              <span className="font-bold text-yellow-400">{c.username}</span>
                              <p className="text-gray-300">{c.text}</p>
                            </div>
                          ))}
                        </div>
                        {user && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Коментар..."
                              className="flex-1 px-3 py-2 rounded-lg text-black text-sm"
                            />
                            <button
                              onClick={() => { addComment(post.id); setCommentText(''); }}
                              className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-bold text-sm"
                            >
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

      {/* НАДІСЛАТИ НОВИНУ */}
      {currentPage === 'submit' && (
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h2 className="text-4xl font-black text-yellow-400 mb-12 text-center" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>
            📝 Надіслати Новину
          </h2>

          {!user ? (
            <div className="p-8 rounded-3xl text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <AlertCircle size={48} className="mx-auto mb-4 text-yellow-400" />
              <p className="text-gray-300 text-lg mb-6">Авторизуйтесь, щоб надіслати новину</p>
              <button
                onClick={() => setShowAuthModal('login')}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl"
              >
                Увійти
              </button>
            </div>
          ) : (
            <form onSubmit={submitPost} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 flex items-center gap-2">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              {/* Сервер */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase">Оберіть сервер</label>
                <div className="grid grid-cols-3 gap-2">
                  {['01', '02', '03', '04', '05', 'ALL'].map(srv => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setSelectedServer(srv)}
                      className={`py-3 rounded-xl font-bold transition ${
                        selectedServer === srv
                          ? 'bg-yellow-500 text-black'
                          : 'text-white hover:bg-white/10'
                      }`}
                      style={selectedServer !== srv ? { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' } : {}}
                    >
                      {srv === 'ALL' ? '🌐 Всі' : `🎮 ${srv}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Текст */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase">Текст новини (мінімум 10 символів)</label>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Напиши цікаву новину для спільноти..."
                  className="w-full px-6 py-4 rounded-2xl outline-none transition text-black resize-none h-40"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">{postText.length} символів</p>
              </div>

              {/* Фото */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase">Фото (опціонально)</label>
                <label className="flex items-center justify-center gap-3 px-6 py-8 rounded-2xl cursor-pointer transition hover:bg-white/10" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px dashed rgba(255, 255, 255, 0.2)' }}>
                  <Upload size={24} className="text-yellow-400" />
                  <span className="text-gray-300">Натисніть для вибору фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <div className="mt-4 relative">
                    <img src={photoPreview} alt="Preview" className="w-full rounded-2xl max-h-96 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 p-2 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* Кнопка */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-black py-4 rounded-2xl transition transform hover:-translate-y-1"
                style={{ boxShadow: '0 20px 40px rgba(250, 204, 21, 0.2)' }}
              >
                {submitting ? '⏳ Відправляється...' : '✅ НАДІСЛАТИ НОВИНУ'}
              </button>

              <div className="p-4 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <p className="text-sm text-blue-300">
                  ℹ️ Твоя новина буде відправлена на модерацію адміністраторам. Вони перевірять контент і опублікують у каналі та на сайті.
                </p>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Модалка авторизації */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)' }}>
          <div className="w-full max-w-md p-8 rounded-[40px] relative" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
            <button onClick={() => setShowAuthModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
              <X />
            </button>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <h2 className="text-3xl font-black mb-6 text-center uppercase tracking-tighter">
              {showAuthModal === 'login' ? 'Вхід в систему' : 'Реєстрація'}
            </h2>

            <form onSubmit={showAuthModal === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {showAuthModal === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-4">Ім'я</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 rounded-2xl outline-none transition text-black"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    placeholder="Ваше ім'я..."
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-4">Логін (нік)</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 rounded-2xl outline-none transition text-black"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  placeholder="Введіть ваш нік..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-4">Пароль</label>
                <input 
                  type="password" 
                  className="w-full px-6 py-4 rounded-2xl outline-none transition text-black"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition transform hover:-translate-y-1"
                style={{ boxShadow: '0 20px 40px rgba(250, 204, 21, 0.2)' }}
              >
                {showAuthModal === 'login' ? 'УВІЙТИ' : 'ЗАРЕЄСТРУВАТИСЯ'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              {showAuthModal === 'login' ? (
                <p>Ще немає акаунту? <button onClick={() => { setShowAuthModal('register'); setError(''); }} className="text-yellow-500 font-bold hover:underline">Створити</button></p>
              ) : (
                <p>Вже є акаунт? <button onClick={() => { setShowAuthModal('login'); setError(''); }} className="text-yellow-500 font-bold hover:underline">Увійти</button></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Футер */}
      <footer className="mt-20 py-12 px-6 text-center text-gray-500 text-sm" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          <a href="https://t.me/sutnistua" target="_blank" rel="noopener" className="hover:text-white transition">Telegram</a>
          <a href="https://t.me/temka_offical_bot" target="_blank" rel="noopener" className="hover:text-white transition">Бот</a>
          <a href="#" className="hover:text-white transition">Підтримка</a>
        </div>
        <p>&copy; 2024-2025 Сутність UA Online. Всі права захищені.</p>
        <p className="mt-2 text-xs opacity-50 uppercase tracking-widest font-bold">Зроблено з любов'ю до спільноти</p>
      </footer>

      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};

export default App;
