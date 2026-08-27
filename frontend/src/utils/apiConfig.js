/**
 * Centralized API & WebSocket Gateway URL Configurator (JS module)
 */

export const getApiUrl = () => {
  if (typeof process !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_SERVER_URL ||
      'http://localhost:5001'
    ).replace(/\/+$/, '');
  }
  return 'http://localhost:5001';
};

export const getSocketUrl = () => {
  if (typeof process !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_SERVER_URL ||
      'http://localhost:5001'
    ).replace(/\/+$/, '');
  }
  return 'http://localhost:5001';
};

export default { getApiUrl, getSocketUrl };
