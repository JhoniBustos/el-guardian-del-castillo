﻿// =====================================================
//  LÓGICA DEL JUEGO  (usa las funciones de cerebro.js)
// =====================================================

const MAX_TURNOS = 10;
const META = 100;

let confianza = 30;
let turnos = MAX_TURNOS;
let terminado = false;
const historial = [];   // últimos mensajes, para que la IA recuerde la charla

const chat = document.getElementById("chat");
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const dragon = document.getElementById("dragon");
const barra = document.getElementById("confianza");
const estado = document.getElementById("estado");
const marcadorTurnos = document.getElementById("turnos");

function agregarMensaje(texto, clase) {
  const div = document.createElement("div");
  div.className = "msg " + clase;
  div.textContent = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Actualiza barra, color y cara del dragón.
function actualizarPantalla() {
  confianza = Math.max(0, Math.min(META, confianza));
  barra.style.width = confianza + "%";
  barra.style.background = confianza < 25 ? "#ff3b3b" : confianza < 60 ? "#ffb400" : "#3bd16f";
  estado.textContent = `Confianza: ${confianza} / ${META}`;
  marcadorTurnos.textContent = `Turnos restantes: ${turnos}`;

  dragon.className = "dragon";
  if (confianza >= 60) { dragon.textContent = "🐲"; dragon.classList.add("feliz"); }
  else if (confianza < 25) { dragon.textContent = "🔥"; dragon.classList.add("enojado"); }
  else { dragon.textContent = "🐉"; }
}

function terminar(gano) {
  terminado = true;
  entrada.disabled = true;
  formulario.querySelector("button").disabled = true;
  if (gano) {
    agregarMensaje("🗝️ El dragón te entrega la llave. ¡GANASTE!", "dragon-msg");
  } else {
    agregarMensaje("💀 El dragón perdió la paciencia. GAME OVER.", "dragon-msg");
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (terminado) return;

  const texto = entrada.value.trim();
  if (!texto) return;
  entrada.value = "";
  agregarMensaje(texto, "jugador");

  // 1) Bloqueamos el formulario mientras la IA "piensa"
  entrada.disabled = true;
  formulario.querySelector("button").disabled = true;

  // 2) La IA analiza el mensaje. Si falla, usamos el diccionario (plan B)
  const ia = await consultarDragonIA(texto, historial);
  const intencion = detectarIntencion(texto);
  let sentimiento, cambio, respuesta;

  if (ia && ia.sentimiento !== null) {
    sentimiento = ia.sentimiento;            // de -10 a 10
    cambio = sentimiento * 2.5;
    respuesta = ia.respuesta;
  } else if (ia) {                           // la IA habló, pero sin puntaje
    sentimiento = analizarSentimiento(texto);
    cambio = sentimiento * 6;
    respuesta = ia.respuesta;
  } else {
    sentimiento = analizarSentimiento(texto);
    cambio = sentimiento * 6;
  }

  // 3) El sentimiento cambia la confianza (máximo +/-25 por mensaje)
  confianza += Math.round(Math.max(-25, Math.min(25, cambio)));
  turnos--;

  // 4) El dragón responde (IA, o diccionario según su humor)
  if (!ia) {
    const humor = sentimiento >= 0 && confianza >= 25 ? "bien" : "mal";
    respuesta = RESPUESTAS[intencion][humor];
  }
  agregarMensaje(respuesta, "dragon-msg");
  historial.push({ rol: "jugador", texto }, { rol: "dragon", texto: respuesta });

  actualizarPantalla();

  // 5) ¿Se acabó el juego?
  if (confianza >= META) terminar(true);
  else if (confianza <= 0 || turnos === 0) terminar(false);
  else {
    entrada.disabled = false;
    formulario.querySelector("button").disabled = false;
    entrada.focus();
  }
});
actualizarPantalla();
agregarMensaje("Un enorme dragón bloquea la puerta. Dice: «¿Quién osa molestarme?»", "dragon-msg");