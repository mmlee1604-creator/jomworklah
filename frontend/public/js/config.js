// Where the JomWorkLah API runs. Change this when the backend is deployed elsewhere.
var localApiHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
window.JKL_API_BASE = window.JKL_API_BASE || (
  localApiHost ? 'http://localhost:8787/api' : 'https://jomworklah.onrender.com/api'
);
