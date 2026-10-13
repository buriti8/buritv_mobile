import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { AppState, NativeModules, NativeEventEmitter, View } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import GoogleCast from 'react-native-google-cast';
import { HotUpdater } from '@hot-updater/react-native';

import { isTV, HOT_UPDATER_URL, RESUME_LIVE_MS } from './src/constants/config';
import checkForUpdates from './src/utils/checkForUpdates';
import useChannels from './src/hooks/useChannels';
import useStreamRecovery from './src/hooks/useStreamRecovery';
import useTVControls from './src/hooks/useTVControls';
import useMobileControls from './src/hooks/useMobileControls';
import useZapping from './src/hooks/useZapping';
import useFavorites from './src/hooks/useFavorites';
import useSlowMode from './src/hooks/useSlowMode';
import useDisplayStatus from './src/hooks/useDisplayStatus';
import LoadingScreen from './src/screens/LoadingScreen';
import TVLayout from './src/screens/TVLayout';
import MobileLayout from './src/screens/MobileLayout';
import ErrorBoundary from './src/components/ErrorBoundary';
import Toast from './src/components/Toast';
import { styles } from './src/styles/styles';

const { BuriPip } = NativeModules;

function IPTVPlayer() {
    const [paused, setPaused] = useState(false);
    const [userMuted, setUserMuted] = useState(false);
    const [theater, setTheater] = useState(false);
    const [inPip, setInPip] = useState(false);

    // ── Hooks ───────────────────────────────────────────────────────────────

    const {
        channels,
        vlcGlobalOpts,
        current,
        currentIndex,
        source,
        sourceIndex,
        loading,
        loadError,
        retryLoad,
        selectChannel,
        selectSource,
        chooseSource,
        rememberSource,
        rankSources,
        recordSourceResult,
        getEnginePref,
        loadM3U,
    } = useChannels();
    const { favorites, toggleFavorite } = useFavorites();
    // Modo internet lento: automático, el usuario no lo ve ni lo maneja
    const {
        slowMode,
        activations: slowActivations,
        ready: slowModeReady,
        reportStall,
        reportBandwidth,
    } = useSlowMode();

    const recovery = useStreamRecovery({
        current,
        source,
        sourceIndex,
        selectSource,
        paused,
        getEnginePref,
        onSourceWorking: rememberSource,
        rankSources,
        onSourceResult: recordSourceResult,
        onStall: reportStall,
        slowMode,
    });
    const { status, retry, resetCycle } = recovery;
    // Lo que ve el usuario: las reconexiones breves de la misma opción no se muestran
    const { displayStatus, quiet: quietReconnect } = useDisplayStatus(
        status,
        current ? `${current.id}|${sourceIndex}` : null,
    );

    // Buffer y caché se fijan al crear el player: cuando la app detecta la red
    // lenta, reconecta la señal con la configuración nueva (la señal ya se
    // estaba cortando, así que este reintento no se nota de más)
    useEffect(() => {
        if (slowActivations > 0) retry();
    }, [slowActivations, retry]);

    const mobileControls = useMobileControls({ loading });
    const { showControls } = mobileControls;

    const muted = userMuted || recovery.recoveryMuted;

    // ── Lifecycle ───────────────────────────────────────────────────────────

    // Los canales no esperan a la consulta de actualizaciones
    useEffect(() => {
        loadM3U();
        checkForUpdates();
    }, [loadM3U]);

    // Al volver del background, vuelve a verificar si hay actualización
    const appStateUpdates = useRef(AppState.currentState);
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (
                appStateUpdates.current.match(/inactive|background/) &&
                nextState === 'active'
            ) {
                checkForUpdates();
            }
            appStateUpdates.current = nextState;
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        paused ? KeepAwake.deactivate() : KeepAwake.activate();
    }, [paused]);

    // ── Segundo plano / Picture-in-Picture ──────────────────────────────────
    //  - Móvil: al salir de la app con algo sonando, sigue en ventana flotante.
    //  - Si la app deja de verse del todo (se cierra el PiP, o en TV se sale
    //    al inicio) se pausa. Al volver: si fue un momento (RESUME_LIVE_MS)
    //    se retoma donde iba, sin reconectar; si fue más, se reconecta para
    //    quedar en el vivo y no varios minutos atrás.

    const pausedRef = useRef(paused);
    pausedRef.current = paused;
    const pausedByStop = useRef(false);
    const stoppedAt = useRef(0);

    useEffect(() => {
        if (!BuriPip) return;
        const emitter = new NativeEventEmitter(BuriPip);
        const subs = [
            emitter.addListener('buriPipChange', (e) => setInPip(!!e?.inPip)),
            // Botones de la ventana flotante
            emitter.addListener('buriPipAction', (e) => {
                if (e?.action === 'playPause') setPaused((p) => !p);
                else if (e?.action === 'mute') setUserMuted((m) => !m);
            }),
            emitter.addListener('buriLifecycle', (e) => {
                if (e?.state === 'stop') {
                    if (!pausedRef.current) {
                        pausedByStop.current = true;
                        stoppedAt.current = Date.now();
                        setPaused(true);
                    }
                } else if (e?.state === 'start' && pausedByStop.current) {
                    pausedByStop.current = false;
                    setPaused(false);
                    if (Date.now() - stoppedAt.current > RESUME_LIVE_MS) retry();
                }
            }),
        ];
        return () => subs.forEach((s) => s.remove());
    }, [retry]);

    useEffect(() => {
        if (isTV) return;
        const autoEnter = !!current && !paused && status !== 'failed';
        if (BuriPip?.setPlaybackState) BuriPip.setPlaybackState(autoEnter, paused, userMuted);
        else BuriPip?.setAutoEnter(autoEnter);
    }, [current, paused, status, userMuted]);

    // ── Actions ─────────────────────────────────────────────────────────────

    const handleSelectChannel = useCallback(
        (ch) => {
            if (!ch) return;
            selectChannel(ch);
            setPaused(false);
            if (!isTV) showControls();
        },
        [selectChannel, showControls],
    );

    // Navegación circular entre canales
    const handlePrevChannel = useCallback(() => {
        if (!channels.length) return;
        handleSelectChannel(channels[(currentIndex - 1 + channels.length) % channels.length]);
    }, [currentIndex, channels, handleSelectChannel]);

    const handleNextChannel = useCallback(() => {
        if (!channels.length) return;
        handleSelectChannel(channels[(currentIndex + 1) % channels.length]);
    }, [currentIndex, channels, handleSelectChannel]);

    // Elegir opción a mano (la misma = reintentar)
    const handleSelectSource = useCallback(
        (i) => {
            setPaused(false);
            if (i === sourceIndex) {
                retry();
            } else {
                resetCycle();
            }
            // Queda recordada para este canal (también al reintentar la misma)
            chooseSource(i);
            if (!isTV) showControls();
        },
        [sourceIndex, retry, resetCycle, chooseSource, showControls],
    );

    // ── TV: control remoto (CH+/CH−, números, ↑/↓ y ←/→ en pantalla completa) ──

    const zapping = useZapping({
        channels,
        currentIndex,
        sourceIndex,
        onSelectChannel: handleSelectChannel,
        onSelectSource: handleSelectSource,
    });

    const tvControls = useTVControls({
        theater,
        setTheater,
        setPaused,
        onZap: zapping.zapBy,
        onDigit: zapping.typeDigit,
        onOption: zapping.optionBy,
        onInfo: zapping.showCurrent,
    });

    const { zapBy } = zapping;
    const tvPrev = useCallback(() => zapBy(-1), [zapBy]);
    const tvNext = useCallback(() => zapBy(1), [zapBy]);

    const togglePause = useCallback(() => {
        setPaused((p) => !p);
        if (!isTV) showControls();
    }, [showControls]);

    const toggleMute = useCallback(() => {
        setUserMuted((m) => !m);
        if (!isTV) showControls();
    }, [showControls]);

    const toggleTheater = useCallback(() => setTheater((t) => !t), []);

    const handleRetry = useCallback(() => {
        setPaused(false);
        retry();
    }, [retry]);

    // ── Chromecast ──────────────────────────────────────────────────────────

    const sourceRef = useRef(null);
    sourceRef.current = source ? { ...source, name: current?.name } : null;

    const castSource = useCallback(async (session, src) => {
        if (!src || src.type === 'web') return; // los embeds web no se pueden castear
        await session.client.loadMedia({
            mediaInfo: {
                contentUrl: src.url,
                contentType: src.url.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp2t',
                streamType: 'live',
                metadata: { type: 'generic', title: src.name },
            },
        });
    }, []);

    // Al conectar un Chromecast (desde el diálogo o el CastButton), carga lo actual
    useEffect(() => {
        if (isTV) return;
        const sub = GoogleCast.getSessionManager().onSessionStarted((session) => {
            castSource(session, sourceRef.current).catch((e) => console.log('Error casting:', e));
        });
        return () => sub.remove();
    }, [castSource]);

    // Si ya hay sesión de cast activa, al cambiar de canal/opción se actualiza
    useEffect(() => {
        if (isTV || !source) return;
        (async () => {
            try {
                const session = await GoogleCast.getSessionManager().getCurrentCastSession();
                if (session) await castSource(session, sourceRef.current);
            } catch (error) {
                console.log('Error casting:', error);
            }
        })();
    }, [source, castSource]);

    // ── Render ──────────────────────────────────────────────────────────────

    const playerProps = useMemo(
        () => ({
            channel: current,
            source,
            sourceIndex,
            engine: recovery.engine,
            playerKey: recovery.playerKey,
            paused,
            muted,
            background: !isTV,
            vlcGlobalOpts,
            slowMode,
            maxBitRate: recovery.maxBitRate,
            onBandwidth: reportBandwidth,
            status: displayStatus,
            quietReconnect,
            onProgress: recovery.handleProgress,
            onPlaying: recovery.handlePlaying,
            onPlaybackState: recovery.handlePlaybackState,
            onError: recovery.handleError,
            onStopped: recovery.handleStopped,
            onRetry: handleRetry,
        }),
        [
            current,
            source,
            sourceIndex,
            recovery.engine,
            recovery.playerKey,
            paused,
            muted,
            vlcGlobalOpts,
            slowMode,
            recovery.maxBitRate,
            reportBandwidth,
            displayStatus,
            quietReconnect,
            recovery.handleProgress,
            recovery.handlePlaying,
            recovery.handlePlaybackState,
            recovery.handleError,
            recovery.handleStopped,
            handleRetry,
        ],
    );

    if (loading || !slowModeReady) return <LoadingScreen error={loadError} onRetry={retryLoad} />;

    const common = {
        channels,
        current,
        currentIndex,
        sourceIndex,
        status: displayStatus,
        paused,
        muted,
        playerProps,
        selectChannel: handleSelectChannel,
        selectSource: handleSelectSource,
        prevChannel: handlePrevChannel,
        nextChannel: handleNextChannel,
        togglePause,
        toggleMute,
        favorites,
        toggleFavorite,
    };

    if (isTV) {
        return (
            <TVLayout
                {...common}
                prevChannel={tvPrev}
                nextChannel={tvNext}
                osd={zapping.osd}
                tvPing={tvControls.tvPing}
                theater={theater}
                ctrlFocused={tvControls.ctrlFocused}
                setCtrlFocused={tvControls.setCtrlFocused}
                playNode={tvControls.playNode}
                registerPlayBtn={tvControls.registerPlayBtn}
                tvUiVisible={tvControls.tvUiVisible}
                hideTvUi={tvControls.hideTvUi}
                toggleTheater={toggleTheater}
            />
        );
    }

    return (
        <MobileLayout
            {...common}
            inPip={inPip}
            fullscreen={mobileControls.fullscreen}
            controlsVisible={mobileControls.controlsVisible}
            toggleFullscreen={mobileControls.toggleFullscreen}
            exitFullscreen={mobileControls.exitFullscreen}
            handleVideoPress={mobileControls.handleVideoPress}
        />
    );
}

function App() {
    return (
        <View style={styles.appRoot}>
            <ErrorBoundary>
                <IPTVPlayer />
            </ErrorBoundary>
            <Toast />
        </View>
    );
}

export default HotUpdater.wrap({
    baseURL: HOT_UPDATER_URL,
    updateStrategy: 'appVersion',
    updateMode: 'manual',
})(App);
