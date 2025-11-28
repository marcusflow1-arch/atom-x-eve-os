import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LIBRARY_THEMES = {
  midnight_library: {
    id: 'midnight_library',
    name: 'Midnight Library',
    css: 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950',
    animation: 'stars'
  },
  neon_shelf: {
    id: 'neon_shelf',
    name: 'Neon Shelf',
    css: 'bg-gradient-to-br from-pink-900 via-purple-950 to-blue-950',
    animation: 'neon'
  },
  enchanted_archive: {
    id: 'enchanted_archive',
    name: 'Enchanted Archive',
    css: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900',
    animation: 'magic'
  },
  cyber_vault: {
    id: 'cyber_vault',
    name: 'Cyber Vault',
    css: 'bg-gradient-to-br from-cyan-950 via-blue-950 to-slate-950',
    animation: 'grid'
  },
  royal_collection: {
    id: 'royal_collection',
    name: 'Royal Collection',
    css: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950',
    animation: 'particles'
  },
  shadow_realm: {
    id: 'shadow_realm',
    name: 'Shadow Realm',
    css: 'bg-gradient-to-br from-gray-950 via-slate-950 to-zinc-950',
    animation: 'smoke'
  },
  crystal_cave: {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    css: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950',
    animation: 'crystals'
  },
  volcanic_chamber: {
    id: 'volcanic_chamber',
    name: 'Volcanic Chamber',
    css: 'bg-gradient-to-br from-red-950 via-orange-950 to-yellow-950',
    animation: 'embers'
  },
  frozen_archive: {
    id: 'frozen_archive',
    name: 'Frozen Archive',
    css: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950',
    animation: 'snow'
  },
  aurora_vault: {
    id: 'aurora_vault',
    name: 'Aurora Vault',
    css: 'bg-gradient-to-br from-green-900 via-blue-900 to-purple-900',
    animation: 'aurora'
  },
  cosmic_library: {
    id: 'cosmic_library',
    name: 'Cosmic Library',
    css: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950',
    animation: 'nebula'
  },
  digital_matrix: {
    id: 'digital_matrix',
    name: 'Digital Matrix',
    css: 'bg-gradient-to-br from-green-950 via-black to-green-950',
    animation: 'matrix'
  },
  sakura_garden: {
    id: 'sakura_garden',
    name: 'Sakura Garden',
    css: 'bg-gradient-to-br from-pink-950 via-rose-950 to-red-950',
    animation: 'petals'
  },
  electric_blue: {
    id: 'electric_blue',
    name: 'Electric Blue',
    css: 'bg-gradient-to-br from-blue-600 via-cyan-700 to-blue-900',
    animation: 'lightning'
  },
  mystic_forest: {
    id: 'mystic_forest',
    name: 'Mystic Forest',
    css: 'bg-gradient-to-br from-green-950 via-emerald-950 to-teal-950',
    animation: 'fireflies'
  },
  // --- Abstract Themes ---
  abstract_art: {
    id: 'abstract_art',
    name: 'Abstract Art',
    css: 'bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-900',
    animation: 'art_strokes'
  },
  deep_space: {
    id: 'deep_space',
    name: 'Deep Space',
    css: 'bg-gradient-to-br from-black via-slate-950 to-blue-950',
    animation: 'deep_stars'
  },
  mother_earth: {
    id: 'mother_earth',
    name: 'Mother Earth',
    css: 'bg-gradient-to-br from-green-900 via-emerald-900 to-cyan-900',
    animation: 'leaves'
  },
  lunar_surface: {
    id: 'lunar_surface',
    name: 'Lunar Surface',
    css: 'bg-gradient-to-br from-slate-800 via-gray-900 to-zinc-900',
    animation: 'moon_dust'
  },
  abstract_chaos: {
    id: 'abstract_chaos',
    name: 'Abstract Chaos',
    css: 'bg-gradient-to-br from-red-900 via-violet-900 to-blue-900',
    animation: 'chaos'
  },
  // --- Anime/Character Themes ---
  cyber_ninja: {
    id: 'cyber_ninja',
    name: 'Cyber Ninja',
    css: 'bg-gradient-to-br from-slate-950 via-zinc-900 to-black',
    animation: 'speed_lines'
  },
  magical_girl: {
    id: 'magical_girl',
    name: 'Magical Girl',
    css: 'bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500',
    animation: 'hearts'
  },
  mecha_pilot: {
    id: 'mecha_pilot',
    name: 'Mecha Pilot',
    css: 'bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900',
    animation: 'hud_grid'
  },
  shonen_spirit: {
    id: 'shonen_spirit',
    name: 'Shonen Spirit',
    css: 'bg-gradient-to-br from-orange-600 via-red-600 to-yellow-600',
    animation: 'aura'
  },
  spirit_guardian: {
    id: 'spirit_guardian',
    name: 'Spirit Guardian',
    css: 'bg-gradient-to-br from-sky-800 via-blue-900 to-indigo-900',
    animation: 'wisps'
  }
};

