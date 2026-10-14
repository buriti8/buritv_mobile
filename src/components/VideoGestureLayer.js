import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, PanResponder, NativeModules } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

// Módulo nativo (android/.../BuriSystemModule.kt). Si la app instalada es
// anterior a él (llegó solo la actualización de JS), no hay gestos y queda
// solo el toque para mostrar los controles.
const { BuriSystem } = NativeModules;

// Movimiento mínimo (dp) para que un toque pase a ser un deslizamiento
const SLOP = 10;
const TAP_MAX_MS = 500;
const HUD_HIDE_MS = 900;

const clamp = v => Math.min(1, Math.max(0, v));

/**
 * Capa táctil sobre el video del celular:
 *   toque                      → muestra u oculta los controles
 *   deslizar arriba/abajo, mitad derecha    → volumen
 *   deslizar arriba/abajo, mitad izquierda  → brillo de la pantalla
 * (en TV no se usa: el volumen y el brillo los maneja el propio TV)
 */
export default function VideoGestureLayer({ onTap }) {
    const size = useRef({ w: 0, h: 0 });
    const gesture = useRef({});
    const tapRef = useRef(onTap);
    tapRef.current = onTap;
    const hideTimer = useRef(null);
    const [hud, setHud] = useState(null); // { kind: 'volume' | 'brightness', value }

    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const scheduleHide = useCallback(() => {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setHud(null), HUD_HIDE_MS);
    }, []);

    const onLayout = useCallback(e => {
        const { width, height } = e.nativeEvent.layout;
        size.current = { w: width, h: height };
    }, []);

    const pan = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderTerminationRequest: () => false,
                onPanResponderGrant: e => {
                    const kind = e.nativeEvent.locationX < size.current.w / 2 ? 'brightness' : 'volume';
                    const g = { kind, start: null, active: false, dy0: 0, at: Date.now() };
                    gesture.current = g;
                    if (!BuriSystem) return;
                    // Valor de partida: el actual del sistema
                    const read = kind === 'volume' ? BuriSystem.getVolume() : BuriSystem.getBrightness();
                    read.then(v => (g.start = v)).catch(() => (g.start = 0.5));
                },
                onPanResponderMove: (e, gs) => {
                    const g = gesture.current;
                    if (!BuriSystem) return;
                    if (!g.active) {
                        // Solo cuenta un deslizamiento más vertical que horizontal
                        if (Math.abs(gs.dy) < SLOP || Math.abs(gs.dy) < Math.abs(gs.dx)) return;
                        g.active = true;
                        g.dy0 = gs.dy;
                        clearTimeout(hideTimer.current);
                    }
                    if (g.start == null) return;
                    // Recorrer ~80 % del alto del video cambia de 0 a 100 %
                    const range = Math.max(120, size.current.h * 0.8);
                    const value = clamp(g.start - (gs.dy - g.dy0) / range);
                    if (g.kind === 'volume') BuriSystem.setVolume(value);
                    else BuriSystem.setBrightness(value);
                    setHud({ kind: g.kind, value });
                },
                onPanResponderRelease: (e, gs) => {
                    const g = gesture.current;
                    if (g.active) {
                        scheduleHide();
                    } else if (
                        Math.abs(gs.dx) < SLOP &&
                        Math.abs(gs.dy) < SLOP &&
                        Date.now() - g.at < TAP_MAX_MS
                    ) {
                        tapRef.current?.();
                    }
                },
                onPanResponderTerminate: () => {
                    if (gesture.current.active) scheduleHide();
                },
            }),
        [scheduleHide],
    );

    const percent = hud ? Math.round(hud.value * 100) : 0;
    const icon =
        hud?.kind === 'brightness'
            ? 'sun'
            : percent === 0
            ? 'volume-xmark'
            : percent < 50
            ? 'volume-low'
            : 'volume-high';

    return (
        <View style={styles.videoTouchable} onLayout={onLayout} {...pan.panHandlers}>
            {hud && (
                <View style={styles.gestureHud} pointerEvents="none">
                    <FontAwesome6 name={icon} size={18} color={C.chalk} iconStyle="solid" />
                    <View style={styles.gestureTrack}>
                        <View style={[styles.gestureFill, { width: `${percent}%` }]} />
                    </View>
                    <Text style={styles.gestureText}>{percent}%</Text>
                </View>
            )}
        </View>
    );
}
