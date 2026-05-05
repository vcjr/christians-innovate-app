"use client"

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

let toastCounter = 0
const toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = 'success') {
  const toast: Toast = {
    id: toastCounter++,
    message,
    type
  }
  toastListeners.forEach(listener => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = []

    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast])
      const id = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 4000)
      timeoutIds.push(id)
    }

    toastListeners.push(listener)
    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) toastListeners.splice(index, 1)
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 ${
            toast.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' :
            toast.type === 'error' ? 'bg-red-50 text-red-900 border border-red-200' :
            'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="ml-2 hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
