import React from 'react'

export default function DepartmentBreakdownTable({ departmentData = {} }) {
  const entries = Object.entries(departmentData)

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Department Expenditure Breakdown</h3>
        <p className="text-xs text-gray-400 text-center py-6">No departmental breakdown data available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Department Expenditure Breakdown</h3>
          <p className="text-[11px] text-gray-500">Headcount vs Net & Gross Salary Expenditure</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-center">Headcount</th>
              <th className="px-4 py-3 text-right">Gross Pay</th>
              <th className="px-4 py-3 text-right">Deductions</th>
              <th className="px-4 py-3 text-right">Net Salary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map(([dept, v]) => (
              <tr key={dept} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 font-bold text-gray-900">{dept}</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                    {v.employee_count || 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">${v.gross?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-right font-medium text-rose-600">-${v.deductions?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">${v.net?.toLocaleString() || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
