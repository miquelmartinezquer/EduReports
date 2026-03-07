// Dades simulades (més endavant es poden moure a una base de dades)

// Usuaris del sistema amb autenticació
// Contrasenya per defecte: "password123"
// Hash generat amb: bcrypt.hash('password123', 10)
let users = [
  { 
    id: 1, 
    name: 'Maria Professora', 
    email: 'maria@escola.cat',
    passwordHash: '$2b$10$Ze68VCe1f3NNyNTsstRbreosEILRwj3DDZUJnBvndfHhkLJZ1dEyu', // "password123" - cal generar hash real
    role: 'teacher',
    createdAt: '2024-01-01'
  },
  { 
    id: 2, 
    name: 'Joan Director', 
    email: 'joan@escola.cat',
    passwordHash: '$2b$10$Ze68VCe1f3NNyNTsstRbreosEILRwj3DDZUJnBvndfHhkLJZ1dEyu', // "password123" - cal generar hash real
    role: 'admin',
    createdAt: '2024-01-01'
  },
    { 
    id: 3, 
    name: 'Miquel', 
    email: 'miquel@escola.cat',
    passwordHash: '$2b$10$S7XpseZOzNrwSdiqq6qnJulbmlQQd1Um0r4Kmg1iG7JX89MB4NbSW', // "prova123" - cal generar hash real
    role: 'admin',
    createdAt: '2024-01-01'
  }
];

let userIdCounter = 3;

const availableColors = [
  { key: 'purple', name: 'Porpra', hover: 'hover:border-purple-400 hover:bg-purple-50' },
  { key: 'blue', name: 'Blau', hover: 'hover:border-blue-400 hover:bg-blue-50' },
  { key: 'green', name: 'Verd', hover: 'hover:border-green-400 hover:bg-green-50' },
  { key: 'orange', name: 'Taronja', hover: 'hover:border-orange-400 hover:bg-orange-50' },
  { key: 'red', name: 'Vermell', hover: 'hover:border-red-400 hover:bg-red-50' },
  { key: 'pink', name: 'Rosa', hover: 'hover:border-pink-400 hover:bg-pink-50' },
  { key: 'yellow', name: 'Groc', hover: 'hover:border-yellow-400 hover:bg-yellow-50' },
  { key: 'teal', name: 'Jade', hover: 'hover:border-teal-400 hover:bg-teal-50' },
  { key: 'cyan', name: 'Cian', hover: 'hover:border-cyan-400 hover:bg-cyan-50' },
  { key: 'indigo', name: 'Indi', hover: 'hover:border-indigo-400 hover:bg-indigo-50' },
  { key: 'slate', name: 'Pissarra', hover: 'hover:border-slate-400 hover:bg-slate-50' },
  { key: 'emerald', name: 'Maragda', hover: 'hover:border-emerald-400 hover:bg-emerald-50' }
];

// Categories globals (plantilles disponibles per a tots els usuaris)
const globalCategories = {
  autonomia: {
    name: 'Autonomia Personal',
    color: 'purple',
    items: [
      "S'abotona i desabotona la bata de manera autònoma",
      "Utilitza els coberts correctament durant els àpats",
      "Es renta les mans sense ajuda després d'anar al bany"
    ]
  },
  comunicacio: {
    name: 'Comunicació i Llenguatge',
    color: 'blue',
    items: [
      "Expressa les seves necessitats amb frases completes",
      "Escolta i respon preguntes adequadament",
      "Explica vivències personals de forma coherent",
      "Reconeix i anomena les lletres del seu nom"
    ]
  },
  matematiques: {
    name: 'Matematiques',
    color: 'green',
    items: [
      "Compta fins a 10 objectes correctament",
      "Reconeix i escriu els números de l'1 al 5"
    ]
  }
};

// Categories per usuari (deprecated - mantenim per compatibilitat)
const userCategories = globalCategories;

// Categories personalitzades per usuari
let userCustomCategories = {
  1: {}, // Maria no té categories personalitzades encara
  2: {}  // Joan no té categories personalitzades encara
};

let courses = [
  { id: 1, userId: 1, name: 'Matemàtiques I3', level: 'I3', createdAt: '2024-01-15' },
  { id: 2, userId: 1, name: 'Llenguatge I4', level: 'I4', createdAt: '2024-02-20' },
  { id: 3, userId: 2, name: 'Ciències Naturals I5', level: 'I5', createdAt: '2024-03-10' }
];

let courseIdCounter = 4;

