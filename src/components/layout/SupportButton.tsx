'use client'

import { useState } from 'react'

export default function SupportButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 w-72 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Suport & Contact</p>
              <p className="text-xs text-gray-400 mt-0.5">Răspundem în max. 24h</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-gray-500 transition-colors ml-2 mt-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="h-px bg-stone-100" />
          <a
            href="mailto:salut@nuntaplanner.ro"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800 group-hover:text-rose-600 transition-colors">salut@nuntaplanner.ro</p>
              <p className="text-xs text-gray-400">Trimite un email</p>
            </div>
          </a>
          <p className="text-xs text-gray-400 text-center pt-1">
            Sau scrie-ne direct — suntem aici să ajutăm 💌
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={`w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border ${
          open
            ? 'bg-gray-800 border-gray-700 text-white rotate-0 scale-95'
            : 'bg-white border-stone-200 text-gray-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:scale-105'
        }`}
        style={{ width: 52, height: 52 }}
        title="Contactează suport"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>
    </div>
  )
}
