
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Settings, Zap, CheckCircle, Copy, ExternalLink, HardDrive } from 'lucide-react';

export default function DesktopPackage() {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const mainJsContent = `const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize the local database
const store = new Store();

// --- Seed the database with initial data if it's empty ---
function seedDatabase() {
  if (!store.get('achievements')) {
    console.log('Seeding database with initial achievements...');
    store.set('achievements', [
        { id: '1', title: 'First Quest', description: 'Complete your first quest.', game: 'Any', category: 'completion', points: 10, rarity: 'common', unlocked_date: '2023-10-26', converted_to_agp: false },
        { id: '2', title: 'Dragon Slayer', description: 'Defeat the Ancient Dragon in Elder Scrolls: Reborn.', game: 'Elder Scrolls: Reborn', category: 'combat', points: 250, rarity: 'legendary', unlocked_date: '2023-10-27', converted_to_agp: false },
        { id: '3', title: 'Cyberpunk Runner', description: 'Complete the main story of Cyberpunk 2088.', game: 'Cyberpunk 2088', category: 'completion', points: 150, rarity: 'epic', unlocked_date: '2023-10-28', converted_to_agp: true },
        { id: '4', title: 'Headshot Master', description: 'Achieve 100 headshots in Vanguard Ops.', game: 'Vanguard Ops', category: 'skill', points: 50, rarity: 'rare', unlocked_date: '2023-10-29', converted_to_agp: false }
    ]);
  }
  if (!store.get('avatar')) {
      console.log('Seeding database with initial avatar data...');
      store.set('avatar', {
        name: "AI Marcus",
        gender: "male",
        level: 42,
        experience: 1250,
        avatar_gamer_points: 8500,
        total_achievements: 128,
      });
  }
}

// --- Local Backend Logic (replaces cloud functions) ---
function setupLocalApi() {
  ipcMain.handle('get-achievements', async (event, { game, category }) => {
    let achievements = store.get('achievements') || [];
    if (game) {
      achievements = achievements.filter(a => a.game === game);
    }
    if (category && category !== 'all') {
      achievements = achievements.filter(a => a.category === category);
    }
    return achievements;
  });

  ipcMain.handle('get-avatar-stats', async () => {
    return store.get('avatar') || { name: 'New Player', level: 1, experience: 0 };
  });
  
  // Add more handlers here to replace other cloud functions
  // ipcMain.handle('unlock-achievement', async (event, { achievementData }) => { ... });
}


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/favicon.ico'),
    title: "ATOM × EVE OS"
  });

  // This should be the URL where your base44 app is running locally
  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  seedDatabase();
  setupLocalApi();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});`;

  const preloadJsContent = `const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure, well-defined API to the frontend (Renderer Process)
contextBridge.exposeInMainWorld('localApi', {
  // Achievements API
  getAchievements: (filters) => ipcRenderer.invoke('get-achievements', filters),
  
  // Avatar API
  getAvatarStats: () => ipcRenderer.invoke('get-avatar-stats'),

  // You can add more functions here as you convert them
  // unlockAchievement: (data) => ipcRenderer.invoke('unlock-achievement', data),
});
`;

  const installInstructions = `# ATOM × EVE OS - OFFLINE Desktop App Guide

This guide converts your web app into a true, offline-capable desktop application.

## Step 1: Install Dependencies
Open a terminal in your project's root folder and run:
\`\`\`bash
npm install electron electron-builder electron-store --save-dev
\`\`\`

## Step 2: Create/Update Local Backend Files
1.  **Create/Replace \`main.js\`**: In your project's root folder, create or replace the \`main.js\` file with the code from the "Main.js (Local Backend)" tab.
2.  **Create/Replace \`preload.js\`**: In the same folder, create or replace \`preload.js\` with the code from the "Preload.js (The Bridge)" tab.

## Step 3: Update package.json
Make sure your \`package.json\` has the correct 'main' entry and 'scripts':
\`\`\`json
{
  "main": "main.js",
  "scripts": {
    "electron": "electron .",
    "build-desktop": "electron-builder"
  }
}
\`\`\`
*(Add these next to your existing scripts like "dev" and "build")*

## Step 4: Update Frontend Code
Modify your React components to call the new local API. For example, in \`pages/Achievements.js\`, change the data fetching call from the cloud function to:
\`\`\`javascript
const achievements = await window.localApi.getAchievements({ game: selectedGame, category: selectedCategory });
\`\`\`
*(An example of this change is provided in the 'Example Frontend Change' tab)*

## Step 5: Run & Build
1.  **Run Development**: Open two terminals.
    - Terminal 1: \`npm run dev\` (Starts the web server)
    - Terminal 2: \`npm run electron\` (Starts the desktop app)
2.  **Build for Distribution**:
    - \`npm run build\` (Builds the web assets)
    - \`npm run build-desktop\` (Packages into an installer)
`;

 const frontendChangeExample = `// In pages/Achievements.js or any other page

import React, { useEffect, useState } from 'react';
// REMOVE: import { Achievement } from '@/entities/Achievement';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  
  useEffect(() => {
    const fetchAchievements = async () => {
      // OLD WAY:
      // const data = await Achievement.filter(...);
      
      // NEW OFFLINE WAY:
      const data = await window.localApi.getAchievements({ 
        /* your filters here */ 
      });

      setAchievements(data);
    };

    fetchAchievements();
  }, [/* dependencies */]);

  // ... rest of your component
}
`;

  return (
    <div className="bg-slate-900 min-h-screen p-8 text-slate-200">
        <header className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-white">Offline Desktop App Conversion</h1>
            <p className="text-slate-400 mt-4 text-lg max-w-3xl mx-auto">
                Follow these steps to convert your web application into a fully functional, offline-capable desktop app using Electron and a local database.
            </p>
        </header>

        <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/30">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Zap className="text-blue-400"/>Instructions</h2>
                <div className="prose prose-invert prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-code:text-cyan-300">
                    <pre><code className="language-markdown">{installInstructions}</code></pre>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <FileDisplay title="Main.js (Local Backend)" content={mainJsContent} onCopy={() => copyToClipboard(mainJsContent, 'main')} isCopied={copiedSection === 'main'} icon={<HardDrive className="text-green-400"/>}/>
                <FileDisplay title="Preload.js (The Bridge)" content={preloadJsContent} onCopy={() => copyToClipboard(preloadJsContent, 'preload')} isCopied={copiedSection === 'preload'} icon={<Zap className="text-yellow-400"/>}/>
            </div>
             <FileDisplay title="Example Frontend Change" content={frontendChangeExample} onCopy={() => copyToClipboard(frontendChangeExample, 'frontend')} isCopied={copiedSection === 'frontend'} icon={<Settings className="text-purple-400"/>}/>
        </div>
    </div>
  );
}

const FileDisplay = ({ title, content, onCopy, isCopied, icon }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 h-full flex flex-col">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">{icon}{title}</h3>
        <div className="relative flex-grow">
            <pre className="bg-slate-900/70 p-4 rounded-md overflow-auto h-96 border border-slate-700 text-sm">
                <code>{content}</code>
            </pre>
            <Button onClick={onCopy} size="icon" className="absolute top-3 right-3 bg-slate-700 hover:bg-slate-600">
                {isCopied ? <CheckCircle className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4"/>}
            </Button>
        </div>
    </div>
);
