// Public endpoints need no token; authenticated requests send the active demo or Supabase token.
(function () {
  const localApiHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const defaultApiBase = localApiHost
    ? 'http://localhost:8787/api'
    : 'https://jomworklah.onrender.com/api';
  const base = String(window.JKL_API_BASE || defaultApiBase).replace(/\/+$/, '');
  const TIMEOUT_MS = 15000;

  class ApiError extends Error {
    constructor(message, { status = 0, code = 'NETWORK_ERROR' } = {}) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  }

  async function request(method, path, { body, token, multipart = false } = {}) {
    let response;
    try {
      response = await fetch(base + path, {
        method,
        headers: {
          ...(body === undefined || multipart ? {} : { 'content-type': 'application/json' }),
          ...(token ? { authorization: 'Bearer ' + token } : {})
        },
        body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
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
    upload: (path, file, { token } = {}) => {
      const body = new FormData();
      body.append('file', file, file.name);
      return request('POST', path, { body, token, multipart: true });
    },
    put: (path, body, options) => request('PUT', path, { ...options, body }),
    patch: (path, body, options) => request('PATCH', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options)
  };
})();
