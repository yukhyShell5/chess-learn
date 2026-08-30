import { useEffect, useRef, useState } from 'react';

export interface EngineLine {
  depth: number;
  score: number; // in centipawns. If mate, it will be 10000 + mate in X
  mate?: number; // if it's a mate, how many moves
  pv: string[]; // sequence of moves like ["e2e4", "e7e5"]
}

export function useEngine(fen: string) {
  const workerRef = useRef<Worker | null>(null);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [mate, setMate] = useState<number | null>(null);
  const [lines, setLines] = useState<EngineLine[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!fen) {
      setLines([]);
      setEvalScore(0);
      setMate(null);
      return;
    }

    // Reset UI state for new position
    setLines([]);
    setEvalScore(0);
    setMate(null);

    // Create a fresh worker for every position to avoid single-threaded WASM crashes on 'stop'
    const worker = new Worker('/chess-learn/stockfish/stockfish-18-lite-single.js');

    worker.onerror = (err) => {
      console.error('Worker error:', err);
    };

    worker.onmessage = (e) => {
      const msg = e.data;
      if (typeof msg !== 'string') return;
      
      if (msg.startsWith('info depth')) {
        parseInfo(msg);
      }
    };

    // Initialize and start searching immediately
    worker.postMessage('uci');
    worker.postMessage('setoption name MultiPV value 3');
    worker.postMessage('ucinewgame');
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage('go infinite');

    return () => {
      // Hard kill the worker when the position changes or unmounts
      worker.terminate();
    };
  }, [fen]);

  const parseInfo = (msg: string) => {
    // Example: info depth 15 ... score cp 120 ... pv e2e4 e7e5 ...
    // or: info depth 15 ... score mate 3 ... multipv 1 ... pv ...
    const tokens = msg.split(' ');
    
    let depth = 0;
    let score = 0;
    let mateIn = null;
    let multiPv = 1;
    let pvIndex = -1;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === 'depth') depth = parseInt(tokens[i + 1], 10);
      else if (tokens[i] === 'multipv') multiPv = parseInt(tokens[i + 1], 10);
      else if (tokens[i] === 'score') {
        if (tokens[i + 1] === 'cp') {
          score = parseInt(tokens[i + 2], 10);
        } else if (tokens[i + 1] === 'mate') {
          mateIn = parseInt(tokens[i + 2], 10);
          score = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn; // Arbitrary high value for mate
        }
      } else if (tokens[i] === 'pv') {
        pvIndex = i + 1;
        break;
      }
    }

    if (pvIndex !== -1) {
      const pv = tokens.slice(pvIndex);
      
      setLines((prev) => {
        const newLines = [...prev];
        // Ensure array is large enough
        while (newLines.length < multiPv) newLines.push({ depth: 0, score: 0, pv: [] });
        
        newLines[multiPv - 1] = { depth, score, mate: mateIn || undefined, pv };
        
        // The evaluation of the position is usually the score of multipv 1
        if (multiPv === 1) {
          setEvalScore(score);
          setMate(mateIn);
        }
        
        return newLines;
      });
    }
  };

  return { evalScore, mate, lines };
}
