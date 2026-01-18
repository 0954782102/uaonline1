import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  LogOut, 
  UserPlus, 
  CheckCircle, 
  Home, 
  Zap,
  Menu,
  X,
  Star,
  Users,
  Info,
  Newspaper,
  Clock,
  User as UserIcon,
  RefreshCw,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';

interface User {
  username: string;
  isAdmin: boolean;
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
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'posts'>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterServer, setFilterServer] = useState<string>('ALL');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('sutnist_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      // ЗАМІНЬ НА СВІЙ URL З PYTHONANYWHERE!
      // Формат: https://ТвійЮзернейм.pythonanywhere.com/api/posts
      const API_URL = 'https://artem324.pythonanywhere.com/api/posts';
      
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
        console.log('✅ Пости завантажено:', data.length);
      } else {
        console.error('❌ Помилка API:', response.status);
        // Якщо API не працює - показуємо тестові пости
        setPosts([
          {
            id: 1,
            server: "05",
            text: "Привіт! Це тестовий пост. Коли бот запрацює, тут будуть справжні новини!",
            user_id: 123,
            username: "Система",
            created_at: new Date().toISOString(),
            channel_link: "https://t.me/sutnistua"
          }
        ]);
      }
    } catch (error) {
      console.error('❌ Помилка завантаження:', error);
      // Показуємо тестовий пост при помилці
      setPosts([
        {
          id: 1,
          server: "05",
          text: "Підключення до API... Перевірте налаштування.",
          user_id: 123,
          username: "Система",
          created_at: new Date().toISOString(),
          channel_link: "https://t.me/sutnistua"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Admin' && password === 'ArtemProcko') {
      const loggedUser = { username: 'Admin', isAdmin: true };
      setUser(loggedUser);
      localStorage.setItem('sutnist_user', JSON.stringify(loggedUser));
      setShowAuthModal(null);
    } else if (username && password) {
      const loggedUser = { username, isAdmin: false };
      setUser(loggedUser);
      localStorage.setItem('sutnist_user', JSON.stringify(loggedUser));
      setShowAuthModal(null);
    }
    setUsername('');
    setPassword('');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sutnist_user');
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
          <h1 className="text-xl font-black tracking-tighter uppercase" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>Сутність UA Online</h1>
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

      {/* ГОЛОВНА СТОРІНКА */}
      {currentPage === 'home' && (
        <>
          <header className="pt-16 pb-12 px-6 text-center" style={{ background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.3) 0%, rgba(5, 11, 24, 0) 70%)' }}>
            <div className="max-w-4xl mx-auto relative">
              <div className="absolute -top-10 -left-10 text-6xl opacity-20">❄️</div>
              <div className="absolute -top-10 -right-10 text-6xl opacity-20">🎄</div>
              
              <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                СВЯТКОВА <span className="text-yellow-400" style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>СУТНІСТЬ</span>
                <br />
                <span className="text-3xl md:text-5xl">UA ONLINE 2025</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Офіційний портал спільноти. Слідкуй за оновленнями в нашому Telegram та користуйся можливостями Truhan Furry Bot.
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
                <Star className="text-yellow-400" /> Наш Ексклюзивний Бот
              </h3>
              <div className="p-8 rounded-3xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-3xl">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">Truhan Furry Bot</h4>
                    <p className="text-gray-400">@temka_offical_bot</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">
                  Надсилайте новини через нашого бота! Модератори перевірять та опублікують ваш контент в каналі та на сайті.
                </p>
                <a 
                  href="https://t.me/temka_offical_bot" 
                  target="_blank" 
                  rel="noopener"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 transition"
                >
                  <Zap size={18} /> Відкрити бота
                </a>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              <div className="p-8 rounded-3xl transition-all group" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-blue-400 transition group-hover:scale-110" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Users size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3">Активна Спільнота</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Сутність UA — це більше ніж канал. Це місце, де кожен голос має значення. Приєднуйтесь до тисяч однодумців.
                </p>
              </div>

              <div className="p-8 rounded-3xl transition-all group" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-yellow-400 transition group-hover:scale-110" style={{ background: 'rgba(250, 204, 21, 0.2)' }}>
                  <Info size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3">Тільки Важливе</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Ми публікуємо найцікавіший контент, актуальні новини та забезпечуємо чесну модерацію через наш бот.
                </p>
              </div>
            </section>
          </main>
        </>
      )}

      {/* СТОРІНКА НОВИН */}
      {currentPage === 'posts' && (
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Заголовок */}
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

          {/* Фільтр серверів */}
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

          {/* Пости */}
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
                  {/* Фото (якщо є) */}
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

                  {/* Контент */}
                  <div className="p-6">
                    {/* Якщо немає фото - показуємо сервер тут */}
                    {!post.photo_url && (
                      <div className="mb-4">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg font-bold text-sm inline-block">
                          🎮 Сервер {post.server}
                        </span>
                      </div>
                    )}

                    {/* Автор та дата */}
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

                    {/* Текст */}
                    <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.text}
                    </p>

                    {/* Дії */}
                    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition">
                          <Heart size={18} />
                          <span className="text-sm">{Math.floor(Math.random() * 50)}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition">
                          <MessageCircle size={18} />
                          <span className="text-sm">{Math.floor(Math.random() * 20)}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-green-500 transition">
                          <Share2 size={18} />
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
                  </div>
                </div>
              ))}
            </div>
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
            <h2 className="text-3xl font-black mb-6 text-center uppercase tracking-tighter">
              {showAuthModal === 'login' ? 'Вхід в систему' : 'Реєстрація'}
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-4">Логін</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 rounded-2xl outline-none transition"
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
                  className="w-full px-6 py-4 rounded-2xl outline-none transition"
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
                <p>Ще немає аккаунту? <button onClick={() => setShowAuthModal('register')} className="text-yellow-500 font-bold hover:underline">Створити</button></p>
              ) : (
                <p>Вже є аккаунт? <button onClick={() => setShowAuthModal('login')} className="text-yellow-500 font-bold hover:underline">Увійти</button></p>
              )}
            </div>
            {showAuthModal === 'login' && (
              <p className="mt-4 text-[10px] text-gray-600 text-center italic">
                Для адмінів: Admin / ArtemProcko
              </p>
            )}
          </div>
        </div>
      )}

      {/* Футер */}
      <footer className="mt-20 py-12 px-6 text-center text-gray-500 text-sm" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="flex justify-center gap-6 mb-6">
          <a href="https://t.me/sutnistua" className="hover:text-white transition">Telegram</a>
          <a href="https://t.me/temka_offical_bot" className="hover:text-white transition">Бот</a>
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
