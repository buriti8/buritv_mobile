import { BackHandler } from 'react-native';
import { showToast, hideToast } from './toast';

// Tiempo para la segunda pulsación de "atrás"
export const EXIT_WINDOW_MS = 2000;

/**
 * Salir de la app con dos veces "atrás".
 *
 * Se registra al cargar el módulo (antes que cualquier pantalla), así queda
 * como el ÚLTIMO en atender el botón: solo actúa cuando nada más lo usó
 * (salir de pantalla completa, de los controles, limpiar un filtro…).
 * La primera pulsación avisa; la segunda, dentro de EXIT_WINDOW_MS, cierra.
 */
let lastPress = 0;

BackHandler.addEventListener('hardwareBackPress', () => {
    const now = Date.now();
    if (now - lastPress < EXIT_WINDOW_MS) {
        lastPress = 0;
        hideToast();
        BackHandler.exitApp();
        return true;
    }
    lastPress = now;
    showToast('Presiona atrás otra vez para salir', EXIT_WINDOW_MS);
    return true;
});
