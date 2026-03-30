import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, Sparkles } from "lucide-react";

export default function GeneratedUI() {
  const [me, setMe] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [history, setHistory] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      setMe(user);
      setLoadingUser(false);
    })();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ui_prompt_lab_nodes");
      const savedHist = localStorage.getItem("ui_prompt_lab_history");
      if (saved) setNodes(JSON.parse(saved));
      if (savedHist) setHistory(JSON.parse(savedHist));
    } catch (_) {
      // ignore
    }
  }, []);

  const systemInstructions = useMemo(
    () => `You are a UI generator that outputs a JSON describing a React UI built with TailwindCSS and shadcn/ui.
Only use the following component types: container, heading, text, button, input, textarea, card, image, badge, list.
- container props: direction('row'|'col'), gap(number, tailwind spacing e.g., 2/4/6), className(optional)
- heading props: level(1|2|3), text(string)
- text props: text(string)
- button props: label(string), variant('default'|'outline'|'secondary'), size('sm'|'md'|'lg')
- input props: placeholder(string)
- textarea props: placeholder(string)
- card props: title(string), description(string)
- image props: src(string), alt(string), rounded(boolean)
- badge props: text(string), variant('default'|'secondary'|'outline')
- list props: items(array of strings)
Return strictly JSON matching the provided schema with a 'nodes' array as the root. Avoid explanations.`,
    []
  );

  const handleRefine = async () => {
    const userMsg = prompt.trim();
    if (!userMsg) return;
    setIsGenerating(true);

    const convo = [
      { role: "system", content: systemInstructions },
      ...history,
      { role: "user", content: userMsg },
    ]
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on the conversation, produce UI JSON.\n\n${convo}`,
      response_json_schema: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                props: { type: "object" },
                children: { type: "array", items: { type: "object" } },
              },
              required: ["type"],
              additionalProperties: true,
            },
          },
        },
        required: ["nodes"],
        additionalProperties: true,
      },
    });

    const newHistory = [...history, { role: "user", content: userMsg }, { role: "assistant", content: JSON.stringify(res) }];
    const newNodes = Array.isArray(res.nodes) ? res.nodes : [];
    setHistory(newHistory);
    setNodes(newNodes);
    localStorage.setItem("ui_prompt_lab_nodes", JSON.stringify(newNodes));
    localStorage.setItem("ui_prompt_lab_history", JSON.stringify(newHistory));
    setIsGenerating(false);
    setPrompt("");
  };

  const renderNode = (node, idx) => {
    if (!node || typeof node !== "object") return null;
    const t = (node.type || "").toLowerCase();
    const p = node.props || {};
    const children = Array.isArray(node.children) ? node.children : [];

    switch (t) {
      case "container": {
        const dir = p.direction === "row" ? "flex-row" : "flex-col";
        const gap = typeof p.gap === "number" ? `gap-${p.gap}` : "gap-4";
        return (
          <div key={idx} className={`flex ${dir} ${gap} ${p.className || ""}`}>
            {children.map((c, i) => renderNode(c, `${idx}-${i}`))}
          </div>
        );
      }
      case "heading": {
        const level = p.level === 1 ? "text-3xl" : p.level === 3 ? "text-xl" : "text-2xl";
        return (
          <div key={idx} className={`${level} font-bold text-white`}>{p.text || "Heading"}</div>
        );
      }
      case "text":
        return (
          <p key={idx} className="text-white/80">
            {p.text || "Text"}
          </p>
        );
      case "button":
        return (
          <button key={idx} className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white hover:bg-white/20">
            {p.label || "Button"}
          </button>
        );
      case "input":
        return <input key={idx} placeholder={p.placeholder || "Type..."} className="px-3 py-2 rounded-md bg-white/5 border border-white/20 text-white placeholder-white/40" />;
      case "textarea":
        return <textarea key={idx} placeholder={p.placeholder || "Type..."} className="px-3 py-2 rounded-md bg-white/5 border border-white/20 text-white placeholder-white/40 min-h-[100px]" />;
      case "card":
        return (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl text-white p-4">
            {(p.title || p.description) && (
              <div className="mb-3">
                {p.title && <div className="text-lg font-semibold">{p.title}</div>}
                {p.description && <div className="text-white/60 text-sm">{p.description}</div>}
              </div>
            )}
            <div>
              {children.length ? children.map((c, i) => renderNode(c, `${idx}-c-${i}`)) : <div className="text-white/60 text-sm">Card content</div>}
            </div>
          </div>
        );
      case "image":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={idx}
            src={p.src || "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1200"}
            alt={p.alt || "Image"}
            className={`max-w-full ${p.rounded ? "rounded-xl" : ""}`}
          />
        );
      case "badge":
        return <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white text-xs w-fit">{p.text || "Badge"}</span>;
      case "list": {
        const items = Array.isArray(p.items) ? p.items : ["Item 1", "Item 2"]; 
        return (
          <ul key={idx} className="list-disc list-inside text-white/80 space-y-1">
            {items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        );
      }
      default:
        return null;
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (me?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
        <div className="text-white/70">Admin access required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative p-6 md:p-10" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      {/* Exit Button */}
      <button
        onClick={() => navigate(createPageUrl('AdminUIBuilder'))}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center"
        title="Exit to UI Prompt Lab"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Generated UI Full Page */}
      <div className="max-w-7xl mx-auto text-white">
        {nodes && nodes.length ? (
          <div className="space-y-4">
            {nodes.map((n, i) => renderNode(n, i))}
          </div>
        ) : (
          <div className="text-white/60">No UI generated yet. Return to the lab and generate one.</div>
        )}
      </div>

      {/* Floating Prompt Refinement Bar */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-6 w-[92vw] md:w-[720px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-xl">
        <div className="flex items-center gap-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add instructions to refine this UI (e.g., add a hero card, switch to 2 columns, make buttons outline)"
            className="min-h-[60px] bg-white/5 border-white/10 text-white"
          />
          <Button onClick={handleRefine} disabled={isGenerating} className="shrink-0 gap-2">
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Refining...' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  );
}