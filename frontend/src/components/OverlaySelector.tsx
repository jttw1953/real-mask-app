// src/components/OverlaySelector.tsx

import React, { useEffect } from 'react';
import type { Overlay } from '../types/overlayType';
import { X } from 'lucide-react';

interface OverlaySelectorProps {
  overlays: Overlay[];
  currentSelected: string;
  onSelect: (overlay: Overlay) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function OverlaySelector({
  overlays,
  currentSelected,
  onSelect,
  isOpen,
  onClose,
}: OverlaySelectorProps) {
  // Don't render if not open
  if (!isOpen) return null;

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    // Backdrop - dark overlay covering entire screen
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Modal Container - prevent clicks from closing */}
      <div
        className="bg-slate-800/95 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Select Overlay</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close overlay selector"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {overlays.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No overlays available</p>
            </div>
          ) : (
            // Overlay Grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {overlays.map((overlay) => {
                const isSelected = overlay.url === currentSelected;

                return (
                  <button
                    key={overlay.id}
                    onClick={() => onSelect(overlay)}
                    className={`
                      relative group rounded-xl overflow-hidden 
                      transition-all duration-200 transform
                      hover:scale-105 hover:shadow-2xl
                      ${
                        isSelected
                          ? 'ring-4 ring-blue-500 shadow-xl scale-105'
                          : 'ring-2 ring-slate-600 hover:ring-slate-500'
                      }
                    `}
                  >
                    {/* Overlay Image Container */}
                    <div className="aspect-square bg-slate-900 relative">
                      <img
                        src={overlay.url}
                        alt={overlay.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="14" fill="%23cbd5e1" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />

                      {/* Selection Indicator Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      {!isSelected && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      )}
                    </div>

                    {/* Overlay Title */}
                    <div
                      className={`
                        px-3 py-2 text-sm font-medium truncate
                        ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-200 group-hover:bg-slate-600'
                        }
                      `}
                    >
                      {overlay.title}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with instruction */}
        <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-700">
          <p className="text-slate-400 text-sm text-center">
            Click an overlay to select it • Press ESC to close
          </p>
        </div>
      </div>
    </div>
  );
}