# EduReports

Aplicacio web per docents orientada a crear informes qualitatius d'educacio infantil de manera mes rapida, estructurada i reutilitzable.

## Que fa avui

EduReports ja permet un flux funcional de punta a punta:

1. **Autenticacio** amb sessio persistent per cookie
2. **Gestio de cursos** amb creacio, edicio, eliminacio i comparticio
3. **Gestio de classes i alumnes** per curs amb dades completes (nom, cognoms, gènere, edat)
4. **Sistema de col·laboradors** amb invitacions per email via app i gestio de permisos
5. **Gestio de categories/items** (manual, importacio CSV/XLSX i exportacio)
6. **Creacio d'informes** amb constructor drag-and-drop, apartats col·lapsables i numerats
7. **Plantilles reutilitzables** per estructurar informes de manera consistent
8. **Auto-guardat de borradors** amb persistencia automatica a cada canvi
9. **Validacions intel·ligents** (apartats sense nom, informes sense observacions finals, items duplicats)
10. **Generacio d'informes amb IA** (Claude API) amb privacitat i anonymitzacio
11. **Visualitzacio i gestio d'informes** generats amb HTML renderitzat
12. **Selector de categories visual** amb indicadors d'us, estadistiques i colors personalitzats
13. **Gestio de colors** per categories amb paleta predefinida i custom

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

**Autenticacio (`/auth`)**
- `POST /auth/register` - Registre de nou usuari
- `POST /auth/login` - Login amb email/password
- `POST /auth/logout` - Tancar sessio
- `GET /auth/me` - Obtenir dades usuari autenticat
- `GET /auth/check` - Verificar estat de sessio

**Cursos (`/courses`)**
- `GET /courses` - Llistar cursos propis
- `GET /courses/shared` - Llistar cursos compartits amb l'usuari
- `POST /courses` - Crear nou curs
- `GET /courses/:id` - Detalls d'un curs
- `PUT /courses/:id` - Actualitzar curs
- `DELETE /courses/:id` - Eliminar curs

**Classes (`/courses/:courseId/classes`)**
- `GET /courses/:courseId/classes` - Llistar classes del curs
- `POST /courses/:courseId/classes` - Crear nova classe
- `PUT /courses/:courseId/classes/:classId` - Actualitzar classe
- `DELETE /courses/:courseId/classes/:classId` - Eliminar classe

**Alumnes (`/courses/:courseId/classes/:classId/students`)**
- `GET /courses/:courseId/classes/:classId/students` - Llistar alumnes
- `POST /courses/:courseId/classes/:classId/students` - Afegir alumne
- `PUT /courses/:courseId/classes/:classId/students/:studentId` - Actualitzar alumne
- `DELETE /courses/:courseId/classes/:classId/students/:studentId` - Eliminar alumne

**Categories (`/courses/:courseId/categories`)**
- `GET /courses/:courseId/categories` - Llistar categories/items
- `POST /courses/:courseId/categories` - Crear categoria/item
- `PUT /courses/:courseId/categories/:key` - Actualitzar categoria/item
- `DELETE /courses/:courseId/categories/:key` - Eliminar categoria/item
- `POST /courses/:courseId/categories/import` - Importar CSV/XLSX
- `GET /courses/:courseId/categories/export/csv` - Exportar a CSV

**Plantilles (`/courses/:courseId/templates`)**
- `GET /courses/:courseId/templates` - Llistar plantilles del curs
- `GET /courses/:courseId/templates/:templateId` - Obtenir plantilla
- `POST /courses/:courseId/templates` - Crear/actualitzar plantilla
- `PUT /courses/:courseId/templates/:templateId` - Actualitzar plantilla
- `DELETE /courses/:courseId/templates/:templateId` - Eliminar plantilla

**Borradors (`/drafts`)**
- `GET /drafts/:studentId` - Obtenir borrador d'alumne
- `POST /drafts/:studentId` - Guardar borrador
- `DELETE /drafts/:studentId` - Eliminar borrador

**Informes (`/reports`)**
- `POST /reports/generate-report` - Generar informe amb IA
- `GET /reports/:reportId` - Consultar informe generat
- `DELETE /reports/:reportId` - Eliminar informe

