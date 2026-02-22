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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center overflow-hidden bg-black"
          >
            {/* Space Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-zinc-950 to-black" />
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: Math.random() }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2 + Math.random() * 3, repeat: Infinity }}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                />
              ))}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10 mb-12"
            >
              <div className="relative inline-block">
                <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter uppercase italic leading-none select-none
                  bg-gradient-to-b from-zinc-100 via-zinc-400 to-zinc-600 bg-clip-text text-transparent
                  drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] border-b-8 border-red-600/50">
                  GarlicPig
                </h1>
                {/* Drip Effect */}
                <div className="absolute -bottom-8 left-1/4 w-4 h-12 bg-red-600 rounded-full blur-[1px] animate-bounce" />
                <div className="absolute -bottom-4 left-1/2 w-3 h-8 bg-red-600 rounded-full blur-[1px]" />
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-2">
                <h2 className="text-4xl md:text-6xl font-black text-zinc-300 uppercase italic tracking-widest drop-shadow-lg">
                  REVENGE
                </h2>
                <h2 className="text-5xl md:text-7xl font-black text-emerald-400 uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.6)] animate-pulse">
                  2000
                </h2>
              </div>
            </motion.div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl"
              >
                <Shield className="w-8 h-8 text-emerald-400 mb-4 mx-auto" />
                <h3 className="text-lg font-black text-white mb-2 italic">THE MISSION</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Infiltrate the farm-rodent complex and eliminate the space guinea pig threat.</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl"
              >
                <Target className="w-8 h-8 text-red-500 mb-4 mx-auto" />
                <h3 className="text-lg font-black text-white mb-2 italic">THE ENEMIES</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Mutated rabbits and the ultimate Mechanical Pig-Ship Boss await.</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl"
              >
                <Play className="w-8 h-8 text-blue-400 mb-4 mx-auto" />
                <h3 className="text-lg font-black text-white mb-2 italic">CONTROLS</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">WASD to move, SPACE to jump, F to fire. Switch boxes change your form.</p>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 50px rgba(16,185,129,0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="relative z-10 px-16 py-8 bg-emerald-600 text-white rounded-full text-3xl font-black uppercase tracking-[0.2em] italic transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] border-b-4 border-emerald-800"
            >
              Start Mission
            </motion.button>
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