// Col·laboradors dels cursos
let collaborators = [
  { id: 1, courseId: 1, name: 'Maria Professora', role: 'Professor/a', email: 'maria@escola.cat', isOwner: true, addedAt: '2024-01-15' },
  { id: 2, courseId: 1, name: 'Anna Martínez', role: 'Professor/a', email: 'anna@escola.cat', addedAt: '2024-01-15' },
  { id: 3, courseId: 1, name: 'Pere López', role: 'Tutor/a', email: 'pere@escola.cat', addedAt: '2024-01-20' },
  { id: 4, courseId: 2, name: 'Maria Professora', role: 'Professor/a', email: 'maria@escola.cat', isOwner: true, addedAt: '2024-02-20' },
  { id: 5, courseId: 3, name: 'Joan Director', role: 'Professor/a', email: 'joan@escola.cat', isOwner: true, addedAt: '2024-03-10' },
];

let collaboratorIdCounter = 6;

// Classes dins dels cursos
let classes = [
  { id: 1, courseId: 1, name: 'Grup A - Matins', schedule: 'Dilluns i Dimecres 9:00-11:00', createdAt: '2024-01-16' },
  { id: 2, courseId: 1, name: 'Grup B - Tardes', schedule: 'Dimarts i Dijous 15:00-17:00', createdAt: '2024-01-16' },
  { id: 3, courseId: 2, name: 'Grup Únic', schedule: 'Divendres 10:00-12:00', createdAt: '2024-02-21' },
];

let classIdCounter = 4;

// Alumnes de les classes
let students = [
  { id: 1, classId: 1, name: 'Marc Garcia', age: 5, enrolledAt: '2024-01-18' },
  { id: 2, classId: 1, name: 'Laura Pérez', age: 5, enrolledAt: '2024-01-18' },
  { id: 3, classId: 1, name: 'Joan Sánchez', age: 6, enrolledAt: '2024-01-20' },
  { id: 4, classId: 2, name: 'Sofia Ruiz', age: 5, enrolledAt: '2024-01-18' },
  { id: 5, classId: 2, name: 'Pau Torres', age: 6, enrolledAt: '2024-01-19' },
  { id: 6, classId: 3, name: 'Emma Fernández', age: 6, enrolledAt: '2024-02-22' },
];

let studentIdCounter = 7;

// Informes dels alumnes
let reports = [
  { 
    id: 1, 
    studentId: 1, 
    courseId: 1,
    title: 'Informe 1r Trimestre',
    createdAt: '2024-03-01',
    htmlContent: '<div>Informe d\'exemple per Marc Garcia...</div>',
    status: 'completed'
  },
  { 
    id: 2, 
    studentId: 2, 
    courseId: 1,
    title: 'Informe 1r Trimestre',
    createdAt: '2024-03-02',
    htmlContent: '<div>Informe d\'exemple per Laura Pérez...</div>',
    status: 'completed'
  }
];

let reportIdCounter = 3;

// Esborranys d'informes
let reportDrafts = [
  // Exemple:
  // {
  //   id: 1,
  //   studentId: 1,
  //   courseId: 1,
  //   userId: 1,
  //   elements: [],
  //   studentName: 'Marc Garcia',
  //   course: 'I3',
  //   language: 'Català',
  //   elementCounter: 0,
  //   lastModified: '2024-03-05T10:30:00.000Z'
  // }
];

let draftIdCounter = 1;

// Categories d'items per cada curs
let courseCategories = {
  1: { // Matemàtiques I3
    autonomia: {
      name: 'Autonomia Personal',
      color: 'purple',
      items: [
        "S'abotona i desabotona la bata de manera autònoma",
        "Utilitza els coberts correctament durant els àpats"
      ]
    },
    matematiques: {
      name: 'Matemàtiques',
      color: 'blue',
      items: [
        "Compta fins a 10 objectes correctament",
        "Reconeix i escriu els números de l'1 al 5"
      ]
    }
  },
  2: { // Llenguatge I4
    comunicacio: {
      name: 'Comunicació i Llenguatge',
      color: 'green',
      items: [
        "Expressa les seves necessitats amb frases completes",
        "Escolta i respon preguntes adequadament"
      ]
    }
  },
  3: {} // Ciències Naturals I5 - sense categories encara
};

