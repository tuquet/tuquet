import { beforeEach, describe, expect, it, vi } from 'vitest';

import { browsersApi, unbindBrowser } from '../automation';
import { supabaseRequest } from '../supabase-client';

vi.mock('../supabase-client', () => ({
  supabaseRequest: vi.fn(),
}));

describe('qC Acceptance: Browser Instances & Local-First Unbind Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call supabaseRequest with PATCH to release device and reset status to idle', async () => {
    vi.mocked(supabaseRequest).mockResolvedValueOnce({
      id: 'browser-001',
    } as any);

    const result = await unbindBrowser('browser-001');

    expect(result).toBe(true);
    expect(supabaseRequest).toHaveBeenCalledTimes(1);
    expect(supabaseRequest).toHaveBeenCalledWith(
      '/rest/v1/browsers?id=eq.browser-001',
      expect.objectContaining({
        body: JSON.stringify({
          locked_at: null,
          locked_by_device_id: null,
          status: 'idle',
        }),
        method: 'PATCH',
        schema: 'workers',
      }),
    );
  });

  it('should handle unbind failures gracefully and return false without crashing', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    vi.mocked(supabaseRequest).mockRejectedValueOnce(
      new Error('Network error or RLS denied'),
    );

    const result = await unbindBrowser('browser-002');

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Automation] Failed to unbind browser:',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it('should expose unbind method via browsersApi facade', () => {
    expect(browsersApi).toHaveProperty('unbind');
    expect(typeof browsersApi.unbind).toBe('function');
  });
});
