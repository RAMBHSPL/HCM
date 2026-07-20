let API_BASE_URL;

if (import.meta.env.VITE_API_BASE_URL) {
    API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
} else if (import.meta.env.DEV) {
    // Always use the same hostname the browser is on so it works via localhost OR network IP
    const hostname = window.location.hostname;
    API_BASE_URL = `http://${hostname}:8000/api`;
} else {
    // Dynamic production fallback using current browser location
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    API_BASE_URL = `${protocol}//${hostname}:8000/api`;
}

const getHeaders = (contentType = 'application/json') => {
    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    const token = sessionStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const contextId = sessionStorage.getItem('activePositionContext');
    if (contextId) {
        headers['X-Position-Context'] = contextId;
    }
    return headers;
};

const resolveUrl = (endpoint) => {
    // 1. Handle absolute URLs (returned by DRF pagination)
    if (endpoint.startsWith('http')) return endpoint;

    // 2. Extract query string if present
    let [path, query] = endpoint.split('?');

    // 3. Prevent double /api prefixing if endpoint already starts with it
    const apiPrefix = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    if (path.startsWith('/api/')) {
        path = path.replace('/api/', '');
    } else if (path.startsWith('api/')) {
        path = path.replace('api/', '');
    }

    // 4. Ensure trailing slash for Django
    const cleanPath = path.endsWith('/') ? path : (path ? `${path}/` : '');

    // 5. Build final URL
    let finalUrl = `${apiPrefix}/${cleanPath}`;
    if (query) {
        finalUrl += `?${query}`;
    }

    return finalUrl;
};

const formatError = (status, statusText, text) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        // If it's HTML, return a generic but helpful message
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
            return {
                error: `System Error (${status})`,
                details: 'A database or system error occurred. This often happens if you enter a duplicate value or missing required data.'
            };
        }
        return {
            error: `Server Error ${status}: ${statusText}`,
            details: text.substring(0, 100)
        };
    }
};

const api = {
    get: async (endpoint, options = {}) => {
        const { force = false, ...fetchOptions } = options;
        let url = resolveUrl(endpoint);

        if (force) {
            url += (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
        }

        const response = await fetch(url, {
            headers: getHeaders(),
            ...fetchOptions
        });
        if (!response.ok) {
            const text = await response.text();
            throw formatError(response.status, response.statusText, text);
        }
        return response.json();
    },
    post: async (endpoint, data) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(resolveUrl(endpoint), {
            method: 'POST',
            headers: getHeaders(isFormData ? null : 'application/json'),
            body: isFormData ? data : JSON.stringify(data),
        });
        if (!response.ok) {
            const text = await response.text();
            throw formatError(response.status, response.statusText, text);
        }
        return response.json();
    },
    put: async (endpoint, data) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(resolveUrl(endpoint), {
            method: 'PUT',
            headers: getHeaders(isFormData ? null : 'application/json'),
            body: isFormData ? data : JSON.stringify(data),
        });
        if (!response.ok) {
            const text = await response.text();
            throw formatError(response.status, response.statusText, text);
        }
        return response.json();
    },
    patch: async (endpoint, data) => {
        const response = await fetch(resolveUrl(endpoint), {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const text = await response.text();
            throw formatError(response.status, response.statusText, text);
        }
        return response.json();
    },
    delete: async (endpoint, data = null) => {
        const response = await fetch(resolveUrl(endpoint), {
            method: 'DELETE',
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined
        });
        if (!response.ok) {
            const text = await response.text();
            throw formatError(response.status, response.statusText, text);
        }
    },
    blob: async (endpoint, options = {}) => {
        const { force = false, ...fetchOptions } = options;
        let url = resolveUrl(endpoint);
        if (force) {
            url += (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
        }
        const response = await fetch(url, {
            headers: getHeaders(),
            ...fetchOptions
        });
        if (!response.ok) {
            const text = await response.text();
            throw formatError(response.status, response.statusText, text);
        }
        return response.blob();
    }
};

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

export default api;
