
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, ShoppingCart, Bot, Send, Trash2, Archive, Star, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../components/auth/AuthContext';

const initialMessages = {
  inbox: [
    { id: 1, from: 'Shadow_Stryker', subject: 'Raid Night!', body: "Hey, you ready for the Leviathan raid tonight at 8 PM EST? We need your DPS. Make sure you've got your best gear equipped!", timestamp: '2 hours ago', read: false },
    { id: 2, from: 'System', subject: 'Welcome to Atom x Eve OS!', body: "Welcome, user. Your journey into a new era of gaming begins now. Explore different worlds, complete achievements, and forge your legend. Your AI companion, EVE, is ready to assist you.", timestamp: '1 day ago', read: true },
  ],
  marketplace: [
    { id: 3, from: 'Marketplace', subject: 'Sale Successful: Phoenix Blade', body: "Congratulations! Your 'Phoenix Blade' has been sold for 8,500 AGP. The funds have been transferred to your account.", timestamp: '5 hours ago', read: false },
    { id: 4, from: 'Marketplace', subject: 'Bid Won: Cybernetic Core', body: "You've won the auction for 'Cybernetic Core' with a bid of 3,200 AGP. The item has been added to your inventory.", timestamp: '3 days ago', read: true },
  ],
  ai_console: [
    { id: 5, from: 'EVE', subject: 'Combat Analysis Complete', body: "Based on your last 50 matches in Vanguard Ops, I've identified an optimized loadout that could increase your K/D ratio by up to 12%. Would you like me to equip it?", timestamp: '1 hour ago', read: false },
    { id: 6, from: 'EVE', subject: 'Achievement Recommendation', body: "I've detected you are close to unlocking the 'Master Tactician' achievement in Fire Emblem. Focusing on defensive strategies in your next few battles should secure it.", timestamp: '6 hours ago', read: true },
  ],
  sent: [
    { id: 7, to: 'Shadow_Stryker', subject: 'Re: Raid Night!', body: "Yeah, I'm in. I'll be online around 7:45 PM to get set up. Let's get that server first!", timestamp: '1 hour ago', read: true },
  ],
};

const MailboxSidebar = ({ activeTab, setActiveTab, messages }) => {
  const getUnreadCount = (tab) => messages[tab]?.filter(m => !m.read).length || 0;
  
  const tabs = [
    { key: 'inbox', label: 'Inbox', icon: <Inbox /> },
    { key: 'marketplace', label: 'Marketplace', icon: <ShoppingCart /> },
    { key: 'ai_console', label: 'AI Console', icon: <Bot /> },
    { key: 'sent', label: 'Sent', icon: <Send /> },
  ];

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <h2 className="text-2xl font-bold text-white mb-6">Mailbox</h2>
      <div className="space-y-2">
        {tabs.map(tab => {
          const unreadCount = getUnreadCount(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left font-semibold transition-all duration-200 ${activeTab === tab.key ? 'bg-blue-500/30 text-blue-300' : 'text-slate-300 hover:bg-slate-700/50'}`}
            >
              <div className="flex items-center gap-3">
                {React.cloneElement(tab.icon, { className: 'w-5 h-5' })}
                <span>{tab.label}</span>
              </div>
              {unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function Mailbox() {
  const [messages, setMessages] = useState(initialMessages);
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(initialMessages.inbox[0]);
  const { isAuthenticated } = useAuth();

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    if (!message.read) {
      setMessages(prev => {
        const newMessages = { ...prev };
        const msg = newMessages[activeTab].find(m => m.id === message.id);
        if (msg) msg.read = true;
        return newMessages;
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen text-slate-200 p-8 page-container">
      <style>{`
        .glass-panel { 
          background: rgba(15, 23, 42, 0.6); 
          backdrop-filter: blur(16px); 
          border: 1px solid rgba(148, 163, 184, 0.2); 
          border-radius: 16px; 
        }
        .message-list,
        .message-content {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
        }
        .message-list::-webkit-scrollbar,
        .message-content::-webkit-scrollbar {
          display: none; /* WebKit */
        }
      `}</style>

      {!isAuthenticated && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-300 text-center">
            Sign in to access your messages and communications
          </p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        <div className="col-span-12 md:col-span-3">
          <MailboxSidebar activeTab={activeTab} setActiveTab={setActiveTab} messages={messages} />
        </div>
        
        <div className="col-span-12 md:col-span-4">
          <div className="glass-panel p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 capitalize">{activeTab}</h2>
            <div className="message-list overflow-y-auto flex-grow pr-2">
              {messages[activeTab].map(msg => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 border-l-4 ${selectedMessage?.id === msg.id ? 'bg-blue-500/20 border-blue-400' : 'border-transparent hover:bg-slate-700/50'}`}
                >
                  <div className="flex justify-between items-start">
                    <p className={`font-semibold ${!msg.read ? 'text-white' : 'text-slate-300'}`}>{msg.from || msg.to}</p>
                    <p className="text-xs text-slate-400 flex-shrink-0 ml-2">{msg.timestamp}</p>
                  </div>
                  <p className={`truncate text-sm ${!msg.read ? 'text-slate-200' : 'text-slate-400'}`}>{msg.subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-5">
          <div className="glass-panel p-6 h-full flex flex-col">
            <AnimatePresence mode="wait">
              {selectedMessage ? (
                <motion.div
                  key={selectedMessage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-grow flex flex-col"
                >
                  <h3 className="text-2xl font-bold text-white mb-3">{selectedMessage.subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 pb-4 border-b border-slate-700">
                    <User className="w-4 h-4" />
                    <span>From: {selectedMessage.from || 'Me'}</span>
                    {selectedMessage.to && <span>To: {selectedMessage.to}</span>}
                  </div>
                  <div className="message-content text-slate-300 leading-relaxed flex-grow overflow-y-auto pr-2">
                    {selectedMessage.body}
                  </div>
                  <div className="flex gap-2 mt-6 border-t border-slate-700 pt-4">
                    <Button variant="outline" className="bg-slate-700/50 hover:bg-slate-600/50">Reply</Button>
                    <Button variant="outline" className="bg-slate-700/50 hover:bg-slate-600/50"><Archive className="w-4 h-4 mr-2"/>Archive</Button>
                    <Button variant="destructive" className="ml-auto"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </motion.div>
              ) : (
                <div className="m-auto text-center text-slate-500">Select a message to read.</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
