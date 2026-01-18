import React, { useState, useEffect } from 'react';
import { Zap, Clock, User } from 'lucide-react';

interface Post {
  id: number;
  server: string;
  text: string;
  user_id: number;
  username: string;
  created_at: string;
  channel_link: string;
}

const PostsFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    loadPosts();
    // Оновлюємо пости кожні 30 секунд
    const interval = setInterval(loadPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    try {
      // Завантажуємо з файлу website_posts.json
      const response = await fetch('/website_posts.json');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Помилка завантаження постів:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = filter === 'ALL' 
    ? posts 
    : posts.filter(p => p.server === filter);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-yellow-400 neon-yellow">
          📰 Останні Новини
        </h2>
        <button 
          onClick={loadPosts}
          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-4 py-2 rounded-xl border border-blue-600/30 transition flex items-center gap-2"
        >
          <Zap size={16} /> Оновити
        </button>
      </div>

      {/* Фільтр серверів */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['ALL', '01', '02', '03', '04', '05'].map(srv => (
          <button
            key={srv}
            onClick={() => setFilter(srv)}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              filter === srv
                ? 'bg-yellow-500 text-black'
                : 'card-glass border border-white/10 hover:border-yellow-500/30'
            }`}
          >
            {srv === 'ALL' ? '🌐 Всі' : `🎮 Сервер ${srv}`}
          </button>
        ))}
      </div>

      {/* Список постів */}
      {filteredPosts.length === 0 ? (
        <div className="card-glass p-12 rounded-[32px] text-center">
          <p className="text-gray-400 text-lg">Поки немає новин</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map(post => (
            <div 
              key={post.id}
              className="card-glass p-6 rounded-[24px] border border-white/10 hover:border-yellow-500/30 transition-all group"
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/20 px-3 py-1 rounded-lg">
                    <span className="text-yellow-400 font-bold">🎮 Сервер {post.server}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <User size={14} />
                    <span>{post.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Clock size={14} />
                  {formatDate(post.created_at)}
                </div>
              </div>

              {/* Текст поста */}
              <div className="prose prose-invert max-w-none mb-4">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {post.text}
                </p>
              </div>

              {/* Посилання на канал */}
              <div className="flex items-center justify-end">
                <a
                  href={post.channel_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-4 py-2 rounded-xl border border-blue-600/30 transition flex items-center gap-2 text-sm font-bold"
                >
                  <Zap size={14} /> Переглянути в каналі
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка "Завантажити більше" */}
      {filteredPosts.length > 10 && (
        <div className="text-center mt-8">
          <button className="card-glass border border-white/20 px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition">
            Завантажити більше
          </button>
        </div>
      )}
    </div>
  );
};

export default PostsFeed;
