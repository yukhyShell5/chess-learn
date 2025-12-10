'use client';

import { useGameStore } from '@/store/useGameStore';
import { ChevronLeft, ChevronRight, RotateCcw, Trash2, Download, Upload, FileDown, FileUp, Search } from 'lucide-react';
import styles from './ControlPanel.module.css';
import { useRef, useState } from 'react';
import { fetchLichessGames, fetchChessComGames } from '@/lib/api';

export default function ControlPanel() {
  const { navigateBack, navigateForward, resetBoard, clearStudy, importPGN, exportPGN, analyzeGames } = useGameStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImportClipboard = () => {
    const pgn = window.prompt('Paste PGN here:');
    if (pgn) {
      importPGN(pgn);
    }
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const pgn = e.target?.result as string;
      if (pgn) {
        importPGN(pgn);
      }
    };
    reader.readAsText(file);
    
    // Reset input to allow re-importing the same file
    event.target.value = '';
  };

  const handleExportClipboard = () => {
    const pgn = exportPGN();
    navigator.clipboard.writeText(pgn).then(() => {
      alert('PGN copied to clipboard!');
    }).catch(() => {
      alert('PGN:\n' + pgn);
    });
  };

  const handleExportFile = () => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-study-${Date.now()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    const platform = window.prompt('Enter platform (lichess or chess.com):', 'lichess');
    if (!platform) return;
    
    const username = window.prompt('Enter username:');
    if (!username) return;

    setIsAnalyzing(true);
    try {
      let pgns: string[] = [];
      if (platform.toLowerCase() === 'lichess') {
        pgns = await fetchLichessGames(username, 100);
      } else if (platform.toLowerCase() === 'chess.com') {
        pgns = await fetchChessComGames(username, 100);
      } else {
        alert('Unknown platform');
        setIsAnalyzing(false);
        return;
      }

      if (pgns.length === 0) {
        alert('No games found');
      } else {
        // Clear existing study before analysis? Or merge?
        // User asked to "make a graph", usually implies a fresh start or specific analysis.
        // Let's ask or just clear. For simplicity, let's clear to avoid mixing with random PGNs.
        // Or maybe merge is better? "Repertoire" implies building up.
        // Let's clear for now to ensure clean analysis of "last 100 games".
        if (window.confirm('This will clear current study. Continue?')) {
            clearStudy();
            analyzeGames(pgns);
            alert(`Analyzed ${pgns.length} games!`);
        }
      }
    } catch (e: any) {
      alert('Error fetching games: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={styles.panel}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pgn"
        style={{ display: 'none' }}
      />
      
      <div className={styles.group}>
        <button className={styles.button} onClick={navigateBack} title="Back">
          <ChevronLeft size={20} />
        </button>
        <button className={styles.button} onClick={navigateForward} title="Forward">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button className={styles.button} onClick={resetBoard} title="Reset Board (Keep Tree)">
          <RotateCcw size={20} />
          <span>Reset</span>
        </button>
        <button className={`${styles.button} ${styles.danger}`} onClick={clearStudy} title="Clear Entire Study">
          <Trash2 size={20} />
          <span>Clear</span>
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button className={styles.button} onClick={handleAnalyze} disabled={isAnalyzing} title="Analyze Games">
          <Search size={20} />
          <span>{isAnalyzing ? 'Loading...' : 'Analyze'}</span>
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button className={styles.button} onClick={handleImportClipboard} title="Import from Clipboard">
          <Upload size={20} />
          <span>Paste</span>
        </button>
        <button className={styles.button} onClick={handleImportFile} title="Import from File">
          <FileUp size={20} />
          <span>File</span>
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button className={styles.button} onClick={handleExportClipboard} title="Export to Clipboard">
          <Download size={20} />
          <span>Copy</span>
        </button>
        <button className={styles.button} onClick={handleExportFile} title="Export to File">
          <FileDown size={20} />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}
