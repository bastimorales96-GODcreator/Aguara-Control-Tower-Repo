"use client"

import { useEffect, useState, createContext, useContext, useCallback } from "react"
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => remove(id), 4500)
  }, [remove])

  const success = useCallback((m: string) => toast(m, "success"), [toast])
  const error   = useCallback((m: string) => toast(m, "error"),   [toast])
  const info    = useCallback((m: string) => toast(m, "info"),    [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container — fixed top-right, stays above everything */}
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: "min(360px, calc(100vw - 2rem))" }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ─── Toast item ───────────────────────────────────────────────────────────────
function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const Icon = t.type === "success" ? CheckCircle2
             : t.type === "error"   ? AlertCircle
             :                        Info

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        t.type === "success" && "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
        t.type === "error"   && "bg-red-500/20 border-red-500/30 text-red-300",
        t.type === "info"    && "bg-[#7c3aed]/20 border-[#7c3aed]/30 text-[#7c3aed]"
      )}
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span className="flex-1 leading-snug">{t.message}</span>
      <button
        onClick={() => onRemove(t.id)}
        aria-label="Cerrar"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity touch-manipulation"
      >
        <X size={14} />
      </button>
    </div>
  )
}