**Invitacions (`/invitations`)**
- `POST /invitations/by-email` - Enviar invitacio per email
- `GET /invitations/course/:courseId/pending` - Invitacions pendents del curs
- `GET /invitations/:userId` - Invitacions de l'usuari
- `POST /invitations/accept/:invitationId` - Acceptar invitacio
- `POST /invitations/decline/:invitationId` - Refusar invitacio
- `DELETE /invitations/:invitationId` - Eliminar invitacio

### Frontend (`mi-frontend`)

- React 19 + React Router v6
- Vite
- Tailwind CSS + Shadcn/ui components
- Sonner per notificacions toast
- HTML5 Drag & Drop API per reordenacio visual
- Importacio de fitxers `.csv/.xlsx` amb biblioteca `xlsx`

Pantalles clau:

- **Login** - Autenticacio amb email/password
- **Home** - Dashboard principal (portada inicial)
- **My Courses** - Llistat de cursos propis i compartits
- **Course Detail** - Gestio completa del curs amb pestanyes:
  - Classes: Gestió de classes i alumnes
  - Items: Categories i items del curs
  - Templates: Plantilles reutilitzables
  - Collaborators: Invitacions i permisos
- **Create Report** - Constructor d'informes amb drag-and-drop
- **Template Builder** - Creador de plantilles amb mateixa funcionalitat
- **Generating Report** - Pantalla d'espera durant generacio IA
- **Generated Report** - Visualitzacio HTML de l'informe generat
- **Report View** - Consulta d'informes guardats

### UI/UX Features

**Constructor d'Informes i Plantilles:**
- **Apartats col·lapsables** amb comportament accordion (només un obert a la vegada)
- **Numeracio visual** d'apartats (1, 2, 3...) amb badges de color
- **Click a tot l'header** per expandir/col·lapsar amb cursor pointer
- **Auto-expansio** quan es crea un nou apartat
- **Drag-and-drop** per reordenar apartats i items
- **Auto-guardat** de borradors a cada canvi
- **Validacions intel·ligents**:
  - Avís quan es finalitza informe sense observacions finals
  - Error quan es guarda plantilla amb apartats sense nom
  - Prevencio de items duplicats per apartat

**Selector de Categories:**
- **Navegacio jerarquica** amb boto back semi-transparent
- **Indicadors d'us** ("Utilitzat" badge als items ja seleccionats)
- **Estadistiques visuals** (X de N items utilitzats per categoria)
- **Colors personalitzats** per categoria amb barra lateral
- **Boto X per eliminar** items directament des del modal
- **Modal persistent** que no es tanca en seleccionar items
- **Truncament de text llarg** amb line-clamp-3

**Components reutilitzables:**
- `DraggableBlock` - Bloc arrossegable amb col·lapse i numeracio
- `CategorySelector` - Modal de seleccio d'items amb categories
- `FinalizeModal` - Revisio i validacio pre-generacio
- `CategoryManager` - Gestio completa de categories/items/colors
- `NavBar` - Barra de navegacio responsive
- `ProtectedRoute` - Proteccio de rutes amb autenticacio

## Dades i model funcional

### Cursos

- `name`: nom del curs
- `owner_id`: usuari propietari
- `available_colors`: JSON amb paleta de colors per categories
- Relacions: classes, alumnes, categories, plantilles, col·laboradors

### Classes i Alumnes

Cada curs conte classes, cada classe conte alumnes.

**Alumnes:**
- `name`: nom (usat per IA en format anonimitzat via placeholder)
- `lastName`: cognoms, nomes per identificacio i titol
- `gender`: `nen | nena | altre | no_indicat`
- `age`: opcional

### Categories i Items

Sistema jerarquic flexible: categories contenen items.

- `category_key`: identificador de categoria (ex: `comportament`)
- `item_key`: identificador d'item (ex: `comportament.participa`)
- `category_name`: nom visible de la categoria
- `item_text`: text de l'item (frase completa)
- `color`: color assignat a la categoria
- Importacio/exportacio en formats CSV i XLSX
- Gestio de colors personalitzats per categoria

### Plantilles

