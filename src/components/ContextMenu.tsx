'use client';

import { useEffect, useRef } from 'react';
import { Trash2, MessageSquare } from 'lucide-react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, nodeId, onDelete, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleDelete = () => {
    onDelete(nodeId);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className={styles.menu}
      style={{ left: x, top: y }}
    >
      <button className={styles.menuItem} onClick={handleDelete}>
        <Trash2 size={16} />
        <span>Delete Node & Children</span>
      </button>
      <button className={styles.menuItem} disabled>
        <MessageSquare size={16} />
        <span>Add Comment (Coming Soon)</span>
      </button>
    </div>
  );
}
