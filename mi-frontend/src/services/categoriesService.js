// Servei per gestionar les categories (CRUD)

const API_URL = 'http://localhost:3000/userCategories';

// Helper per obtenir la URL correcta segons si hi ha courseId
function getCategoriesURL(courseId) {
  if (courseId) {
    return `http://localhost:3000/courses/${courseId}/categories`;
  }
  return API_URL;
}

// Helper per gestionar respostes
async function handleResponse(response, errorMsg) {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.error || errorMsg);
    }
    throw new Error(errorMsg);
  }
  return await response.json();
}

// Obtenir totes les categories
export async function getCategories(courseId = null) {
  const response = await fetch(getCategoriesURL(courseId));
  return handleResponse(response, 'Error carregant categories');
}

// Obtenir els colors disponibles
export async function getAvailableColors(courseId = null) {
  const url = courseId 
    ? `http://localhost:3000/courses/${courseId}/categories/colors`
    : `${API_URL}/colors`;
  const response = await fetch(url);
  return handleResponse(response, 'Error carregant colors');
}

// Crear una nova categoria
export async function createCategory(key, name, color = 'purple', items = [], courseId = null) {
  const response = await fetch(getCategoriesURL(courseId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, name, color, items })
  });
  return handleResponse(response, 'Error creant categoria');
}

// Actualitzar una categoria
export async function updateCategory(key, data, courseId = null) {
  const url = courseId 
    ? `http://localhost:3000/courses/${courseId}/categories/${key}`
    : `${API_URL}/${key}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(response, 'Error actualitzant categoria');
}

// Eliminar una categoria
export async function deleteCategory(key, courseId = null) {
  const url = courseId 
    ? `http://localhost:3000/courses/${courseId}/categories/${key}`
    : `${API_URL}/${key}`;
  const response = await fetch(url, {
    method: 'DELETE'
  });
  return handleResponse(response, 'Error eliminant categoria');
}

// Afegir un item a una categoria
export async function addItemToCategory(categoryKey, item, courseId = null) {
  const url = courseId 
    ? `http://localhost:3000/courses/${courseId}/categories/${categoryKey}/items`
    : `${API_URL}/${categoryKey}/items`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item })
  });
  return handleResponse(response, 'Error afegint item');
}

// Eliminar un item d'una categoria
export async function removeItemFromCategory(categoryKey, itemIndex, courseId = null) {
  const url = courseId 
    ? `http://localhost:3000/courses/${courseId}/categories/${categoryKey}/items/${itemIndex}`
    : `${API_URL}/${categoryKey}/items/${itemIndex}`;
  const response = await fetch(url, {
    method: 'DELETE'
  });
  return handleResponse(response, 'Error eliminant item');
}
