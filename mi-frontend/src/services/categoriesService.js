// Servei per gestionar les categories (CRUD)
import fetchWithAuth from '../utils/fetchWithAuth';

const API_URL = '/userCategories';

// Helper per obtenir la URL correcta segons si hi ha courseId
function getCategoriesURL(courseId) {
  if (courseId) {
    return `/courses/${courseId}/categories`;
  }
  return API_URL;
}

// Obtenir totes les categories
export async function getCategories(courseId = null) {
  return fetchWithAuth(getCategoriesURL(courseId));
}

// Obtenir els colors disponibles
export async function getAvailableColors(courseId = null) {
  const url = courseId 
    ? `/courses/${courseId}/categories/colors`
    : `${API_URL}/colors`;
  return fetchWithAuth(url);
}

// Crear una nova categoria
export async function createCategory(key, name, color = 'purple', items = [], courseId = null) {
  return fetchWithAuth(getCategoriesURL(courseId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, name, color, items })
  });
}

// Actualitzar una categoria
export async function updateCategory(key, data, courseId = null) {
  const url = courseId 
    ? `/courses/${courseId}/categories/${key}`
    : `${API_URL}/${key}`;
  return fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// Eliminar una categoria
export async function deleteCategory(key, courseId = null) {
  const url = courseId 
    ? `/courses/${courseId}/categories/${key}`
    : `${API_URL}/${key}`;
  return fetchWithAuth(url, {
    method: 'DELETE'
  });
}

// Afegir un item a una categoria
export async function addItemToCategory(categoryKey, item, courseId = null) {
  const url = courseId 
    ? `/courses/${courseId}/categories/${categoryKey}/items`
    : `${API_URL}/${categoryKey}/items`;
  return fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item })
  });
}

// Eliminar un item d'una categoria
export async function removeItemFromCategory(categoryKey, itemIndex, courseId = null) {
  const url = courseId 
    ? `/courses/${courseId}/categories/${categoryKey}/items/${itemIndex}`
    : `${API_URL}/${categoryKey}/items/${itemIndex}`;
  return fetchWithAuth(url, {
    method: 'DELETE'
  });
}
