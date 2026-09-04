'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, ExternalLink, Download } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Payment Proof / Bill Document',
}: ImageLightboxModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Container - Stop propagation on inner click */}
      <div
        className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-between rounded-3xl bg-[#060f2a] border border-devotional-gold-500/40 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="w-full px-4 py-3 border-b border-devotional-gold-500/20 flex items-center justify-between bg-devotional-blue-950/80">
          <div className="truncate pr-2">
            <h3 className="text-sm sm:text-base font-extrabold text-devotional-gold-300 truncate">
              {title}
            </h3>
            <p className="text-[10px] text-gray-400">Pinch or tap zoom to inspect details</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white transition-colors"
              title={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white transition-colors"
              title="Open full resolution"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 hover:text-white transition-colors"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Image Viewport */}
        <div className="w-full flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 bg-black/40 min-h-[50vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className={`rounded-xl object-contain transition-transform duration-200 select-none ${
              isZoomed
                ? 'scale-150 cursor-zoom-out'
                : 'max-h-[70vh] max-w-full cursor-zoom-in shadow-xl border border-white/10'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>

        {/* Footer actions */}
        <div className="w-full p-3 bg-devotional-blue-950/80 border-t border-devotional-gold-500/20 flex items-center justify-between text-xs">
          <span className="text-[11px] text-gray-400">
            Tap image to {isZoomed ? 'reset size' : 'zoom in'}
          </span>
          <a
            href={imageUrl}
            download="payment-document.jpg"
            className="px-3.5 py-1.5 rounded-xl bg-devotional-gold-500 hover:bg-devotional-gold-400 text-devotional-blue-950 font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Image</span>
          </a>
        </div>
      </div>
    </div>
  );
}
