'use client';
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { centerMenuBox, type CenterBox } from '@/lib/dropdown';

interface SmartDropdownProps {
  trigger: ReactNode;
  triggerClass?: string;
  children: ReactNode;
  menuClass?: string;
}

export default function SmartDropdown({ trigger, triggerClass, children, menuClass = '' }: SmartDropdownProps) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<CenterBox | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const wrap = wrapRef.current;
      const menu = menuRef.current;
      if (!wrap || !menu) return;
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      setBox(centerMenuBox(viewportWidth, viewportHeight, menu.offsetWidth, menu.offsetHeight));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  const menuStyle: CSSProperties | undefined = box
    ? { left: box.left, top: box.top, maxHeight: box.maxHeight, maxWidth: box.maxWidth }
    : undefined;

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
            onClickCapture={e => {
              if (e.target !== menuRef.current) setOpen(false);
            }}
            style={menuStyle}
            className={`fixed z-40 overflow-y-auto dropdown-scroll ${menuClass}`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