Les plantilles defineixen estructures reutilitzables per informes:

- Estructura identica al constructor d'informes (apartats + items)
- Validacio: apartats han de tenir nom abans de guardar
- Carregables a "Create Report" per iniciar rapidament
- Permeten coherencia entre informes del mateix tipus
- Visuals identiques: col·lapsables, numerades, drag-and-drop

### Col·laboracio

Sistema d'invitacions per compartir cursos:

- Invitacions per email amb acceptacio/refus
- El propietari (`owner`) manté control total
- Gestio d'invitacions pendents per curs

### IA i privacitat

El flux actual separa clarament dades per privacitat:

- **A la IA s'envia** `student.name = "STUDENT_NAME"` (placeholder), **no el nom real**
- El backend substitueix el placeholder al resultat abans de guardar/servir
- Al cos injectat de l'informe, es posa nomes el nom (sense cognoms)
- El titol de l'informe usa nom complet (nom + cognoms)
- Les dades d'estructura (apartats, items) s'envien anonimitzades
- Gènere i edat s'envien per contextualitzar el llenguatge
- **Important:** Cap dada sensible (cognoms, identificadors únics) arriba a Claude API

**Proces de generacio:**

1. Frontend envia estructura d'informe + configuracio (conclusions si/no)
2. Backend construeix prompt amb:`- Estructura amb apartats i items seleccionats
   - Placeholder "STUDENT_NAME" enlloc del nom real
   - Context de gènere i edat si disponible
   - Instruccions de format i to educatiu
3. Claude API genera HTML amb text narratiu basat en items
4. Backend normalitza HTML i substitueix placeholder per nom real
5. S'emmagatzema informe complet amb titol (nom+cognoms) i data
6. Frontend renderitza HTML en vista segura

### Render de l'informe

- Frontend renderitza capçalera de vista (`report.title`, data, estat)
- HTML generat per IA es tracta com a cos del document
- Backend normalitza el HTML per evitar capçaleres duplicades o estat dins el cos
- Vista d'impressio: neteja d'estils i capçalera professional

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

Crea `mi-backend/.env` amb les següents variables:

```env
# Server
PORT=3000
NODE_ENV=dev

# Sessions
SESSION_SECRET=canvia_aixo_per_una_clau_segura_en_produccio

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=la_teva_contrasenya
DB_NAME=edureports_db

