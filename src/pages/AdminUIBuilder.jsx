import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminUIBuilder() {
  const [me, setMe] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]); // {role:'user'|'assistant', content:string}
  const [nodes, setNodes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      setMe(user);
      setLoadingUser(false);
    })();
  }, []);

  const isAdmin = me?.role === "admin";

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

  const handleGenerate = async (extra = "") => {
    const userMsg = (prompt + (extra ? "\n\n" + extra : "")).trim();
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
    localStorage.setItem('ui_prompt_lab_nodes', JSON.stringify(newNodes));
    localStorage.setItem('ui_prompt_lab_history', JSON.stringify(newHistory));
    setIsGenerating(false);
  };

  const handleOpenPreview = () => {
    localStorage.setItem('ui_prompt_lab_nodes', JSON.stringify(nodes));
    localStorage.setItem('ui_prompt_lab_history', JSON.stringify(history));
    navigate(createPageUrl('GeneratedUI'));
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
          <Button key={idx} variant={p.variant || "default"} size={p.size || "md"}>
            {p.label || "Button"}
          </Button>
        );
      case "input":
        return <Input key={idx} placeholder={p.placeholder || "Type..."} />;
      case "textarea":
        return <Textarea key={idx} placeholder={p.placeholder || "Type..."} className="min-h-[100px]" />;
      case "card":
        return (
          <Card key={idx} className="bg-white/5 border-white/10 text-white">
            {(p.title || p.description) && (
              <CardHeader>
                {p.title && <CardTitle className="text-white">{p.title}</CardTitle>}
                {p.description && <div className="text-white/60 text-sm">{p.description}</div>}
              </CardHeader>
            )}
            <CardContent>
              {children.length ? children.map((c, i) => renderNode(c, `${idx}-c-${i}`)) : <div className="text-white/60 text-sm">Card content</div>}
            </CardContent>
          </Card>
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
        return <Badge key={idx} className="w-fit">{p.text || "Badge"}</Badge>;
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <div className="text-white font-semibold mb-2">Admin Access Required</div>
          <div className="text-white/60 text-sm">Only admins can use the UI Prompt Lab.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">UI Prompt Lab</h1>
          </div>
          <Badge className="bg-white/10 border-white/20 text-white">Admin</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prompt Panel */}
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Describe the UI you want</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: A 2-column dashboard with a stats card, a list of tasks, and a CTA button to create a new task"
                className="min-h-[140px]"
              />
              <div className="flex items-center gap-3">
                <Button onClick={() => handleGenerate()} disabled={isGenerating} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? "Generating..." : "Generate UI"}
                </Button>
                <Button variant="outline" onClick={handleOpenPreview} disabled={!nodes.length} className="gap-2">
                  Full Page Preview
                </Button>
                <span className="text-white/40 text-sm">Add more instructions and click again to refine.</span>
              </div>

              {history.length > 0 && (
                <div className="pt-2">
                  <Separator className="bg-white/10 mb-4" />
                  <div className="max-h-40 overflow-auto space-y-2 pr-1">
                    {history.map((m, i) => (
                      <div key={i} className={`text-xs ${m.role === 'user' ? 'text-blue-300' : 'text-white/60'}`}>
                        <span className="uppercase mr-2 opacity-70">{m.role}:</span>
                        {m.content.length > 300 ? m.content.slice(0, 300) + '…' : m.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {nodes && nodes.length ? (
                <div className="space-y-4">
                  {nodes.map((n, i) => renderNode(n, i))}
                </div>
              ) : (
                <div className="text-white/50 text-sm">Your generated UI will appear here.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}