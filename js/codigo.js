/**
 * codigo.js - Proyecto Bimestral: Sobrecarga en el Circuito (Ley de Ohm)
 * Control de la lógica del juego, temporizador, puntajes y dibujo del circuito.
 */

// ==========================================
// Variables Globales del Estado del Juego
// ==========================================
let puntos = 0;
let vidas = 3;
let tiempo = 15;
const TIEMPO_BASE = 15;
let temporizador = null;
let respuestaCorrecta = 0;
let tipoIncognita = 'R'; // Puede ser 'V', 'I', o 'R'
let racha = 0;
let rachaMaxima = 0;
let aciertos = 0;
let juegoActivo = false;
let esperandoSiguiente = false;

// Cargar récord guardado del navegador
let recordGuardado = parseInt(localStorage.getItem('record_ley_ohm') || '0', 10);

// ==========================================
// Referencias a Elementos del DOM
// ==========================================
const tiempoTexto = document.getElementById('tiempoTexto');
const puntosTexto = document.getElementById('puntosTexto');
const rachaTexto = document.getElementById('rachaTexto');
const vidasTexto = document.getElementById('vidasTexto');
const barraTiempo = document.getElementById('barraTiempo');

// Pantallas
const pantallaInicio = document.getElementById('pantallaInicio');
const pantallaJuego = document.getElementById('pantallaJuego');
const recordInicio = document.getElementById('recordInicio');

// Elementos de datos del circuito
const lblDato1 = document.getElementById('lblDato1');
const valDato1 = document.getElementById('valDato1');
const lblDato2 = document.getElementById('lblDato2');
const valDato2 = document.getElementById('valDato2');
const txtIncognita = document.getElementById('txtIncognita');
const txtFormulaGuia = document.getElementById('txtFormulaGuia');
const estadoTexto = document.getElementById('estadoTexto');

// SVG y dibujo interactivo
const svgTextoV = document.getElementById('svgTextoV');
const svgTextoI = document.getElementById('svgTextoI');
const svgTextoR = document.getElementById('svgTextoR');
const cajaVoltaje = document.getElementById('cajaVoltaje');
const cajaCorriente = document.getElementById('cajaCorriente');
const cajaResistencia = document.getElementById('cajaResistencia');
const cableCircuito = document.getElementById('cableCircuito');
const svgFocoHalo = document.getElementById('svgFocoHalo');

// Formulario y acciones
const txtRespuestaUsuario = document.getElementById('txtRespuestaUsuario');
const simboloUnidad = document.getElementById('simboloUnidad');
const btnVerificar = document.getElementById('btnVerificar');
const btnEmpezar = document.getElementById('btnEmpezar');
const btnPista = document.getElementById('btnPista');
const cajaPistaOhm = document.getElementById('cajaPistaOhm');
const cajaFeedback = document.getElementById('cajaFeedback');

// Modal Game Over
const modalGameOver = document.getElementById('modalGameOver');
const puntosFinales = document.getElementById('puntosFinales');
const txtRecordFinal = document.getElementById('txtRecordFinal');
const txtAciertosFinales = document.getElementById('txtAciertosFinales');
const btnReintentar = document.getElementById('btnReintentar');

// ==========================================
// Efectos de Sonido Básicos (Web Audio API)
// ==========================================
let audioCtx = null;

function reproducirBeep(frecuencia, tipo, duracion) {
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = tipo || 'sine';
        osc.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duracion);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duracion);
    } catch (e) {
        // En caso de que el navegador bloquee el audio, no interrumpe el juego
    }
}

function sonidoAcierto() {
    reproducirBeep(520, 'triangle', 0.1);
    setTimeout(() => reproducirBeep(780, 'triangle', 0.2), 90);
}

function sonidoError() {
    reproducirBeep(220, 'sawtooth', 0.25);
}

function sonidoTickAlerta() {
    reproducirBeep(880, 'sine', 0.05);
}

// ==========================================
// Lógica del Juego
// ==========================================

// Mostrar el récord guardado al cargar
recordInicio.textContent = recordGuardado;

function iniciarJuego() {
    puntos = 0;
    vidas = 3;
    racha = 0;
    rachaMaxima = 0;
    aciertos = 0;
    juegoActivo = true;
    esperandoSiguiente = false;

    puntosTexto.textContent = puntos;
    rachaTexto.textContent = 'x1';
    actualizarVidasUI();

    pantallaInicio.classList.add('oculto');
    pantallaJuego.classList.remove('oculto');
    modalGameOver.classList.add('oculto');
    cajaFeedback.classList.add('oculto');

    generarProblema();
}

