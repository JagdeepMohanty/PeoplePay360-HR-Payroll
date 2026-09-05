import React from 'react'

export default function EmptyState({ icon: Icon, title = 'No data available', description = 'There are no records matching your current filter criteria.', action }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-dashed border-gray-300 text-center">
      {Icon && (
        <div className="p-3 bg-gray-100 rounded-full text-gray-500 mb-3">
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
