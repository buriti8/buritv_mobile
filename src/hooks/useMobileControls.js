import { useState, useRef, useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { isTV } from '../constants/config';

/**
 * Controles para la UI móvil:
 *  - Overlay de controles con auto-ocultar (4.5s)
 *  - Fullscreen (landscape)
 */
export default function useMobileControls({ loading }) {
    const [fullscreen, setFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(false);

    const hideTimeout = useRef(null);

    const startAutoHide = useCallback(() => {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => setControlsVisible(false), 4500);
    }, []);

    const showControls = useCallback(() => {
        setControlsVisible(true);
        startAutoHide();
    }, [startAutoHide]);

    // Al terminar la carga, mostrar controles brevemente
    useEffect(() => {
        if (!loading && !isTV) showControls();
    }, [loading, showControls]);

    const toggleFullscreen = useCallback(() => {
        setFullscreen((prev) => {
            prev ? Orientation.lockToPortrait() : Orientation.lockToLandscape();
            return !prev;
        });
        showControls();
    }, [showControls]);

    const exitFullscreen = useCallback(() => {
        Orientation.lockToPortrait();
        setFullscreen(false);
        showControls();
    }, [showControls]);

    const handleVideoPress = useCallback(() => {
        if (controlsVisible) {
            clearTimeout(hideTimeout.current);
            setControlsVisible(false);
        } else {
            showControls();
        }
    }, [controlsVisible, showControls]);

    // Botón atrás en fullscreen → salir de fullscreen en vez de cerrar la app
    useEffect(() => {
        if (isTV) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (fullscreen) {
                Orientation.lockToPortrait();
                setFullscreen(false);
                showControls();
                return true; // consumir el evento
            }
            return false; // dejar que el sistema maneje (salir de app)
        });
        return () => sub.remove();
    }, [fullscreen, showControls]);

    // Cleanup
    useEffect(() => {
        return () => clearTimeout(hideTimeout.current);
    }, []);

    return {
        fullscreen,
        controlsVisible,
        showControls,
        toggleFullscreen,
        exitFullscreen,
        handleVideoPress,
    };
}
