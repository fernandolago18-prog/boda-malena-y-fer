/* ============================================================================
   CONFIGURACIÓN MAESTRA DE LA BODA · MALENA & FER
   Edita este único archivo para personalizar nombres, fechas, fotos, mapa,
   hoteles, horarios y conexión con Google Forms o Google Apps Script.
   ============================================================================ */

window.BODA_CONFIG = {
  couple: {
    partner1: 'Malena',
    partner2: 'Fer',
    monogram: 'M & F',
    hashtag: '#MalenaYFer2027',
    email: 'boda@malenayfer.es'
  },

  wedding: {
    // Formato ISO con zona horaria (+02:00 en septiembre en España)
    dateISO: '2027-09-18T18:00:00+02:00',
    dateDisplay: '18 de septiembre de 2027',
    weekdayDisplay: 'Sábado, 18 de septiembre de 2027',
    locationShort: 'Finca El Olivar · Murcia',
    calendarEndISO: '2027-09-19T04:00:00+02:00',
    calendarTitle: 'Boda de Malena & Fer',
    calendarLocation: 'Finca El Olivar (Ubicación de ejemplo), Murcia',
    calendarDescription:
      '¡Nos casamos! Gracias por acompañarnos en este día tan especial y seguir construyendo momentos junto a nosotros.'
  },

  envelope: {
    // Segundos que la invitación permanece completamente fuera del sobre para leerla con calma
    readDurationSeconds: 4.5,
    invitationTagline: 'Con toda la ilusión del mundo, os invitamos a celebrar nuestra boda.'
  },

  cinema: {
    // Modos disponibles:
    //   'storyboard'   -> 4 escenas fotográficas con parallax, partículas doradas y trazo SVG (activo por defecto)
    //   'video-frames' -> Secuencia de fotogramas extraídos de vuestro vídeo en un <canvas> ligado al scroll
    //   'video-direct' -> Vídeo MP4 directo sincronizado con el scroll
    mode: 'storyboard',

    // Configuración si cambias mode a 'video-frames' (ver README.md para el comando ffmpeg)
    videoFrames: {
      folder: 'assets/frames/',
      prefix: 'frame_',
      extension: 'webp',
      frameCount: 120,
      padLength: 4
    },

    // Configuración si cambias mode a 'video-direct'
    videoDirect: {
      src: 'assets/video/boda-scroll.mp4',
      poster: 'assets/images/scene-1-comienzo.jpg'
    },

    chapters: [
      {
        id: 'capitulo-1',
        roman: 'I',
        shortLabel: 'El Primer Cruce',
        eyebrow: 'Capítulo I · Hace seis años',
        title: 'Cuando el destino nos pidió paciencia',
        text: 'Nos conocimos hace seis años, en nuestra primera toma de contacto durante el covid. El destino decidió que aún no era el momento y prefirió esperar un año más para cruzar de verdad nuestros caminos.',
        image: 'assets/images/scene-1-comienzo.jpg',
        theme: 'dawn',
        polaroidCaption: 'Primer encuentro · 2020'
      },
      {
        id: 'capitulo-2',
        roman: 'II',
        shortLabel: 'Cumple de Bili',
        eyebrow: 'Capítulo II · Un año después',
        title: 'Miradas, palabras y los primeros bailes',
        text: 'Hasta que llegó el cumpleaños de nuestra gran amiga Bili. Allí intercambiamos por primera vez miradas cómplices, conversaciones sin prisa y unos bailes que marcaron el inicio de todo.',
        image: 'assets/images/scene-2-ceremonia.jpg',
        theme: 'olive',
        polaroidCaption: 'Cumpleaños de Bili · 2021'
      },
      {
        id: 'capitulo-3',
        roman: 'III',
        shortLabel: 'Bando 2022',
        eyebrow: 'Capítulo III · Primavera de 2022',
        title: 'Aquel primer beso en el Bando de la Huerta',
        text: 'Después de coincidir en varias fiestas, en aquel Bando de la Huerta de 2022 nos dimos nuestro primer beso. Desde entonces han pasado casi cinco años construyendo recuerdos juntos.',
        image: 'assets/images/scene-3-banquete.jpg',
        theme: 'twilight',
        polaroidCaption: 'Bando de la Huerta · 2022'
      },
      {
        id: 'capitulo-4',
        roman: 'IV',
        shortLabel: 'Nos Casamos',
        eyebrow: 'Capítulo IV · Nuestro gran paso',
        title: 'Queremos hacer este día inolvidable contigo',
        text: 'Ahora damos un paso muy importante en nuestras vidas y nos casamos. Nada sería igual sin vosotros a nuestro lado para brindar, celebrar y hacer este día aún más especial.',
        image: 'assets/images/scene-4-fiesta.jpg',
        theme: 'night',
        polaroidCaption: 'Malena & Fer · 2027'
      }
    ]
  },

  schedule: [
    {
      time: '17:30',
      title: 'Llegada y Bienvenida',
      subtitle: 'Jardín de los Cipreses',
      description: 'Recepción de invitados con agua aromatizada, abanicos de tela y música acústica mientras encontráis vuestro sitio.',
      icon: 'welcome',
      mood: 'day'
    },
    {
      time: '18:00',
      title: 'La Ceremonia',
      subtitle: 'Patio de los Olivos',
      description: 'Nuestro «sí, quiero» al aire libre. Prometemos emoción de la buena y pañuelos discretos por si cae alguna lágrima.',
      icon: 'rings',
      mood: 'day'
    },
    {
      time: '19:15',
      title: 'Cóctel al Atardecer',
      subtitle: 'Mirador del Jardín',
      description: 'Jamón al corte, croquetas caseras de campeonato, estaciones de cocina en vivo y barra de vermut mientras cae el sol.',
      icon: 'cocktail',
      mood: 'sunset'
    },
    {
      time: '21:00',
      title: 'Banquete bajo las Estrellas',
      subtitle: 'Pérgola Principal',
      description: 'Cena sentados entre luces cálidas, brindis improvisados y alguna sorpresa que aún no podemos desvelar.',
      icon: 'dinner',
      mood: 'sunset'
    },
    {
      time: '23:30',
      title: 'Barra Libre & DJ',
      subtitle: 'Invernaderos de la Finca',
      description: 'Primer baile, bengalas y pista abierta. A la 01:30 h llega la recena con mini hamburguesas y churros con chocolate.',
      icon: 'party',
      mood: 'night'
    },
    {
      time: '03:00',
      title: 'Último Autobús de Vuelta',
      subtitle: 'Destino Centro de Murcia y Hoteles',
      description: 'Tendremos lanzaderas a la 01:30 h y a las 03:00 h para que nadie tenga que mirar el coche ni el reloj.',
      icon: 'bus',
      mood: 'night'
    }
  ],

  locations: {
    center: [37.974, -1.135],
    zoom: 12,
    // OPCIONAL (100% gratis): Si creáis un mapa en mymaps.google.com con todos vuestros
    // pines a la vez (finca, bus y hoteles), pegad aquí la URL de inserción (/maps/d/embed?mid=...)
    // y al pulsar "Todos los puntos" se verán todos juntos dentro de Google Maps.
    googleMyMapsEmbedUrl: '',
    venues: [
      {
        id: 'finca-olivar',
        type: 'venue',
        name: 'Finca El Olivar (Ubicación de ejemplo)',
        role: 'Ceremonia, Cóctel y Banquete',
        address: 'Camino de los Olivos s/n, El Palmar, 30120 Murcia',
        time: '17:30 h – 03:30 h',
        lat: 37.9435,
        lng: -1.1618,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=37.9435,-1.1618',
        notes: 'Edita estas coordenadas en js/config.js con la ubicación definitiva de vuestra finca. Parking gratuito disponible.'
      },
      {
        id: 'parada-bus',
        type: 'bus',
        name: 'Parada Oficial de Autobuses',
        role: 'Salida lanzadera invitados · 17:00 h',
        address: 'Plaza Circular, 30008 Murcia',
        time: 'Ida 17:00 h · Vuelta 01:30 h y 03:00 h',
        lat: 37.9924,
        lng: -1.1306,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=37.9924,-1.1306',
        notes: 'El autobús saldrá puntual hacia la finca con paradas de regreso en el centro y hoteles.'
      }
    ],
    hotels: [
      {
        id: 'hotel-nelva',
        type: 'hotel',
        name: 'Hotel Nelva',
        stars: '★★★★',
        distance: 'A 12 min de la finca · Centro',
        priceRange: 'Desde 115 €/noche',
        promoCode: 'MALENAYFER',
        promoNote: 'Tarifa especial invitados reservando antes del 15/07/2027',
        address: 'Av. Primero de Mayo, 5, 30006 Murcia',
        phone: '+34 968 06 02 00',
        website: 'https://www.google.com/maps/search/?api=1&query=37.9906,-1.1194',
        lat: 37.9906,
        lng: -1.1194,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=37.9906,-1.1194',
        highlight: 'Amplios jardines, piscina y fácil acceso desde la autovía'
      },
      {
        id: 'hotel-siete-coronas',
        type: 'hotel',
        name: 'Barceló Murcia Siete Coronas',
        stars: '★★★★',
        distance: 'A 10 min de la finca · Junto al Segura',
        priceRange: 'Desde 120 €/noche',
        promoCode: 'BODAMF27',
        promoNote: '15% dto. para invitados de Malena & Fer (cupo limitado)',
        address: 'Paseo de Garay, 5, 30003 Murcia',
        phone: '+34 968 21 77 74',
        website: 'https://www.google.com/maps/search/?api=1&query=37.9841,-1.1235',
        lat: 37.9841,
        lng: -1.1235,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=37.9841,-1.1235',
        highlight: 'A un paseo de la Catedral y zona de tapeo'
      },
      {
        id: 'hotel-floridablanca',
        type: 'hotel',
        name: 'Catalonia Conde de Floridablanca',
        stars: '★★★★',
        distance: 'A 9 min de la finca · Barrio del Carmen',
        priceRange: 'Desde 105 €/noche',
        promoCode: 'MF2027',
        promoNote: 'Incluye late check-out el domingo hasta las 13:00 h',
        address: 'Princesa, 18, 30002 Murcia',
        phone: '+34 968 21 46 26',
        website: 'https://www.google.com/maps/search/?api=1&query=37.9794,-1.1319',
        lat: 37.9794,
        lng: -1.1319,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=37.9794,-1.1319',
        highlight: 'Muy práctico para salir directo hacia la finca o el bus'
      }
    ]
  },

  infoUtil: {
    dressCode: {
      title: 'Etiqueta & Dress Code',
      subtitle: 'Formal Campestre · Elegante y cómodo',
      description:
        'La ceremonia y el cóctel serán sobre césped y jardín: recomendamos tacón ancho, cuñas o alpargatas de repuesto para la fiesta. Por la noche refresca ligeramente, así que un chal o chaqueta será buen aliado.',
      avoidNote: 'Reservamos el blanco y el marfil en exclusiva para la novia.',
      swatches: [
        { name: 'Verde Oliva', hex: '#4A5A42' },
        { name: 'Champagne', hex: '#C5A059' },
        { name: 'Terracota Suave', hex: '#B97A5E' },
        { name: 'Azul Medianoche', hex: '#28364A' },
        { name: 'Blanco (Solo Novia)', hex: '#FFFFFF', isWhiteTrap: true }
      ],
      whiteAlertTitle: 'Alerta de Protocolo Nupcial',
      whiteAlertMessage:
        '¡Alto ahí, valiente! El blanco nuclear, marfil y crema luminoso están reservados en exclusiva para la novia. Si apareces de blanco en la finca, el equipo de seguridad te entregará automáticamente una bandeja de canapés para servir en el cóctel.',
      whiteAlertConfirm: 'Prometo elegir otro color'
    },
    transport: {
      title: 'Autobuses & Parking',
      subtitle: 'Para que solo te preocupes de brindar',
      busSchedule: [
        '17:00 h · Salida desde Plaza Circular (Murcia)',
        '17:15 h · Parada rápida en Paseo de Garay',
        '01:30 h · Primer regreso a hoteles y centro',
        '03:00 h · Último autobús tras la recena'
      ],
      parkingNote: 'Si vienes en tu propio coche, la finca cuenta con parking amplio gratuito y vigilado toda la noche.'
    },
    gift: {
      title: 'Vuestra Presencia & Luna de Miel',
      subtitle: 'Nuestro mejor regalo es celebrar juntos',
      description:
        'Teneros ese día con nosotros es lo que más ilusión nos hace. Si además queréis ayudarnos con nuestra luna de miel, os dejamos nuestro número de cuenta.',
      ibanDisplay: 'ES21 0049 1500 05 1234567890',
      ibanCopy: 'ES2100491500051234567890',
      copiedMessage: 'IBAN copiado. Gracias de corazón por acompañarnos en nuestra luna de miel.'
    }
  },

  rsvp: {
    // Modos de envío:
    //   'demo'         -> Funciona al instante en local/preview guardando en el navegador (ideal para probar)
    //   'google-forms' -> Envía en segundo plano a tu Google Form (requiere actionUrl y entry.XXXXXX)
    //   'apps-script'  -> Envía a tu Google Sheet vía Google Apps Script (confirmación real + emails automáticos)
    backendMode: 'demo',

    deadlineText: 'Por favor, confirma tu asistencia antes del 15 de julio de 2027',
    maxNoDodges: 5,

    // Nuestros dos perros estilo Pixar moviéndose por la web y hablando en bocadillos
    dogs: {
      sprites: {
        husky: {
          welcome: 'assets/images/dogs/husky-welcome.png',
          food: 'assets/images/dogs/husky-food.png',
          party: 'assets/images/dogs/husky-party.png',
          celebrate: 'assets/images/dogs/husky-celebrate.png',
          sad: 'assets/images/dogs/husky-sad.png'
        },
        terrier: {
          welcome: 'assets/images/dogs/terrier-welcome.png',
          food: 'assets/images/dogs/terrier-food.png',
          party: 'assets/images/dogs/terrier-party.png',
          celebrate: 'assets/images/dogs/terrier-celebrate.png',
          sad: 'assets/images/dogs/terrier-sad.png'
        },
        carryDuo: 'assets/images/dogs/dog-duo-carry.png'
      },

      // Etiquetas del botón "No" sin cuenta atrás de intentos (sorpresa para el invitado)
      noButtonLabels: [
        'No podré asistir',
        '¿En serio? 🤔',
        'Ni lo sueñes...',
        'No seas así...',
        'Última oportunidad...',
        'Vale, no puedo ir 😢'
      ],

      // Cada perro dice su propio comentario ingenioso para camelarse al invitado cuando intenta pulsar "No"
      noDodgeBanter: [
        {
          husky: '¡Y justo al lado del cortador de jamón y de la barra libre!',
          terrier: 'Prometemos sentarte lejos de la novia: seguro antimanchas incluido (promoción no aplicable a los padres de los novios).'
        },
        {
          husky: 'Piénsalo: barra libre ilimitada, croquetas caseras y cero fotos comprometedoras.',
          terrier: 'Bueno... cero fotos hasta las 02:00 h. Luego ya no prometemos nada.'
        },
        {
          husky: 'Si no vienes, el domingo te toca tragarte 400 fotos por WhatsApp con envidia.',
          terrier: 'Y lo peor: sin poder opinar de quién dio la nota en la barra libre.'
        },
        {
          husky: 'Última oferta: te libramos del «¿y tú pa’ cuándo?» y eliges temazo al DJ.',
          terrier: '¡Además Malena y Fer ya cuentan contigo para cerrar la pista!'
        },
        {
          husky: 'Vale, nos rendimos... eres más duro que el pan de ayer. Ya puedes pulsarlo.',
          terrier: 'Eso sí: debes una cena a Malena y Fer (y soborno de jamón a nosotros).'
        }
      ],

      stepBanter: {
        1: {
          husky: '¡Hola! Somos los organizadores peludos de Malena y Fer.',
          terrier: 'Dinos tu nombre para apuntarte en nuestra lista VIP.'
        },
        2: {
          husky: '¿Vienes solo o traes pareja de baile?',
          terrier: '¡Cuantos más seamos, más caricias nos llevamos!'
        },
        3: {
          husky: '¿Viene algún peque en vuestro equipo?',
          terrier: '¡Tenemos menús infantiles, tronas y mucho jardín para jugar!'
        },
        4: {
          husky: '¡Hora de comer! Elige tu plato favorito.',
          terrier: 'Prometo no mirar tu plato con ojitos... mucho.'
        },
        5: {
          husky: '¿Alguna alergia o intolerancia que debamos cuidar?',
          terrier: '¡En cocina lo apuntan todo al milímetro!'
        },
        6: {
          husky: '¿Subes al autobús para olvidarte del coche?',
          terrier: '¡Yo me pido ventanilla en el viaje de vuelta!'
        },
        7: {
          husky: 'Mueve el deslizador de la Barra Libre sin miedo.',
          terrier: '¡Queremos ver quién aguanta hasta los churros!'
        },
        8: {
          husky: '¿Qué temazo te levanta de la silla al instante?',
          terrier: '¡Se lo llevo en la boca al DJ ahora mismo!'
        },
        9: {
          husky: 'Último paso: déjales un mensaje a Malena y Fer.',
          terrier: '¡En cuanto pulses confirmar sacamos tu Pase VIP!'
        }
      },

      partyBanter: {
        1: {
          husky: '¿Solo un café y a casa? ¡Eso no te lo crees ni tú!',
          terrier: 'Apuesto a que a la 01:00 h sigues en la pista.'
        },
        2: {
          husky: 'Brindis elegante y alguna balada romántica.',
          terrier: '¡Muy fino todo, pero luego nos soltamos!'
        },
        3: {
          husky: '¡Zapatos fuera a medianoche!',
          terrier: '¡Ese es el espíritu oficial de la boda!'
        },
        4: {
          husky: '¡Modo festival activado! Ya suena la conga.',
          terrier: '¡Pide canciones sin piedad, yo te cubro!'
        },
        5: {
          husky: '¡De los nuestros! Cerramos la finca con los novios.',
          terrier: '¡Churros, chocolate y a recoger manteles juntos!'
        }
      },

      courierMessages: [
        '¡Atrapada! Se la llevamos corriendo en la boca a Malena y Fer...',
        'Guardando tu respuesta a buen recaudo entre ladridos de alegría...',
        '¡Anotando al equipo completo de peques y tronas!',
        '¡Directa en la boca hacia la mesa del chef de la finca!',
        '¡Oído cocina! Corriendo a avisar al catering...',
        '¡A toda pastilla a reservar plaza en el autobús!',
        '¡Auuu! Corriendo a la cabina del DJ con tu nivel de fiesta...',
        '¡Última carrera! Llevamos tu temazo directo al tocadiscos...'
      ],

      petHuskyBanter: [
        {
          husky: '¡Auuu! Qué gusto esas caricias detrás de las orejas.',
          terrier: '¡Oye! ¿Y para mí qué? ¡Yo también tengo pajarita!'
        },
        {
          husky: '¡Oficialmente eres mi humano favorito de la boda!',
          terrier: '¡Yo salto más alto si me acaricias a mí también!'
        }
      ],

      petTerrierBanter: [
        {
          husky: '¡Eh, no me dejes fuera! Yo también soy muy bueno.',
          terrier: '¡Guau, guau! ¡Dame más mimos y te guardo doble canapé!'
        },
        {
          husky: '¿Veis como yo también me porto genial?',
          terrier: '¡Jaja, gracias! Con estas caricias ya estoy listo para bailar.'
        }
      ]
    },

    // Opción A: Google Forms oculto (rellena con los IDs de tu formulario; ver README.md)
    googleForms: {
      actionUrl: '', // Ej: 'https://docs.google.com/forms/d/e/TU_FORM_ID/formResponse'
      entries: {
        name: 'entry.1000001',
        email: 'entry.1000002',
        attendance: 'entry.1000003',
        hasPlusOne: 'entry.1000004',
        plusOneName: 'entry.1000005',
        childrenCount: 'entry.1000014',
        childrenDetails: 'entry.1000015',
        menu: 'entry.1000006',
        plusOneMenu: 'entry.1000007',
        allergies: 'entry.1000008',
        bus: 'entry.1000009',
        partyLevel: 'entry.1000010',
        song: 'entry.1000011',
        message: 'entry.1000012',
        noAttempts: 'entry.1000013'
      }
    },

    // Opción B: Google Apps Script Web App (ver scripts/google-apps-script.gs y README.md)
    appsScript: {
      webAppUrl: '' // Ej: 'https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec'
    },

    menuOptions: [
      {
        id: 'carne',
        label: 'Solomillo a la brasa',
        detail: 'Con milojas de patata trufada y reducción de vino de la tierra'
      },
      {
        id: 'pescado',
        label: 'Lubina salvaje al horno',
        detail: 'Con crema suave de hinojo, espárragos trigueros y aceite de oliva'
      },
      {
        id: 'vegano',
        label: 'Menú Botánico (Vegano)',
        detail: 'Canelón asado de setas silvestres, piñones tostados y crema de almendra'
      },
      {
        id: 'infantil',
        label: 'Menú Peque-VIP',
        detail: 'Pasta fresca o escalope casero con patatas y helado artesanal'
      }
    ],

    allergyPresets: [
      'Sin gluten',
      'Sin lactosa',
      'Alergia a frutos secos',
      'Sin marisco',
      'Ninguna (me como hasta las servilletas)'
    ],

    partyLevels: [
      {
        level: 1,
        emoji: '☕',
        title: 'Modo Discreto',
        description: '«Me tomo el café y me retiro pronto» (todos sabemos que es mentira).'
      },
      {
        level: 2,
        emoji: '🥂',
        title: 'Brindis Elegante',
        description: 'Dos copas de champán, charla agradable y un par de lentas.'
      },
      {
        level: 3,
        emoji: '🕺',
        title: 'Rey / Reina de la Pista',
        description: 'Zapatos fuera a las 00:00 h y coreografía asegurada.'
      },
      {
        level: 4,
        emoji: '🔥',
        title: 'Modo Festival',
        description: 'Pido canciones al DJ cada veinte minutos y lidero el trenecito.'
      },
      {
        level: 5,
        emoji: '🌅',
        title: 'Cierro el Garito con los Novios',
        description: 'Me quedo hasta los churros de la recena y ayudo a recoger los manteles.'
      }
    ],

    songEasterEggs: [
      {
        keywords: ['paquito', 'chocolatero'],
        reaction: '🎺 ¡Alarma de conga! Confirmamos pasillo obligatorio en mitad del jardín.'
      },
      {
        keywords: ['despacito'],
        reaction: '🕺 Clásico inmortal. Prometemos ponerla cuando ya nadie lleve corbata.'
      },
      {
        keywords: ['gran noche', 'raphael'],
        reaction: '🎤 ¡Qué pasará, qué misterio habrá! Himno oficial de las 02:00 h desbloqueado.'
      },
      {
        keywords: ['macarena'],
        reaction: '💃 Nivel de coordinación grupal: máximo. La pista ya está calentando.'
      },
      {
        keywords: ['queen', 'bohemian', 'dont stop', "don't stop"],
        reaction: '🎸 ¡Puro espectáculo! El DJ acaba de subirla al puesto #1 de la lista.'
      },
      {
        keywords: ['abba', 'dancing queen', 'gimme'],
        reaction: '🪩 Bola de discoteca activada. Esta pista va a arder con estilo.'
      },
      {
        keywords: ['chayanne', 'torero', 'salome'],
        reaction: '🔥 Si suena Chayanne, oficialmente nos casamos todos otra vez.'
      },
      {
        keywords: ['rosalia', 'rosalía', 'bad bunny', 'quevedo', 'karol'],
        reaction: '🔊 ¡Perreo elegante en el invernadero! Guardamos tus zapatillas en la entrada.'
      }
    ]
  }
};
