/**
 * Unified AI Chat Hook
 * 
 * Tries the user's own API key first (for offline/desktop mode).
 * Falls back to Base44's built-in InvokeLLM if no key is set or if the provider is 'base44'.
 * 
 * This is what makes the AI features work AFTER the app is downloaded as a desktop app.
 */
import { base44 } from '@/api/base44Client';
import { getSavedKeys, getActiveProvider } from './AIProviderConfig';

// ─── Direct API calls to external providers (browser-side) ──────

async function callOpenAI(apiKey, model, systemPrompt, userMessage) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI API error: ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOpenAIJSON(apiKey, model, systemPrompt, userMessage, jsonSchema) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI API error: ${res.status}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

async function callGoogle(apiKey, model, systemPrompt, userMessage) {
  const m = model || 'gemini-2.0-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGoogleJSON(apiKey, model, systemPrompt, userMessage, jsonSchema) {
  const m = model || 'gemini-2.0-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt + '\n\nYou MUST respond with valid JSON only.' }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
}

// Note: Anthropic doesn't support browser-side calls (CORS blocked).
// For Anthropic, we must route through a backend function.
// If the user picks Anthropic but is offline from Base44, we show a clear error.

async function callBase44LLM(prompt, jsonSchema) {
  if (jsonSchema) {
    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: jsonSchema,
      add_context_from_internet: true,
    });
  }
  return await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
  });
}

// ─── Unified invoke ─────────────────────────────────

/**
 * Invoke AI with automatic provider routing.
 * 
 * @param {Object} opts
 * @param {string} opts.systemPrompt - System/context prompt
 * @param {string} opts.userMessage - User's message
 * @param {Object} [opts.jsonSchema] - If provided, request structured JSON response
 * @returns {Promise<string|Object>} - String for text, Object for JSON
 */
export async function invokeAI({ systemPrompt, userMessage, jsonSchema }) {
  const activeProvider = getActiveProvider();
  const keys = getSavedKeys();

  // If user has set a provider with a key, use it directly (works offline)
  if (activeProvider !== 'base44' && keys[activeProvider]?.apiKey) {
    const { apiKey, model } = keys[activeProvider];

    if (activeProvider === 'openai') {
      if (jsonSchema) {
        return callOpenAIJSON(apiKey, model, systemPrompt, userMessage, jsonSchema);
      }
      return callOpenAI(apiKey, model, systemPrompt, userMessage);
    }

    if (activeProvider === 'google') {
      if (jsonSchema) {
        return callGoogleJSON(apiKey, model, systemPrompt, userMessage, jsonSchema);
      }
      return callGoogle(apiKey, model, systemPrompt, userMessage);
    }

    if (activeProvider === 'anthropic') {
      // Anthropic blocks browser CORS — try backend, fall back to error
      try {
        return await callBase44LLM(systemPrompt + '\n\n' + userMessage, jsonSchema);
      } catch {
        throw new Error('Anthropic requires a backend proxy (CORS). Use OpenAI or Gemini for desktop mode, or connect to Base44.');
      }
    }
  }

  // Default: Use Base44 built-in
  const fullPrompt = systemPrompt + '\n\nUser: ' + userMessage;
  return callBase44LLM(fullPrompt, jsonSchema);
}

/**
 * Get a human-readable label for the current active provider.
 */
export function getActiveProviderLabel() {
  const active = getActiveProvider();
  if (active === 'base44') return 'Base44 AI';
  const keys = getSavedKeys();
  const k = keys[active];
  if (!k) return 'Base44 AI';
  const labels = { openai: 'OpenAI', anthropic: 'Claude', google: 'Gemini' };
  return `${labels[active] || active} (${k.model || 'default'})`;
}