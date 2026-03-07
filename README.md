# EduReports (en construccion)

EduReports es una aplicacion web para docentes orientada a crear informes cualitativos de alumnado de infantil de forma mas rapida, estructurada y personalizable.

La idea principal del proyecto es combinar:

- Gestion academica basica (cursos, clases, alumnado, colaboradores).
- Construccion guiada de borradores de informe por secciones.
- Generacion asistida con IA de un informe final en HTML listo para revisar y guardar.

Este repositorio esta en fase activa de desarrollo. Ya existe un flujo funcional de punta a punta, pero todavia hay piezas pendientes para produccion (persistencia real, hardening, tests, etc.).

## Vision del producto

El objetivo es que un docente pueda:

1. Entrar a su cuenta.
2. Gestionar sus cursos y su estructura (clases, alumnos, colaboradores).
3. Definir o reutilizar categorias e items pedagogicos.
4. Montar un borrador por alumno con bloques/secciones.
5. Generar un informe narrativo con IA respetando idioma, orden y contenido.
6. Guardar y consultar informes ya creados.

## Estado actual (MVP en construccion)

Actualmente el proyecto incluye:

- Login y registro con sesion por cookie (`express-session`).
- Rutas protegidas en backend (`requireAuth`) y frontend (`ProtectedRoute`).
- Gestion de cursos.
- Gestion de colaboradores, clases y alumnado por curso.
- Gestion de categorias globales y personalizadas por usuario.
- Editor de informe por bloques con:
	- Secciones
	- Items por categoria
	- Texto libre
	- Reordenacion drag and drop
	- Auto-guardado de borrador por alumno
- Generacion de informe con Claude (o respuesta mock en modo `dev`).
- Guardado y consulta de informes por alumno.

Limitaciones actuales importantes:

- Los datos son `mock` en memoria (`mi-backend/data/mockData.js`).
- Al reiniciar el backend se pierde el estado.
- No hay suite de tests automatizados integrada todavia.
- Faltan tareas de seguridad/endurecimiento para entorno real.

## Arquitectura del repo

```text
EduReports/
	mi-backend/   # API Express + sesiones + integracion IA
	mi-frontend/  # React + Vite (interfaz docente)
```

### Backend (`mi-backend`)

Tecnologia principal:

- Node.js + Express
- `express-session` para autenticacion por cookie
- `bcrypt` para hash de contrasenas
- Integracion con API de Anthropic Claude (servicio `services/claude.js`)

Rutas destacadas:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST/PUT/DELETE /courses` + subrutas para clases, alumnado, colaboradores
- `GET/POST/PUT/DELETE /userCategories` (categorias personalizadas)
- `GET/POST/DELETE /drafts/:studentId` (borradores)
- `POST /reports/generate-report` (generacion IA)
- Rutas para guardar y consultar informes por alumno/curso

### Frontend (`mi-frontend`)

Tecnologia principal:

- React 19
- React Router
- Vite

Pantallas principales:

- Login
- Mis cursos
- Detalle de curso
- Crear informe
- Estado de generacion
- Informe generado
- Vista de informe guardado

## Flujo funcional actual

1. El usuario inicia sesion.
2. Crea o abre un curso.
3. Entra a un alumno y crea un borrador de informe por secciones/items.
4. El borrador se guarda automaticamente en backend.
5. Se envia la estructura a IA para generar HTML narrativo.
6. El resultado se puede guardar como informe y consultar despues.

## Requisitos

- Node.js 18+ recomendado
- npm 9+ recomendado

## Puesta en marcha local

### 1) Backend

```bash
cd mi-backend
npm install
```

Crear `.env` en `mi-backend/.env` con valores minimos:

```env
PORT=3000
SESSION_SECRET=tu_secreto_local
NODE_ENV=dev
ANTHROPIC_API_KEY=
```

Notas:

- Con `NODE_ENV=dev`, el servicio IA devuelve una respuesta mock.
- Para usar IA real, usar otro valor de `NODE_ENV` (por ejemplo `production`) y definir `ANTHROPIC_API_KEY`.

Arranque backend:

```bash
node app.js
```

### 2) Frontend

```bash
cd mi-frontend
npm install
npm run dev
```

Frontend por defecto: `http://localhost:5173`

## Configuracion de CORS y sesiones

El backend esta configurado para aceptar credenciales desde:

- `http://localhost:5173`

Si cambias puerto o dominio del frontend, actualiza `mi-backend/app.js` en la configuracion de `cors`.

## Roadmap propuesto

- Migrar de `mockData` a base de datos real (PostgreSQL o similar).
- Añadir validaciones de esquema y manejo de errores mas uniforme.
- Mejorar seguridad de sesion y configuracion para produccion.
- Añadir tests unitarios e integracion.
- Versionado/exportacion de informes (PDF/impresion).
- Mejorar observabilidad (logs estructurados, trazas y metricas).

## Estado del proyecto

Proyecto en construccion, orientado a evolucionar desde MVP funcional a plataforma estable para uso docente real.

Si quieres contribuir en esta fase, prioriza:

1. Calidad de arquitectura y dominio pedagogico.
2. Persistencia de datos y fiabilidad.
3. Experiencia de usuario en el editor de informes.
