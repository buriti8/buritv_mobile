import { Platform } from 'react-native';

export const isTV = Platform.isTV;

const M3U_DRIVE_ID = '1OK6_rn5hFGB0WgpG4XqIR-FR6qlIYBL7';
// Enlace directo (sin redirección) y, de respaldo, el enlace clásico de Drive
export const M3U_URLS = [
    `https://drive.usercontent.google.com/download?id=${M3U_DRIVE_ID}&export=download`,
    `https://drive.google.com/uc?export=download&id=${M3U_DRIVE_ID}`,
];
// fetch en Android no tiene tiempo límite: sin esto, con mala red la
// pantalla de carga podía quedarse colgada para siempre
export const M3U_TIMEOUT_MS = 12000;
// Sin lista (ni copia guardada): reintentos automáticos con espera creciente
export const M3U_RETRY_MS = [3000, 8000, 15000, 30000];

export const HOT_UPDATER_URL =
    'https://dvoqn4m4ky7xd.cloudfront.net/api/check-update';

// Wikimedia y otros CDNs rechazan logos pedidos sin User-Agent
export const LOGO_HEADERS = { 'User-Agent': 'BuriTV/1.0' };

export const TV_ROW_H = 50;
export const TV_SECTION_H = 38;
export const TV_HEADER_H = 60;
export const MOBILE_ROW_H = 60;
// Alto fijo de los títulos de sección en el celular (para getItemLayout)
export const MOBILE_SECTION_H = 42;

// ── Recuperación del stream ──────────────────────────────────────────────
// Sin avance de video durante este tiempo (ya reproduciendo) = corte
export const STALL_MS = 10000;
// Tiempo máximo para que una fuente arranque
export const START_TIMEOUT_MS = 20000;
// Espera antes de cada reintento sobre la misma fuente
export const RETRY_BACKOFF_MS = [500, 2500];
// Si todas las opciones fallan, se vuelve a intentar solo cada…
export const FAILED_RETRY_MS = 20000;
export const WATCHDOG_MS = 2000;
// Una opción que falla FLAP_LIMIT veces en FLAP_WINDOW_MS es inestable:
// se deja de reintentar y se escala (otro motor u otra opción)
export const FLAP_LIMIT = 3;
export const FLAP_WINDOW_MS = 60000;

// ── Varios canales a la vez ──────────────────────────────────────────────
// Cada recuadro es un player propio con su decodificador: un celular aguanta
// 4, pero un TV Box modesto (poca memoria, pocos decodificadores por
// hardware) solo 2.
export const MULTI_MAX = isTV ? 2 : 4;
// Solo el recuadro con sonido va a calidad completa; el resto, con tope
export const MULTI_TILE_MAX_BITRATE = 1500000;

// ── Tipografía ───────────────────────────────────────────────────────────
// Roboto Condensed (viene con Android): la letra de los marcadores y placas
// de las transmisiones deportivas. Para nombres de canal, números y títulos.
export const FONT_DISPLAY = Platform.select({
    android: 'sans-serif-condensed',
    ios: 'AvenirNextCondensed-Bold',
    default: undefined,
});

// ── Internet lento ──────────────────────────────────────────────────────
// Modo "internet lento": más reserva y más paciencia antes de dar por
// cortada una señal (a cambio de unos segundos más de retraso)
export const STALL_MS_SLOW = 20000;
export const START_TIMEOUT_MS_SLOW = 35000;
// Tope de calidad en modo lento (bits/s). Solo sirve si la señal ofrece
// varias calidades; si trae una sola, se reproduce esa.
export const SLOW_MAX_BITRATE = 1500000;
// Si una señal que ya reproducía se corta, se baja un escalón de calidad
// en el siguiente intento (bits/s). Vale para esa opción durante la sesión.
export const BITRATE_STEPS = [2500000, 1200000, 600000];
// Detección automática del modo internet lento (el usuario no lo ve):
//  - se activa si una señal que ya reproducía se corta SLOW_ON_STALLS veces
//    en SLOW_STALL_WINDOW_MS, o si la velocidad medida queda por debajo de
//    SLOW_ON_BPS de forma sostenida;
//  - se desactiva tras SLOW_OFF_AFTER_MS sin cortes y con velocidad sobrada.
export const SLOW_ON_STALLS = 2;
export const SLOW_STALL_WINDOW_MS = 5 * 60 * 1000;
export const SLOW_ON_BPS = 1800000;
export const SLOW_OFF_BPS = 4000000;
export const SLOW_OFF_AFTER_MS = 15 * 60 * 1000;

// ── Experiencia sin cortes visibles ─────────────────────────────────────
// Una reconexión de la MISMA opción que dure menos que esto no se muestra
// (sin "Reconectando…", sin quitar "En vivo"): solo un indicador discreto
export const RECONNECT_GRACE_MS = 2500;
// Al volver a la app tras salir un momento: si estuviste fuera menos que
// esto se retoma sin reconectar (queda a lo sumo estos segundos detrás del
// vivo); si fue más, se reconecta directo al vivo
export const RESUME_LIVE_MS = 10000;
