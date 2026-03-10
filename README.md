# EduReports

Aplicacio web per docents orientada a crear informes qualitatius d'educacio infantil de manera mes rapida, estructurada i reutilitzable.

## Que fa avui

EduReports ja permet un flux funcional de punta a punta:

1. Autenticacio amb sessio per cookie.
2. Gestio de cursos, classes, alumnes i col·laboradors.
3. Gestio de categories/items (manual, importacio i exportacio).
4. Creacio de borradors d'informe per alumne amb auto-guardat.
5. Generacio d'informe en HTML amb IA.
6. Consulta, impressio i eliminacio d'informes guardats.

## Arquitectura

```text
EduReports/
  mi-backend/   API Express + MySQL + sessions + IA
  mi-frontend/  React + Vite
```

### Backend (`mi-backend`)

- Node.js + Express
- MySQL (`mysql2`)
- Sessions (`express-session`)
- Autenticacio amb `bcrypt`
- Integracio IA via `services/claude.js`

Rutes principals:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/check`
- `GET/POST/PUT/DELETE /courses`
- `GET/POST/DELETE /courses/:courseId/classes`
- `GET/POST/DELETE /courses/:courseId/classes/:classId/students`
- `GET/POST/PUT/DELETE /courses/:courseId/categories`
- `POST /courses/:courseId/categories/import`
- `GET /courses/:courseId/categories/export/csv`
- `GET/POST/DELETE /drafts/:studentId`
- `POST /reports/generate-report`, `GET /reports/:reportId`

### Frontend (`mi-frontend`)

- React 19 + React Router
- Vite
- UI amb components propis + Sonner (toasts)
- Importacio de fitxers `.csv/.xlsx` amb `xlsx`

Pantalles clau:

- Login
- My Courses
- Course Detail
- Create Report
- Generating Report
- Report View

## Dades i model funcional

### Alumnes

- `name`: nom (usat per IA en format anonimitzat via placeholder)
- `lastName`: cognoms, nomes per identificacio i titol
- `gender`: `nen | nena | altre | no_indicat`
- `age`: opcional

### IA i privacitat

El flux actual separa clarament dades per privacitat:

- A la IA s'envia `student.name = "STUDENT_NAME"` (placeholder), no el nom real.
- El backend substitueix el placeholder al resultat abans de guardar/servir.
- Al cos injectat de l'informe, es posa nomes el nom (sense cognoms).
- El titol de l'informe usa nom complet (nom + cognoms).

### Render de l'informe

- Frontend renderitza capcalera de vista (`report.title`, data, estat).
- HTML generat per IA es tracta com a cos del document.
- Backend normalitza el HTML per evitar capcaleres duplicades o estat dins el cos.

## Requisits

- Node.js 18+
- npm 9+
- MySQL 8+

## Instal·lacio local

### 1) Base de dades

1. Crea una base de dades (exemple: `edureports_db`).
2. Executa `mi-backend/scripts/create_tables.sql`.
3. (Opcional) Executa scripts auxiliars de `mi-backend/scripts/` segons el teu entorn.

### 2) Backend

```bash
cd mi-backend
npm install
node app.js
```

Crea `mi-backend/.env` amb minim:

```env
PORT=3000
SESSION_SECRET=canvia_aixo
NODE_ENV=dev
ANTHROPIC_API_KEY=
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=edureports_db
```

Notes:

- `NODE_ENV=dev` pot usar resposta mock al servei IA segons configuracio.
- Per IA real, cal `ANTHROPIC_API_KEY` valida.

### 3) Frontend

```bash
cd mi-frontend
npm install
npm run dev
```

Per defecte: `http://localhost:5173`

## CORS i sessions

El backend permet origins locals de Vite (`http://localhost:517X`) i credencials.

Si canvies domini/port, revisa `mi-backend/app.js` (bloc `cors`).

## Importacio / exportacio de categories

- Importacio: `.csv` o `.xlsx`.
- Si el format no es valid, es mostra `toast.error` al frontend.
- L'importacio substitueix categories/items del curs (amb confirmacio previa).
- Exportacio: CSV amb BOM UTF-8 i nom de fitxer del curs.

## Limitacions actuals

- No hi ha tests automatitzats integrats.
- Falta hardening de produccio (seguretat, observabilitat, validacions de contracte mes estrictes).
- El README de `mi-frontend` encara es generic de Vite.

## Properes millores recomanades

1. Afegir scripts npm (`start`, `dev`, `lint`) al backend.
2. Afegir migracions versionades (enlloc d'ALTER manuals).
3. Cobertura de tests (unitaris + integracio) per controllers i flux IA.
4. Endpoint de salut (`/health`) i logging estructurat.
