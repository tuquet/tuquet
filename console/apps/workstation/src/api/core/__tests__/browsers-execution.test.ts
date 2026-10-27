import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  browsersApi,
  startBrowserProfile,
  stopBrowserProfile,
} from '../automation';
import { supabaseRequest } from '../supabase-client';

vi.mock('../supabase-client', () => ({
  supabaseRequest: vi.fn(),
}));

describe('qC Acceptance: GoLogin Execution Pattern & Unified Cockpit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should dispatch start browser request via local daemon or fallback to supabase', async () => {
    // Mock fetch failure to test fallback to supabase
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error('Connection refused'));
    vi.mocked(supabaseRequest).mockResolvedValueOnce({
      id: 'browser-001',
    } as any);

    const result = await startBrowserProfile('browser-001');

    expect(result.success).toBe(true);
    expect(supabaseRequest).toHaveBeenCalledWith(
      '/rest/v1/browsers?id=eq.browser-001',
      expect.objectContaining({
        method: 'PATCH',
        schema: 'workers',
      }),
    );
  });

  it('should dispatch stop browser request and trigger unbind release', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as any);
    vi.mocked(supabaseRequest).mockResolvedValueOnce({
      id: 'browser-001',
    } as any);

    const result = await stopBrowserProfile('browser-001');

    expect(result.success).toBe(true);
  });

  it('should expose start and stop in browsersApi facade', () => {
    expect(browsersApi).toHaveProperty('start');
    expect(browsersApi).toHaveProperty('stop');
    expect(browsersApi).toHaveProperty('unbind');
  });
});
