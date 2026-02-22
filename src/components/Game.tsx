
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
  const [currentLevel, setCurrentLevel] = useState(1);
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
    carrotBombs: 0,
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
  const levelWidthRef = useRef(5000);

  const loadLevel = (levelNum: number) => {
    levelWidthRef.current = 5000 + (levelNum * 1000);
    const platforms: Platform[] = [
      { id: 'g1', x: 0, y: 550, width: 1500, height: 50, vx: 0, vy: 0, type: 'ground' },
      { id: 'g2', x: 1700, y: 550, width: 1500, height: 50, vx: 0, vy: 0, type: 'ground' },
      { id: 'g3', x: 3400, y: 550, width: levelWidthRef.current - 3400, height: 50, vx: 0, vy: 0, type: 'ground' },
    ];

    // Add some random platforms and mystery blocks
    for (let i = 0; i < 20; i++) {
      platforms.push({
        id: `p${i}`,
        x: 500 + i * 300 + Math.random() * 100,
        y: 200 + Math.random() * 250,
        width: 100 + Math.random() * 100,
        height: 20,
        vx: 0,
        vy: 0,
        type: 'floating'
      });
      if (i % 3 === 0) {
        platforms.push({
          id: `m${i}`,
          x: 600 + i * 300,
          y: 250,
          width: 40,
          height: 40,
          vx: 0,
          vy: 0,
          type: 'mystery-block',
          hasItem: true
        });
      }
    }

    const enemies: Enemy[] = [];
    for (let i = 0; i < 10 + levelNum * 5; i++) {
      enemies.push({
        id: `e${i}`,
        x: 800 + i * 400,
        y: 510,
        width: 40,
        height: 40,
        vx: -(2 + levelNum * 0.5),
        vy: 0,
        hp: 30 + levelNum * 10,
        maxHp: 30 + levelNum * 10,
        type: Math.random() > 0.5 ? 'guinea-pig' : 'rabbit',
        behavior: 'patrol'
      });
    }

    enemies.push({
      id: 'boss',
      x: levelWidthRef.current - 400,
      y: 450,
      width: 120,
      height: 120,
      vx: 0,
      vy: 0,
      hp: 500 + levelNum * 200,
      maxHp: 500 + levelNum * 200,
      type: 'boss',
      behavior: 'boss-pattern',
      lastShot: 0
    });

    platformsRef.current = platforms;
    enemiesRef.current = enemies;
    powerUpsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    playerRef.current.x = 100;
    playerRef.current.y = 400;
    cameraXRef.current = 0;
  };

  useEffect(() => {
    loadLevel(currentLevel);

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
          const isCarrot = player.carrotBombs > 0;
          bulletsRef.current.push({
            id: Math.random().toString(),
            x: bulletX,
            y: player.y + player.height / 2,
            width: isCarrot ? 20 : 12,
            height: isCarrot ? 10 : 4,
            vx: player.facing === 'right' ? BULLET_SPEED : -BULLET_SPEED,
            vy: 0,
            damage: isCarrot ? 50 : 10,
            owner: 'player',
            type: isCarrot ? 'carrot' : 'normal'
          });
          if (isCarrot) player.carrotBombs--;
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
          if (rand < 0.15) type = 'health';
          else if (rand < 0.3) type = 'ammo';
          else if (rand < 0.4) type = 'shield';
          else if (rand < 0.5) type = 'carrot';
          
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
          if (pu.type === 'carrot') player.carrotBombs += 20;
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
                // Explosion particles
                for (let i = 0; i < 15; i++) {
                  particlesRef.current.push({
                    x: e.x + e.width / 2,
                    y: e.y + e.height / 2,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color: i % 2 === 0 ? '#ff4500' : '#ffff00'
                  });
                }
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
            if (currentLevel < 4) {
              setCurrentLevel(prev => prev + 1);
              loadLevel(currentLevel + 1);
            } else {
              setGameState(GameState.WIN);
              onWin();
            }
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

      // Parallax Layer 2: Cyberpunk Buildings
      ctx.save();
      ctx.translate(-cameraXRef.current * 0.3, 0);
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = '#0f172a';
        const bh = 200 + Math.random() * 300;
        const bw = 100 + Math.random() * 100;
        ctx.fillRect(i * 400, CANVAS_HEIGHT - bh, bw, bh);
        // Neon Windows
        ctx.fillStyle = i % 2 === 0 ? COLORS.NEON_PINK : COLORS.NEON_CYAN;
        for (let wy = 0; wy < bh - 40; wy += 40) {
          if (Math.random() > 0.3) ctx.fillRect(i * 400 + 10, CANVAS_HEIGHT - bh + 20 + wy, 10, 10);
          if (Math.random() > 0.3) ctx.fillRect(i * 400 + bw - 20, CANVAS_HEIGHT - bh + 20 + wy, 10, 10);
        }
      }
      ctx.restore();

      ctx.save();
      ctx.translate(-cameraXRef.current, 0);

      // Platforms
      platformsRef.current.forEach(p => {
        if (p.type === 'mystery-block') {
          ctx.fillStyle = p.isHit ? COLORS.MYSTERY_BLOCK_HIT : COLORS.MYSTERY_BLOCK;
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.strokeStyle = COLORS.NEON_CYAN;
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x, p.y, p.width, p.height);
          
          if (!p.isHit) {
            ctx.fillStyle = COLORS.NEON_CYAN;
            ctx.font = 'bold 20px monospace';
            ctx.fillText('?', p.x + 15, p.y + 28);
          }
        } else {
          // Metal Arcade Ground
          ctx.fillStyle = COLORS.GROUND;
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.strokeStyle = COLORS.GROUND_ACCENT;
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x, p.y, p.width, p.height);
          
          // Rivets
          ctx.fillStyle = '#18181b';
          ctx.fillRect(p.x + 5, p.y + 5, 4, 4);
          ctx.fillRect(p.x + p.width - 9, p.y + 5, 4, 4);
          ctx.fillRect(p.x + 5, p.y + p.height - 9, 4, 4);
          ctx.fillRect(p.x + p.width - 9, p.y + p.height - 9, 4, 4);

          // Green Pipes (from cover art)
          if (p.type === 'ground' && p.x % 1000 === 0) {
            ctx.fillStyle = COLORS.PIPE;
            ctx.fillRect(p.x + 200, p.y + p.height, 40, 100);
            ctx.fillRect(p.x + 180, p.y + p.height + 20, 80, 20);
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
        } else if (pu.type === 'carrot') {
          // Draw Carrot
          ctx.fillStyle = COLORS.CARROT;
          ctx.beginPath();
          ctx.moveTo(pu.x + 5, pu.y + 5);
          ctx.lineTo(pu.x + 25, pu.y + 25);
          ctx.lineTo(pu.x + 5, pu.y + 25);
          ctx.fill();
          ctx.fillStyle = COLORS.NEON_GREEN;
          ctx.fillRect(pu.x + 2, pu.y, 6, 6);
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
          // Mechanical Pig Ship (from cover art)
          ctx.fillStyle = COLORS.BOSS_METAL;
          ctx.beginPath();
          ctx.ellipse(e.x + 60, e.y + 60, 60, 50, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Large Cannon
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(e.x + 40, e.y + 70, 80, 30);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(e.x + 40, e.y + 70, 80, 30);
          
          // Red Eyes
          ctx.fillStyle = COLORS.BOSS_EYE;
          ctx.beginPath();
          ctx.arc(e.x + 30, e.y + 40, 12, 0, Math.PI * 2);
          ctx.arc(e.x + 90, e.y + 40, 12, 0, Math.PI * 2);
          ctx.fill();
          
          // Snout
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(e.x + 60, e.y + 55, 25, 18, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Detailed Minions (from cover art)
          if (e.type === 'guinea-pig') {
            // Space Suit Guinea Pig
            ctx.fillStyle = COLORS.GUINEA_PIG_SUIT;
            ctx.beginPath();
            ctx.arc(e.x + 20, e.y + 20, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Glass Helmet
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x + 20, e.y + 20, 20, 0, Math.PI * 2);
            ctx.stroke();
            
            // Face
            ctx.fillStyle = COLORS.GUINEA_PIG;
            ctx.beginPath();
            ctx.arc(e.x + 20, e.y + 22, 12, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Aggressive Rabbit
            ctx.fillStyle = COLORS.RABBIT;
            ctx.beginPath();
            ctx.ellipse(e.x + 20, e.y + 25, 15, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Long Ears
            ctx.beginPath();
            ctx.ellipse(e.x + 10, e.y + 5, 5, 15, 0.2, 0, Math.PI * 2);
            ctx.ellipse(e.x + 30, e.y + 5, 5, 15, -0.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Red Eyes
            ctx.fillStyle = COLORS.RABBIT_EYE;
            ctx.fillRect(e.x + 12, e.y + 18, 4, 4);
            ctx.fillRect(e.x + 24, e.y + 18, 4, 4);
          }
          
          // Tiny Gun
          ctx.fillStyle = '#333';
          const gunX = e.vx > 0 ? e.x + 25 : e.x - 5;
          ctx.fillRect(gunX, e.y + 25, 15, 6);
        }
        
        // Enemy HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(e.x, e.y - 15, e.width, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x, e.y - 15, (e.hp / e.maxHp) * e.width, 6);
      });

      // Bullets
      bulletsRef.current.forEach(b => {
        if (b.type === 'carrot') {
          ctx.fillStyle = COLORS.CARROT;
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.fillStyle = COLORS.NEON_GREEN;
          ctx.fillRect(b.x + (b.vx > 0 ? b.width - 5 : 0), b.y, 5, b.height);
        } else {
          ctx.fillStyle = b.owner === 'player' ? COLORS.BULLET : COLORS.ENEMY_BULLET;
          ctx.fillRect(b.x, b.y, b.width, b.height);
        }
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.owner === 'player' ? COLORS.BULLET : COLORS.ENEMY_BULLET;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
      });

      // Player (GarlicPig)
      const player = playerRef.current;
      
      // Muscular Arms (from cover art)
      ctx.fillStyle = COLORS.PIG;
      const armX = player.facing === 'right' ? player.x - 5 : player.x + 25;
      ctx.beginPath();
      ctx.ellipse(armX + 10, player.y + 25, 12, 8, 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Tattoo on arm
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(armX + 5, player.y + 25);
      ctx.lineTo(armX + 15, player.y + 25);
      ctx.stroke();

      // Body
      ctx.fillStyle = COLORS.PIG_DARK;
      ctx.beginPath();
      ctx.ellipse(player.x + 20, player.y + 20, 20, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.PIG;
      ctx.beginPath();
      ctx.ellipse(player.x + 20, player.y + 20, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Green Military Vest
      ctx.fillStyle = COLORS.VEST;
      ctx.fillRect(player.x + 5, player.y + 10, 30, 20);
      ctx.strokeStyle = '#1a2e05';
      ctx.strokeRect(player.x + 5, player.y + 10, 30, 20);
      
      // Curly Tail
      ctx.strokeStyle = COLORS.PIG_DARK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const tailX = player.facing === 'right' ? player.x : player.x + 40;
      ctx.moveTo(tailX, player.y + 20);
      ctx.quadraticCurveTo(tailX - (player.facing === 'right' ? 10 : -10), player.y + 10, tailX, player.y);
      ctx.stroke();

      // Snout
      ctx.fillStyle = '#ffb6c1';
      const snoutX = player.facing === 'right' ? player.x + 30 : player.x - 5;
      ctx.beginPath();
      ctx.ellipse(snoutX + 7, player.y + 25, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.fillRect(snoutX + 4, player.y + 23, 2, 2);
      ctx.fillRect(snoutX + 8, player.y + 23, 2, 2);
      
      // Military Helmet with Garlic Bulb (from cover art)
      ctx.fillStyle = COLORS.HELMET;
      ctx.beginPath();
      ctx.arc(player.x + 20, player.y + 5, 22, Math.PI, 0);
      ctx.fill();
      
      // Garlic Bulb on top
      ctx.fillStyle = COLORS.GARLIC;
      ctx.beginPath();
      ctx.moveTo(player.x + 20, player.y - 15);
      ctx.quadraticCurveTo(player.x + 10, player.y - 5, player.x + 20, player.y + 5);
      ctx.quadraticCurveTo(player.x + 30, player.y - 5, player.x + 20, player.y - 15);
      ctx.fill();
      ctx.fillStyle = '#4ade80'; // Green leaf on garlic
      ctx.fillRect(player.x + 18, player.y - 18, 4, 4);
      
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
      const gunX = player.facing === 'right' ? player.x + 20 : player.x - 20;
      ctx.fillRect(gunX, player.y + 22, 40, 12);
      ctx.fillStyle = '#444';
      ctx.fillRect(gunX + (player.facing === 'right' ? 30 : 0), player.y + 24, 10, 8); // Barrel
      ctx.fillStyle = '#111';
      ctx.fillRect(gunX + 10, player.y + 30, 15, 10); // Magazine
      
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
            <div className="flex gap-2 mt-2">
              <div className="text-xs font-bold text-orange-400">CARROTS: {playerRef.current.carrotBombs}</div>
              <div className="text-xs font-bold text-zinc-400">LEVEL: {currentLevel}</div>
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