function generarProblema() {
    esperandoSiguiente = false;
    cajaFeedback.classList.add('oculto');
    txtRespuestaUsuario.value = '';
    txtRespuestaUsuario.focus();

    // Valores enteros razonables para cálculo mental y educativo
    const corrientesPosibles = [2, 3, 4, 5, 6, 8, 10];
    const corriente = corrientesPosibles[Math.floor(Math.random() * corrientesPosibles.length)];
    const resistencia = Math.floor(Math.random() * 12) + 2; // entre 2 y 13 Ω
    const voltaje = corriente * resistencia;

    // Seleccionar aleatoriamente qué variable calcular (0: V, 1: R, 2: I)
    const caso = Math.floor(Math.random() * 3);

    if (caso === 0) {
        // Calcular VOLTAJE: V = I * R
        tipoIncognita = 'V';
        lblDato1.textContent = 'CORRIENTE (I)';
        valDato1.textContent = `${corriente} A`;
        lblDato2.textContent = 'RESISTENCIA (R)';
        valDato2.textContent = `${resistencia} Ω`;

        txtIncognita.textContent = 'VOLTAJE (V)';
        txtFormulaGuia.textContent = 'Fórmula: V = I × R';
        simboloUnidad.textContent = 'V';
        respuestaCorrecta = voltaje;

        actualizarDibujoCircuito(null, corriente, resistencia, 'V');
    } else if (caso === 1) {
        // Calcular RESISTENCIA: R = V / I
        tipoIncognita = 'R';
        lblDato1.textContent = 'VOLTAJE (V)';
        valDato1.textContent = `${voltaje} V`;
        lblDato2.textContent = 'CORRIENTE (I)';
        valDato2.textContent = `${corriente} A`;

        txtIncognita.textContent = 'RESISTENCIA (R)';
        txtFormulaGuia.textContent = 'Fórmula: R = V / I';
        simboloUnidad.textContent = 'Ω';
        respuestaCorrecta = resistencia;

        actualizarDibujoCircuito(voltaje, corriente, null, 'R');
    } else {
        // Calcular CORRIENTE: I = V / R
        tipoIncognita = 'I';
        lblDato1.textContent = 'VOLTAJE (V)';
        valDato1.textContent = `${voltaje} V`;
        lblDato2.textContent = 'RESISTENCIA (R)';
        valDato2.textContent = `${resistencia} Ω`;

        txtIncognita.textContent = 'CORRIENTE (I)';
        txtFormulaGuia.textContent = 'Fórmula: I = V / R';
        simboloUnidad.textContent = 'A';
        respuestaCorrecta = corriente;

        actualizarDibujoCircuito(voltaje, null, resistencia, 'I');
    }

    iniciarTemporizador();
}

// Función especial: Actualizar el dibujo del circuito SVG
function actualizarDibujoCircuito(v, i, r, incognita, estado = 'normal') {
    // Reset de estilos
    cajaVoltaje.setAttribute('stroke', '#94a3b8');
    cajaCorriente.setAttribute('stroke', '#94a3b8');
    cajaResistencia.setAttribute('stroke', '#94a3b8');
    cableCircuito.setAttribute('stroke', '#3b82f6');
    svgFocoHalo.setAttribute('fill', '#fef08a');
    svgFocoHalo.setAttribute('opacity', '0.6');
    estadoTexto.textContent = 'ACTIVO';
    estadoTexto.style.color = '#16a34a';

    // Rellenar valores o marcar '?'
    svgTextoV.textContent = (incognita === 'V') ? '?' : `${v}V`;
    svgTextoI.textContent = (incognita === 'I') ? 'I = ?' : `I = ${i}A`;
    svgTextoR.textContent = (incognita === 'R') ? '?' : `${r}Ω`;

    // Resaltar la caja incógnita
    if (incognita === 'V') cajaVoltaje.setAttribute('stroke', '#2563eb');
    if (incognita === 'I') cajaCorriente.setAttribute('stroke', '#2563eb');
    if (incognita === 'R') cajaResistencia.setAttribute('stroke', '#2563eb');

    if (estado === 'exito') {
        cableCircuito.setAttribute('stroke', '#16a34a');
        svgFocoHalo.setAttribute('fill', '#86efac');
        svgFocoHalo.setAttribute('opacity', '0.9');
        estadoTexto.textContent = 'ESTABILIZADO';
        estadoTexto.style.color = '#16a34a';
    } else if (estado === 'error') {
        cableCircuito.setAttribute('stroke', '#dc2626');
        svgFocoHalo.setAttribute('fill', '#fca5a5');
        svgFocoHalo.setAttribute('opacity', '0.9');
        estadoTexto.textContent = 'SOBRECARGA';
        estadoTexto.style.color = '#dc2626';
    }
}

// ==========================================
// Control del Temporizador
// ==========================================
function iniciarTemporizador() {
    clearInterval(temporizador);
    tiempo = TIEMPO_BASE;
    actualizarBarraTiempo();

    temporizador = setInterval(() => {
        if (!juegoActivo || esperandoSiguiente) return;

        tiempo--;
        actualizarBarraTiempo();

        if (tiempo <= 4 && tiempo > 0) {
            sonidoTickAlerta();
        }

        if (tiempo <= 0) {
            clearInterval(temporizador);
            perderVida(`¡Tiempo agotado! Sobrecarga en el circuito. La respuesta era ${respuestaCorrecta} ${simboloUnidad.textContent}`);
        }
    }, 1000);
}

