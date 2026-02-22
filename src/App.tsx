/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, Play, Shield, Target } from 'lucide-react';
import { Game } from './components/Game';
import { GameState } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [lastScore, setLastScore] = useState(0);

  const startGame = () => setGameState(GameState.PLAYING);
  const handleGameOver = (score: number) => {
    setLastScore(score);
    setGameState(GameState.GAME_OVER);
  };
  const handleWin = () => setGameState(GameState.WIN);

  return (
    <div className="w-full h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {gameState === GameState.MENU && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mb-12"
            >
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic text-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                GarlicPig
              </h1>
              <h2 className="text-3xl md:text-5xl font-mono font-bold text-zinc-400 -mt-4">
                REVENGE 2000
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mb-12">
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <Shield className="w-8 h-8 text-emerald-500 mb-4 mx-auto" />
                <h3 className="text-lg font-bold mb-2">THE MISSION</h3>
                <p className="text-sm text-zinc-500">Infiltrate the rodent base and eliminate the space guinea pig threat.</p>
              </div>
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <Target className="w-8 h-8 text-emerald-500 mb-4 mx-auto" />
                <h3 className="text-lg font-bold mb-2">THE ENEMIES</h3>
                <p className="text-sm text-zinc-500">Watch out for mutated rabbits and the ultimate Cyber-Hamster boss.</p>
              </div>
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <Play className="w-8 h-8 text-emerald-500 mb-4 mx-auto" />
                <h3 className="text-lg font-bold mb-2">CONTROLS</h3>
                <p className="text-sm text-zinc-500">WASD to move, SPACE to jump, F to fire your machine gun.</p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="group relative px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
            >
              Start Operation
            </button>
          </motion.div>
        )}

        {gameState === GameState.PLAYING && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Game onGameOver={handleGameOver} onWin={handleWin} />
          </motion.div>
        )}

        {gameState === GameState.GAME_OVER && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950"
          >
            <Skull className="w-24 h-24 text-red-500 mb-6" />
            <h2 className="text-6xl font-black text-white mb-2 uppercase italic">Killed in Action</h2>
            <p className="text-2xl font-mono text-zinc-500 mb-8">Final Score: {lastScore}</p>
            <button
              onClick={startGame}
              className="px-10 py-4 bg-zinc-100 text-zinc-950 rounded-full text-xl font-bold uppercase hover:bg-white transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => setGameState(GameState.MENU)}
              className="mt-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Return to Menu
            </button>
          </motion.div>
        )}

        {gameState === GameState.WIN && (
          <motion.div 
            key="win"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 bg-emerald-950"
          >
            <Trophy className="w-32 h-32 text-yellow-400 mb-8 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
            <h2 className="text-7xl font-black text-white mb-4 uppercase italic">Mission Accomplished</h2>
            <p className="text-2xl font-mono text-emerald-200 mb-12">The rodents have been defeated!</p>
            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-10 py-4 bg-white text-emerald-950 rounded-full text-xl font-bold uppercase hover:bg-emerald-50 transition-all"
              >
                Play Again
              </button>
              <button
                onClick={() => setGameState(GameState.MENU)}
                className="px-10 py-4 bg-emerald-800 text-white rounded-full text-xl font-bold uppercase hover:bg-emerald-700 transition-all"
              >
                Menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
