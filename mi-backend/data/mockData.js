const responseExample = {
    "id": "msg_01JB9Vqemxf3QqNaEXbnPNxU",
    "type": "message",
    "role": "assistant",
    "model": "claude-sonnet-4-20250514",
    "content": [{
        "type": "text",
        "text": "<div class='prose max-w-none'>\n\n<h1 class='text-3xl font-bold text-gray-900 mb-2'>Informe de Marc Garcia</h1>\n<p class='text-gray-500 mb-6'>I3-A - Desembre 2024</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Hàbits i Autonomia\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nMarc demostra una bona autonomia personal en les rutines diàries de l'aula. Es treu la jaqueta i la penja al seu lloc sense necessitat d'ajuda, cosa que mostra el seu domini d'aquests hàbits bàsics. També mostra iniciativa a l'hora de recollir les joguines després de les activitats, participant de forma activa en l'ordre de l'espai. Pel que fa a la higiene personal, utilitza el lavabo de manera autònoma seguint correctament els passos necessaris, la qual cosa indica una bona consolidació d'aquests aprenentatges.\n</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Llenguatge i Comunicació\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nEn l'àmbit comunicatiu, Marc participa activament en les rotllanes del matí, on explica les seves vivències amb seguretat i claredat. Ha desenvolupat habilitats de prelectura interessants, ja que identifica el seu nom escrit i també el d'alguns companys de classe. Durant l'hora del conte, gaudeix de l'escolta dels relats i manté l'atenció al llarg de tota l'activitat, mostrant interès per les narracions i la lectura.\n</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Relacions Socials\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nMarc mostra una actitud positiva en les relacions amb els seus companys. Comparteix els materials amb els companys de la seva taula de manera natural i col·laborativa. Està aprenent a gestionar els conflictes de forma constructiva, començant a resoldre petits desacords mitjançant la paraula en lloc de reaccions impulsives. També respecta el torn de paraula durant les activitats grupals, demostrant comprensió de les normes de convivència de l'aula.\n</p>\n\n<h2 class='text-2xl font-bold text-indigo-700 mt-8 mb-4 border-b pb-2 border-indigo-100'>\n   Psicomotricitat\n</h2>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nEn l'àmbit motor, Marc mostra un bon control del cos en les activitats que requereixen salt i equilibri, participant amb confiança en les propostes de moviment. Pel que fa a la motricitat fina, està millorant progressivament la pinça digital en les tasques de dibuix i pintura, cosa que li permet tenir més precisió en aquestes activitats creatives.\n</p>\n\n<p class='text-gray-700 leading-relaxed mb-4 text-lg'>\nValoro positivament l'evolució del Marc en tots els àmbits treballats aquest trimestre. Mostra una actitud positiva cap als aprenentatges i una bona disposició per participar en les activitats propostes. Continuarem treballant per consolidar aquests avenços i acompanyar-lo en el seu desenvolupament integral.\n</p>\n\n</div>"
    }],
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
    "sections": [{
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
    responseExample,
};