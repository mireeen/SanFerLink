import { ref, set, remove, get } from "firebase/database";
import { rtdb } from "./firebase.js";

/* =========================
   EVENTS
========================= */

const eventos = {
  txupinazo: {
    name: "Txupinazo",
    category: "Tradición",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza Consistorial",
    date: "2025-07-06T12:00:00",
    status: "active",
    description: "Retransmitido por pantallas gigantes en la Plaza del Castillo, Paseo de Sarasate,  Parque de Antoniutti y Plaza de los Fueros."
  },

  musica_Calle: {
    name: "Música en las Calles",
    category: "Música",
    lat: 42.8184,
    lng: -1.644,
    location: "Antoniutti, Plaza Consistorial y Paseo de Sarasate",
    date: "2025-07-06T12:00:00",
    status: "active",
    description: "Txarangas Galtzagorri, Ziripot y Banda Popular Maestro Bravo. Salidas desde Antoniutti, Plaza Consistorial, y Paseo de Sarasate."
  },

  danzas: {
    name: "Festival Folclórico",
    category: "Tradición",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza de los Fueros",
    date: "2025-07-06T13:00:00",
    status: "active",
    description: "Grupos de danzas: Amaiur, Ardantzeta, Basakaitz, DanTXaldi, Duguna, Eluntze, Harizti, Iruña Taldea, Larratz, Mikelats, Muthiko Alaiak, Oberena, Ortzadar, Txori Zuri."
  },

  gigantes_cabezudos2: {
    name: "Gigantes y Cabezudos",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Estación de Autobuses",
    date: "2025-07-06T17:00:00",
    status: "active",
    description: "Salida de la comparsa desde la Estación de Autobuses."
  },

  juegos_infantiles: {
    name: "Birjolastu JuegoRejuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Taconera",
    date: "2025-07-06T18:00:00",
    status: "active",
    description: "Espacio de juego infantil. Hasta las 21:00 h."
  },

  juegos_infantiles2: {
    name: "¡Menudas Fiestas!",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza de la Libertad",
    date: "2025-07-06T18:00:00",
    status: "active",
    description: "Actividades infantiles. Hasta las 21:00 h."
  },

  jotas: {
    name: "Ronda de Jotas",
    category: "Tradición",
    lat: 42.8184,
    lng: -1.644,
    location: "Avenida Roncesvalles",
    date: "2025-07-06T18:00:00",
    status: "active",
    description: "Monumento al Encierro. Escuela de jotas Manuel Turrillas."
  },

  rejones: {
    name: "Corrida de Rejones",
    category: "Tradición",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza de Toros",
    date: "2025-07-06T18:30:00",
    status: "active",
    description: "",
  },

  concierto_compañia2: {
    name: "Odd Signals",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-06T19:00:00",
    status: "active"
  },

  titereak: {
    name: "Títeres",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza de la Libertad",
    date: "2025-07-06T20:00:00",
    status: "active",
    description: "Ipuin Magikoak. Bihar Taldea (euskera).",
  },

  concierto_cruz: {
    name: "Verbena",
    category: "Concierto",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza de la Cruz",
    date: "2025-07-06T20:00:00",
    status: "active",
    description: "Orquesta Meteoro 2.0. Hasta las 22:00.",
  },

  musica_calle2: {
    name: "Muévete, ven y baila",
    category: "Música",
    lat: 42.8184,
    lng: -1.644,
    location: "Avenida Roncesvalles",
    date: "2025-07-06T20:30:00",
    status: "active",
    description: "En el Monumento al Encierro",
  },

  concierto_compañia3: {
    name: "CC:DISCO!",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-06T20:30:00",
    status: "active"
  },

  concierto_compañia4: {
    name: "Celia Carrera",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-06T22:30:00",
    status: "active"
  },

  concierto_compañia5: {
    name: "Puttaneska",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-07T20:00:00",
    status: "active"
  },

  concierto_compañia6: {
    name: "Frente Cumbiero",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-07T23:30:00",
    status: "active"
  },

  concierto_compañia7: {
    name: "Burutik",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-08T20:00:00",
    status: "active"
  },

  concierto_compañia8: {
    name: "Tarta Relena",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-08T23:30:00",
    status: "active"
  },

  concierto_compañia9: {
    name: "La Mala Pékora",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-09T20:00:00",
    status: "active"
  },

  concierto_compañia10: {
    name: "The Zawose Queens",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-09T23:30:00",
    status: "active"
  },

  concierto_compañia11: {
    name: "Puntu Takoma",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-10T20:00:00",
    status: "active"
  },

  concierto_compañia12: {
    name: "Bibi Tanga & The Selenites",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-10T23:30:00",
    status: "active"
  },

  concierto_compañia13: {
    name: "Travéstika",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-11T12:30:00",
    status: "active"
  },

  concierto_compañia14: {
    name: "Euskoprincess",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-11T20:00:00",
    status: "active"
  },

  concierto_compañia15: {
    name: "Scientist feat Shanique Marie (Equiknoxx)",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-11T23:30:00",
    status: "active"
  },

  concierto_compañia16: {
    name: "Yaya Massemba",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-12T12:30:00",
    status: "active"
  },

  concierto_compañia17: {
    name: "Kumbia vs Salsa",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-12T20:00:00",
    status: "active"
  },

  concierto_compañia18: {
    name: "Instituto Mexicano del Sonido",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-12T23:30:00",
    status: "active"
  },

  concierto_compañia19: {
    name: "Sedientos de Cumbia",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-13T20:00:00",
    status: "active"
  },

  concierto_compañia20: {
    name: "Izo Fitzroy",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2026-07-13T23:30:00",
    status: "active"
  },

  bailables: {
    name: "Bailables",
    category: "Tradición",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza del Castillo",
    date: "2026-07-06T21:00:00",
    status: "active",
    description: "Gaita y txistu.",
  },

  torico: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-06T21:45:00",
    status: "active",
    description: "",
  },

  torico2: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-07T21:45:00",
    status: "active",
    description: "",
  },

  torico3: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-08T21:45:00",
    status: "active",
    description: "",
  },

  torico4: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-09T21:45:00",
    status: "active",
    description: "",
  },

  torico5: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-10T21:45:00",
    status: "active",
    description: "",
  },

  torico6: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-11T21:45:00",
    status: "active",
    description: "",
  },

  torico7: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-12T21:45:00",
    status: "active",
    description: "",
  },

  torico8: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-13T21:45:00",
    status: "active",
    description: "",
  },

  torico9: {
    name: "Toro de fuego",
    category: "Infantil",
    lat: 42.8184,
    lng: -1.644,
    location: "Cuesta de Santo Domingo, Plaza Consistorial, calle Nueva",
    date: "2026-07-14T21:45:00",
    status: "active",
    description: "",
  },

  rejones: {
    name: "Corrida de Rejones",
    category: "Tradición",
    lat: 42.8184,
    lng: -1.644,
    location: "Plaza de Toros",
    date: "2025-07-06T18:30:00",
    status: "active",
    description: "",
  },

  encierro1: {
    name: "Primer Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-07T08:00:00",
    status: "active",
  },

  encierro2: {
    name: "Segundo Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-08T08:00:00",
    status: "active"
  },
  encierro3: {
    name: "Tercer Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-09T08:00:00",
    status: "active",
  },
  encierro4: {
    name: "Cuarto Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-10T08:00:00",
    status: "active",
  },
  encierro5: {
    name: "Quinto Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-11T08:00:00",
    status: "active",
  },
  encierro6: {
    name: "Sexto Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-12T08:00:00",
    status: "active",
  },
  encierro7: {
    name: "Séptimo Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-13T08:00:00",
    status: "active",
  },
  encierro8: {
    name: "Octavo Encierro",
    category: "Encierro",
    lat: 42.8187,
    lng: -1.6452,
    location: "Santo Domingo",
    date: "2025-07-14T08:00:00",
    status: "active",
  },

  procesion: {
    name: "Procesión San Fermín",
    category: "Tradición",
    lat: 42.8191,
    lng: -1.6433,
    location: "Catedral",
    date: "2026-07-07T10:00:00",
    status: "active"
  },

  concierto_castillo: {
    name: "Concierto Plaza del Castillo",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza del Castillo",
    date: "2025-07-09T22:00:00",
    status: "active"
  },

  concierto_compañia: {
    name: "Concierto Plaza del Castillo",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2025-07-09T22:00:00",
    status: "active"
  },

  fuegos: {
    name: "Fuegos Artificiales",
    category: "Fuegos",
    lat: 42.8189,
    lng: -1.6514,
    location: "Ciudadela",
    date: "2025-07-06T23:00:00",
    status: "active"
  },

  pobre_de_mi: {
    name: "Pobre de Mí",
    category: "Tradición",
    lat: 42.8184,
    lng: -1.644,
    location: "Ayuntamiento",
    date: "2025-07-14T00:00:00",
    status: "active"
  },
  dianas1: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-07T06:45:00",
    status: "active"
  },
  dianas2: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-08T06:45:00",
    status: "active"
  },
  dianas3: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-09T06:45:00",
    status: "active"
  },
  dianas4: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-10T06:45:00",
    status: "active"
  },
  dianas5: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-11T06:45:00",
    status: "active"
  },
  dianas6: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-12T06:45:00",
    status: "active"
  },
  dianas7: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-13T06:45:00",
    status: "active"
  },
  dianas8: {
    name: "Dianas",
    category: "Tradición",
    lat: 42.8182,
    lng: -1.6443,
    location: "Casco Viejo",
    date: "2026-07-14T06:45:00",
    status: "active"
  },

  gigantes_cabezudos: {
    name: "Gigantes y Cabezudos",
    category: "Infantil",
    lat: 42.8177,
    lng: -1.6431,
    location: "Plaza del Castillo",
    date: "2025-07-08T09:30:00",
    status: "active"
  },

  comparsa_txaranga: {
    name: "Txaranga Popular",
    category: "Música",
    lat: 42.8183,
    lng: -1.6446,
    location: "Mercaderes",
    date: "2025-07-08T13:00:00",
    status: "active"
  },

  concierto_fueros: {
    name: "Concierto Plaza de los Fueros",
    category: "Concierto",
    lat: 42.8147,
    lng: -1.6417,
    location: "Plaza de los Fueros",
    date: "2025-07-10T21:30:00",
    status: "active"
  },

  deporte_rural: {
    name: "Deporte Rural Vasco",
    category: "Cultura",
    lat: 42.8152,
    lng: -1.6409,
    location: "Plaza de los Fueros",
    date: "2025-07-09T12:00:00",
    status: "active"
  },

  teatro_callejero: {
    name: "Teatro Callejero",
    category: "Cultura",
    lat: 42.8170,
    lng: -1.6438,
    location: "Casco Antiguo",
    date: "2025-07-10T18:30:00",
    status: "active"
  },

  infantil_taconera: {
    name: "Actividades Infantiles Taconera",
    category: "Infantil",
    lat: 42.8197,
    lng: -1.6510,
    location: "Parque Taconera",
    date: "2025-07-11T11:00:00",
    status: "active"
  },

  kalejira_popular: {
    name: "Kalejira Popular",
    category: "Tradición",
    lat: 42.8175,
    lng: -1.6432,
    location: "Casco Viejo",
    date: "2025-07-12T17:00:00",
    status: "active"
  },

  feria_gastronomica: {
    name: "Feria Gastronómica",
    category: "Gastronomía",
    lat: 42.8169,
    lng: -1.6428,
    location: "Plaza del Castillo",
    date: "2025-07-11T13:00:00",
    status: "active"
  },

  espectaculo_fuegos_extra: {
    name: "Espectáculo de Fuegos Especial",
    category: "Fuegos",
    lat: 42.8189,
    lng: -1.6514,
    location: "Ciudadela",
    date: "2025-07-13T23:30:00",
    status: "active"
  },
  amaia_plaza_castillo: {
    name: "Amaia (Directo)",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza del Castillo",
    date: "2025-07-09T22:30:00",
    status: "active"
  },

  la_la_love_you_castillo: {
    name: "La La Love You",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza del Castillo",
    date: "2025-07-10T22:30:00",
    status: "active"
  },

  estopa_plaza_castillo: {
    name: "Estopa (Gira Festiva)",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza del Castillo",
    date: "2025-07-11T23:00:00",
    status: "active"
  },

  dj_karlillos: {
    name: "DJ Karlillos & Friends",
    category: "Fiesta",
    lat: 42.8179,
    lng: -1.6439,
    location: "Plaza del Castillo",
    date: "2025-07-12T00:30:00",
    status: "active"
  },

  mikel_izal_noche: {
    name: "IZAL (Concierto Nocturno)",
    category: "Concierto",
    lat: 42.8160,
    lng: -1.6412,
    location: "Plaza Libertad",
    date: "2025-07-08T22:00:00",
    status: "active"
  },

  sorotan_bele_antoniutti: {
    name: "Sorotan Bele (Euskal Folk)",
    category: "Concierto",
    lat: 42.8215,
    lng: -1.6490,
    location: "Parque Antoniutti",
    date: "2025-07-12T21:30:00",
    status: "active"
  },

  concierto_compañia3: {
    name: "Concierto Plaza del Castillo",
    category: "Concierto",
    lat: 42.8168,
    lng: -1.6435,
    location: "Plaza Compañía",
    date: "2025-07-09T22:00:00",
    status: "active"
  },

  mariachi_noche_mexicana: {
    name: "Mariachi Vargas Show",
    category: "Cultura",
    lat: 42.8172,
    lng: -1.6435,
    location: "Casco Antiguo",
    date: "2025-07-10T20:30:00",
    status: "active"
  },

  la_fuga_pelota: {
    name: "La Fuga (Rock Vasco)",
    category: "Concierto",
    lat: 42.8147,
    lng: -1.6417,
    location: "Plaza de los Fueros",
    date: "2025-07-11T22:30:00",
    status: "active"
  },

  charanga_kai: {
    name: "Charanga KAI Kalejira",
    category: "Música",
    lat: 42.8183,
    lng: -1.6444,
    location: "Centro",
    date: "2025-07-12T12:00:00",
    status: "active"
  },

  orquesta_noche_taconera: {
    name: "Orquesta Eclipse",
    category: "Fiesta",
    lat: 42.8197,
    lng: -1.6510,
    location: "Taconera",
    date: "2025-07-13T23:30:00",
    status: "active"
  }

};

