/**
 * Secret Store client — local CLI daemon (`127.0.0.1:8765/api/v1/secrets*`).
 *
 * Endpoint paths mirror the database **schema → table** hierarchy, exactly like the
 * console router: schema `secrets` → `/secrets`, table `secrets.credentials` →
 * `/secrets/credentials`, table `secrets.tenant_keys` → `/secrets/tenant-keys`.
 *
 * Values are never returned by the API (names + metadata only) — see SPEC-secret-store.
 */

const DEFAULT_DAEMON_PORT = 8765;

export interface CredentialRow {
  key_version?: null | number;
  name: string;
}

export interface CredentialOpResult {
  affected: number;
  message: string;
  ok: boolean;
}

/** Schema-level status of the Secret Store (`secrets`). */
export interface SecretStoreStatus {
  cloud_count: number;
  cloud_error: null | string;
  device_public_key: null | string;
  enrolled: boolean;
  local_count: number;
  store_path: string;
}

/** Listing of the `secrets.credentials` resource. */
export interface CredentialList {
  cloud: CredentialRow[];
  cloud_error: null | string;
  local: CredentialRow[];
}

/** Combined view-model used by the credentials page. */
export interface CredentialStatus extends SecretStoreStatus {
  cloud: CredentialRow[];
  local: CredentialRow[];
}

function daemonBase(port = DEFAULT_DAEMON_PORT) {
  return `http://127.0.0.1:${port}/api/v1`;
}

async function daemonRequest<T>(
  path: string,
  init?: RequestInit,
  port = DEFAULT_DAEMON_PORT,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${daemonBase(port)}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...init,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error ?? data?.message ?? `HTTP ${res.status}`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** GET /secrets — schema-level status only. */
export function getSecretStatus(port?: number) {
  return daemonRequest<SecretStoreStatus>('/secrets', { method: 'GET' }, port);
}

/** GET /secrets/credentials — list `secrets.credentials` (local + cloud names). */
export function listCredentials(port?: number) {
  return daemonRequest<CredentialList>(
    '/secrets/credentials',
    { method: 'GET' },
    port,
  );
}

/** Status + credentials in one call (schema status merged with the table listing). */
export async function getCredentials(port?: number): Promise<CredentialStatus> {
  const [status, list] = await Promise.all([
    getSecretStatus(port),
    listCredentials(port),
  ]);
  return {
    ...status,
    cloud: list.cloud,
    local: list.local,
    cloud_error: list.cloud_error ?? status.cloud_error,
    cloud_count: list.cloud.length,
    local_count: list.local.length,
  };
}

/** POST /secrets/credentials — create/update a credential (stored locally, encrypted). */
export function setCredential(name: string, value: string, port?: number) {
  return daemonRequest<CredentialOpResult>(
    '/secrets/credentials',
    { body: JSON.stringify({ name, value }), method: 'POST' },
    port,
  );
}

/** DELETE /secrets/credentials/{name} */
export function deleteCredential(name: string, port?: number) {
  return daemonRequest<CredentialOpResult>(
    `/secrets/credentials/${encodeURIComponent(name)}`,
    { method: 'DELETE' },
    port,
  );
}

/** POST /secrets/credentials/push — upload credentials, client-side encrypted. */
export function pushCredentials(port?: number) {
  return daemonRequest<CredentialOpResult>(
    '/secrets/credentials/push',
    { method: 'POST' },
    port,
  );
}

/** POST /secrets/credentials/pull — receive the sealed DEK and decrypt locally. */
export function pullCredentials(port?: number) {
  return daemonRequest<CredentialOpResult>(
    '/secrets/credentials/pull',
    { method: 'POST' },
    port,
  );
}

/** POST /secrets/tenant-keys/rotate — rotate the tenant DEK (`secrets.tenant_keys`). */
export function rotateTenantKeys(port?: number) {
  return daemonRequest<CredentialOpResult>(
    '/secrets/tenant-keys/rotate',
    { method: 'POST' },
    port,
  );
}
