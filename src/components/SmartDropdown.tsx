'use client';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { shouldFlipUp } from '@/lib/dropdown';

interface SmartDropdownProps {
  trigger: ReactNode;
  triggerClass?: string;
  children: ReactNode;
  menuClass?: string;
}

export default function SmartDropdown({ trigger, triggerClass, children, menuClass = '' }: SmartDropdownProps) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current;
    const menu = menuRef.current;
    if (!wrap || !menu) return;
    const rect = wrap.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const flip = shouldFlipUp(rect.bottom, menu.offsetHeight, viewportHeight);
    setUp(flip);
    setMaxHeight(flip ? Math.max(120, rect.top - 8) : undefined);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button type="button" onClick={() => setOpen(o => !o)} className={triggerClass}>
        {trigger}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            ref={menuRef}
            onClickCapture={() => setOpen(false)}
            style={maxHeight ? { maxHeight } : undefined}
            className={`absolute right-0 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto ${up ? 'bottom-full mb-1' : 'top-full mt-1'} ${menuClass}`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
