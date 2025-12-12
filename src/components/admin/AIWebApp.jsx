import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';

export default function AIWebApp() {
  const [generating, setGenerating] = useState(false);

  const generateAIApp = () => {
    setGenerating(true);
    
    // Create the HTML content for the AI app
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .container {
            width: 90%;
            max-width: 800px;
            height: 90vh;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            align-self: flex-end;
            margin-left: auto;
        }
        
        .message.ai {
            background: #f0f0f0;
            color: #333;
            align-self: flex-start;
        }
        
        .input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
        }
        
        .input-container input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 25px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s;
        }
        
        .input-container input:focus {
            border-color: #667eea;
        }
        
        .input-container button {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .input-container button:hover {
            transform: scale(1.05);
        }
        
        .input-container button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .typing {
            display: inline-flex;
            gap: 4px;
        }
        
        .typing span {
            width: 8px;
            height: 8px;
            background: #667eea;
            border-radius: 50%;
            animation: bounce 1.4s infinite;
        }
        
        .typing span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes bounce {
            0%, 60%, 100% {
                transform: translateY(0);
            }
            30% {
                transform: translateY(-10px);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <span>✨</span>
                AI Assistant
            </h1>
        </div>
        
        <div class="chat-container" id="chatContainer">
            <div class="message ai">
                Hello! I'm your AI assistant. How can I help you today?
            </div>
        </div>
        
        <div class="input-container">
            <input 
                type="text" 
                id="messageInput" 
                placeholder="Type your message..." 
                autocomplete="off"
            />
            <button id="sendButton">Send</button>
        </div>
    </div>
    
    <script>
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        let isProcessing = false;
        
        function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isUser ? 'user' : 'ai'}\`;
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function showTyping() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message ai';
            typingDiv.id = 'typing';
            typingDiv.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
            chatContainer.appendChild(typingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function removeTyping() {
            const typingDiv = document.getElementById('typing');
            if (typingDiv) typingDiv.remove();
        }
        
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isProcessing) return;
            
            isProcessing = true;
            sendButton.disabled = true;
            
            addMessage(message, true);
            messageInput.value = '';
            
            showTyping();
            
            try {
                // Simulate AI response (replace with actual API call)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                removeTyping();
                
                // Simple response logic
                const responses = [
                    "That's an interesting question! Let me think about that...",
                    "I understand what you're asking. Here's what I think...",
                    "Great question! Based on my knowledge...",
                    "I'd be happy to help you with that!"
                ];
                
                const response = responses[Math.floor(Math.random() * responses.length)];
                addMessage(response, false);
                
            } catch (error) {
                removeTyping();
                addMessage('Sorry, I encountered an error. Please try again.', false);
            }
            
            isProcessing = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
        
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        messageInput.focus();
    </script>
</body>
</html>`;

    // Create and download the HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-assistant-app.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setGenerating(false);
  };

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Assistant App
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Ready-to-use AI chat interface with modern UI
          </p>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Responsive chat interface
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Gradient design with animations
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Ready to integrate with AI APIs
        </div>
      </div>
      
      <Button
        onClick={generateAIApp}
        disabled={generating}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {generating ? (
          <>Generating...</>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download AI App (.html)
          </>
        )}
      </Button>
      
      <p className="text-xs text-slate-400 mt-3">
        Download the HTML file and upload it to the LG Web Apps section above
      </p>
    </div>
  );
}