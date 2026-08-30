'use client';

import React from 'react';
import styles from './EvalBar.module.css';

interface EvalBarProps {
  scoreCp: number; // in centipawns, from side to move's POV
  mate: number | null;
  turn: 'w' | 'b'; // 'w' or 'b'
}

export default function EvalBar({ scoreCp, mate, turn }: EvalBarProps) {
  // Convert score to White's point of view
  let whiteScore = scoreCp;
  if (turn === 'b') {
    whiteScore = -whiteScore;
  }
  
  // Calculate percentage for the bar (0 to 100)
  // Usually, +5 is 100%, 0 is 50%, -5 is 0%
  // Let's use a sigmoid or clamped linear function
  
  let percent = 50;
  if (mate !== null) {
    // Mate
    const whiteMate = turn === 'w' ? mate : -mate;
    percent = whiteMate > 0 ? 100 : 0;
  } else {
    // 1 pawns = 100 cp. 
    // Let's say +/- 5 pawns is min/max.
    // 500 cp = 100%, -500 cp = 0%
    // 50 + (score / 10)
    percent = 50 + (whiteScore / 10);
    percent = Math.max(0, Math.min(100, percent));
  }

  // Format text
  let text = '';
  if (mate !== null) {
    const m = Math.abs(mate);
    text = `M${m}`;
  } else {
    const val = Math.abs(whiteScore / 100).toFixed(1);
    text = `${val}`;
  }

  const isWhiteAdvantage = mate !== null ? (turn === 'w' ? mate > 0 : mate < 0) : whiteScore >= 0;

  return (
    <div className={styles.barContainer}>
      <div 
        className={styles.fill} 
        style={{ height: `${percent}%` }}
      />
      <div className={`${styles.score} ${isWhiteAdvantage ? styles.scoreWhite : styles.scoreBlack}`}>
        {text}
      </div>
    </div>
  );
}