const responseExample = {
  "id": "msg_01JB9Vqemxf3QqNaEXbnPNxU",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-20250514",
  "content": [
    {
      "type": "text",
      "text": "<div class='prose max-w-none'>\n\n<h1 class='text-3xl font-bold text-gray-900 mb-2'>Informe de Marc Garcia</h1>\n<p class='text-gray-500 mb-6'>I3-A - Desembre 2024</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Hàbits i Autonomia\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nMarc demostra una bona autonomia personal en les rutines diàries de l'aula. Es treu la jaqueta i la penja al seu lloc sense necessitat d'ajuda, cosa que mostra el seu domini d'aquests hàbits bàsics. També mostra iniciativa a l'hora de recollir les joguines després de les activitats, participant de forma activa en l'ordre de l'espai. Pel que fa a la higiene personal, utilitza el lavabo de manera autònoma seguint correctament els passos necessaris, la qual cosa indica una bona consolidació d'aquests aprenentatges.\n</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Llenguatge i Comunicació\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nEn l'àmbit comunicatiu, Marc participa activament en les rotllanes del matí, on explica les seves vivències amb seguretat i claredat. Ha desenvolupat habilitats de prelectura interessants, ja que identifica el seu nom escrit i també el d'alguns companys de classe. Durant l'hora del conte, gaudeix de l'escolta dels relats i manté l'atenció al llarg de tota l'activitat, mostrant interès per les narracions i la lectura.\n</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Relacions Socials\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nMarc mostra una actitud positiva en les relacions amb els seus companys. Comparteix els materials amb els companys de la seva taula de manera natural i col·laborativa. Està aprenent a gestionar els conflictes de forma constructiva, començant a resoldre petits desacords mitjançant la paraula en lloc de reaccions impulsives. També respecta el torn de paraula durant les activitats grupals, demostrant comprensió de les normes de convivència de l'aula.\n</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Psicomotricitat\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nEn l'àmbit motor, Marc mostra un bon control del cos en les activitats que requereixen salt i equilibri, participant amb confiança en les propostes de moviment. Pel que fa a la motricitat fina, està millorant progressivament la pinça digital en les tasques de dibuix i pintura, cosa que li permet tenir més precisió en aquestes activitats creatives.\n</p>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nValoro positivament l'evolució del Marc en tots els àmbits treballats aquest trimestre. Mostra una actitud positiva cap als aprenentatges i una bona disposició per participar en les activitats propostes. Continuarem treballant per consolidar aquests avenços i acompanyar-lo en el seu desenvolupament integral.\n</p>\n\n</div>"
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 497,
    "cache_creation_input_tokens": 1113,
    "cache_read_input_tokens": 0,
    "output_tokens": 1017
  }
}

const reportDataExample = {
  "student": {
    "name": "Marc Garcia",
    "course": "I3-A",
    "language": "Català"
  },
  "sections": [
    {
      "type": "section",
      "title": "Hàbits i Autonomia",
      "items": [
        { "content": "Es treu la jaqueta i la penja al seu lloc sense ajuda." },
        { "content": "Mostra iniciativa a l'hora de recollir les joguines de l'aula." },
        { "content": "Utilitza el lavabo de manera autònoma seguint els passos d'higiene." }
      ]
    },
    {
      "type": "section",
      "title": "Llenguatge i Comunicació",
      "items": [
        { "content": "Participa activament en les rotllanes del matí explicant vivències." },
        { "content": "Identifica el seu nom escrit i el d'alguns companys." },
        { "content": "Gaudeix de l'escolta de contes i manté l'atenció durant el relat." }
      ]
    },
    {
      "type": "section",
      "title": "Relacions Socials",
      "items": [
        { "content": "Comparteix els materials amb els companys de la seva taula." },
        { "content": "Comença a resoldre petits conflictes mitjançant la paraula." },
        { "content": "Respecte el torn de paraula durant les activitats grupals." }
      ]
    },
    {
      "type": "section",
      "title": "Psicomotricitat",
      "items": [
        { "content": "Mostra bon control del cos en les activitats de salt i equilibri." },
        { "content": "Està millorant la pinça digital en les tasques de dibuix i pintura." }
      ]
    }
  ]
}

module.exports = {
  users,
  userIdCounter,
  globalCategories,
  userCategories,
  userCustomCategories,
  availableColors,
  responseExample,
  courses,
  courseIdCounter,
  collaborators,
  collaboratorIdCounter,
  classes,
  classIdCounter,
  students,
  studentIdCounter,
  reports,
  reportIdCounter,
  reportDrafts,
  draftIdCounter,
  courseCategories
};
