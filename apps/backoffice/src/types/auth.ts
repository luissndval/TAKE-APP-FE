export type TenantRole = 'owner' | 'manager' | 'cashier' | 'kitchen';
export type PlatformRole = 'superadmin' | 'support' | 'finance';

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  full_name: string;
  tenant_role: TenantRole | null;
  platform_role: PlatformRole | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Helpers
export function isPlatformUser(user: User | null): boolean {
  return !!user?.platform_role;
}

export function isTenantUser(user: User | null): boolean {
  return !!user?.tenant_role;
}

export function hasMinRole(user: User | null, minRole: TenantRole): boolean {
  if (!user?.tenant_role) return false;
  const hierarchy: TenantRole[] = ['kitchen', 'cashier', 'manager', 'owner'];
  return hierarchy.indexOf(user.tenant_role) >= hierarchy.indexOf(minRole);
}
