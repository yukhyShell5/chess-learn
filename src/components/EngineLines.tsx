'use client';

import React from 'react';
import { EngineLine } from '@/hooks/useEngine';
import styles from './EngineLines.module.css';

import { useGameStore } from '@/store/useGameStore';

interface EngineLinesProps {
  lines: EngineLine[];
  turn: 'w' | 'b';
}

export default function EngineLines({ lines, turn }: EngineLinesProps) {
  const { playLine } = useGameStore();

  if (!lines || lines.length === 0) return null;

  return (
    <div className={styles.container}>
      {lines.map((line, i) => {
        if (!line.pv || line.pv.length === 0) return null;

        let scoreText = '';
        if (line.mate !== undefined && line.mate !== null) {
          const m = Math.abs(line.mate);
          // If mate > 0, engine side is mating
          const sign = line.mate > 0 ? '+' : '-';
          scoreText = `M${m}`;
          if ((turn === 'w' && line.mate < 0) || (turn === 'b' && line.mate > 0)) {
            scoreText = `-${scoreText}`;
          } else {
             scoreText = `+${scoreText}`;
          }
        } else {
          let score = line.score / 100;
          if (turn === 'b') score = -score;
          scoreText = score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
        }

        return (
          <div key={i} className={styles.line} onClick={() => playLine(line.pv)} title="Click to play this variation">
            <div className={styles.score}>{scoreText}</div>
            <div className={styles.depth}>{line.depth}</div>
            <div className={styles.pv}>{line.pv.join(' ')}</div>
          </div>
        );
      })}
    </div>
  );
}
