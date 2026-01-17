
import React from 'react';
import { Send, Sparkles } from 'lucide-react';

const BotCard: React.FC = () => {
  return (
    <div className="card-glass p-8 rounded-3xl border border-yellow-500/30 group hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <Sparkles className="text-yellow-400 animate-pulse" />
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <span className="text-4xl font-black text-white">TF</span>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-white mb-2">Truhan Furry Bot</h3>
          <p className="text-gray-400 mb-4">
            Твій вірний помічник для публікації та модерації постів. 
            Роби контент яскравішим разом з нами!
          </p>
          <a 
            href="https://t.me/temka_offical_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Send size={18} />
            @temka_offical_bot
          </a>
        </div>
      </div>
    </div>
  );
};

export default BotCard;
