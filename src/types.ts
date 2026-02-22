
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN',
  BOSS_INTRO = 'BOSS_INTRO'
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  ammo: number;
  carrotBombs: number;
  isJumping: boolean;
  facing: 'left' | 'right';
  lastShot: number;
  character: 'pig' | 'horse';
}

export interface Enemy extends Entity {
  type: 'guinea-pig' | 'rabbit' | 'boss';
  hp: number;
  maxHp: number;
  behavior: 'patrol' | 'aggressive' | 'boss-pattern';
  lastShot?: number;
}

export interface Bullet extends Entity {
  owner: 'player' | 'enemy';
  damage: number;
  type: 'normal' | 'carrot';
}

export interface Platform extends Entity {
  type: 'ground' | 'floating' | 'mystery-block' | 'switch-box';
  hasItem?: boolean;
  isHit?: boolean;
}

export interface PowerUp extends Entity {
  type: 'health' | 'ammo' | 'shield' | 'garlic' | 'carrot';
  collected: boolean;
}

export interface GameLevel {
  platforms: Platform[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  finishX: number;
}
