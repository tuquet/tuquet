import type { TenantMembershipQueryResult } from '../access';

import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import {
  flattenMemberships,
  readPlatformRole,
  readUserIdFromToken,
} from '../access';
import { buildSupabaseProfileHeaders } from '../supabase-client';

function createMockJwt(payload: Record<string, any>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = 'mock_signature';
  return `${header}.${body}.${sig}`;
}

describe('buildSupabaseProfileHeaders', () => {
  it('should return empty headers for default or public schema', () => {
    expect(buildSupabaseProfileHeaders()).toEqual({});
    expect(buildSupabaseProfileHeaders('public')).toEqual({});
    expect(buildSupabaseProfileHeaders(undefined, 'POST')).toEqual({});
  });

  it('should set Accept-Profile for GET and HEAD operations on isolated schemas', () => {
    expect(buildSupabaseProfileHeaders('workers', 'GET')).toEqual({
      'Accept-Profile': 'workers',
    });
    expect(buildSupabaseProfileHeaders('automation', 'head')).toEqual({
      'Accept-Profile': 'automation',
    });
    expect(buildSupabaseProfileHeaders('billing')).toEqual({
      'Accept-Profile': 'billing',
    });
  });

  it('should set Content-Profile for mutating operations (POST, PATCH, DELETE, PUT)', () => {
    expect(buildSupabaseProfileHeaders('workers', 'POST')).toEqual({
      'Content-Profile': 'workers',
    });
    expect(buildSupabaseProfileHeaders('automation', 'PATCH')).toEqual({
      'Content-Profile': 'automation',
    });
    expect(buildSupabaseProfileHeaders('billing', 'DELETE')).toEqual({
      'Content-Profile': 'billing',
    });
  });
});

describe('readPlatformRole', () => {
  it('should return null for invalid, empty, or malformed tokens', () => {
    expect(readPlatformRole(null)).toBeNull();
    expect(readPlatformRole(undefined)).toBeNull();
    expect(readPlatformRole('')).toBeNull();
    expect(readPlatformRole('invalid_token')).toBeNull();
    expect(readPlatformRole('part1.not_valid_json.part3')).toBeNull();
  });

  it('should return null when platform_role is absent in app_metadata', () => {
    const token = createMockJwt({
      sub: 'user-1',
      app_metadata: { provider: 'email' },
    });
    expect(readPlatformRole(token)).toBeNull();
  });

  it('should extract superadmin platform_role accurately', () => {
    const token = createMockJwt({
      sub: 'admin-1',
      app_metadata: {
        platform_role: 'superadmin',
        provider: 'email',
      },
    });
    expect(readPlatformRole(token)).toBe('superadmin');
  });
});

describe('readUserIdFromToken', () => {
  it('should extract sub claim from valid token', () => {
    const token = createMockJwt({ sub: 'user-uuid-1234' });
    expect(readUserIdFromToken(token)).toBe('user-uuid-1234');
  });

  it('should return null for invalid token or missing sub', () => {
    expect(readUserIdFromToken('')).toBeNull();
    expect(readUserIdFromToken(createMockJwt({}))).toBeNull();
  });
});

describe('flattenMemberships', () => {
  it('should handle empty or null input gracefully', () => {
    expect(flattenMemberships([])).toEqual({
      permissions: [],
      tenantPermissions: {},
    });
    expect(flattenMemberships(null as any)).toEqual({
      permissions: [],
      tenantPermissions: {},
    });
  });

  it('should aggregate, deduplicate, and sort permissions across multiple tenants', () => {
    const mockRows: TenantMembershipQueryResult[] = [
      {
        tenant_id: 'tenant-1',
        member_roles: [
          {
            roles: {
              role_permissions: [
                { permission_id: 'tenants:read' },
                { permission_id: 'members:read' },
              ],
            },
          },
          {
            roles: {
              role_permissions: [
                { permission_id: 'workers:devices:read' },
                { permission_id: 'tenants:read' }, // duplicate in tenant-1
              ],
            },
          },
        ],
      },
      {
        tenant_id: 'tenant-2',
        member_roles: [
          {
            roles: {
              role_permissions: [
                { permission_id: 'automation:workflows:read' },
                { permission_id: 'members:read' }, // duplicate cross-tenant
              ],
            },
          },
        ],
      },
      {
        tenant_id: 'tenant-empty',
        member_roles: [],
      },
    ];

    const result = flattenMemberships(mockRows);

    expect(result.permissions).toEqual([
      'automation:workflows:read',
      'members:read',
      'tenants:read',
      'workers:devices:read',
    ]);

    expect(result.tenantPermissions).toEqual({
      'tenant-1': ['members:read', 'tenants:read', 'workers:devices:read'],
      'tenant-2': ['automation:workflows:read', 'members:read'],
      'tenant-empty': [],
    });
  });
});
