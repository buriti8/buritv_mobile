import { useState, useRef, useCallback, useEffect } from 'react';
import { BackHandler, useTVEventHandler } from 'react-native';
import { isTV } from '../constants/config';

/**
 * Lógica de controles para Android TV:
 *  - Foco visual de botones
 *  - Auto-ocultar controles (4s)
 *  - Botón atrás → salir del modo teatro
 *  - Evento playPause del control remoto
 */
export default function useTVControls({ theater, setTheater, setPaused }) {
    const [ctrlFocused, setCtrlFocused] = useState(null);
    const [playNode, setPlayNode] = useState(null);
    const [tvUiVisible, setTvUiVisible] = useState(false);
    const [listFocused, setListFocused] = useState(-1);

    const tvHideTimer = useRef(null);

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
                return true;
            }
            return false;
        });
        return () => sub.remove();
    }, [theater, setTheater]);

    // Evento playPause del control remoto
    useTVEventHandler(
        useCallback(
            (evt) => {
                if (!isTV) return;
                if (evt?.eventType === 'playPause') setPaused((p) => !p);
                if (ctrlFocused != null) tvPing();
            },
            [ctrlFocused, tvPing, setPaused],
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
        tvUiVisible,
        setTvUiVisible,
        listFocused,
        setListFocused,
        tvHideTimer,
        tvPing,
    };
}
