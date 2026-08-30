'use client';

import { useEffect, useRef, useState } from 'react';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { useGameStore } from '@/store/useGameStore';
import { Chess } from 'chess.js'; // Just for types or utility if needed locally
import styles from './ChessBoard.module.css';

export default function ChessBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<Api | null>(null);
  const { nodes, activeNodeId, makeMove } = useGameStore();
  
  const activeNode = nodes[activeNodeId];
  const fen = activeNode.fen;

  // Initialize Chessground
  useEffect(() => {
    if (!containerRef.current) return;

    const chess = new Chess(fen); // Local instance to calculate legal moves for highlighting

    const config: Config = {
      fen: fen,
      coordinates: true,
      movable: {
        color: 'both', // Allow moving both sides for analysis/study
        free: false,
        dests: getLegalMoves(chess),
      },
      events: {
        move: (orig, dest) => {
          const { reviewMode, makeMove, reviewMove } = useGameStore.getState();
          if (reviewMode) {
            reviewMove(orig, dest);
          } else {
            makeMove(orig, dest);
          }
        },
      },
      highlight: {
        lastMove: true,
        check: true,
      },
      drawable: {
        enabled: true, // Allow drawing arrows/circles for study
      }
    };

    const groundApi = Chessground(containerRef.current, config);
    setApi(groundApi);

    return () => {
      groundApi.destroy();
    };
  }, []); // Run once on mount? No, we need to update it when FEN changes.

  // Update board when FEN or Active Node changes
  useEffect(() => {
    if (!api) return;

    const chess = new Chess(fen);
    
    // Calculate last move for highlighting
    const lastMove = activeNode.move ? [activeNode.move.from, activeNode.move.to] : [];

    api.set({
      fen: fen,
      lastMove: lastMove as any, // chessground types might be slightly different but [string, string] usually works
      movable: {
        dests: getLegalMoves(chess),
      },
    });
  }, [fen, api, activeNode]);

  // Helper to get legal moves map for Chessground
  function getLegalMoves(chess: Chess) {
    const dests = new Map();
    chess.moves({ verbose: true }).forEach((m) => {
      if (!dests.has(m.from)) dests.set(m.from, []);
      dests.get(m.from).push(m.to);
    });
    return dests;
  }

  return (
    <div className={styles.boardContainer}>
      <div ref={containerRef} className={styles.board} />
    </div>
  );
}
