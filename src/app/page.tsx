'use client';

import ChessBoard from '@/components/ChessBoard';
import VariantGraph from '@/components/VariantGraph';
import ControlPanel from '@/components/ControlPanel';
import EvalBar from '@/components/EvalBar';
import EngineLines from '@/components/EngineLines';
import ReviewPanel from '@/components/ReviewPanel';
import styles from './page.module.css';
import { useGameStore } from '@/store/useGameStore';
import { useEffect, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';

export default function Home() {
  const { navigateBack, navigateForward, nodes, activeNodeId, reviewMode } = useGameStore();
  const activeNode = nodes[activeNodeId];
  const fen = activeNode?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const turn = fen.split(' ')[1] as 'w' | 'b';
  
  // We only run engine if NOT in review mode
  const { evalScore, mate, lines } = useEngine(!reviewMode ? fen : '');

  useEffect(() => {
    // Force Chessground to recalculate bounds after layout shift
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, [reviewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateBack();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBack, navigateForward]);

  return (
    <main className={styles.main}>
      <div className={styles.leftPanel}>
        <div className={styles.boardArea}>
          {!reviewMode && (
            <div className={styles.engineLinesTop}>
              <EngineLines lines={lines} turn={turn} />
            </div>
          )}
          <div className={styles.boardWithEval}>
            {!reviewMode && (
              <div className={styles.evalBarWrapper}>
                <EvalBar scoreCp={evalScore} mate={mate} turn={turn} />
              </div>
            )}
            <div className={styles.boardWrapper}>
              <ChessBoard />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.rightPanel}>
        <ControlPanel />
        {reviewMode ? <ReviewPanel /> : <VariantGraph />}
      </div>
    </main>
  );
}
