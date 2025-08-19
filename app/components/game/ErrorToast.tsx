"use client";

import React, { useEffect } from 'react';

interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function ErrorToast({ 
  message, 
  isVisible, 
  onClose, 
  duration = 3000 
}: ErrorToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="error-toast">
      <div className="error-toast-content">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{message}</span>
        <button 
          className="error-close-btn"
          onClick={onClose}
          aria-label="Zamknij"
        >
          ×
        </button>
      </div>
    </div>
  );
}
