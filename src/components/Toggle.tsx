"use client"

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22 }}
      className={`relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#7c3aed]" : "bg-black/[0.15]"
      }`}
    >
      <span
        style={{ width: 16, height: 16 }}
        className={`inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[20px]" : "translate-x-[1px]"
        }`}
      />
    </button>
  )
}
