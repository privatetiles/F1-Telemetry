import { useState, useRef, useEffect, useCallback } from 'react'
import Icon from './Icon'

export interface SelectOption {
  value: string
  label: string
  prefix?: string
  disabled?: boolean
  dimmed?: boolean
}

interface Props {
  id?: string
  className?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  'aria-label'?: string
  iconSize?: number
}

export default function CustomSelect({
  id, className, value, options, onChange, disabled, placeholder,
  'aria-label': ariaLabel, iconSize = 15,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const displayLabel = selected?.label ?? placeholder ?? ''

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div
      ref={rootRef}
      className={`custom-select${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}${className ? ' ' + className : ''}`}
    >
      <button
        id={id}
        type="button"
        className="custom-select-trigger"
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {selected?.prefix && <span className="custom-select-prefix">{selected.prefix}</span>}
        <span className="custom-select-value">{displayLabel}</span>
        <Icon name="chevron-down" size={iconSize} />
      </button>

      {open && (
        <div className="custom-select-dropdown" role="listbox">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              disabled={opt.disabled}
              className={`custom-select-option${opt.value === value ? ' is-selected' : ''}${opt.disabled ? ' is-disabled' : ''}${opt.dimmed ? ' is-dimmed' : ''}`}
              onClick={() => {
                if (!opt.disabled) {
                  onChange(opt.value)
                  setOpen(false)
                }
              }}
            >
              {opt.prefix && <span className="custom-select-prefix">{opt.prefix}</span>}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
