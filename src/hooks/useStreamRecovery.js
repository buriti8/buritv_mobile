import { useEffect, useRef, useCallback, useState } from 'react';
import {
    STALL_MS,
    START_TIMEOUT_MS,
    RETRY_BACKOFF_MS,
    FAILED_RETRY_MS,
    WATCHDOG_MS,
    FLAP_LIMIT,
    FLAP_WINDOW_MS,
    STALL_MS_SLOW,
    START_TIMEOUT_MS_SLOW,
    SLOW_MAX_BITRATE,
    BITRATE_STEPS,
} from '../constants/config';

// Errores de ExoPlayer que indican que el servidor no responde (conexión
// fallida, timeout, HTTP 4xx/5xx, no encontrado…): ahí VLC tampoco ayudaría.
const DEAD_SOURCE_CODES = new Set([2001, 2002, 2004, 2005, 2006, 2007]);

// Errores en los que ExoPlayer no se lleva bien con ESE servidor (segmentos
// irregulares, listas o contenedores mal formados, códec que el equipo no
// decodifica). Reintentar con ExoPlayer solo produce ciclos de
// "reproduce → falla"; VLC sí suele poder → se pasa a VLC al primer error.
const EXO_PREFER_VLC_CODES = new Set([2008, 3001, 3002, 3003, 3004, 4001, 4002, 4003, 4004, 4005]);

// "Quedó atrás de la ventana en vivo": react-native-video ya lo resuelve
// solo (salta al vivo y sigue, sin rearmar el player). No es un fallo.
const BEHIND_LIVE_WINDOW = 1002;