export const ThemeBackground = ({ themeId }) => {
  const canvasRef = useRef(null);
  const currentTheme = LIBRARY_THEMES[themeId] || LIBRARY_THEMES.midnight_library;

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const animationType = currentTheme.animation;
    
    // Default particle config
    const particleConfig = {
        count: 100,
        type: animationType === 'snow' ? 'snow' : animationType,
        colors: ['rgba(255, 255, 255, 0.6)']
    };

    let particles = [];

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const initializeParticles = () => {
        particles = [];
        const { count, type, colors } = particleConfig;
        for (let i = 0; i < count; i++) {
            let p = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random(),
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 0.5 + 0.1,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05
            };

            if (type === 'snow') {
                p.vy = Math.random() * 2 + 1;
            } else if (type === 'petals') {
                p.vy = Math.random() * 1.5 + 0.5;
            } else if (type === 'embers') {
                p.vy = -(Math.random() * 1 + 0.5);
                p.x = canvas.width / 2 + (Math.random() - 0.5) * 100;
            } else if (type === 'matrix') {
                p.char = String.fromCharCode(0x30A0 + Math.random() * 96);
                p.font_size = 14;
                p.speed = 3;
                p.x = Math.floor(Math.random() * canvas.width / p.font_size) * p.font_size;
                p.y = Math.random() * canvas.height;
            } else if (type === 'leaves') {
                p.vy = Math.random() * 1 + 0.5;
                p.vx = Math.random() * 1 - 0.5;
                p.rotation = Math.random() * Math.PI * 2;
                p.color = `rgba(${100 + Math.random()*100}, ${200 + Math.random()*55}, ${100}, 0.6)`;
            } else if (type === 'hearts') {
                p.vy = -(Math.random() * 1.5 + 0.5);
                p.size = Math.random() * 10 + 5;
                p.color = `rgba(255, ${100 + Math.random()*100}, ${150 + Math.random()*100}, 0.6)`;
            } else if (type === 'speed_lines') {
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
                p.width = Math.random() * 100 + 50;
                p.speed = Math.random() * 15 + 10;
                p.color = 'rgba(0, 255, 255, 0.3)';
            } else if (type === 'aura') {
                p.vy = -(Math.random() * 3 + 1);
                p.radius = Math.random() * 20 + 10;
                p.color = `rgba(255, ${Math.random() * 100 + 50}, 0, 0.3)`;
            } else if (type === 'art_strokes') {
                p.width = Math.random() * 50 + 20;
                p.height = Math.random() * 5 + 2;
                p.angle = Math.random() * Math.PI * 2;
                p.color = `hsla(${Math.random() * 360}, 70%, 50%, 0.5)`;
            } else if (type === 'hud_grid') {
                 p.x = Math.floor(Math.random() * (canvas.width / 50)) * 50;
                 p.y = Math.floor(Math.random() * (canvas.height / 50)) * 50;
                 p.size = Math.random() * 10 + 5;
                 p.blink = Math.random() > 0.9;
            } else if (type === 'wisps') {
                p.vy = -(Math.random() * 0.5 + 0.2);
                p.vx = Math.sin(Math.random() * Math.PI * 2) * 0.5;
            }

            particles.push(p);
        }
    };

    initializeParticles();

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const time = Date.now() * 0.001;

        if (['stars', 'particles', 'magic', 'fireflies', 'snow', 'embers', 'crystals', 'petals', 'leaves', 'moon_dust', 'chaos', 'deep_stars', 'wisps'].includes(animationType)) {
            particles.forEach(p => {
                ctx.beginPath();
                if (animationType === 'petals' || animationType === 'leaves') {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.angle);
                    ctx.fillStyle = p.color;
                    // Leaf/Petal shape
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.radius * 2, p.radius, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else if (animationType === 'crystals') {
                    ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = p.color;
                    ctx.stroke();
                } else if (animationType === 'wisps') {
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'rgba(200, 230, 255, 0.8)';
                    ctx.fill();
                } else {
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    if (['fireflies', 'magic', 'chaos'].includes(animationType)) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = p.color;
                    }
                    ctx.fill();
                }
                
                p.y += p.vy;
                p.x += p.vx * 0.1;
                
                if (animationType === 'chaos') {
                    p.x += (Math.random() - 0.5) * 5;
                    p.y += (Math.random() - 0.5) * 5;
                }
                
                p.opacity = Math.sin(time + p.x) * 0.2 + 0.8;
                
                if (animationType === 'snow' || animationType === 'moon_dust') {
                    p.x += Math.sin(p.y * 0.01) * 0.5;
                    if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                } else if (animationType === 'embers' || animationType === 'wisps') {
                    if (p.y < 0) { p.y = canvas.height; p.x = canvas.width / 2 + (Math.random() - 0.5) * 100; }
                } else if (animationType === 'petals' || animationType === 'leaves') {
                    p.x += Math.sin(p.y * 0.01) * 0.3;
                    p.angle += p.rotationSpeed;
                    if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                } else {
                    if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                    if (p.x > canvas.width) p.x = 0;
                    if (p.x < 0) p.x = canvas.width;
                }
            });
            ctx.shadowBlur = 0;
        }

        // New Animations Logic
        if (animationType === 'hearts') {
            particles.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                const size = p.size;
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(-size/2, -size/2, -size, size/3, 0, size);
                ctx.bezierCurveTo(size, size/3, size/2, -size/2, 0, 0);
                ctx.fill();
                ctx.restore();
                
                p.y += p.vy;
                p.x += Math.sin(time * 2 + p.y * 0.05) * 1;
                if (p.y < -50) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
            });
        }

        if (animationType === 'speed_lines') {
            particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.width, 2);
                p.x += p.speed;
                if (p.x > canvas.width) { p.x = -p.width; p.y = Math.random() * canvas.height; }
            });
        }

        if (animationType === 'aura') {
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                g.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
                g.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = g;
                ctx.fill();
                
                p.y += p.vy;
                p.radius *= 0.98;
                if (p.radius < 2 || p.y < 0) {
                    p.y = canvas.height;
                    p.x = Math.random() * canvas.width;
                    p.radius = Math.random() * 20 + 10;
                }
            });
        }

        if (animationType === 'art_strokes') {
            particles.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
                ctx.restore();
                
                p.angle += 0.01;
                p.x += Math.sin(time + p.y) * 0.5;
                p.y += Math.cos(time + p.x) * 0.5;
            });
        }

        if (animationType === 'hud_grid') {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            // Draw Grid
            for(let x = 0; x < canvas.width; x+=50) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }
            for(let y = 0; y < canvas.height; y+=50) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
            }
            // Blinking Dots
            particles.forEach(p => {
                if (Math.sin(time * 5 + p.x) > 0) {
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
                    ctx.fillRect(p.x, p.y, 5, 5);
                }
            });
        }

        if (animationType === 'grid') {
            const gridSize = 50;
            const dynamicOpacity = Math.sin(time * 0.5) * 0.1 + 0.2;
            ctx.strokeStyle = `rgba(59, 130, 246, ${dynamicOpacity})`;
            ctx.lineWidth = 1;

            for (let x = 0; x < canvas.width; x += gridSize) {
                const wave = Math.sin(x * 0.01 + time) * 10;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height + wave);
                ctx.stroke();
            }

            for (let y = 0; y < canvas.height; y += gridSize) {
                const wave = Math.sin(y * 0.01 + time) * 10;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width + wave, y);
                ctx.stroke();
            }
        }

        if (animationType === 'aurora') {
            const gradient = ctx.createLinearGradient(0, Math.sin(time) * canvas.height * 0.5, canvas.width, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 255, 127, 0.1)');
            gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (animationType === 'nebula') {
            const nebulaTime = Date.now() * 0.0003;
            for (let i = 0; i < 3; i++) {
                const gradient = ctx.createRadialGradient(
                    canvas.width / 2 + Math.sin(nebulaTime + i) * 200,
                    canvas.height / 2 + Math.cos(nebulaTime + i) * 200,
                    0,
                    canvas.width / 2 + Math.sin(nebulaTime + i) * 200,
                    canvas.height / 2 + Math.cos(nebulaTime + i) * 200,
                    400
                );
                const colors = [
                    ['rgba(255, 0, 255, 0.1)', 'rgba(128, 0, 255, 0)'],
                    ['rgba(0, 255, 255, 0.1)', 'rgba(0, 128, 255, 0)'],
                    ['rgba(255, 0, 128, 0.1)', 'rgba(255, 0, 255, 0)']
                ];
                gradient.addColorStop(0, colors[i][0]);
                gradient.addColorStop(1, colors[i][1]);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        if (animationType === 'neon') {
            ctx.strokeStyle = `hsla(${(time * 50) % 360}, 100%, 70%, 0.3)`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 20; i++) {
                const x = (i / 20) * canvas.width;
                const y = Math.sin(x * 0.01 + time) * 50 + canvas.height / 2;
                if (i === 0) ctx.beginPath(), ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        if (animationType === 'matrix') {
            ctx.font = '14px monospace';
            particles.forEach(p => {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.fillText(p.char, p.x, p.y);
                p.y += p.speed;
                if (p.y > canvas.height) {
                    p.y = 0;
                    p.x = Math.floor(Math.random() * canvas.width / 14) * 14;
                    p.char = String.fromCharCode(0x30A0 + Math.random() * 96);
                }
            });
        }

        if (animationType === 'lightning') {
            if (Math.random() > 0.98) {
                const x1 = Math.random() * canvas.width;
                const y1 = 0;
                const length = canvas.height * (0.8 + Math.random() * 0.2);
                const branchCount = Math.floor(Math.random() * 3) + 1;

                ctx.strokeStyle = `rgba(200, 200, 255, ${Math.random() * 0.5 + 0.5})`;
                ctx.lineWidth = 2 + Math.random() * 2;
                ctx.shadowBlur = 20;
                ctx.shadowColor = 'rgba(200, 200, 255, 0.8)';
                ctx.lineCap = 'round';

                const drawLightningBranch = (startX, startY, len, angle, depth) => {
                    if (len < 5 || depth > 3) return;
                    const endX = startX + Math.cos(angle) * len;
                    const endY = startY + Math.sin(angle) * len;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                    if (Math.random() > 0.5) drawLightningBranch(endX, endY, len * 0.6, angle + (Math.random() - 0.5) * 0.8, depth + 1);
                    if (Math.random() > 0.5) drawLightningBranch(endX, endY, len * 0.6, angle - (Math.random() - 0.5) * 0.8, depth + 1);
                };
                drawLightningBranch(x1, y1, length, Math.PI / 2 + (Math.random() - 0.5) * 0.3, 0);
                ctx.shadowBlur = 0;
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, [currentTheme]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${currentTheme.css}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />
    </div>
  );
};

export const ThemeToggle = ({ selectedTheme, onThemeSelect }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/5 hover:bg-white/10 border border-white/10">
          <Palette className="w-5 h-5 text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-slate-900/95 backdrop-blur-xl border-slate-700"
        style={{ width: '650px', maxHeight: '550px' }}
        align="end"
      >
        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-white font-bold text-lg mb-1">Themes</h4>
            <p className="text-slate-400 text-sm">Customize your background</p>
          </div>
          
          <div className="grid grid-cols-4 gap-4 max-h-[420px] overflow-y-auto pr-2">
            {Object.values(LIBRARY_THEMES).map(theme => {
              const isSelected = selectedTheme === theme.id;
              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onThemeSelect(theme.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30' 
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70'
                  }`}
                >
                  <div className={`w-full aspect-video rounded-lg mb-2 ${theme.css} relative overflow-hidden`}>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white rounded-full p-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-center text-white">
                    {theme.name}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};