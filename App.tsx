import React, { useState, useEffect } from 'react';
import { User } from './types';
import Snowfall from './components/Snowfall';
import BotCard from './components/BotCard';
import PostsFeed from './components/PostsFeed';
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
  Newspaper
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'posts'>('home');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('sutnist_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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

  return (
    <div className="min-h-screen pb-20">
      <Snowfall />
      
      <div className="fixed top-0 left-0 w-full flex justify-around pointer-events-none z-20">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${i % 2 === 0 ? 'bg-red-500 shadow-red-500' : 'bg-yellow-400 shadow-yellow-400'}`} style={{ animationDelay: `${i * 0.2}s` }}></div>
        ))}
      </div>

      <nav className="sticky top-0 z-50 card-glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-black font-black px-2 py-1 rounded-lg text-sm tracking-tight">UA</div>
          <h1 className="text-xl font-black neon-yellow tracking-tighter uppercase">Сутність UA Online</h1>
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
              <span className="text-sm font-semibold text-yellow-500 flex items-center gap-1"><CheckCircle size={14} /> {user.username}</span>
              <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-4 py-2 rounded-xl border border-red-500/30 transition">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal('login')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-xl transition flex items-center gap-2">
              <LogIn size={18} /> Увійти
            </button>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-xl font-bold">
            <button onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }} className="flex items-center gap-4 text-white"> <Home /> Головна </button>
            <button onClick={() => { setCurrentPage('posts'); setIsMenuOpen(false); }} className="flex items-center gap-4 text-white"> <Newspaper /> Новини </button>
            <a href="https://t.me/sutnistua" target="_blank" rel="noopener" className="flex items-center gap-4 text-white"> <Zap /> Канал </a>
            {user ? (
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center gap-4 text-red-500"> <LogOut /> Вийти </button>
            ) : (
              <button onClick={() => { setShowAuthModal('login'); setIsMenuOpen(false); }} className="flex items-center gap-4 text-yellow-500"> <LogIn /> Увійти </button>
            )}
          </div>
        </div>
      )}

      {currentPage === 'home' && (
        <>
          <header className="hero-gradient pt-16 pb-12 px-6 text-center overflow-hidden">
            <div className="max-w-4xl mx-auto relative">
              <div className="absolute -top-10 -left-10 text-6xl opacity-20">❄️</div>
              <div className="absolute -top-10 -right-10 text-6xl opacity-20">🎄</div>
              
              <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                СВЯТКОВА <span className="text-yellow-400 neon-yellow">СУТНІСТЬ</span> <br />
                <span className="text-3xl md:text-5xl">UA ONLINE 2025</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Офіційний портал спільноти. Слідкуй за оновленнями в нашому Telegram та користуйся можливостями Truhan Furry Bot.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a href="https://t.me/sutnistua" target="_blank" rel="noopener" className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition transform hover:scale-105">
                  <Zap /> Наш Канал
                </a>
                <button onClick={() => setCurrentPage('posts')} className="card-glass border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition hover:bg-white/10 transform hover:scale-105">
                  <Newspaper /> Переглянути Новини
                </button>
                {!user && (
                  <button onClick={() => setShowAuthModal('register')} className="card-glass border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition hover:bg-white/10 transform hover:scale-105">
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
              <BotCard />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              <div className="card-glass p-8 rounded-[32px] border border-white/10 hover:border-blue-500/30 transition-all group">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition">
                  <Users size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3">Активна Спільнота</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Сутність UA — це більше ніж канал. Це місце, де кожен голос має значення. Приєднуйтесь до тисяч однодумців.
                </p>
              </div>

              <div className="card-glass p-8 rounded-[32px] border border-white/10 hover:border-yellow-500/30 transition-all group">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 text-yellow-400 group-hover:scale-110 transition">
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

      {currentPage === 'posts' && <PostsFeed />}

      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="card-glass w-full max-w-md p-8 rounded-[40px] relative">
            <button onClick={() => setShowAuthModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X /></button>
            <h2 className="text-3xl font-black mb-6 text-center uppercase tracking-tighter">
              {showAuthModal === 'login' ? 'Вхід в систему' : 'Реєстрація'}
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-4">Логін</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-yellow-500 transition" 
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-yellow-500 transition" 
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition shadow-xl shadow-yellow-500/20 transform hover:-translate-y-1">
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

      <footer className="mt-20 border-t border-white/10 py-12 px-6 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6 mb-6">
          <a href="https://t.me/sutnistua" className="hover:text-white transition">Telegram</a>
          <a href="https://t.me/temka_offical_bot" className="hover:text-white transition">Бот</a>
          <a href="#" className="hover:text-white transition">Підтримка</a>
        </div>
        <p>&copy; 2024-2025 Сутність UA Online. Всі права захищені.</p>
        <p className="mt-2 text-xs opacity-50 uppercase tracking-widest font-bold">Зроблено з любов'ю до спільноти</p>
      </footer>
    </div>
  );
};

export default App;
