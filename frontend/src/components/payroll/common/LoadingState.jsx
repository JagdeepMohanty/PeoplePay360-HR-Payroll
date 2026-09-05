import React from 'react'

export default function LoadingState({ rows = 3, message = 'Loading payroll analytics…' }) {
  return (
    <div className="space-y-4 p-4 bg-white rounded-xl border border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
      <p className="text-xs text-gray-400 text-center pt-2">{message}</p>
    </div>
  )
}
