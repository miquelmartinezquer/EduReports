// Helper per fer peticions amb autenticació automàtica

const API_BASE_URL = 'http://localhost:3000';

export const fetchWithAuth = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const config = {
    ...options,
    credentials: 'include', // Sempre enviar cookies de sessió
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(fullUrl, config);
  
  // Si rep 401, l'usuari no està autenticat
  if (response.status === 401) {
    // Redirigir al login
    window.location.href = '/login';
    throw new Error('No autoritzat');
  }

  // Si la resposta no és ok (error 4xx o 5xx), llançar error
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error del backend:', errorData);
    const errorMessage = errorData.details 
      ? `${errorData.error}: ${errorData.details}` 
      : errorData.error || `Error ${response.status}`;
    throw new Error(errorMessage);
  }

  // Retornar les dades JSON automàticament
  return response.json();
};

export default fetchWithAuth;
