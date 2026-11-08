const LEXICO = {
  // positivas
  gracias: 2, hermoso: 3, genial: 3, poderoso: 3, amigo: 2, admiro: 3, valiente: 2,
  amable: 3, bonito: 2, excelente: 4, maravilloso: 4, inteligente: 3,

  // negativas
  feo: -3, tonto: -3, idiota: -4, odio: -4, cobarde: -3, basura: -4,
  cruel: -3, horrible: -4, malvado: -3, desagradable: -3, terrible: -4
};

function normalizar(texto) {
  return texto
    .toLowerCase()                                      // todo a minúscula
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // quita tildes
    .replace(/[^a-zñ\s]/g, " ")                         // quita signos
    .trim();
}

const NEGADORES = ["no", "nunca", "jamas", "tampoco"];

function analizarSentimiento(texto) {
  const palabras = normalizar(texto).split(/\s+/);   // separa en palabras
  let puntaje = 0;

  palabras.forEach((palabra, i) => {
    let valor = LEXICO[palabra] || 0;                // puntaje de la palabra (0 si no existe)

    // "no eres feo": la negación invierte el valor
    if (valor !== 0 && (NEGADORES.includes(palabras[i - 1]) || NEGADORES.includes(palabras[i - 2]))) {
      valor = -valor;
    }
    puntaje += valor;
  });

  if (texto.includes("!") && puntaje < 0) puntaje -= 1;   // gritar empeora el insulto
  return puntaje;
}

const INTENCIONES = [
  { nombre: "saludo",    claves: ["hola", "buenas", "saludos", "hey"] },
  { nombre: "llave",     claves: ["llave", "puerta", "abrir", "tesoro"] },
  { nombre: "nombre",    claves: ["nombre", "llamas", "quien"] },
  { nombre: "chiste",    claves: ["chiste", "gracioso", "risa", "broma"] },
  { nombre: "comida",    claves: ["comida", "hambre", "comer", "oveja"] },
  { nombre: "despedida", claves: ["adios", "chao", "bye", "hasta"] },
  { nombre: "musica", claves: ["musica", "cancion", "cantar", "melodia"] },
  { nombre: "magia", claves: ["magia", "hechizo", "magico", "encantamiento"] }
];

function detectarIntencion(texto) {
  const palabras = normalizar(texto).split(/\s+/);
  for (const intencion of INTENCIONES) {
    if (intencion.claves.some(c => palabras.includes(c))) return intencion.nombre;
  }
  return "desconocida";          // si no entendió nada
}

const RESPUESTAS = {
  saludo: {
    bien: "¡Saludos, viajero! Hacía siglos que nadie me hablaba con respeto.",
    mal: "Grrr... ¿Qué quieres, pequeño humano?"
  },
  llave: {
    bien: "¿La llave? Me caes bien... pero demuéstrame que eres de fiar.",
    mal: "¡La llave es MÍA! Vuelve cuando aprendas modales."
  },
  nombre: {
    bien: "Me llaman Ignis el Paciente. ¿Y tú?",
    mal: "Mi nombre es 'Aléjate'."
  },
  chiste: {
    bien: "¿Por qué el dragón no usa WiFi? ¡Porque quema la conexión! Ja, ja.",
    mal: "No estoy de humor para chistes. Tu cara ya es suficiente broma."
  },
  comida: {
    bien: "Mmm, oveja asada... Hace tiempo que no como bien. Qué amable eres.",
    mal: "¿Comida? Estoy pensando en comerte A TI."
  },
  despedida: {
    bien: "Vuelve pronto, viajero. Tienes buena energía.",
    mal: "¡Largo de aquí!"
  },
  desconocida: {
    bien: "No te entendí del todo, pero tu tono es agradable. Prueba otra cosa.",
    mal: "No entiendo nada de lo que dices. Y no me gusta tu tono."
  },
  musica: {
    bien: "¡Me encanta la música! Hace siglos que no escucho una buena canción.",
    mal: "¡Silencio! No estoy de humor para canciones."
  },
  magia: {
    bien: "¡La magia es fascinante! Conozco hechizos muy antiguos.",
    mal: "No me hables de magia cuando estoy de mal humor."
  }
};

async function consultarDragonIA(texto, historial) {
  try {
    const respuesta = await fetch("/api/dragon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: texto, historial }),
      signal: AbortSignal.timeout(20000)
    });
    if (!respuesta.ok) return null;
    return await respuesta.json();     // { sentimiento: -10..10, respuesta: "..." }
  } catch (error) {
    return null;
  }
}