/* =========================
   BATHROOMS
========================= */

const baños = {
  ayuntamiento: {
    name: "Ayuntamiento",
    lat: 42.8184,
    lng: -1.644
  },

  plaza_castillo: {
    name: "Plaza del Castillo",
    lat: 42.8168,
    lng: -1.6435
  },

  fueros: {
    name: "Plaza de los Fueros",
    lat: 42.8147,
    lng: -1.6417
  },

  ciudadela: {
    name: "Ciudadela",
    lat: 42.8189,
    lng: -1.6514
  },

  taconera: {
    name: "Taconera",
    lat: 42.8197,
    lng: -1.651
  }
};

const getCurrentTimestamp = () => new Date().toISOString();

const alertas = {
  user_test_1: {
    tipo: "Calle colapsada",
    descripcion: "Estafeta recién colapsada durante el encierro. Muchísima densidad de gente.",
    latitud: 42.8180,
    longitud: -1.6433,
    timestamp: getCurrentTimestamp(),
    userId: "user_test_1"
  },

  user_test_2: {
    tipo: "Calle colapsada",
    descripcion: "Mercaderes con flujo lento de personas, pero transitable.",
    latitud: 42.8183,
    longitud: -1.6444,
    timestamp: getCurrentTimestamp(),
    userId: "user_test_2"
  },

  user_test_3: {
    tipo: "Calle colapsada",
    descripcion: "Santo Domingo con acumulación antigua, la situación parece mejorar.",
    latitud: 42.8189,
    longitud: -1.6456,
    timestamp: getCurrentTimestamp(),
    userId: "user_test_3"
  },

  user_test_4: {
    tipo: "Calle colapsada",
    descripcion: "Jarauta completamente llena en zona de bares.",
    latitud: 42.8195,
    longitud: -1.6462,
    timestamp: getCurrentTimestamp(),
    userId: "user_test_4"
  },

  user_test_5: {
    tipo: "Calle colapsada",
    descripcion: "Zona de Taconera con bastante afluencia, pero en movimiento.",
    latitud: 42.8197,
    longitud: -1.6510,
    timestamp: getCurrentTimestamp(),
    userId: "user_test_5"
  },

  user_test_6: {
    tipo: "Calle colapsada",
    descripcion: "Plaza del Castillo con afluencia anterior ya reduciéndose.",
    latitud: 42.8168,
    longitud: -1.6435,
    timestamp: getCurrentTimestamp(),
    userId: "user_test_6"
  },

  OuNIE3Jpf1avqi6lOf: {
    tipo: "Calle colapsada",
    descripcion: "gidks",
    latitud: 42.7993819,
    longitud: -1.6355467,
    timestamp: getCurrentTimestamp(),
    userId: "1nssvfu9W8SOsTU5R7FYNKKPsfJ3"
  }
};

async function seed() {
  try {
    console.log("📦 Subiendo eventos...");
    await set(ref(rtdb, "eventos"), eventos);

    //console.log("🚽 Subiendo baños...");
    //await set(ref(rtdb, "baños"), baños);

    console.log("🚨 Subiendo alertas...");
    const alertasRef = ref(rtdb, "alertas");

    // Primero intenta leer si existe
    const snapshot = await get(alertasRef);
    console.log("¿Existe alertas?", snapshot.exists());

    // Luego sube los datos (si no existe, Firebase lo crea)
    await set(alertasRef, alertas);
    console.log("✅ Alertas subidas correctamente");

    console.log("✅ Seed completado correctamente");
  } catch (err) {
    console.error("❌ Error en seed:", err);
    console.error("Código de error:", err.code);
    console.error("Mensaje:", err.message);
  }
}

seed();