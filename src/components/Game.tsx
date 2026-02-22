
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Player, Enemy, Bullet, Platform, PowerUp } from '../types';
import { 
  GRAVITY, PLAYER_SPEED, JUMP_FORCE, FRICTION, 
  BULLET_SPEED, SHOT_COOLDOWN, COLORS, 
  CANVAS_WIDTH, CANVAS_HEIGHT 
} from '../constants';
import { soundEngine } from '../services/soundService';

interface GameProps {
  onGameOver: (score: number) => void;
  onWin: () => void;
}

export const Game: React.FC<GameProps> = ({ onGameOver, onWin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  const [score, setScore] = useState(0);
  
  const playerRef = useRef<Player>({
    id: 'player',
    x: 100,
    y: 400,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    ammo: 100,
    isJumping: false,
    facing: 'right',
    lastShot: 0
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<{x: number, y: number, vx: number, vy: number, life: number, color: string}[]>([]);
  const cameraXRef = useRef(0);
  const levelWidthRef = useRef(3000);

  useEffect(() => {
    const platforms: Platform[] = [
      { id: 'g1', x: 0, y: 550, width: 1000, height: 50, vx: 0, vy: 0, type: 'ground' },
      { id: 'g2', x: 1100, y: 550, width: 800, height: 50, vx: 0, vy: 0, type: 'ground' },
      { id: 'g3', x: 2000, y: 550, width: 1000, height: 50, vx: 0, vy: 0, type: 'ground' },
      { id: 'p1', x: 300, y: 400, width: 150, height: 20, vx: 0, vy: 0, type: 'floating' },
      { id: 'p2', x: 550, y: 300, width: 150, height: 20, vx: 0, vy: 0, type: 'floating' },
      { id: 'p3', x: 800, y: 400, width: 150, height: 20, vx: 0, vy: 0, type: 'floating' },
      { id: 'p4', x: 1200, y: 350, width: 200, height: 20, vx: 0, vy: 0, type: 'floating' },
      { id: 'p5', x: 1500, y: 250, width: 200, height: 20, vx: 0, vy: 0, type: 'floating' },
      { id: 'm1', x: 400, y: 300, width: 40, height: 40, vx: 0, vy: 0, type: 'mystery-block', hasItem: true },
      { id: 'm2', x: 440, y: 300, width: 40, height: 40, vx: 0, vy: 0, type: 'mystery-block', hasItem: true },
      { id: 'm3', x: 1000, y: 300, width: 40, height: 40, vx: 0, vy: 0, type: 'mystery-block', hasItem: true },
    ];

    const enemies: Enemy[] = [
      { id: 'e1', x: 600, y: 510, width: 40, height: 40, vx: -2, vy: 0, hp: 30, maxHp: 30, type: 'guinea-pig', behavior: 'patrol' },
      { id: 'e2', x: 1300, y: 510, width: 40, height: 40, vx: -2, vy: 0, hp: 30, maxHp: 30, type: 'rabbit', behavior: 'patrol' },
      { id: 'e3', x: 1600, y: 210, width: 40, height: 40, vx: -2, vy: 0, hp: 30, maxHp: 30, type: 'guinea-pig', behavior: 'patrol' },
      { id: 'e4', x: 2200, y: 510, width: 40, height: 40, vx: -2, vy: 0, hp: 30, maxHp: 30, type: 'rabbit', behavior: 'patrol' },
      { id: 'boss', x: 2800, y: 450, width: 100, height: 100, vx: 0, vy: 0, hp: 500, maxHp: 500, type: 'boss', behavior: 'boss-pattern', lastShot: 0 },
    ];

    platformsRef.current = platforms;
    enemiesRef.current = enemies;

    const handleKeyDown = (e: KeyboardEvent) => keysRef.current[e.code] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.code] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      const player = playerRef.current;
      if (gameState !== GameState.PLAYING) return;

      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
        player.vx = -PLAYER_SPEED;
        player.facing = 'left';
      } else if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
        player.vx = PLAYER_SPEED;
        player.facing = 'right';
      } else {
        player.vx *= FRICTION;
      }

      if ((keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || keysRef.current['Space']) && !player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
        soundEngine.playJump();
        
        // Jump particles
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * -2,
            life: 1.0,
            color: 'rgba(255, 255, 255, 0.5)'
          });
        }
      }

      player.vy += GRAVITY;
      player.x += player.vx;
      player.y += player.vy;

      const now = Date.now();
      if (keysRef.current['KeyF'] || keysRef.current['Enter']) {
        if (now - player.lastShot > SHOT_COOLDOWN) {
          const bulletX = player.facing === 'right' ? player.x + player.width : player.x;
          bulletsRef.current.push({
            id: Math.random().toString(),
            x: bulletX,
            y: player.y + player.height / 2,
            width: 12,
            height: 4,
            vx: player.facing === 'right' ? BULLET_SPEED : -BULLET_SPEED,
            vy: 0,
            damage: 10,
            owner: 'player'
          });
          player.lastShot = now;
          soundEngine.playShoot();
        }
      }

      let onPlatform = false;
      platformsRef.current.forEach(p => {
        // Collision from top
        if (
          player.x < p.x + p.width &&
          player.x + player.width > p.x &&
          player.y + player.height > p.y &&
          player.y + player.height < p.y + p.height + player.vy
        ) {
          player.y = p.y - player.height;
          if (player.vy > 5) {
            // Land particles
            for (let i = 0; i < 5; i++) {
              particlesRef.current.push({
                x: player.x + player.width / 2,
                y: player.y + player.height,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * -3,
                life: 1.0,
                color: 'rgba(255, 255, 255, 0.5)'
              });
            }
          }
          player.vy = 0;
          player.isJumping = false;
          onPlatform = true;
        }
        // Collision from bottom (Mystery Block)
        if (
          p.type === 'mystery-block' && !p.isHit &&
          player.x < p.x + p.width &&
          player.x + player.width > p.x &&
          player.y < p.y + p.height &&
          player.y > p.y + player.vy
        ) {
          p.isHit = true;
          player.vy = 2; // Bounce back
          soundEngine.playHit();
          
          // Spawn PowerUp
          const rand = Math.random();
          let type: PowerUp['type'] = 'garlic';
          if (rand < 0.2) type = 'health';
          else if (rand < 0.4) type = 'ammo';
          else if (rand < 0.5) type = 'shield';
          
          powerUpsRef.current.push({
            id: Math.random().toString(),
            x: p.x,
            y: p.y - 40,
            width: 30,
            height: 30,
            vx: 0,
            vy: -2,
            type,
            collected: false
          });
        }
      });
      if (!onPlatform && player.y < CANVAS_HEIGHT) {
        player.isJumping = true;
      }

      // PowerUps update
      powerUpsRef.current = powerUpsRef.current.filter(pu => {
        if (pu.collected) return false;
        
        pu.y += pu.vy;
        if (pu.vy < 0) pu.vy += 0.1; // Gravity for powerup spawn
        else pu.vy = 0;

        // Collection
        if (
          player.x < pu.x + pu.width &&
          player.x + player.width > pu.x &&
          player.y < pu.y + pu.height &&
          player.y + player.height > pu.y
        ) {
          pu.collected = true;
          soundEngine.playHit();
          if (pu.type === 'health') player.hp = Math.min(player.maxHp, player.hp + 30);
          if (pu.type === 'ammo') player.ammo += 50;
          if (pu.type === 'garlic') setScore(prev => prev + 100);
          else setScore(prev => prev + 50);
          return false;
        }
        return true;
      });

      // Particles update
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.02;
        return p.life > 0;
      });

      if (player.y > CANVAS_HEIGHT + 100) {
        setGameState(GameState.GAME_OVER);
        onGameOver(score);
        soundEngine.playExplosion();
      }

      bulletsRef.current = bulletsRef.current.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        
        let hit = false;
        if (b.owner === 'player') {
          enemiesRef.current.forEach(e => {
            if (
              b.x < e.x + e.width &&
              b.x + b.width > e.x &&
              b.y < e.y + e.height &&
              b.y + b.height > e.y
            ) {
              e.hp -= b.damage;
              hit = true;
              soundEngine.playHit();
              if (e.hp <= 0) {
                setScore(prev => prev + (e.type === 'boss' ? 1000 : 100));
                soundEngine.playExplosion();
              }
            }
          });
        } else {
          if (
            b.x < player.x + player.width &&
            b.x + b.width > player.x &&
            b.y < player.y + player.height &&
            b.y + b.height > player.y
          ) {
            player.hp -= b.damage;
            hit = true;
            soundEngine.playHit();
            if (player.hp <= 0) {
              setGameState(GameState.GAME_OVER);
              onGameOver(score);
              soundEngine.playExplosion();
            }
          }
        }

        return !hit && b.x > cameraXRef.current - 100 && b.x < cameraXRef.current + CANVAS_WIDTH + 100;
      });

      enemiesRef.current = enemiesRef.current.filter(e => {
        if (e.hp <= 0) {
          if (e.type === 'boss') {
            setGameState(GameState.WIN);
            onWin();
          }
          return false;
        }

        if (e.type === 'boss') {
          e.y += Math.sin(now / 500) * 2;
          if (now - (e.lastShot || 0) > 1000) {
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: e.x,
              y: e.y + e.height / 2,
              width: 15,
              height: 6,
              vx: -7,
              vy: (Math.random() - 0.5) * 4,
              damage: 20,
              owner: 'enemy'
            });
            e.lastShot = now;
            soundEngine.playShoot();
          }
        } else {
          e.x += e.vx;
          if (Math.random() < 0.01) e.vx *= -1;
        }

        if (
          player.x < e.x + e.width &&
          player.x + player.width > e.x &&
          player.y < e.y + e.height &&
          player.y + player.height > e.y
        ) {
          player.hp -= 0.5;
          if (player.hp <= 0) {
            setGameState(GameState.GAME_OVER);
            onGameOver(score);
            soundEngine.playExplosion();
          }
        }

        return true;
      });

      const targetCameraX = Math.max(0, Math.min(player.x - CANVAS_WIDTH / 2, levelWidthRef.current - CANVAS_WIDTH));
      cameraXRef.current += (targetCameraX - cameraXRef.current) * 0.1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Amiga-style Copper Sky
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, COLORS.SKY_TOP);
      gradient.addColorStop(0.5, COLORS.SKY_BOTTOM);
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Parallax Layer 1: Stars/Far Space (Slowest)
      ctx.fillStyle = 'white';
      for (let i = 0; i < 50; i++) {
        const x = (i * 234 + cameraXRef.current * -0.1) % CANVAS_WIDTH;
        const y = (i * 123) % CANVAS_HEIGHT;
        ctx.fillRect(x, y, 2, 2);
      }

      // Parallax Layer 2: Distant Planets/Mountains
      ctx.save();
      ctx.translate(-cameraXRef.current * 0.3, 0);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#220044';
        ctx.beginPath();
        ctx.moveTo(i * 600, 550);
        ctx.lineTo(i * 600 + 300, 200);
        ctx.lineTo(i * 600 + 600, 550);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(-cameraXRef.current, 0);

      // Platforms
      platformsRef.current.forEach(p => {
        if (p.type === 'mystery-block') {
          ctx.fillStyle = p.isHit ? COLORS.MYSTERY_BLOCK_HIT : COLORS.MYSTERY_BLOCK;
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x, p.y, p.width, p.height);
          
          if (!p.isHit) {
            ctx.fillStyle = 'black';
            ctx.font = 'bold 20px monospace';
            ctx.fillText('?', p.x + 15, p.y + 28);
          }
        } else {
          // Ground with texture
          ctx.fillStyle = COLORS.GROUND;
          ctx.fillRect(p.x, p.y, p.width, p.height);
          
          // Grass top with detail
          ctx.fillStyle = '#2d5a27';
          ctx.fillRect(p.x, p.y, p.width, 8);
          ctx.fillStyle = '#3e7a36';
          for(let gx = 0; gx < p.width; gx += 10) {
            ctx.fillRect(p.x + gx, p.y - 2, 4, 4);
          }
        }
      });

      // PowerUps
      powerUpsRef.current.forEach(pu => {
        if (pu.collected) return;
        
        if (pu.type === 'garlic') {
          // Draw Garlic Bulb
          ctx.fillStyle = COLORS.GARLIC;
          ctx.beginPath();
          ctx.moveTo(pu.x + 15, pu.y + 5);
          ctx.quadraticCurveTo(pu.x + 5, pu.y + 15, pu.x + 15, pu.y + 25);
          ctx.quadraticCurveTo(pu.x + 25, pu.y + 15, pu.x + 15, pu.y + 5);
          ctx.fill();
          ctx.fillStyle = '#dcfce7'; // Stem
          ctx.fillRect(pu.x + 13, pu.y, 4, 6);
        } else {
          ctx.fillStyle = pu.type === 'health' ? COLORS.POWERUP_HEALTH : 
                          pu.type === 'ammo' ? COLORS.POWERUP_AMMO : COLORS.POWERUP_SHIELD;
          ctx.beginPath();
          ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px monospace';
          const label = pu.type === 'health' ? 'H' : pu.type === 'ammo' ? 'A' : 'S';
          ctx.fillText(label, pu.x + 10, pu.y + 20);
        }
      });

      // Particles
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color.replace('0.5', p.life.toString());
        ctx.fillRect(p.x, p.y, 4, 4);
      });

      // Enemies
      enemiesRef.current.forEach(e => {
        if (e.type === 'boss') {
          // Detailed Boss
          ctx.fillStyle = COLORS.BOSS_DARK;
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.fillStyle = COLORS.BOSS;
          ctx.fillRect(e.x + 5, e.y + 5, e.width - 10, e.height - 10);
          
          // Glowing Eyes
          ctx.fillStyle = '#ff0000';
          const pulse = Math.sin(Date.now() / 100) * 5;
          ctx.fillRect(e.x + 20, e.y + 25, 20 + pulse, 20 + pulse);
          ctx.fillRect(e.x + 60, e.y + 25, 20 + pulse, 20 + pulse);
          
          // Mechanical Arms
          ctx.fillStyle = '#444';
          ctx.fillRect(e.x - 20, e.y + 40, 20, 10);
          ctx.fillRect(e.x + e.width, e.y + 40, 20, 10);
          
          // Metal bits
          ctx.fillStyle = '#666';
          ctx.fillRect(e.x + 10, e.y + 70, 80, 10);
        } else {
          // Detailed Minions
          const baseColor = e.type === 'guinea-pig' ? COLORS.GUINEA_PIG : COLORS.RABBIT;
          const darkColor = e.type === 'guinea-pig' ? COLORS.GUINEA_PIG_DARK : COLORS.RABBIT_DARK;
          
          ctx.fillStyle = darkColor;
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.fillStyle = baseColor;
          ctx.fillRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
          
          if (e.type === 'guinea-pig') {
            // Patches
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(e.x + 5, e.y + 5, 10, 10);
            ctx.fillRect(e.x + 25, e.y + 25, 10, 10);
          } else {
            // Flop Ears
            ctx.fillStyle = baseColor;
            ctx.fillRect(e.x + 5, e.y - 15, 10, 20);
            ctx.fillRect(e.x + 25, e.y - 15, 10, 20);
          }
          
          // Space Helmet
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(e.x - 2, e.y - 2, e.width + 4, e.height + 4);
          
          // Eyes
          ctx.fillStyle = 'black';
          const eyeX = e.vx > 0 ? e.x + 30 : e.x + 5;
          ctx.fillRect(eyeX, e.y + 10, 6, 6);
        }
        
        // Enemy HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(e.x, e.y - 15, e.width, 6);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(e.x, e.y - 15, (e.hp / e.maxHp) * e.width, 6);
      });

      // Bullets
      bulletsRef.current.forEach(b => {
        ctx.fillStyle = b.owner === 'player' ? COLORS.BULLET : COLORS.ENEMY_BULLET;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.owner === 'player' ? COLORS.BULLET : COLORS.ENEMY_BULLET;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
      });

      // Player (GarlicPig)
      const player = playerRef.current;
      // Body
      ctx.fillStyle = COLORS.PIG_DARK;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = COLORS.PIG;
      ctx.fillRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4);
      
      // Camo Patterns
      ctx.fillStyle = '#2d3314';
      ctx.fillRect(player.x + 5, player.y + 10, 8, 8);
      ctx.fillRect(player.x + 25, player.y + 25, 8, 8);
      
      // Snout
      ctx.fillStyle = '#ffb6c1';
      const snoutX = player.facing === 'right' ? player.x + 30 : player.x - 5;
      ctx.fillRect(snoutX, player.y + 20, 15, 10);
      ctx.fillStyle = 'black';
      ctx.fillRect(snoutX + 3, player.y + 23, 2, 2);
      ctx.fillRect(snoutX + 10, player.y + 23, 2, 2);
      
      // Military Hat with detail
      ctx.fillStyle = '#4b5320';
      ctx.fillRect(player.x - 4, player.y - 8, player.width + 8, 12);
      ctx.fillStyle = '#2d3314';
      ctx.fillRect(player.x + 15, player.y - 6, 10, 4); // Badge
      
      // Eyes (Angry)
      ctx.fillStyle = 'black';
      const eyeX = player.facing === 'right' ? player.x + 25 : player.x + 10;
      ctx.fillRect(eyeX, player.y + 12, 6, 6);
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(eyeX - 2, player.y + 10);
      ctx.lineTo(eyeX + 8, player.y + 14);
      ctx.stroke();

      // Machine Gun (Detailed)
      ctx.fillStyle = '#222';
      const gunX = player.facing === 'right' ? player.x + 25 : player.x - 15;
      ctx.fillRect(gunX, player.y + 22, 30, 10);
      ctx.fillStyle = '#444';
      ctx.fillRect(gunX + (player.facing === 'right' ? 20 : 0), player.y + 24, 10, 6); // Barrel

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, onGameOver, onWin, score]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
      <div className="relative shadow-2xl border-4 border-zinc-700 rounded-lg overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="bg-black"
        />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-40 h-5 bg-zinc-900 rounded-full overflow-hidden border-2 border-zinc-700">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all duration-300" 
                  style={{ width: `${playerRef.current.hp}%` }}
                />
              </div>
              <span className="text-sm font-black font-mono text-white italic tracking-tighter">VITALITY</span>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400 italic tracking-tighter drop-shadow-md">
              {score.toString().padStart(6, '0')}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 text-[10px] font-black font-mono text-white/40 bg-black/40 p-2 rounded italic uppercase tracking-widest">
          SYSTEM: AMIGA 1200 EMULATION ACTIVE | GP-2000 REV.2
        </div>
      </div>
    </div>
  );
};
