"use client";

// Live 3D human model with augmented reality (AR) — uses Google's
// <model-viewer> web component, loaded only in the browser.

import { createElement, useEffect, useState } from 'react';

interface ModelViewerProps {
  src: string;
  alt: string;
  arLabel: string;
  loadingLabel: string;
}

export default function ModelViewer({ src, alt, arLabel, loadingLabel }: ModelViewerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('@google/model-viewer')
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">{loadingLabel}</div>
    );
  }

  // createElement keeps TypeScript happy without global JSX declarations.
  return createElement(
    'model-viewer',
    {
      src,
      alt,
      ar: true,
      'ar-modes': 'webxr scene-viewer quick-look',
      'camera-controls': true,
      'touch-action': 'pan-y',
      'auto-rotate': true,
      'auto-rotate-delay': 3000,
      'shadow-intensity': '1',
      exposure: '1',
      'interaction-prompt': 'auto',
      style: { width: '100%', height: '100%' },
    },
    createElement(
      'button',
      {
        slot: 'ar-button',
        className: 'absolute bottom-3 start-3 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg',
      },
      arLabel,
    ),
  );
}
