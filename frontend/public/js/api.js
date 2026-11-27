// Minimal API client for the candidate app. Public endpoints need no token; user endpoints
// (added in later steps) send the bearer token for the current persona.
(function () {
  const base = String(window.JKL_API_BASE || 'http://localhost:8787/api').replace(/\/+$/, '');
  const TIMEOUT_MS = 15000;

  class ApiError extends Error {
    constructor(message, { status = 0, code = 'NETWORK_ERROR' } = {}) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  }

  async function request(method, path, { body, token } = {}) {
    let response;
    try {
      response = await fetch(base + path, {
        method,
        headers: {
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(token ? { authorization: 'Bearer ' + token } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
    } catch (error) {
      const timedOut = error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw new ApiError(timedOut ? 'The server took too long to respond.' : 'Could not reach the server at ' + base + '.');
    }
    if (response.status === 204) return null;
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // A non-JSON body is reported with the HTTP status below.
    }
    if (!response.ok) {
      throw new ApiError(payload?.error?.message || 'Request failed (HTTP ' + response.status + ').', {
        status: response.status,
        code: payload?.error?.code || 'HTTP_' + response.status
      });
    }
    return payload;
  }

  window.jklApi = {
    base,
    ApiError,
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    put: (path, body, options) => request('PUT', path, { ...options, body }),
    patch: (path, body, options) => request('PATCH', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options)
  };
})();
