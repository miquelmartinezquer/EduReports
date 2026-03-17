// Helper per fer peticions amb autenticació automàtica

import { buildApiUrl } from "../config/api";

export const fetchWithAuth = async(url, options = {}) => {
    const fullUrl = buildApiUrl(url);

    const hasBody = options.body !== undefined && options.body !== null;
    const baseHeaders = {
        ...options.headers,
    };

    // Només afegir Content-Type quan realment enviem body JSON.
    if (hasBody && !baseHeaders['Content-Type']) {
        baseHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        credentials: 'include', // Sempre enviar cookies de sessió
        headers: baseHeaders,
    };

    let response;
    try {
        response = await fetch(fullUrl, config);
    } catch (networkError) {
        throw new Error('No s\'ha pogut connectar amb el backend (servidor aturat o CORS)');
    }

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
        const backendMessage = errorData.mensaje || errorData.message || errorData.error;
        const errorMessage = errorData.details ?
            `${backendMessage || 'Error'}: ${errorData.details}` :
            backendMessage || `Error ${response.status}`;
        throw new Error(errorMessage);
    }

    // Retornar les dades JSON automàticament
    return response.json();
};

export default fetchWithAuth;