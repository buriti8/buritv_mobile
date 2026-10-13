import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SLOW_ON_STALLS,
    SLOW_STALL_WINDOW_MS,
    SLOW_ON_BPS,
    SLOW_OFF_BPS,
    SLOW_OFF_AFTER_MS,
} from '../constants/config';

const K_SLOW = 'slowNetMode';
// Muestras de velocidad necesarias antes de decidir (una sola es ruido)
const MIN_BW_SAMPLES = 6;
// Peso de cada muestra nueva en el promedio móvil de velocidad
const BW_ALPHA = 0.25;
// Sin medición de velocidad se espera más para apagarlo (evita que se
// prenda y apague una y otra vez en una red lenta pero estable)
const OFF_WITHOUT_DATA_MS = SLOW_OFF_AFTER_MS * 3;

/**
 * Modo "internet lento", automático e invisible para el usuario.
 *
 * Se ACTIVA solo cuando la red no da abasto:
 *  - una señal que ya reproducía se corta SLOW_ON_STALLS veces seguidas
 *    (reportStall, lo llama la recuperación del stream), o
 *  - se cortó una vez y la velocidad que mide ExoPlayer está baja
 *    (reportBandwidth). La velocidad baja sola no basta: una señal liviana
 *    puede ir perfecta con poca velocidad.
 * Se DESACTIVA cuando pasan SLOW_OFF_AFTER_MS sin cortes y la velocidad
 * medida está sobrada (sin medición —VLC, embeds— se espera el triple).
 *
 * Con el modo activo el reproductor guarda más reserva, va unos segundos más
 * atrás del vivo, usa una calidad más liviana (si la señal la ofrece) y
 * espera más antes de dar una señal por cortada.
 *
 * El estado se recuerda: si la red de la casa es lenta, la próxima vez la app
 * ya arranca en este modo. `activations` cuenta solo los encendidos
 * automáticos (no la lectura inicial): App reconecta la señal en ese momento
 * para aplicar el buffer nuevo. Al apagarse no se reconecta: se aplica en el
 * próximo cambio de canal u opción, sin cortar lo que se está viendo.
 */
export default function useSlowMode() {
    const [slowMode, setSlowMode] = useState(false);
    const [activations, setActivations] = useState(0);
    const [ready, setReady] = useState(false);

    const slowRef = useRef(false);
    slowRef.current = slowMode;
    const stalls = useRef([]); // momentos de los cortes recientes
    const lastStallAt = useRef(0);
    const changedAt = useRef(Date.now());
    const bw = useRef({ avg: null, samples: 0 });

    useEffect(() => {
        AsyncStorage.getItem(K_SLOW)
            .then(v => {
                if (v === '1') setSlowMode(true);
            })
            .catch(() => {})
            .finally(() => setReady(true));
    }, []);

    const setMode = useCallback(on => {
        if (slowRef.current === on) return;
        slowRef.current = on;
        changedAt.current = Date.now();
        stalls.current = [];
        bw.current = { avg: null, samples: 0 };
        setSlowMode(on);
        if (on) setActivations(n => n + 1);
        AsyncStorage.setItem(K_SLOW, on ? '1' : '0').catch(() => {});
        console.log(`[BuriTV] Modo internet lento ${on ? 'activado' : 'desactivado'}`);
    }, []);

    // Una señal que ya reproducía se cortó (falta de velocidad, casi siempre)
    const reportStall = useCallback(() => {
        const now = Date.now();
        lastStallAt.current = now;
        if (slowRef.current) return;
        stalls.current = stalls.current.filter(t => now - t < SLOW_STALL_WINDOW_MS);
        stalls.current.push(now);
        const b = bw.current;
        const slowLink = b.samples >= MIN_BW_SAMPLES && b.avg < SLOW_ON_BPS;
        if (stalls.current.length >= SLOW_ON_STALLS || slowLink) setMode(true);
    }, [setMode]);

    // Velocidad estimada por ExoPlayer al descargar (bits/s)
    const reportBandwidth = useCallback(
        e => {
            const bps = e?.bitrate;
            if (!bps || bps <= 0) return;
            const b = bw.current;
            b.avg = b.avg == null ? bps : b.avg + BW_ALPHA * (bps - b.avg);
            b.samples += 1;
            if (b.samples < MIN_BW_SAMPLES) return;
            const now = Date.now();
            if (!slowRef.current) {
                // Velocidad baja + un corte reciente → activar
                const recentStall = now - lastStallAt.current < SLOW_STALL_WINDOW_MS;
                if (b.avg < SLOW_ON_BPS && recentStall) setMode(true);
            } else if (
                b.avg > SLOW_OFF_BPS &&
                now - Math.max(lastStallAt.current, changedAt.current) > SLOW_OFF_AFTER_MS
            ) {
                setMode(false);
            }
        },
        [setMode],
    );

    // Sin medición de velocidad (VLC, embeds): apagarlo si pasa el tiempo sin cortes
    useEffect(() => {
        if (!slowMode) return;
        const iv = setInterval(() => {
            const quietFor = Date.now() - Math.max(lastStallAt.current, changedAt.current);
            const b = bw.current;
            const hasData = b.samples >= MIN_BW_SAMPLES;
            if (
                hasData
                    ? quietFor > SLOW_OFF_AFTER_MS && b.avg > SLOW_OFF_BPS
                    : quietFor > OFF_WITHOUT_DATA_MS
            ) {
                setMode(false);
            }
        }, 60000);
        return () => clearInterval(iv);
    }, [slowMode, setMode]);

    return { slowMode, activations, ready, reportStall, reportBandwidth };
}
