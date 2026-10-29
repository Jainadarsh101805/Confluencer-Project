import React, { useEffect, useState } from 'react';

interface PrecisionCursorProps {
  enabled: boolean;
}

export const PrecisionCursor: React.FC<PrecisionCursorProps> = ({ enabled }) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.dataset.interactive)
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const onMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [enabled]);

  // Smooth trail update
  useEffect(() => {
    if (!enabled || !isVisible) return;

    let animId: number;
    const follow = () => {
      setTrail((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.25,
        y: prev.y + (position.y - prev.y) * 0.25,
      }));
      animId = requestAnimationFrame(follow);
    };
    animId = requestAnimationFrame(follow);

    return () => cancelAnimationFrame(animId);
  }, [position, enabled, isVisible]);

  if (!enabled || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Precision Trailing Aura */}
      <div
        className={`fixed top-0 left-0 rounded-full transition-transform duration-75 ease-out ${
          isHovering
            ? 'w-8 h-8 border border-ledger-lime/80 bg-ledger-lime/10'
            : 'w-5 h-5 border border-ledger-lime/40'
        }`}
        style={{
          transform: `translate3d(${trail.x - (isHovering ? 16 : 10)}px, ${
            trail.y - (isHovering ? 16 : 10)
          }px, 0)`,
        }}
      />
      {/* Precision Core Dot */}
      <div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-ledger-lime"
        style={{
          transform: `translate3d(${position.x - 3}px, ${position.y - 3}px, 0)`,
        }}
      />
    </div>
  );
};
