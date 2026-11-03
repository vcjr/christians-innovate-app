'use client'

import { useState, useRef, useEffect, useId } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface NavDropdownItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavDropdownProps {
  label: string
  icon: React.ReactNode
  items: NavDropdownItem[]
}

export function NavDropdown({ label, icon, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium transition"
      >
        {icon}
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50"
        >
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
