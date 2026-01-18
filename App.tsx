import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Home, Newspaper, Zap, Menu, X, Heart, MessageCircle, Upload, AlertCircle, RefreshCw } from 'lucide-react';

interface User {
  id: number;
  username: string;
  first_name: string;
}

interface Post {
  id: number;
  server: string;
  text: string;
  username: string;
  created_at: string;
  photo_url?: string;
  likes: number;
  comments: number;
}

const App: React.FC = () => {
  const API_URL = 'https://artem324.pythonanywhere.com';

  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<'home' | 'posts' | 'submit'>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterServer, setFilterServer] = useState('ALL');

  // Auth
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [regUsername, setRegUsername] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Submit post
  const [postServer, setPostServer] = useState('01');
  const [postText, setPostText] = useState('');
  const [postPhoto, setPostPhoto] = useState<File | null>(null);
  const [postPhotoPreview, setPostPhotoPreview] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sutnist_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts`);
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts.sort((a: Post, b: Post) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
    } catch (err) {
      console.error('Помилка:', err);
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
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.toLowerCase().trim(),
          first_name: regFirstName.trim(),
          password: regPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        const newUser: User = {
          id: data.user_id,
          username: regUsername.toLowerCase().trim(),
          first_name: regFirstName.trim()
        };
        setUser(newUser);
        localStorage.setItem('sutnist_user', JSON.stringify(newUser));
        setShowAuth(null);
        setRegUsername('');
        setRegFirstName('');
        setRegPassword('');
      } else {
        setRegError(data.message || 'Помилка');
      }
    } catch (err) {
      setRegError('Помилка підключення');
    }
  };

  const handleLogin = async () => {
    setRegError('');
    if (!regUsername || !regPassword) {
      setRegError('Введіть логін та пароль');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.toLowerCase().trim(),
          password: regPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        const newUser: User = {
          id: data.user_id,
          username: data.username,
          first_name: data.first_name
        };
        setUser(newUser);
        localStorage.setItem('sutnist_user', JSON.stringify(newUser));
        setShowAuth(null);
        setRegUsername('');
        setRegPassword('');
      } else {
        setRegError(data.message || 'Невірний логін/пароль');
      }
    } catch (err) {
      setRegError('Помилка підключення');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPostPhotoPreview(e.target?.result as string);
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

    try {
      const formData = new FormData();
      formData.append('user_id', user.id.toString());
      formData.append('username', user.username);
      formData.append('first_name', user.first_name);
      formData.append('server', postServer);
      formData.append('text', postText.trim());
      if (postPhoto) {
        formData.append('photo', postPhoto);
      }

      const res = await fetch(`${API_URL}/api/submit-post`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ Новину відправлено на модерацію!');
        setPostText('');
        setPostPhoto(null);
        setPostPhotoPreview('');
        setPostServer('01');
        setPage('posts');
        setTimeout(() => loadPosts(), 500);
      } else {
        setPostError(data.message || 'Помилка');
      }
    } catch (err) {
      setPostError('Помилка підключення');
    }

    setPostSubmitting(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sutnist_user');
    setPage('home');
  };

  const filteredPosts = filterServer === 'ALL' 
    ? posts 
    : posts.filter(p => p.server === filterServer);

  const formatDate = (dateStr: string) => {
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded text-sm">UA</div>
            <h1 className="text-2xl font-black">Сутність UA</h1>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setPage('home')}
              className={`px-4 py-2 rounded ${page === 'home' ? 'bg-yellow-500 text-black' : 'hover:bg-gray-700'}`}
            >
              Головна
            </button>
            <button
              onClick={() => setPage('posts')}
              className={`px-4 py-2 rounded ${page === 'posts' ? 'bg-yellow-500 text-black' : 'hover:bg-gray-700'}`}
            >
              Новини
            </button>
            {user && (
              <button
                onClick={() => setPage('submit')}
                className={`px-4 py-2 rounded ${page === 'submit' ? 'bg-yellow-500 text-black' : 'hover:bg-gray-700'}`}
              >
                Надіслати
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-4 ml-6 pl-6 border-l border-gray-700">
                <span className="text-sm font-bold text-yellow-400">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                >
                  Вийти
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth('login')}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded"
              >
                Увійти
              </button>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <button onClick={() => { setPage('home'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded">
              Головна
            </button>
            <button onClick={() => { setPage('posts'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded">
              Новини
            </button>
            {user && (
              <button onClick={() => { setPage('submit'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded">
                Надіслати
              </button>
            )}
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 rounded">
                Вийти
              </button>
            ) : (
              <button onClick={() => { setShowAuth('login'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-yellow-400 hover:bg-gray-700 rounded">
                Увійти
              </button>
            )}
          </div>
        )}
      </nav>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {page === 'home' && (
          <div className="text-center space-y-8">
            <h2 className="text-6xl font-black">🎄 СВЯТКОВА СУТНІСТЬ</h2>
            <p className="text-xl text-gray-400">Офіційний портал спільноти UA ONLINE 2025</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://t.me/sutnistua" target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded font-bold">
                Наш Канал
              </a>
              <button onClick={() => setPage('posts')} className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded font-bold">
                Переглянути Новини
              </button>
              {!user && (
                <button onClick={() => setShowAuth('register')} className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded font-bold">
                  Реєстрація
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">📝 Як це працює</h3>
                <ol className="text-left text-gray-300 space-y-2">
                  <li>1. Реєструйся на сайті</li>
                  <li>2. Перейди на "Надіслати"</li>
                  <li>3. Напиши новину</li>
                  <li>4. Адміни перевіряють</li>
                  <li>5. Опублікується у каналі</li>
                </ol>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">💬 Обговорення</h3>
                <p className="text-gray-300">Лайкай та коментуй новини!</p>
              </div>
            </div>
          </div>
        )}

        {page === 'posts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-4xl font-black">📰 Новини</h2>
              <button onClick={loadPosts} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2">
                <RefreshCw size={18} /> Оновити
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {['ALL', '01', '02', '03', '04', '05'].map((srv) => (
                <button
                  key={srv}
                  onClick={() => setFilterServer(srv)}
                  className={`px-4 py-2 rounded font-bold ${filterServer === srv ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {srv === 'ALL' ? '🌐 Всі' : `🎮 ${srv}`}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">⏳ Завантаження...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Поки немає новин 📭</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    {post.photo_url && (
                      <img src={post.photo_url} alt="Post" className="w-full h-64 object-cover" />
                    )}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded font-bold text-sm">
                          🎮 Сервер {post.server}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
                      </div>
                      <div className="border-t border-gray-700 pt-4">
                        <p className="text-sm text-gray-300 mb-2">👤 <span className="font-bold text-yellow-400">{post.username}</span></p>
                        <p className="text-white whitespace-pre-wrap">{post.text}</p>
                      </div>
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-700">
                        <button className="flex items-center gap-2 text-gray-400 hover:text-red-500">
                          <Heart size={20} />
                          <span className="text-sm">{post.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500">
                          <MessageCircle size={20} />
                          <span className="text-sm">{post.comments || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {page === 'submit' && (
          <div className="max-w-2xl mx-auto">
            {!user ? (
              <div className="bg-gray-800 p-8 rounded-lg text-center space-y-4">
                <AlertCircle size={48} className="mx-auto text-yellow-500" />
                <p className="text-lg">Авторизуйтесь, щоб надіслати новину</p>
                <button onClick={() => setShowAuth('login')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded">
                  Увійти
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 p-8 rounded-lg space-y-6">
                <h2 className="text-3xl font-black">📝 Надіслати Новину</h2>

                {postError && (
                  <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded flex items-center gap-2">
                    <AlertCircle size={20} />
                    {postError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold mb-3">Оберіть сервер</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['01', '02', '03', '04', '05', 'ALL'].map((srv) => (
                      <button
                        key={srv}
                        onClick={() => setPostServer(srv)}
                        className={`py-2 rounded font-bold ${postServer === srv ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                      >
                        {srv === 'ALL' ? '🌐 Всі' : `🎮 ${srv}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">Текст новини (мінімум 10 символів)</label>
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Напиши цікаву новину..."
                    className="w-full px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 resize-none h-40"
                  />
                  <p className="text-xs text-gray-400 mt-2">{postText.length} символів</p>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">Фото (опціонально)</label>
                  <label className="flex items-center justify-center gap-2 px-6 py-8 rounded border-2 border-dashed border-gray-600 hover:border-yellow-500 cursor-pointer">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-gray-300">Натисніть для вибору фото</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                  {postPhotoPreview && (
                    <div className="mt-4 relative">
                      <img src={postPhotoPreview} alt="Preview" className="w-full rounded max-h-96 object-cover" />
                      <button
                        onClick={() => { setPostPhoto(null); setPostPhotoPreview(''); }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmitPost}
                  disabled={postSubmitting}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold py-3 rounded"
                >
                  {postSubmitting ? '⏳ Відправляється...' : '✅ НАДІСЛАТИ'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md space-y-6 relative">
            <button onClick={() => setShowAuth(null)} className="absolute top-4 right-4 hover:bg-gray-700 p-2 rounded">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-black">
              {showAuth === 'login' ? 'Вхід' : 'Реєстрація'}
            </h2>

            {regError && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded flex items-center gap-2">
                <AlertCircle size={20} />
                {regError}
              </div>
            )}

            <div className="space-y-4">
              {showAuth === 'register' && (
                <div>
                  <label className="block text-sm font-bold mb-2">Ім'я</label>
                  <input
                    type="text"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Ваше ім'я"
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2">Логін</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Ваш нік"
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Пароль</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Ваш пароль"
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <button
                onClick={showAuth === 'login' ? handleLogin : handleRegister}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded"
              >
                {showAuth === 'login' ? 'Увійти' : 'Зареєструватися'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-400">
              {showAuth === 'login' ? (
                <p>
                  Ще немає акаунту?{' '}
                  <button onClick={() => { setShowAuth('register'); setRegError(''); }} className="text-yellow-400 hover:underline font-bold">
                    Зареєструватися
                  </button>
                </p>
              ) : (
                <p>
                  Вже є акаунт?{' '}
                  <button onClick={() => { setShowAuth('login'); setRegError(''); }} className="text-yellow-400 hover:underline font-bold">
                    Увійти
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
