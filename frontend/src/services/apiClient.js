import axios from 'axios';

// withCredentials sends the HttpOnly auth cookie. No token is ever kept in localStorage.
const apiClient = axios.create({ baseURL: '/api', withCredentials: true });

// If the session expires, any API call returns 401. We announce it so AuthContext can log out.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? '';
    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register') || url.startsWith('/auth/me');
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('notenest:session-expired'));
    }
    return Promise.reject(error);
  }
);

// Turns any axios error into one readable sentence.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  if (data?.title) return data.title;
  if (error?.response?.status === 413) return 'The upload is too large.';
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
  return fallback;
}

export default apiClient;
