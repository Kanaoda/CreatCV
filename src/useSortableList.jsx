import { useState, useCallback } from 'react';

export function reorderArray(list, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex == null || toIndex == null) return list;
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function useSortableList() {
  const [drag, setDrag] = useState({ key: null, from: null, to: null });

  const start = useCallback((key, index) => {
    setDrag({ key, from: index, to: index });
  }, []);

  const over = useCallback((key, index, event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDrag((prev) => (prev.key === key && prev.from !== null && prev.to !== index
      ? { ...prev, to: index }
      : prev));
  }, []);

  const end = useCallback((key, onReorder) => {
    setDrag((prev) => {
      if (prev.key === key && prev.from !== null && prev.to !== null && prev.from !== prev.to) {
        onReorder(prev.from, prev.to);
      }
      return { key: null, from: null, to: null };
    });
  }, []);

  const itemClassName = useCallback((key, index, baseClass = 'dynamic-item') => {
    const dragging = drag.key === key && drag.from === index;
    const dropTarget = drag.key === key && drag.to === index && drag.from !== index;
    return `${baseClass} sortable-item${dragging ? ' is-dragging' : ''}${dropTarget ? ' is-drop-target' : ''}`;
  }, [drag]);

  const containerProps = useCallback((key, index) => ({
    onDragOver: (e) => over(key, index, e),
    onDrop: (e) => e.preventDefault(),
  }), [over]);

  const handleProps = useCallback((key, index, onReorder) => ({
    type: 'button',
    className: 'drag-handle',
    draggable: true,
    title: 'Drag to reorder',
    'aria-label': `Drag to reorder item ${index + 1}`,
    onDragStart: (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      start(key, index);
    },
    onDragEnd: () => end(key, onReorder),
  }), [start, end]);

  return { itemClassName, containerProps, handleProps };
}

export function SortableToolbar({ index, handleProps, children }) {
  return (
    <div className="sortable-item-toolbar">
      <button {...handleProps}>
        ⋮⋮
      </button>
      <span className="sort-index">{index + 1}</span>
      <div className="sortable-item-toolbar-actions">{children}</div>
    </div>
  );
}