function actualizarBarraTiempo() {
    tiempoTexto.textContent = `${tiempo}s`;

    const porcentaje = (tiempo / TIEMPO_BASE) * 100;
    barraTiempo.style.width = `${Math.max(0, porcentaje)}%`;

    if (tiempo <= 4) {
        tiempoTexto.classList.add('tiempo-critico');
        barraTiempo.style.backgroundColor = '#dc2626';
    } else if (tiempo <= 8) {
        tiempoTexto.classList.remove('tiempo-critico');
        barraTiempo.style.backgroundColor = '#d97706';
    } else {
        tiempoTexto.classList.remove('tiempo-critico');
        barraTiempo.style.backgroundColor = '#2563eb';
    }
}

// ==========================================
// Validación y Puntuación
// ==========================================
function verificarRespuesta() {
    if (!juegoActivo || esperandoSiguiente) return;

    const valorIngresado = parseFloat(txtRespuestaUsuario.value);

    if (isNaN(valorIngresado)) {
        mostrarMensaje('Por favor, escribe un número antes de estabilizar.', false);
        return;
    }

    // Comprobar respuesta con margen de error mínimo
    if (Math.abs(valorIngresado - respuestaCorrecta) < 0.05) {
        // Respuesta Correcta
        clearInterval(temporizador);
        esperandoSiguiente = true;
        aciertos++;
        racha++;
        if (racha > rachaMaxima) rachaMaxima = racha;

        // Puntos base + bonus por racha
        const puntosGanados = 10 + (racha > 1 ? (racha - 1) * 5 : 0);
        puntos += puntosGanados;

        puntosTexto.textContent = puntos;
        rachaTexto.textContent = `x${racha}`;

        sonidoAcierto();
        actualizarDibujoCircuito(null, null, null, null, 'exito');
        mostrarMensaje(`¡Correcto! Circuito estabilizado (+${puntosGanados} pts)`, true);

        // Pasar al siguiente problema tras 1.2 segundos
        setTimeout(() => {
            if (juegoActivo) generarProblema();
        }, 1200);
    } else {
        // Respuesta Incorrecta
        perderVida(`¡Incorrecto! El valor era ${respuestaCorrecta} ${simboloUnidad.textContent}.`);
    }
}

function perderVida(mensaje) {
    clearInterval(temporizador);
    esperandoSiguiente = true;
    vidas--;
    racha = 0;
    rachaTexto.textContent = 'x1';
    actualizarVidasUI();

    sonidoError();
    actualizarDibujoCircuito(null, null, null, null, 'error');
    mostrarMensaje(mensaje, false);

    if (vidas <= 0) {
        // Terminar partida
        setTimeout(() => {
            finalizarJuego();
        }, 1400);
    } else {
        // Continuar siguiente ronda tras 1.5 segundos
        setTimeout(() => {
            if (juegoActivo) generarProblema();
        }, 1500);
    }
}

function actualizarVidasUI() {
    let corazones = '';
    for (let i = 0; i < vidas; i++) {
        corazones += '❤️';
    }
    for (let i = vidas; i < 3; i++) {
        corazones += '🖤';
    }
    vidasTexto.textContent = corazones;
}

function mostrarMensaje(texto, esExito) {
    cajaFeedback.textContent = texto;
    cajaFeedback.className = `mensaje-alerta ${esExito ? 'mensaje-exito' : 'mensaje-error'}`;
    cajaFeedback.classList.remove('oculto');
}

// ==========================================
// Finalización y Guardado de Récord
// ==========================================
function finalizarJuego() {
    juegoActivo = false;
    clearInterval(temporizador);

    // Comprobar si se superó el récord
    let nuevoRecord = false;
    if (puntos > recordGuardado) {
        recordGuardado = puntos;
        localStorage.setItem('record_ley_ohm', recordGuardado);
        nuevoRecord = true;
    }

    puntosFinales.textContent = puntos;
    txtRecordFinal.textContent = nuevoRecord 
        ? `¡NUEVO RÉCORD: ${recordGuardado} pts!` 
        : `Récord guardado: ${recordGuardado} pts`;
    
    txtAciertosFinales.textContent = `Aciertos: ${aciertos} | Racha máxima: ${rachaMaxima}`;

    modalGameOver.classList.remove('oculto');
}

function togglePista() {
    cajaPistaOhm.classList.toggle('oculto');
}

// ==========================================
// Eventos y Asignaciones
// ==========================================
btnEmpezar.addEventListener('click', iniciarJuego);
btnReintentar.addEventListener('click', iniciarJuego);
btnVerificar.addEventListener('click', verificarRespuesta);
btnPista.addEventListener('click', togglePista);

// Permitir presionar tecla 'Enter' para responder rápidamente
txtRespuestaUsuario.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        verificarRespuesta();
    }
});