// react-native-video antepone un "2" al código de Media3 (2008 → "22008")
const exoCode = e => {
    const raw = String(e?.error?.errorCode ?? e?.errorCode ?? '');
    const n = Number(raw.length === 5 && raw[0] === '2' ? raw.slice(1) : raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * Controla qué motor reproduce cada opción y mantiene viva la señal sin
 * cambiar nunca de canal por su cuenta.
 *
 *  engine: 'exo' (ExoPlayer, principal) | 'vlc' (respaldo) | 'web' (embeds)
 *  status: 'loading' | 'playing' | 'reconnecting' | 'failed'
 *
 *  Ante un error, un fin de stream, un corte (sin avance durante STALL_MS)
 *  o una opción que no arranca (START_TIMEOUT_MS):
 *
 *   1. Si ya estaba reproduciendo, reintenta la MISMA opción con espera
 *      creciente (RETRY_BACKOFF_MS): cubre los microcortes.
 *   2. Si ExoPlayer no pudo y el servidor no está caído (formato/códec que
 *      el equipo no soporta, servidor que corta segmentos…), prueba la misma
 *      opción con VLC.
 *   3. Pasa a otra opción del MISMO canal, empezando por la más estable
 *      según el historial (rankSources) y sin repetir las ya probadas.
 *   4. Si ninguna responde → 'failed' y sigue reintentando solo cada
 *      FAILED_RETRY_MS. Cambiar de canal es decisión del usuario.
 *
 *  Cuando una opción reproduce, se recuerda (opción + motor) para la
 *  próxima vez que se abra el canal. Cada arranque y cada caída se anotan
 *  en el historial de la opción (onSourceResult).
 *
 *  Calidad: si una opción que ya reproducía se corta, el siguiente intento
 *  baja un escalón (BITRATE_STEPS). En modo "internet lento" se parte de
 *  SLOW_MAX_BITRATE y se espera más antes de dar una señal por cortada.
 *  (Bajar la calidad solo es posible si la señal ofrece varias.)
 */
export default function useStreamRecovery({
    current,
    source,
    sourceIndex,
    selectSource,
    paused,
    getEnginePref,
    onSourceWorking,
    rankSources,
    onSourceResult,
    onStall,
    slowMode,
}) {
    const [status, setStatus] = useState('loading');
    const [playerKey, setPlayerKey] = useState(0);
    const [recoveryMuted, setRecoveryMuted] = useState(false);
    const [engineOverride, setEngineOverride] = useState(null); // { url, engine }
    // Tope de calidad por opción tras cortes: { [url]: bits/s }
    const [bitrateCaps, setBitrateCaps] = useState({});

    const engine = !source
        ? null
        : source.type === 'web'
        ? 'web'
        : engineOverride?.url === source.url
        ? engineOverride.engine
        : source.engine || getEnginePref?.(source.url) || 'exo';

    // Tope efectivo para la opción actual (0 = sin tope)
    const caps = [source && bitrateCaps[source.url], slowMode && SLOW_MAX_BITRATE].filter(Boolean);
    const maxBitRate = caps.length ? Math.min(...caps) : 0;

    const statusRef = useRef(status);
    statusRef.current = status;

    const attempts = useRef(0); // reintentos sobre la opción+motor actual
    const tried = useRef(new Set()); // opciones descartadas en este ciclo
    const playedThisSource = useRef(false);
    const recentFails = useRef([]); // fallos recientes de la opción+motor actual
    const lastProgressAt = useRef(Date.now());
    const lastTime = useRef(null);
    const retryTimer = useRef(null);
    const pendingUnmute = useRef(false);
    // ExoPlayer informa si está reproduciendo (en HLS en vivo su posición
    // casi no cambia aunque el video avance, así que no sirve para detectar cortes)
    const exoPlaying = useRef(false);

    // Valores actuales para callbacks estables
    const live = useRef({});
    live.current = {
        current,
        source,
        sourceIndex,
        selectSource,
        paused,
        engine,
        onSourceWorking,
        rankSources,
        onSourceResult,
        onStall,
        slowMode,
    };

    const clearRetry = () => {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
    };

    const schedule = useCallback((wait, fn) => {
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
            retryTimer.current = null;
            fn();
        }, wait);
    }, []);

    // ── Canal nuevo: ciclo de recuperación desde cero ────────────────────
    useEffect(() => {
        clearRetry();
        attempts.current = 0;
        tried.current = new Set();
        setEngineOverride(null);
        setStatus('loading');
    }, [current?.id]);

    // ── Opción o motor nuevo ─────────────────────────────────────────────
    useEffect(() => {
        playedThisSource.current = false;
        recentFails.current = [];
    }, [source?.url, engine]);

    // ── Cualquier (re)montaje del player: esperar a que arranque ────────
    useEffect(() => {
        lastTime.current = null;
        exoPlaying.current = false;
        lastProgressAt.current = Date.now();
        if (statusRef.current === 'playing') setStatus('loading');
    }, [source?.url, engine, playerKey]);

    // ── Al reiniciar VLC: mutear hasta que haya avance real ─────────────
    // (VLC a veces arranca sin audio tras un remount; alternar mute lo
    // arregla. Con ExoPlayer no hace falta: así el audio no se corta de más)
    useEffect(() => {
        if (playerKey === 0 || engine !== 'vlc') return;
        setRecoveryMuted(true);
        pendingUnmute.current = true;
        const t = setTimeout(() => {
            pendingUnmute.current = false;
            setRecoveryMuted(false);
        }, 2000);
        return () => clearTimeout(t);
    }, [playerKey, engine]);

    // Al reanudar tras una pausa, el reloj del watchdog arranca de nuevo
    useEffect(() => {
        if (!paused) lastProgressAt.current = Date.now();
    }, [paused]);

    // ── La opción está entregando video ─────────────────────────────────
    const markPlaying = useCallback(() => {
        lastProgressAt.current = Date.now();
        playedThisSource.current = true;
        if (pendingUnmute.current) {
            pendingUnmute.current = false;
            setRecoveryMuted(false);
        }
        if (statusRef.current !== 'playing') {
            clearRetry();
            attempts.current = 0;
            tried.current = new Set();
            setStatus('playing');
            const { current: c, sourceIndex: i, engine: en } = live.current;
            if (c) console.log(`[BuriTV] Reproduciendo ${c.name} · opción ${i + 1} · ${en}`);
            const {
                current: ch,
                source: src,
                sourceIndex: idx,
                engine: eng,
                onSourceWorking: cb,
                onSourceResult: note,
            } = live.current;
            if (ch) cb?.(ch.id, idx, eng);
            note?.(src?.url, true);
        }
    }, []);

    const handleProgress = useCallback(
        e => {
            const t = e?.currentTime ?? e?.time;
            if (t != null && t !== lastTime.current) {
                lastTime.current = t;
                markPlaying();
            }
        },
        [markPlaying],
    );

    const handlePlaybackState = useCallback(
        e => {
            exoPlaying.current = !!e?.isPlaying;
            if (exoPlaying.current) markPlaying();
        },
        [markPlaying],
    );

    // ── ExoPlayer reproduce el video pero no puede decodificar el audio ─────
    // (MP2, AC3… según el equipo): queda sin sonido y sin error. Si hay pistas
    // de audio y ninguna quedó seleccionada, se pasa a VLC, que sí las abre.
    const audioTimer = useRef(null);
    const audioMissing = useRef(false);
    useEffect(() => {
        audioMissing.current = false;
        clearTimeout(audioTimer.current);
    }, [source?.url, engine, playerKey]);
    useEffect(() => () => clearTimeout(audioTimer.current), []);
    const handleAudioTracks = useCallback(e => {
        const tracks = e?.audioTracks;
        if (!Array.isArray(tracks) || !tracks.length) return;
        audioMissing.current = !tracks.some(t => t.selected);
        clearTimeout(audioTimer.current);
        if (!audioMissing.current) return;
        // Margen: la selección puede llegar un instante después de la lista
        audioTimer.current = setTimeout(() => {
            const { source: src, engine: eng } = live.current;
            if (!audioMissing.current || !src || eng !== 'exo') return;
            console.log(`[BuriTV] Sin audio en ExoPlayer (${src.url}) → VLC`);
            setEngineOverride({ url: src.url, engine: 'vlc' });
        }, 1500);
    }, []);

    // ── Algo falló: decidir el siguiente paso ───────────────────────────
    const fail = useCallback(
        (reason, code) => {
            const {
                current: ch,
                source: src,
                sourceIndex: idx,
                selectSource: pick,
                paused: p,
                engine: eng,
            } = live.current;
            if (!ch || !src || p) return;
            if (retryTimer.current) return; // ya hay una recuperación en marcha
            if (code === BEHIND_LIVE_WINDOW) {
                // El player nativo ya volvió al vivo por su cuenta
                lastProgressAt.current = Date.now();
                return;
            }

            const count = ch.sources.length;
            const deadSource = DEAD_SOURCE_CODES.has(code);
            live.current.onSourceResult?.(src.url, false);
            console.log(
                `[BuriTV] Fallo (${reason}${code ? ` ${code}` : ''}) en ${ch.name} · ` +
                    `opción ${idx + 1}/${count} · ${eng}`,
            );

            // ¿Se cae una y otra vez aunque alcance a reproducir? → inestable
            const now = Date.now();
            recentFails.current = recentFails.current.filter(t => now - t < FLAP_WINDOW_MS);
            recentFails.current.push(now);
            const flapping = recentFails.current.length >= FLAP_LIMIT;

            // Una señal que ya reproducía se cortó: dato para detectar internet lento
            // (no los errores de compatibilidad con ExoPlayer: no son de velocidad)
            if (
                playedThisSource.current &&
                reason !== 'timeout' &&
                !EXO_PREFER_VLC_CODES.has(code)
            ) {
                live.current.onStall?.();
            }

            // Ya reproducía y se cortó: puede ser falta de velocidad → el próximo
            // intento con un escalón menos de calidad (si la señal tiene varias)
            if (reason === 'stall' && playedThisSource.current && eng === 'exo') {
                setBitrateCaps(prev => {
                    const cur = prev[src.url];
                    const next = BITRATE_STEPS.find(b => !cur || b < cur);
                    return next ? { ...prev, [src.url]: next } : prev;
                });
            }

            // 0) ExoPlayer no se entiende con este servidor → VLC ya mismo
            //    (sin pasar por reintentos que solo repiten el mismo error)
            if (eng === 'exo' && EXO_PREFER_VLC_CODES.has(code)) {
                attempts.current = 0;
                setStatus('reconnecting');
                schedule(150, () => setEngineOverride({ url: src.url, engine: 'vlc' }));
                return;
            }

            // 1) Microcorte: misma opción, mismo motor
            let maxRetries = 1;
            if (flapping || reason === 'timeout') maxRetries = 0;
            else if (playedThisSource.current) maxRetries = RETRY_BACKOFF_MS.length;
            if (attempts.current < maxRetries) {
                const wait =
                    RETRY_BACKOFF_MS[Math.min(attempts.current, RETRY_BACKOFF_MS.length - 1)];
                attempts.current += 1;
                setStatus('reconnecting');
                schedule(wait, () => setPlayerKey(k => k + 1));
                return;
            }

            // 2) ExoPlayer falló sin que el servidor esté caído (formato, códec,
            //    servidor que corta los segmentos…) → misma opción con VLC
            // (si alcanza a reproducir, el servidor está vivo aunque dé error de red)
            if (eng === 'exo' && (!deadSource || flapping)) {
                attempts.current = 0;
                setStatus('reconnecting');
                schedule(300, () => setEngineOverride({ url: src.url, engine: 'vlc' }));
                return;
            }

            // 3) Otra opción del mismo canal: la más estable que falte probar
            tried.current.add(idx);
            const order = live.current.rankSources?.(ch) ?? [...ch.sources.keys()];
            const nextOption = order.find(i => !tried.current.has(i));
            if (nextOption != null) {
                attempts.current = 0;
                setStatus('reconnecting');
                schedule(300, () => pick(nextOption));
                return;
            }

            // 4) Ninguna opción responde: avisar y seguir intentando solo
            setStatus('failed');
            schedule(FAILED_RETRY_MS, () => {
                attempts.current = 0;
                tried.current = new Set();
                setEngineOverride(null);
                setStatus('reconnecting');
                // Volver a empezar por la que mejor historial tiene
                const best = (live.current.rankSources?.(ch) ?? [])[0] ?? (idx + 1) % count;
                if (best !== idx) pick(best);
                else setPlayerKey(k => k + 1);
            });
        },
        [schedule],
    );

    const handleError = useCallback(e => fail('error', exoCode(e)), [fail]);
    const handleStopped = useCallback(() => fail('stopped'), [fail]);

    // ── Watchdog: cortes y opciones que nunca arrancan ──────────────────
    useEffect(() => {
        const iv = setInterval(() => {
            const { current: ch, source: src, paused: p } = live.current;
            if (!ch || !src || p || retryTimer.current) return;
            const st = statusRef.current;
            if (st === 'failed') return;
            // Los embeds web no informan avance: solo se vigila que carguen
            if (st === 'playing' && src.type === 'web') return;

            if (exoPlaying.current) lastProgressAt.current = Date.now();
            const elapsed = Date.now() - lastProgressAt.current;
            const slow = live.current.slowMode;
            const limit =
                st === 'playing'
                    ? slow
                        ? STALL_MS_SLOW
                        : STALL_MS
                    : slow
                    ? START_TIMEOUT_MS_SLOW
                    : START_TIMEOUT_MS;
            if (elapsed > limit) fail(st === 'playing' ? 'stall' : 'timeout');
        }, WATCHDOG_MS);
        return () => clearInterval(iv);
    }, [fail]);

    // ── Reintento manual / reinicio tras volver del background ──────────
    const retry = useCallback(() => {
        clearRetry();
        attempts.current = 0;
        tried.current = new Set();
        setStatus('loading');
        setPlayerKey(k => k + 1);
    }, []);

    // El usuario eligió otra opción a mano: empezar el ciclo desde cero
    const resetCycle = useCallback(() => {
        clearRetry();
        attempts.current = 0;
        tried.current = new Set();
        setEngineOverride(null);
        setStatus('loading');
    }, []);

    useEffect(() => clearRetry, []);

    return {
        status,
        engine,
        playerKey,
        maxBitRate,
        recoveryMuted,
        handleProgress,
        handlePlaying: markPlaying,
        handlePlaybackState,
        handleAudioTracks,
        handleError,
        handleStopped,
        retry,
        resetCycle,
    };
}
