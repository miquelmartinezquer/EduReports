const sanitize = (value) => String(value || "").trim();

const normalizedProtocol = sanitize(import.meta.env.VITE_API_PROTOCOL || "http").replace(/:$/, "");
const normalizedHost = sanitize(import.meta.env.VITE_API_HOST || "localhost");
const normalizedPort = sanitize(import.meta.env.VITE_API_PORT || "3000");

const envBaseUrl = sanitize(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, "");

const derivedBaseUrl = `${normalizedProtocol}://${normalizedHost}${normalizedPort ? `:${normalizedPort}` : ""}`;

export const API_BASE_URL = envBaseUrl || derivedBaseUrl;

export const buildApiUrl = (path = "") => {
  if (String(path).startsWith("http")) {
    return path;
  }

  const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
