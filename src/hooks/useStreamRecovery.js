import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import {
    STALL_THRESHOLD,
    CHECK_INTERVAL,
    MAX_SOFT_RETRIES,
} from '../constants/config';

/**
 * Recuperación multicapa del stream:
 *
 *  Capa 1: Buffer VLC (network-caching del M3U)
 *  Capa 2: Soft recovery (pause/unpause)
 *  Capa 3: Hard recovery (remount player)
 *  Capa 4: AppState — al volver de background, refresh automático
 */
export default function useStreamRecovery({
    current,
    playerKey,
    setPlayerKey,
    paused,
    setPaused,
    setMuted,
    channelError,
}) {
    const lastProgressTime = useRef(null);
    const lastProgressAt = useRef(0);
    const stallCheckRef = useRef(null);
    const playbackStarted = useRef(false);
    const softRetries = useRef(0);
    const appStateRef = useRef(AppState.currentState);

    // ── onProgress handler ──────────────────────────────────────────────
    const handleProgress = useCallback((e) => {
        const t = e?.currentTime ?? e?.time;
        if (t != null && t !== lastProgressTime.current) {
            lastProgressTime.current = t;
            lastProgressAt.current = Date.now();
            if (!playbackStarted.current) {
                playbackStarted.current = true;
                softRetries.current = 0;
            }
        }
    }, []);

    // ── Reset al cambiar canal o hacer reload ───────────────────────────
    useEffect(() => {
        lastProgressTime.current = null;
        lastProgressAt.current = Date.now();
        playbackStarted.current = false;
        softRetries.current = 0;
    }, [current, playerKey]);

    // ── Fix audio: toggle muted en reload ───────────────────────────────
    useEffect(() => {
        if (playerKey === 0) return;
        setMuted(true);
        const t = setTimeout(() => setMuted(false), 150);
        return () => clearTimeout(t);
    }, [playerKey, setMuted]);

    // ── Detección de stall + recuperación escalonada ────────────────────
    useEffect(() => {
        stallCheckRef.current = setInterval(() => {
            if (paused || channelError || !current) return;
            if (!playbackStarted.current) return;
            const elapsed = Date.now() - lastProgressAt.current;
            if (elapsed < STALL_THRESHOLD) return;

            if (softRetries.current < MAX_SOFT_RETRIES) {
                softRetries.current += 1;
                lastProgressAt.current = Date.now();
                console.log(`[BuriTV] Soft recovery #${softRetries.current}…`);
                setPaused(true);
                setTimeout(() => setPaused(false), 300);
            } else {
                console.log('[BuriTV] Hard recovery — remounting player…');
                lastProgressAt.current = Date.now();
                playbackStarted.current = false;
                softRetries.current = 0;
                setPlayerKey((k) => k + 1);
            }
        }, CHECK_INTERVAL);

        return () => clearInterval(stallCheckRef.current);
    }, [paused, channelError, current, setPaused, setPlayerKey]);

    // ── Capa 4: al volver de background → refresh ───────────────────────
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextState === 'active'
            ) {
                if (current && !channelError) {
                    console.log('[BuriTV] App resumed — refreshing stream…');
                    playbackStarted.current = false;
                    softRetries.current = 0;
                    setPlayerKey((k) => k + 1);
                }
            }
            appStateRef.current = nextState;
        });
        return () => sub.remove();
    }, [current, channelError, setPlayerKey]);

    // ── Auto-restart si VLC se detiene ──────────────────────────────────
    const handleStopped = useCallback(() => {
        if (!paused && current && !channelError) {
            console.log('[BuriTV] VLC stopped — restarting…');
            setPlayerKey((k) => k + 1);
        }
    }, [paused, current, channelError, setPlayerKey]);

    return {
        handleProgress,
        handleStopped,
    };
}
