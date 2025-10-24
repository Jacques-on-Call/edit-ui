import { useState, useCallback } from 'react';

export function useDraggable() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const onDragStart = useCallback((e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const onDragMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  return {
    isDragging,
    dragOffset,
    draggableProps: {
      onTouchStart: onDragStart,
      onTouchMove: onDragMove,
      onTouchEnd: onDragEnd,
    },
  };
}
