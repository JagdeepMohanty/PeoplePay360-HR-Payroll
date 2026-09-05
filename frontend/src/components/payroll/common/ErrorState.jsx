import React from 'react'

export default function ErrorState({ title = 'Failed to load payroll data', message = 'An unexpected error occurred while fetching reports.', onRetry }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
      <h3 className="text-sm font-semibold text-red-800">{title}</h3>
      <p className="text-xs text-red-600 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
        >
          Retry Request
        </button>
      )}
    </div>
  )
}
