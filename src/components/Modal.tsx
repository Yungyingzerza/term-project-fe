"use client";

import { X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success" | "confirm";
  confirmText?: string;
  cancelText?: string;
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "ตรง",
  cancelText = "ยกเลิก",
}: ModalProps) {
  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
      case "confirm":
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case "error":
        return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "warning":
      case "confirm":
        return "border-yellow-500/20";
      case "error":
        return "border-red-500/20";
      case "success":
        return "border-green-500/20";
      default:
        return "border-white/10";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md bg-neutral-900/95 backdrop-blur-xl border ${getBorderColor()} rounded-2xl shadow-2xl animate-[modalSlideIn_0.2s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="ปิด"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold mb-2">{title}</h2>
              <p className="text-sm text-white/80 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            {type === "confirm" || onConfirm ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors font-medium text-sm"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                    type === "error" || type === "warning"
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      : "bg-white text-black hover:opacity-90"
                  }`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
