'use client';

import { useGameStore } from '@/store/useGameStore';
import styles from './ReviewPanel.module.css';

export default function ReviewPanel() {
  const { reviewStatus, playRandomComputerMove, activeNodeId, nodes, startReview, rootId } = useGameStore();

  const activeNode = nodes[activeNodeId];
  const hasChildren = activeNode?.children?.length > 0;

  if (reviewStatus === 'idle') {
    // Find branching nodes
    const branchingNodes = Object.values(nodes).filter(n => n.children.length > 1 && n.id !== rootId);

    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Mode Révision</h2>
        <div className={styles.choiceList}>
          <p className={styles.subtitle}>Choisissez un point de départ :</p>
          <button className={styles.choiceButton} onClick={() => startReview(rootId)}>
            Depuis le début (Position Initiale)
          </button>
          {branchingNodes.map(n => (
            <button key={n.id} className={styles.choiceButton} onClick={() => startReview(n.id)}>
              Depuis la variation après {n.move?.san}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Mode Révision</h2>
      
      <div className={styles.statusBox} data-status={reviewStatus}>
        {reviewStatus === 'none' && (
          <p>Jouez un coup pour tester votre mémoire.</p>
        )}
        {reviewStatus === 'correct' && (
          <p className={styles.correct}>✅ Correct ! (L'ordinateur joue...)</p>
        )}
        {reviewStatus === 'wrong' && (
          <p className={styles.wrong}>❌ Mauvais coup, réessayez !</p>
        )}
        {reviewStatus === 'finished' && (
          <p className={styles.finished}>🎉 Fin de la ligne ! Vous avez tout bon.</p>
        )}
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.button} 
          onClick={playRandomComputerMove}
          disabled={!hasChildren || reviewStatus === 'finished'}
        >
          Faire jouer l'ordinateur (coup au hasard)
        </button>
      </div>
    </div>
  );
}