# Frontend CORS (opcional, per defecte localhost:5173)
FRONTEND_URL=http://localhost:5173
```

Notes:

- `NODE_ENV=dev` pot usar resposta mock al servei IA segons configuracio
- Per IA real, cal `ANTHROPIC_API_KEY` valida (model: claude-3-5-sonnet)
- `SESSION_SECRET` ha de ser una clau aleatoria segura en produccio
- El servidor escolta per defecte al PORT especificat (3000)

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

## Patrons i decisions de disseny

### Accordion behavior (apartats col·lapsables)

Els constructors d'informes i plantilles usen patró accordion:
- Només un apartat obert a la vegada (millor focus cognitiu)
- State gestionat amb `expandedHeaderId` (null = tots tancats)
- Clic a tot el header per expandir/col·lapsar (àrea d'interacció gran)
- Auto-expansió quan es crea nou apartat

### Prevenció de duplicats

Sistema `itemUsageMap` compta usos d'items per apartat:
- Badge "Utilitzat" quan `usageCount >= 1`
- Bloqueig de selecció si ja està utilitzat
- Permet mateix item en diferents apartats (flexible)

### Auto-guardat de borradors

Cada canvi a l'estructura triggeja `saveDraft`:
- Debounce implicit per evitar massa peticions
- Feedback visual amb toast només en errors
- State local sempre primer (optimistic)

### Drag-and-drop amb intel·ligència

`handleDragStart` prevé drag quan:
- Clic dins d'input o textarea (edició de text)
- Clic en botons d'acció
- Permet drag només des del "handle" visual

### Validacions graceful

- Confirmacions enlloc de blocatges durs
- Warnings visuals (banners ambre) abans d'errors
- Toast errors només per problemes reals
- Permet guardar borrador sempre (no bloquejar creativitat)

## Importacio / exportacio de categories

- **Formats suportats:** `.csv` i `.xlsx`
- **Importacio:** Substitueix totes les categories/items del curs (amb confirmacio previa)
- **Exportacio:** CSV amb BOM UTF-8 per compatibilitat amb Excel
  - Nom de fitxer basat en el nom del curs
  - Inclou totes les categories i items amb colors assignats
- **Colors:** Si no s'especifica color a la importacio, s'assigna un dels disponibles
- **Casos d'us:** 
  - Reutilitzar categories d'altres cursos
  - Editar massivament en full de càlcul
  - Backup i restauracio de configuracions

### Format d'importacio

El format esperat és per columnes: cada columna representa una categoria i conté els seus items.

**Estructura:**
- **Primera fila:** Noms de les categories
- **Files següents:** Items de cada categoria (un item per fila)

**Exemple:**

| Comportament | Autonomia | Socialització |
|--------------|-----------|---------------|
| Participa activament a classe | Es vesteix sol/a | Comparteix joguines |
| Respecta el torn de paraula | Menja de manera autònoma | Juga amb companys |
| Segueix les normes | Ordena el material | Resol conflictes dialogant |
| Manté l'atenció | Demana ajuda quan ho necessita | Mostra empatia |

**Notes:**
- Les columnes poden tenir diferent nombre d'items (cel·les buides s'ignoren)
- Els noms de categories de la primera fila són obligatoris
- Els items són frases completes que es poden seleccionar per l'informe
- A l'exportació es mantindrà aquest mateix format
- Validacio: Si el format no es valid, es mostra `toast.error` al frontend

## Limitacions actuals

- **Tests:** No hi ha tests automatitzats (unitaris ni d'integracio)
- **Produccio:** Falta hardening complet:
  - Validacions de contracte més estrictes a l'API
  - Rate limiting per prevenir abusos (especialment generacio IA)
  - Logging estructurat i monitoritzacio
  - Gestio d'errors més robusta
- **Usuari demo:** No hi ha compte demo protegit contra modificacions
- **Migracions:** ALTER manuals enlloc de sistema de migracions versionades
- **Documentation:** README de `mi-frontend` encara és generic de Vite
- **Optimitzacions:**
  - No hi ha cache per respostes API freqüents
  - Queries SQL podrien optimitzar-se amb indexes
  - Imatges/assets sense compressio automatica
- **Accessibilitat:** Falta auditoria WCAG completa (keyboard nav, screen readers)
- **Internacionalitzacio:** Text hardcoded en català, sense sistema i18n

## Properes millores recomanades

### Curt termini

1. **Usuari demo protegit:**
   - Afegir camp `is_demo` a taula users
   - Middleware per bloquejar DELETE i limitar creacions
   - Script de reset nocturn per netejar dades demo
   - Rate limiting més estricte per usuaris demo

2. **Scripts npm:** Afegir al backend (`start`, `dev`, `lint`, `test`)

3. **Endpoint de salut:** `/health` per monitoring i health checks

4. **Validacions millorades:**
   - Validacio de formats d'email més robusta
   - Limits de longitud per noms, texts, etc.
   - Sanititzacio d'inputs per prevenir XSS

### Mitjà termini

5. **Sistema de migracions:** Usar eina com `knex` o `db-migrate` per versionat

6. **Tests automatitzats:**
   - Unitaris per controllers i services
   - Integracio per flux complert (auth, CRUD, generacio IA)
   - E2E amb Playwright per fluxos crítics

7. **Error boundaries:** Implementar a React per capturar errors gracefully

8. **Retry logic:** Per peticions API fallides (resiliencia de xarxa)

9. **Optimistic UI:** Actualitzacions optimistes per millor UX

### Llarg termini

10. **Cache layer:** Redis per sessions i respostes API freqüents

11. **WebSockets:** Actualitzacions en temps real per col·laboracio

12. **Versionat d'informes:** Historial de canvis i comparacio

13. **Analytics:** Dashboard amb metriques d'ús per docents

14. **Mobile app:** Versio nativa per iOS/Android (React Native)

15. **Integracio:** Export a PDF, integracio amb Google Classroom, etc.
