import { useState, useRef, useCallback, useEffect } from 'react';
import { BackHandler, TextInput, UIManager, findNodeHandle, useTVEventHandler } from 'react-native';
import { isTV } from '../constants/config';

/**
 * Lógica de controles para Android TV:
 *  - Foco visual de botones y auto-ocultar controles (4s)
 *  - Botón atrás en pantalla completa → sale de ella y deja el foco en el
 *    botón de pantalla completa (no vuelve a la lista)
 *  - Teclas del control remoto:
 *      Play/Pausa            → pausar / reanudar
 *      CH+ / CH−             → canal siguiente / anterior (siempre)
 *      0-9                   → ir a un canal por número
 *      Info                  → banner del canal actual
 *      Guía                  → mostrar la lista de canales
 *    En pantalla completa con los controles ocultos:
 *      ↑ / ↓                 → canal siguiente / anterior
 *      ← / →                 → opción anterior / siguiente del canal
 *      OK                    → mostrar controles
 */
export default function useTVControls({
    theater,
    setTheater,
    setPaused,
    onZap,
    onDigit,
    onOption,
    onInfo,
}) {
    const [ctrlFocused, setCtrlFocused] = useState(null);
    const [playNode, setPlayNode] = useState(null);
    const [tvUiVisible, setTvUiVisible] = useState(false);

    const tvHideTimer = useRef(null);
    const theaterBtn = useRef(null);
    const registerTheaterBtn = useCallback(node => {
        theaterBtn.current = node;
    }, []);

    // ── Ref callback para el botón Play (puente de foco) ────────────────
    const registerPlayBtn = useCallback((node) => {
        setPlayNode((prev) => (prev === node ? prev : node));
    }, []);

    // ── Ping: muestra controles y programa auto-ocultar ─────────────────
    const tvPing = useCallback(() => {
        setTvUiVisible(true);
        clearTimeout(tvHideTimer.current);
        tvHideTimer.current = setTimeout(() => setTvUiVisible(false), 4000);
    }, []);

    // Al volver a la lista se ocultan los controles
    const hideTvUi = useCallback(() => {
        clearTimeout(tvHideTimer.current);
        setTvUiVisible(false);
    }, []);

    // Enfocar un control → mostrar
    useEffect(() => {
        if (!isTV) return;
        if (ctrlFocused != null) tvPing();
    }, [ctrlFocused, tvPing]);

    // Botón atrás → salir modo teatro
    useEffect(() => {
        if (!isTV) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (theater) {
                setTheater(false);
                tvPing();
                // Esperar a que se monten la lista y la barra: la lista pide el
                // foco al abrirse y hay que quitárselo
                setTimeout(() => {
                    const tag = theaterBtn.current && findNodeHandle(theaterBtn.current);
                    if (tag != null) {
                        UIManager.dispatchViewManagerCommand(tag, 'requestTVFocus', []);
                    }
                }, 350);
                return true;
            }
            return false;
        });
        return () => sub.remove();
    }, [theater, setTheater, tvPing]);

    // ── Teclas del control remoto ───────────────────────────────────────
    useTVEventHandler(
        useCallback(
            (evt) => {
                if (!isTV || !evt?.eventType) return;
                let type = evt.eventType;
                // focus/blur también llegan por aquí: no son teclas
                if (type === 'focus' || type === 'blur') return;
                // Pulsación larga: llega al bajar y al soltar; usar solo la primera
                if (type.startsWith('long')) {
                    if (evt.eventKeyAction === 1) return;
                    type = type[4].toLowerCase() + type.slice(5);
                }
                // Escribiendo en el buscador: los números y flechas son del teclado
                if (TextInput.State.currentlyFocusedInput()) return;

                if (type === 'playPause') setPaused((p) => !p);
                else if (type === 'channelUp') onZap(1);
                else if (type === 'channelDown') onZap(-1);
                else if (/^[0-9]$/.test(type)) onDigit(type);
                else if (type === 'info') onInfo();
                else if (type === 'guide') setTheater(false);
                else if (theater && !tvUiVisible) {
                    if (type === 'up') onZap(1);
                    else if (type === 'down') onZap(-1);
                    else if (type === 'left') onOption(-1);
                    else if (type === 'right') onOption(1);
                }

                if (ctrlFocused != null) tvPing();
            },
            [
                ctrlFocused,
                tvPing,
                setPaused,
                setTheater,
                theater,
                tvUiVisible,
                onZap,
                onDigit,
                onOption,
                onInfo,
            ],
        ),
    );

    // Cleanup
    useEffect(() => {
        return () => clearTimeout(tvHideTimer.current);
    }, []);

    return {
        ctrlFocused,
        setCtrlFocused,
        playNode,
        registerPlayBtn,
        registerTheaterBtn,
        tvUiVisible,
        hideTvUi,
        tvPing,
    };
}
