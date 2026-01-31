import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUp, ArrowDown, Send, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ClanFormTopic() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const topicId = params.get("topic_id");

  const [topic, setTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const t = await base44.entities.ClanFormTopic.filter({ id: topicId });
      const topicRec = Array.isArray(t) ? t[0] : t?.data?.[0] || t;
      setTopic(topicRec);
      const msgs = await base44.entities.ClanFormMessage.filter({ topic_id: topicId }, 'created_date', 200);
      setMessages(msgs || []);
    } finally { setLoading(false); }
  }, [topicId]);

  useEffect(() => { load(); }, [load]);

  const handleVoteTopic = async (type) => {
    if (!topic) return;
    const newScore = (topic.score || 0) + (type === 'up' ? 1 : -1);
    await base44.entities.ClanFormTopic.update(topic.id, { score: newScore });
    setTopic((t) => ({ ...t, score: newScore }));
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    await base44.entities.ClanFormMessage.create({ topic_id: topicId, content: message.trim() });
    setMessage("");
    await load();
  };

  return (
    <div className="min-h-screen text-white p-6 pt-28" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" className="mb-6 text-white/70 hover:text-white" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {loading ? (
          <div className="h-40 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
        ) : topic ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center text-white/70 mr-2">
                <button onClick={() => handleVoteTopic('up')} className="p-1.5 rounded hover:bg-white/10"><ArrowUp className="w-5 h-5" /></button>
                <div className="font-bold text-lg">{topic.score || 0}</div>
                <button onClick={() => handleVoteTopic('down')} className="p-1.5 rounded hover:bg-white/10"><ArrowDown className="w-5 h-5" /></button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-white/10 border-white/20">Clan Form Topic</Badge>
                  {topic.visibility_scope && <Badge className="bg-cyan-500/20 border-cyan-500/30 text-cyan-200">{topic.visibility_scope}</Badge>}
                </div>
                <h1 className="text-2xl font-bold">{topic.title}</h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-white/60">Topic not found.</div>
        )}

        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl">
          <div className="p-4 border-b border-white/10 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" /> Messages</div>
          <div className="max-h-[60vh] overflow-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-white/50 mb-1 flex items-center gap-2">
                  <strong className="text-white/80">{m.username || m.user_id}</strong>
                  <span className="text-white/30">·</span>
                  <span>{new Date(m.created_date).toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/90 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {messages.length === 0 && <p className="text-xs text-white/40">No messages yet.</p>}
          </div>
          <div className="p-4 border-t border-white/10 flex items-center gap-2">
            <Input placeholder="Write a message…" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button onClick={handleSend} disabled={!message.trim()} className="gap-2"><Send className="w-4 h-4" /> Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}