"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown } from "lucide-react"

export interface DateRange {
  from: Date
  to: Date
  label: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

function getPresets(): DateRange[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  function daysAgo(n: number) {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d
  }

  function startOfMonth(offset = 0) {
    return new Date(now.getFullYear(), now.getMonth() + offset, 1)
  }

  function endOfMonth(offset = 0) {
    return new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  }

  const yesterday = daysAgo(1)

  return [
    { from: today, to: today, label: "Hoy" },
    { from: yesterday, to: yesterday, label: "Ayer" },
    { from: daysAgo(6), to: today, label: "Últimos 7 días" },
    { from: daysAgo(29), to: today, label: "Últimos 30 días" },
    { from: daysAgo(89), to: today, label: "Últimos 90 días" },
    { from: startOfMonth(), to: today, label: "Este mes" },
    { from: startOfMonth(-1), to: endOfMonth(-1), label: "Mes pasado" },
  ]
}

export function defaultDateRange(): DateRange {
  const presets = getPresets()
  return presets[3] // Últimos 30 días
}

function fmt(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function applyCustom() {
    if (!customFrom || !customTo) return
    const from = new Date(customFrom)
    const to = new Date(customTo)
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return
    onChange({ from, to, label: `${fmt(from)} – ${fmt(to)}` })
    setOpen(false)
  }

  const presets = getPresets()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs text-[#374151] bg-black/[0.04] hover:bg-black/[0.06] border border-black/[0.08] rounded-lg px-3 py-1.5 transition-colors"
      >
        <Calendar size={12} />
        <span>{value.label}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-black/[0.10] rounded-xl shadow-2xl shadow-black/10 w-56 py-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { onChange(p); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                p.label === value.label
                  ? "text-[#7c3aed] bg-[#7c3aed]/10"
                  : "text-[#374151] hover:text-[#0f0f12] hover:bg-black/[0.04]"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="border-t border-black/[0.08] mt-1 pt-2 px-3 pb-2">
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Rango personalizado</p>
            <div className="space-y-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="w-full bg-black/[0.04] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#374151] focus:outline-none focus:border-[#7c3aed]/50"
              />
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="w-full bg-black/[0.04] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#374151] focus:outline-none focus:border-[#7c3aed]/50"
              />
              <button
                onClick={applyCustom}
                className="w-full py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium rounded-lg transition-colors mt-1"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
