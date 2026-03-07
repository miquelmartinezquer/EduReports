# EduReports (en construcción)

EduReports es una aplicación web para docentes orientada a crear informes cualitativos de alumnado de infantil de forma más rápida, estructurada y personalizable.

La idea principal del proyecto es combinar:

- Gestión académica básica (cursos, clases, alumnado, colaboradores).
- Construcción guiada de borradores de informe por secciones.
- Generación asistida con IA de un informe final en HTML listo para revisar y guardar.

Este repositorio está en fase activa de desarrollo. Ya existe un flujo funcional de punta a punta con integración de base de datos real, pero todavía hay piezas pendientes para producción (hardening, tests, etc.).

## Visión del producto

El objetivo es que un docente pueda:

1. Entrar a su cuenta.
2. Gestionar sus cursos y su estructura (clases, alumnos, colaboradores).
3. Definir o reutilizar categorías e items pedagógicos.
4. Montar un borrador por alumno con bloques/secciones.
5. Generar un informe narrativo con IA respetando idioma, orden y contenido.
6. Guardar y consultar informes ya creados.

## Estado actual (MVP en construcción)

Actualmente el proyecto incluye:

- Login y registro con sesión por cookie (`express-session`).
- Rutas protegidas en backend (`requireAuth`) y frontend (`ProtectedRoute`).
- Gestión de cursos con persistencia en base de datos.
- Gestión de colaboradores, clases y alumnado por curso.
- Gestión de categorías globales y personalizadas por usuario.
- Editor de informe por bloques con:
	- Secciones
	- Items por categoría
	- Texto libre
	- Reordenación drag and drop
	- Auto-guardado de borrador por alumno
- Generación de informe con Claude (o respuesta mock en modo `dev`).
- Guardado y consulta de informes por alumno con verificación de duplicados.
- Integración con base de datos MySQL para persistencia de datos.

Limitaciones actuales importantes:

- No hay suite de tests automatizados integrada todavía.
- Faltan tareas de seguridad/endurecimiento para entorno real.
- La base de datos requiere configuración inicial (ver sección de puesta en marcha).

## Arquitectura del repo

```text
EduReports/
	mi-backend/   # API Express + sesiones + integración IA + base de datos
	mi-frontend/  # React + Vite (interfaz docente)
```

### Backend (`mi-backend`)

Tecnología principal:

- Node.js + Express
- `express-session` para autenticación por cookie
- `bcrypt` para hash de contraseñas
- Integración con API de Anthropic Claude (servicio `services/claude.js`)
- MySQL para persistencia de datos

Rutas destacadas:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST/PUT/DELETE /courses` + subrutas para clases, alumnado, colaboradores
- `GET/POST/PUT/DELETE /userCategories` (categorías personalizadas)
- `GET/POST/DELETE /drafts/:studentId` (borradores)
- `POST /reports/generate-report` (generación IA con guardado directo en BD)
- Rutas para guardar y consultar informes por alumno/curso con verificación de duplicados

### Frontend (`mi-frontend`)

Tecnología principal:

- React 19
- React Router
- Vite

Pantallas principales:

- Login
- Mis cursos
- Detalle de curso
- Crear informe
- Estado de generación
- Informe generado
- Vista de informe guardado

## Flujo funcional actual

1. El usuario inicia sesión.
2. Crea o abre un curso (datos persistidos en BD).
3. Entra a un alumno y crea un borrador de informe por secciones/items (auto-guardado en BD).
4. El borrador se guarda automáticamente en backend.
5. Se envía la estructura a IA para generar HTML narrativo.
6. El resultado se guarda directamente en BD con verificación de duplicados y se puede consultar después.

## Requisitos

- Node.js 18+ recomendado
- npm 9+ recomendado
- MySQL 8.0+ para base de datos

## Puesta en marcha local

### 1) Base de datos

Configura una instancia de MySQL local o remota. Crea una base de datos para el proyecto (ej. `edureports_db`).

Ejecuta los scripts de inicialización de BD (ubicados en `mi-backend/scripts/` o similar) para crear tablas y datos iniciales.

### 2) Backend

```bash
cd mi-backend
npm install
```

Crear `.env` en `mi-backend/.env` con valores mínimos:

```env
PORT=3000
SESSION_SECRET=tu_secreto_local
NODE_ENV=dev
ANTHROPIC_API_KEY=
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=edureports_db
```

Notas:

- Con `NODE_ENV=dev`, el servicio IA devuelve una respuesta mock.
- Para usar IA real, usar otro valor de `NODE_ENV` (por ejemplo `production`) y definir `ANTHROPIC_API_KEY`.
- Configura las variables de BD según tu setup de MySQL.

Arranque backend:

```bash
node app.js
```

### 3) Frontend

```bash
cd mi-frontend
npm install
npm run dev
```

Frontend por defecto: `http://localhost:5173`

## Configuración de CORS y sesiones

El backend está configurado para aceptar credenciales desde:

- `http://localhost:5173`

Si cambias puerto o dominio del frontend, actualiza `mi-backend/app.js` en la configuración de `cors`.

## Roadmap propuesto

- ✅ Migrar de `mockData` a base de datos real (MySQL implementado).
- Añadir validaciones de esquema y manejo de errores más uniforme.
- Mejorar seguridad de sesión y configuración para producción.
- Añadir tests unitarios e integración.
- Versionado/exportación de informes (PDF/impresión).
- Mejorar observabilidad (logs estructurados, trazas y métricas).

## Estado del proyecto

Proyecto en construcción, con integración de base de datos funcional. Orientado a evolucionar desde MVP funcional a plataforma estable para uso docente real.

Si quieres contribuir en esta fase, prioriza:

1. Calidad de arquitectura y dominio pedagógico.
2. Persistencia de datos y fiabilidad.
3. Experiencia de usuario en el editor de informes.
