import React, { useState, useEffect, useRef } from 'react';
import { Send, User, BarChart3, Info, Newspaper, MessageSquare, AlertCircle, CheckCircle, XCircle, Clock, Shield, Users, Bell } from 'lucide-react';

const API_URL = "https://api.anthropic.com/v1/messages";
const CHANNEL_URL = "https://t.me/sutnistua";
const WEBSITE_URL = "https://uaonliine.netlify.app/";

const UAOnlineBot = () => {
  const [currentView, setCurrentView] = useState('main');
  const [userId] = useState(() => Math.floor(Math.random() * 1000000000));
  const [userName, setUserName] = useState('');
  const [userRegistered, setUserRegistered] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [postText, setPostText] = useState('');
  const [userStats, setUserStats] = useState({
    totalPosts: 0,
    approved: 0,
    rejected: 0,
    warnings: 0
  });
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 146,
    totalPosts: 0,
    approved: 0,
    rejected: 0,
    moderators: 13
  });
  const [posts, setPosts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportInput, setSupportInput] = useState('');
  const [supportActive, setSupportActive] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userRegistered && userName.trim()) {
      setUserRegistered(true);
      setGlobalStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
    }
  }, [userName, userRegistered]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  const servers = ['01', '02', '03', '04', '05', 'ALL'];

  const stylePost = (server, text) => {
    return `⚡️ Говорить ${server} ⚡️\n\n${text}\n\n━━━━━━━━━━━━━━━━━━\n📰 Новини Сервер ${server}\n📩 Надіслати новину: Web Bot\n\n✨ Сутність UA ONLINE ✨`;
  };

  const autoEdit = (text) => {
    let edited = text;
    const replacements = {
      'ьий': 'ий',
      'ьі': 'і',
      'тся': 'ться',
      '  ': ' ',
      ',,': ',',
      '..': '.',
      '!.': '!',
      '?.': '?'
    };
    
    for (const [old, newVal] of Object.entries(replacements)) {
      edited = edited.split(old).join(newVal);
    }
    
    return edited.split('. ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('. ').trim();
  };

  const handleSubmitPost = () => {
    if (postText.length < 10) {
      alert('❌ Мінімум 10 символів!');
      return;
    }

    const editedText = autoEdit(postText);
    const styledText = stylePost(selectedServer, editedText);
    const postId = posts.length + 1;

    const newPost = {
      id: postId,
      userId: userId,
      userName: userName,
      server: selectedServer,
      text: editedText,
      styledText: styledText,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setPosts(prev => [newPost, ...prev]);
    setUserStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
    setGlobalStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));

    setPostText('');
    setSelectedServer(null);
    setCurrentView('main');

    setTimeout(() => {
      if (Math.random() > 0.3) {
        approvePost(postId);
      } else {
        rejectPost(postId);
      }
    }, 3000 + Math.random() * 5000);
  };

  const approvePost = (postId) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, status: 'approved', channelMsgId: Math.floor(Math.random() * 10000) } : p
    ));
    setUserStats(prev => ({ ...prev, approved: prev.approved + 1 }));
    setGlobalStats(prev => ({ ...prev, approved: prev.approved + 1 }));
  };

  const rejectPost = (postId) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, status: 'rejected' } : p
    ));
    setUserStats(prev => ({ ...prev, rejected: prev.rejected + 1 }));
    setGlobalStats(prev => ({ ...prev, rejected: prev.rejected + 1 }));
  };

  const sendToAI = async (message) => {
    setAiTyping(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Ти - AI асистент служби підтримки UA ONLINE Bot. Відповідай українською мовою, коротко та по справі. Допомагай користувачам з питаннями про бот, модерацію постів, правила спільноти.

Питання користувача: ${message}

Дай корисну та дружню відповідь.`
            }
          ]
        })
      });

      const data = await response.json();
      const aiResponse = data.content?.find(c => c.type === 'text')?.text || 'Вибачте, сталася помилка. Спробуйте ще раз.';
      
      setSupportMessages(prev => [...prev, {
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setSupportMessages(prev => [...prev, {
        type: 'ai',
        text: 'Вибачте, не вдалося отримати відповідь. Будь ласка, спробуйте пізніше або викличте модератора.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setAiTyping(false);
    }
  };

  const handleSupportMessage = () => {
    if (!supportInput.trim()) return;

    const userMessage = {
      type: 'user',
      text: supportInput,
      timestamp: new Date().toISOString()
    };

    setSupportMessages(prev => [...prev, userMessage]);
    
    const messageText = supportInput;
    setSupportInput('');
    
    sendToAI(messageText);
  };

  const callModerator = () => {
    const modMessage = {
      type: 'system',
      text: '📢 Модератора викликано! Очікуйте відповіді...',
      timestamp: new Date().toISOString()
    };
    setSupportMessages(prev => [...prev, modMessage]);

    setTimeout(() => {
      const modResponse = {
        type: 'moderator',
        text: 'Вітаю! Я модератор. Чим можу допомогти?',
        timestamp: new Date().toISOString()
      };
      setSupportMessages(prev => [...prev, modResponse]);
    }, 2000);
  };

  const MainMenu = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">👋 Вітаємо в UA ONLINE Bot!</h2>
        <p className="text-sm opacity-90">🆔 Ваш ID: <span className="font-mono bg-white/20 px-2 py-1 rounded">{userId}</span></p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setCurrentView('newPost')} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition">
          <Newspaper size={32} />
          <span className="text-sm font-medium">Надіслати новину</span>
        </button>
        
        <button onClick={() => setCurrentView('profile')} className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition">
          <User size={32} />
          <span className="text-sm font-medium">Мій профіль</span>
        </button>
        
        <button onClick={() => setCurrentView('stats')} className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition">
          <BarChart3 size={32} />
          <span className="text-sm font-medium">Статистика</span>
        </button>
        
        <button onClick={() => setCurrentView('about')} className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition">
          <Info size={32} />
          <span className="text-sm font-medium">Про бот</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="bg-blue-400 hover:bg-blue-500 text-white p-3 rounded-lg text-center transition">
          📺 Наш канал
        </a>
        <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="bg-purple-400 hover:bg-purple-500 text-white p-3 rounded-lg text-center transition">
          🌐 Наш сайт
        </a>
      </div>

      <button onClick={() => { setCurrentView('support'); setSupportActive(true); }} className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white p-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg">
        <MessageSquare size={24} />
        <span className="font-medium">💬 Чат підтримки</span>
      </button>
    </div>
  );

  const NewPostView = () => (
    <div className="space-y-4">
      <button onClick={() => setCurrentView('main')} className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
        ← Назад
      </button>

      {!selectedServer ? (
        <>
          <h3 className="text-xl font-bold">🎮 Оберіть сервер:</h3>
          <div className="grid grid-cols-3 gap-3">
            {servers.map(srv => (
              <button key={srv} onClick={() => setSelectedServer(srv)} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-bold transition">
                {srv === 'ALL' ? '🌐 ВСІ' : `🎮 ${srv}`}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded-lg">
            ✅ Сервер {selectedServer} обрано!
          </div>
          <h3 className="text-xl font-bold">📝 Надішліть текст новини</h3>
          <p className="text-sm text-gray-600">(мінімум 10 символів)</p>
          <textarea value={postText} onChange={(e) => setPostText(e.target.value)} className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Введіть текст новини..." />
          <div className="text-sm text-gray-500">{postText.length} / 10 символів</div>
          <div className="flex gap-3">
            <button onClick={handleSubmitPost} disabled={postText.length < 10} className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-3 rounded-lg font-bold transition">
              ✅ Відправити
            </button>
            <button onClick={() => { setSelectedServer(null); setPostText(''); }} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-bold transition">
              ❌ Скасувати
            </button>
          </div>
        </>
      )}
    </div>
  );

  const ProfileView = () => {
    const rate = userStats.totalPosts > 0 ? (userStats.approved / userStats.totalPosts * 100).toFixed(1) : 0;
    const userPosts = posts.filter(p => p.userId === userId);

    return (
      <div className="space-y-4">
        <button onClick={() => setCurrentView('main')} className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
          ← Назад
        </button>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">👤 Профіль</h2>
          <div className="space-y-2 text-sm">
            <p>🆔 ID: <span className="font-mono bg-white/20 px-2 py-1 rounded">{userId}</span></p>
            <p>👤 Ім'я: {userName || 'Не вказано'}</p>
            <p>📝 Всього постів: <span className="font-bold">{userStats.totalPosts}</span></p>
            <p>✅ Схвалено: <span className="font-bold">{userStats.approved}</span></p>
            <p>❌ Відхилено: <span className="font-bold">{userStats.rejected}</span></p>
            <p>⚠️ Попереджень: <span className="font-bold">{userStats.warnings}</span></p>
            <p>📈 Рейтинг: <span className="font-bold">{rate}%</span></p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-bold mb-3">📜 Історія постів</h3>
          {userPosts.length === 0 ? (
            <p className="text-gray-500 text-sm">Ви ще не надсилали жодної новини</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userPosts.map(post => (
                <div key={post.id} className="border-l-4 pl-3 py-2 text-sm" style={{ borderColor: post.status === 'approved' ? '#10b981' : post.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                  <div className="flex items-center gap-2 mb-1">
                    {post.status === 'approved' && <CheckCircle size={16} className="text-green-500" />}
                    {post.status === 'rejected' && <XCircle size={16} className="text-red-500" />}
                    {post.status === 'pending' && <Clock size={16} className="text-yellow-500" />}
                    <span className="font-medium">Сервер {post.server}</span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{post.text}</p>
                  {post.status === 'approved' && post.channelMsgId && (
                    <a href={`${CHANNEL_URL}/${post.channelMsgId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline">
                      Переглянути в каналі →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const StatsView = () => (
    <div className="space-y-4">
      <button onClick={() => setCurrentView('main')} className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
        ← Назад
      </button>

      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">📊 Статистика</h2>
        <div className="space-y-2">
          <p>👥 Користувачів: <span className="font-bold">{globalStats.totalUsers}</span></p>
          <p>📝 Постів: <span className="font-bold">{globalStats.totalPosts}</span></p>
          <p>✅ Схвалено: <span className="font-bold">{globalStats.approved}</span></p>
          <p>❌ Відхилено: <span className="font-bold">{globalStats.rejected}</span></p>
          <p>👮 Модераторів: <span className="font-bold">{globalStats.moderators}</span></p>
        </div>
      </div>
    </div>
  );

  const AboutView = () => (
    <div className="space-y-4">
      <button onClick={() => setCurrentView('main')} className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
        ← Назад
      </button>

      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">ℹ️ Про бот</h2>
        <div className="space-y-3 text-sm">
          <p>🤖 <strong>Сутність UA ONLINE Bot</strong></p>
          <p>📝 Цей бот дозволяє користувачам надсилати новини з різних серверів.</p>
          <div>
            <p className="font-bold mb-1">⚡️ Можливості:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Відправка новин з серверів 01-05</li>
              <li>Автоматична модерація</li>
              <li>Публікація в канал</li>
              <li>Відображення на сайті</li>
              <li>Чат підтримки з AI</li>
              <li>Виклик модераторів</li>
            </ul>
          </div>
          <p>👮 Модераторів: <strong>{globalStats.moderators}</strong></p>
          <p>👥 Користувачів: <strong>{globalStats.totalUsers}</strong></p>
          <p className="pt-2">✨ <strong>Сутність UA ONLINE</strong> ✨</p>
        </div>
      </div>
    </div>
  );

  const SupportView = () => (
    <div className="flex flex-col h-[600px]">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare size={24} />
          <h2 className="text-xl font-bold">Чат підтримки</h2>
        </div>
        <button onClick={() => setCurrentView('main')} className="hover:bg-white/20 p-2 rounded transition">
          ✕
        </button>
      </div>

      <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3">
        {supportMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
            <p>Вітаємо в чаті підтримки!</p>
            <p className="text-sm">Поставте запитання або викличте модератора</p>
          </div>
        ) : (
          supportMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.type === 'user' ? 'bg-blue-500 text-white' :
                msg.type === 'ai' ? 'bg-white border border-gray-200' :
                msg.type === 'moderator' ? 'bg-purple-100 border border-purple-300' :
                'bg-yellow-100 border border-yellow-300'
              }`}>
                {msg.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-1 text-xs text-gray-600">
                    <Shield size={12} />
                    <span>AI Асистент</span>
                  </div>
                )}
                {msg.type === 'moderator' && (
                  <div className="flex items-center gap-2 mb-1 text-xs text-purple-700">
                    <Users size={12} />
                    <span>Модератор</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        {aiTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 space-y-2">
        <button onClick={callModerator} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition">
          <Bell size={18} />
          <span className="font-medium">Викликати модератора</span>
        </button>
        
        <div className="flex gap-2">
          <input type="text" value={supportInput} onChange={(e) => setSupportInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSupportMessage()} placeholder="Напишіть повідомлення..." className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none" />
          <button onClick={handleSupportMessage} disabled={!supportInput.trim()} className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  if (!userRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🤖 UA ONLINE Bot
          </h1>
          <p className="text-gray-600 mb-6 text-center">Вітаємо! Введіть ваше ім'я для початку роботи</p>
          <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && userName.trim() && setUserRegistered(true)} placeholder="Введіть ваше ім'я..." className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none" />
          <button onClick={() => userName.trim() && setUserRegistered(true)} disabled={!userName.trim()} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-lg font-bold transition">
            🚀 Почати
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare size={28} />
              UA ONLINE Bot
            </h1>
            <p className="text-sm opacity-90 mt-1">Привіт, {userName}! 👋</p>
          </div>

          <div className="p-6">
            {currentView === 'main' && <MainMenu />}
            {currentView === 'newPost' && <NewPostView />}
            {currentView === 'profile' && <ProfileView />}
            {currentView === 'stats' && <StatsView />}
            {currentView === 'about' && <AboutView />}
            {currentView === 'support' && <SupportView />}
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mt-4">
          ✨ Сутність UA ONLINE ✨
        </div>
      </div>
    </div>
  );
};

export default UAOnlineBot;
