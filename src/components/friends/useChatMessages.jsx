import { useState, useEffect, useCallback } from 'react';

// Module-level shared store: friendId → messages[]
// Both messenger instances (standalone + inside profile) share this map.
const chatStore = new Map();
const listeners = new Map(); // friendId → Set of setState callbacks

const MOCK_CHAT_HISTORY = {
  'temp_logan': [
    { id: 1, text: "Hey! Want to squad up later?", sender: 'friend', timestamp: '10:30 AM', type: 'text' },
    { id: 2, text: "Yeah sure! What time?", sender: 'me', timestamp: '10:32 AM', type: 'text' },
    { id: 3, text: "Around 8pm?", sender: 'friend', timestamp: '10:33 AM', type: 'text' },
    { id: 4, text: "Perfect, see you then!", sender: 'me', timestamp: '10:35 AM', type: 'text' },
    { id: 5, text: "Check out this clip I got!", sender: 'friend', timestamp: '2:15 PM', type: 'video', mediaUrl: 'https://example.com/clip.mp4', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
  ],
  'temp_ariana': [
    { id: 1, text: "Did you finish that achievement?", sender: 'friend', timestamp: 'Yesterday', type: 'text' },
    { id: 2, text: "Not yet, so close though!", sender: 'me', timestamp: 'Yesterday', type: 'text' },
  ],
};

function getMessages(friendId) {
  if (!chatStore.has(friendId)) {
    chatStore.set(friendId, MOCK_CHAT_HISTORY[friendId] || []);
  }
  return chatStore.get(friendId);
}

function notify(friendId) {
  const subs = listeners.get(friendId);
  if (subs) subs.forEach(fn => fn([...chatStore.get(friendId)]));
}

export function useChatMessages(friendId) {
  const [messages, setMessages] = useState(() => getMessages(friendId));

  useEffect(() => {
    if (!friendId) return;
    // Sync to current store value on mount / friendId change
    setMessages([...getMessages(friendId)]);

    if (!listeners.has(friendId)) listeners.set(friendId, new Set());
    listeners.get(friendId).add(setMessages);
    return () => {
      listeners.get(friendId)?.delete(setMessages);
    };
  }, [friendId]);

  const addMessage = useCallback((msg) => {
    if (!friendId) return;
    const current = getMessages(friendId);
    current.push(msg);
    chatStore.set(friendId, current);
    notify(friendId);
  }, [friendId]);

  return { messages, addMessage };
}