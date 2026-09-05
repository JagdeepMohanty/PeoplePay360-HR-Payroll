/**
 * Centralized Permission Matrix & Helper Utilities
 * Required Roles: employee, hr, hr_payroll
 */

export const ROLE_PERMISSIONS = {
  employee: [
    'employee:view:own',
    'payroll:view:own',
  ],

  hr: [
    'employee:view:own',
    'employee:view:all',
  ],

  hr_payroll: [
    'employee:view:own',
    'employee:view:all',
    'payroll:view:own',
    'payroll:view:all',
    'payroll:manage',
  ],

  // Backward compatibility for existing backend roles
  EMPLOYEE: ['employee:view:own', 'payroll:view:own'],
  HR_MANAGER: ['employee:view:own', 'employee:view:all'],
  HR_PAYROLL_USER: ['employee:view:own', 'employee:view:all', 'payroll:view:own'],
  HR_PAYROLL_MANAGER: ['employee:view:own', 'employee:view:all', 'payroll:view:own', 'payroll:view:all', 'payroll:manage'],
  ADMIN: ['employee:view:own', 'employee:view:all', 'payroll:view:own', 'payroll:view:all', 'payroll:manage'],
}

/**
 * Get permission array for a role
 */
export function getRolePermissions(role) {
  if (!role) return []
  const normalized = role.toString().toLowerCase()
  if (ROLE_PERMISSIONS[normalized]) return ROLE_PERMISSIONS[normalized]
  if (ROLE_PERMISSIONS[role]) return ROLE_PERMISSIONS[role]
  return ROLE_PERMISSIONS.employee
}

/**
 * Check if permission list contains required permission
 */
export function hasPermission(userPermissions, requiredPermission) {
  if (!requiredPermission) return true
  if (!userPermissions || !Array.isArray(userPermissions)) return false
  return userPermissions.includes(requiredPermission)
}
