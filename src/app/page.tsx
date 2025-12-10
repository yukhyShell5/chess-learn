'use client';

import ChessBoard from '@/components/ChessBoard';
import VariantGraph from '@/components/VariantGraph';
import ControlPanel from '@/components/ControlPanel';
import styles from './page.module.css';
import { useGameStore } from '@/store/useGameStore';
import { useEffect } from 'react';

export default function Home() {
  const { navigateBack, navigateForward } = useGameStore();

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
        <ChessBoard />
      </div>
      <div className={styles.rightPanel}>
        <ControlPanel />
        <VariantGraph />
      </div>
    </main>
  );
}
