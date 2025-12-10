import { create } from 'zustand';
import { Chess, Move } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'pgn-parser';

export interface MoveNode {
  id: string;
  fen: string;
  move: Move | null; // null for the root node
  children: string[]; // IDs of children nodes
  parentId: string | null;
  comment?: string;
  stats?: {
    white: number;
    black: number;
    draw: number;
    total: number;
  };
}

interface GameState {
  game: Chess; // The chess.js instance for logic validation
  nodes: Record<string, MoveNode>; // Map of all nodes
  rootId: string;
  activeNodeId: string; // The currently selected node
  
  // Actions
  makeMove: (source: string, target: string) => boolean;
  navigateToNode: (nodeId: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  deleteNode: (nodeId: string) => void;
  resetBoard: () => void;
  clearStudy: () => void;
  importPGN: (pgn: string) => void;
  analyzeGames: (pgns: string[]) => void;
  exportPGN: () => string;
}

export const useGameStore = create<GameState>((set, get) => {
  const initialGame = new Chess();
  const rootId = 'root';
  
  const initialNodes: Record<string, MoveNode> = {
    [rootId]: {
      id: rootId,
      fen: initialGame.fen(),
      move: null,
      children: [],
      parentId: null,
    },
  };

  return {
    game: initialGame,
    nodes: initialNodes,
    rootId,
    activeNodeId: rootId,

    // ... (makeMove, navigateToNode, etc. remain same, skipping for brevity in this tool call if possible, but I must provide context)
    // Actually, I need to replace the whole file or large chunks to be safe.
    // Let's just append the new action and update the interface.
    
    // ... makeMove ...
    makeMove: (source, target) => {
      const { game, nodes, activeNodeId } = get();
      const activeNode = nodes[activeNodeId];
      const tempGame = new Chess(activeNode.fen);
      
      try {
        const moveResult = tempGame.move({ from: source, to: target, promotion: 'q' });
        if (!moveResult) return false;

        const newFen = tempGame.fen();
        const existingChildId = activeNode.children.find(childId => {
          const childNode = nodes[childId];
          return childNode.move?.san === moveResult.san;
        });

        if (existingChildId) {
          set({ activeNodeId: existingChildId });
          return true;
        }

        const newNodeId = uuidv4();
        const newNode: MoveNode = {
          id: newNodeId,
          fen: newFen,
          move: moveResult,
          children: [],
          parentId: activeNodeId,
        };

        set(state => ({
          nodes: {
            ...state.nodes,
            [activeNodeId]: {
              ...state.nodes[activeNodeId],
              children: [...state.nodes[activeNodeId].children, newNodeId],
            },
            [newNodeId]: newNode,
          },
          activeNodeId: newNodeId,
        }));
        return true;
      } catch (e) { return false; }
    },

    navigateToNode: (nodeId) => { set({ activeNodeId: nodeId }); },
    navigateBack: () => {
      const { nodes, activeNodeId } = get();
      const activeNode = nodes[activeNodeId];
      if (activeNode.parentId) set({ activeNodeId: activeNode.parentId });
    },
    navigateForward: () => {
      const { nodes, activeNodeId } = get();
      const activeNode = nodes[activeNodeId];
      if (activeNode.children && activeNode.children.length > 0) set({ activeNodeId: activeNode.children[0] });
    },
    deleteNode: (nodeId) => {
       // ... existing delete logic ...
       const { nodes, activeNodeId, rootId } = get();
       if (nodeId === rootId) return;
       const nodesToDelete = new Set<string>([nodeId]);
       const collectDescendants = (id: string) => {
         const node = nodes[id];
         if (node?.children) node.children.forEach(c => { nodesToDelete.add(c); collectDescendants(c); });
       };
       collectDescendants(nodeId);
       const parentId = nodes[nodeId].parentId;
       if (parentId && nodes[parentId]) {
         const parent = nodes[parentId];
         const newChildren = parent.children.filter(id => id !== nodeId);
         const newNodes = { ...nodes };
         nodesToDelete.forEach(id => delete newNodes[id]);
         newNodes[parentId] = { ...parent, children: newChildren };
         const newActiveNodeId = nodesToDelete.has(activeNodeId) ? parentId : activeNodeId;
         set({ nodes: newNodes, activeNodeId: newActiveNodeId });
       }
    },
    resetBoard: () => { set({ activeNodeId: rootId }); },
    clearStudy: () => {
      const newGame = new Chess();
      set({
        game: newGame,
        nodes: { [rootId]: { id: rootId, fen: newGame.fen(), move: null, children: [], parentId: null } },
        activeNodeId: rootId,
      });
    },

    importPGN: (pgn: string) => {
        // ... existing import logic ...
        // We will repurpose analyzeGames to be the main "merge" logic
        // But for now let's keep importPGN as "replace study"
        get().analyzeGames([pgn]); // Reuse analyzeGames but maybe clear first?
        // Actually, the user might want to ADD to the study.
        // Let's make importPGN clear and then analyze.
        get().clearStudy();
        get().analyzeGames([pgn]);
    },

    analyzeGames: (pgns: string[]) => {
      try {
        const { nodes, rootId } = get();
        const newNodes = { ...nodes };
        
        // Helper to find or create child
        const findOrCreateChild = (parentId: string, moveSan: string, currentFen: string, result: string) => {
           const parent = newNodes[parentId];
           const tempGame = new Chess(currentFen);
           const moveResult = tempGame.move(moveSan);
           if (!moveResult) return null;
           
           const newFen = tempGame.fen();
           
           // Check existing
           let childId = parent.children.find(cid => newNodes[cid].move?.san === moveSan);
           
           if (!childId) {
             childId = uuidv4();
             const newNode: MoveNode = {
               id: childId,
               fen: newFen,
               move: moveResult,
               children: [],
               parentId: parentId,
               stats: { white: 0, black: 0, draw: 0, total: 0 }
             };
             newNodes[childId] = newNode;
             parent.children.push(childId);
           }
           
           // Update stats
           const childNode = newNodes[childId];
           if (!childNode.stats) childNode.stats = { white: 0, black: 0, draw: 0, total: 0 };
           
           childNode.stats.total++;
           if (result === '1-0') childNode.stats.white++;
           else if (result === '0-1') childNode.stats.black++;
           else if (result === '1/2-1/2') childNode.stats.draw++;
           
           return { id: childId, fen: newFen };
        };

        // Process all PGNs
        // If pgns is an array of strings, some might contain multiple games (Lichess)
        // We need to parse them all.
        
        let allGames: any[] = [];
        for (const pgnChunk of pgns) {
           // Sanitize
           let cleanPgn = pgnChunk; // pgn-parser handles multiple games nicely usually
           // But our previous sanitizer only checked the END.
           // If it's multiple games, we might not need to append *.
           // Let's trust pgn-parser for bulk PGNs or try to parse.
           
           const parsed = parse(cleanPgn);
           if (parsed) allGames = allGames.concat(parsed);
        }

        for (const gameData of allGames) {
           const result = gameData.headers?.Result || '*';
           const moves = gameData.moves;
           
           let currentId = rootId;
           let currentFen = newNodes[rootId].fen;
           
           for (const moveData of moves) {
              const moveSan = moveData.move;
              const next = findOrCreateChild(currentId, moveSan, currentFen, result);
              if (next) {
                currentId = next.id;
                currentFen = next.fen;
              } else {
                break; // Invalid move in PGN
              }
           }
        }
        
        set({ nodes: newNodes });
        
      } catch (e) {
        console.error('Analysis failed', e);
        alert('Analysis failed: ' + e);
      }
    },


    exportPGN: () => {
      const { nodes, rootId } = get();
      
      // Recursive function to build PGN
      const buildPGN = (nodeId: string): string => {
        const node = nodes[nodeId];
        if (!node.children || node.children.length === 0) return '';

        let pgn = '';
        
        // Main line is the first child (usually)
        // But in our tree, children are unordered. We should probably treat the first added as main line?
        // Or just take the first one.
        
        const mainChildId = node.children[0];
        const mainChild = nodes[mainChildId];
        
        // Move number logic is complex if we jump around, but let's try basic
        // We need the move number from the FEN or calculate it.
        // chess.js move object has 'before' and 'after' FENs, but not move number directly in simple object?
        // Actually moveResult has 'san'.
        // We can get move number from FEN.
        
        const parentFen = node.fen;
        const tempGame = new Chess(parentFen);
        const moveNumber = tempGame.moveNumber();
        const turn = tempGame.turn(); // 'w' or 'b'
        
        const moveString = (turn === 'w' ? `${moveNumber}. ` : (nodeId === rootId ? `${moveNumber}... ` : '')) + mainChild.move?.san;
        
        pgn += moveString + ' ';
        
        // Add comments if any
        if (mainChild.comment) {
            pgn += `{ ${mainChild.comment} } `;
        }

        // Add variations (siblings of mainChild? No, siblings are variations of THIS move)
        // Wait, node.children are ALL variations from the current position.
        // So child[0] is main line, child[1..n] are variations.
        
        for (let i = 1; i < node.children.length; i++) {
          const varChildId = node.children[i];
          const varChild = nodes[varChildId];
          const varMoveString = (turn === 'w' ? `${moveNumber}. ` : `${moveNumber}... `) + varChild.move?.san;
          
          pgn += `( ${varMoveString} `;
          if (varChild.comment) pgn += `{ ${varChild.comment} } `;
          pgn += buildPGN(varChildId);
          pgn += ') ';
        }

        // Continue main line
        pgn += buildPGN(mainChildId);

        return pgn;
      };

      return buildPGN(rootId).trim();
    }
  };
});
