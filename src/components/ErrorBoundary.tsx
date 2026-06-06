"use client"

import React from "react"
import { RefreshCw, AlertTriangle } from "lucide-react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white mb-1">Algo salió mal</p>
            <p className="text-xs text-white/40 max-w-xs">
              {this.state.error?.message || "Error inesperado. Intentá recargar la página."}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/60 hover:text-white/90 transition-colors touch-manipulation"
          >
            <RefreshCw size={12} />
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
