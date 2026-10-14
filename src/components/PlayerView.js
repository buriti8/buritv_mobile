import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import Video from 'react-native-video';
import { VLCPlayer } from 'react-native-vlc-media-player';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import WebPlayerView from './WebPlayerView';

// Buffer pensado para TV en vivo en equipos modestos: arranca rápido
// (2.5s), aguanta microcortes, y no acumula más de 30s (en vivo no sirve
// más y en un TV Box de 1 GB es memoria que se pierde). Sin buffer hacia
// atrás: en vivo no se retrocede.
const EXO_BUFFER = {
    minBufferMs: 10000,
    maxBufferMs: 30000,
    bufferForPlaybackMs: 2500,
    bufferForPlaybackAfterRebufferMs: 5000,
    backBufferDurationMs: 0,
    // Con poca memoria libre deja de llenar el buffer en vez de que el
    // sistema mate la app
    maxHeapAllocationPercent: 0.4,
    minBufferMemoryReservePercent: 0.2,
};
// Modo "internet lento": más reserva antes de arrancar y tras un corte, y
// reproducir unos segundos más atrás del vivo (más margen para descargar).
// El límite real lo pone la señal: si publica pocos segundos de video en
// vivo, no se puede guardar más que eso.
const EXO_BUFFER_SLOW = {
    ...EXO_BUFFER,
    minBufferMs: 20000,
    maxBufferMs: 50000,
    bufferForPlaybackMs: 5000,
    bufferForPlaybackAfterRebufferMs: 10000,
    live: { targetOffsetMs: 20000, minOffsetMs: 8000, maxOffsetMs: 40000 },
};
// VLC: caché de red más grande en modo lento (se agrega al final: manda)
const VLC_SLOW_OPTS = ['--network-caching=8000', '--live-caching=8000'];
// Al cambiar de canal u opción se espera este tiempo antes de montar el player
// nuevo: si se pasa rápido por varios, solo se abre el último (crear y cerrar
// un player por cada toque congela la app y a veces deja VLC sin audio).
const SWITCH_SETTLE_MS = 350;
// Sin el "LIVE" propio de react-native-video: la app ya muestra el suyo
const EXO_CONTROLS_STYLES = { hideLiveBadge: true };

/**
 * Reproduce la opción actual con el motor que decidió useStreamRecovery:
 *  - 'exo' → ExoPlayer (react-native-video), decodificación por hardware
 *  - 'vlc' → VLC, respaldo para formatos que ExoPlayer no soporta
 *  - 'web' → WebView para embeds
 */
export default function PlayerView({
    channel,
    source,
    sourceIndex,
    engine,
    playerKey,
    paused,
    muted,
    background,
    vlcGlobalOpts,
    slowMode,
    maxBitRate,
    onBandwidth,
    status,
    quietReconnect,
    compact,
    onProgress,
    onPlaying,
    onPlaybackState,
    onAudioTracks,
    onError,
    onStopped,
    onRetry,
}) {
    // Lo que realmente está montado: sigue al pedido, pero un cambio de
    // canal/opción espera a que se deje de cambiar. Reintentos y cambios de
    // motor de la misma señal son inmediatos.
    const [shown, setShown] = useState({ source, engine, playerKey });
    useEffect(() => {
        if (!source) return;
        const next = { source, engine, playerKey };
        if (shown.source?.url === source.url) {
            if (shown.engine !== engine || shown.playerKey !== playerKey) setShown(next);
            return;
        }
        const t = setTimeout(() => setShown(next), SWITCH_SETTLE_MS);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source?.url, engine, playerKey]);

    if (!source) return null;
    // Mientras el player viejo sigue montado, sus eventos no cuentan para la señal nueva
    const settled =
        shown.source?.url === source.url &&
        shown.engine === engine &&
        shown.playerKey === playerKey;
    const guard = fn => (fn ? (...args) => (settled ? fn(...args) : undefined) : undefined);
    onProgress = guard(onProgress);
    onPlaying = guard(onPlaying);
    onPlaybackState = guard(onPlaybackState);
    onAudioTracks = guard(onAudioTracks);
    onError = guard(onError);
    onStopped = guard(onStopped);
    // (al cambiar el modo lento, App llama a retry(): sube playerKey y el
    // player se rearma con el buffer/caché nuevos)
    const key = `${shown.engine}-${shown.source.url}-${shown.playerKey}`;
    const vlcOpts = shown.source.vlcOpts
        ? shown.source.vlcOpts.map(o => `--${o}`)
        : vlcGlobalOpts;

    return (
        <>
            {shown.engine === 'web' && (
                <WebPlayerView
                    key={key}
                    url={shown.source.url}
                    muted={muted}
                    onLoaded={onPlaying}
                    onError={onError}
                />
            )}

            {shown.engine === 'exo' && (
                <Video
                    key={key}
                    style={styles.player}
                    source={{
                        uri: shown.source.url,
                        type: /\.m3u8(\?|$)/i.test(shown.source.url) ? 'm3u8' : undefined,
                        minLoadRetryCount: 3,
                        bufferConfig: slowMode ? EXO_BUFFER_SLOW : EXO_BUFFER,
                    }}
                    resizeMode="contain"
                    maxBitRate={maxBitRate}
                    // Velocidad medida al descargar: alimenta la detección
                    // automática de internet lento (useSlowMode)
                    reportBandwidth={!!onBandwidth}
                    onBandwidthUpdate={onBandwidth}
                    paused={paused}
                    muted={muted}
                    playInBackground={background}
                    focusable={false}
                    shutterColor="transparent"
                    controlsStyles={EXO_CONTROLS_STYLES}
                    bufferingStrategy="DependingOnMemory"
                    progressUpdateInterval={1000}
                    onProgress={onProgress}
                    onReadyForDisplay={onPlaying}
                    onPlaybackStateChanged={onPlaybackState}
                    onAudioTracks={onAudioTracks}
                    onError={onError}
                    onEnd={onStopped}
                />
            )}

            {shown.engine === 'vlc' && (
                <VLCPlayer
                    key={key}
                    style={styles.player}
                    source={{ uri: shown.source.url }}
                    paused={paused}
                    muted={muted}
                    playInBackground={background}
                    onProgress={onProgress}
                    onError={onError}
                    onStopped={onStopped}
                    onEnd={onStopped}
                    initOptions={slowMode ? [...vlcOpts, ...VLC_SLOW_OPTS] : vlcOpts}
                />
            )}

            {/* Reconexión breve de la misma opción: solo un indicador discreto,
                sin tapar el video ni avisar (ver useDisplayStatus) */}
            {quietReconnect && !paused && (
                <View
                    style={[styles.quietSpinner, isTV && styles.quietSpinnerTV]}
                    pointerEvents="none"
                >
                    <ActivityIndicator size="small" color={C.text} />
                </View>
            )}

            {status !== 'playing' && !paused && (
                <StatusOverlay
                    status={status}
                    channel={channel}
                    sourceIndex={sourceIndex}
                    compact={compact}
                    onRetry={onRetry}
                />
            )}
        </>
    );
}

function StatusOverlay({ status, channel, sourceIndex, compact, onRetry }) {
    const count = channel?.sources.length ?? 0;
    const optionText = count > 1 ? `Opción ${sourceIndex + 1} de ${count}` : null;

    if (compact) {
        // PiP: solo un indicador mínimo
        return (
            <View style={styles.statusOverlay} pointerEvents="none">
                {status === 'failed' ? (
                    <FontAwesome6
                        name="satellite-dish"
                        size={18}
                        color={C.textDim}
                        iconStyle="solid"
                    />
                ) : (
                    <ActivityIndicator color={C.accentSoft} />
                )}
            </View>
        );
    }

    if (status === 'failed') {
        return (
            <View style={[styles.statusOverlay, styles.statusOverlayDark]} pointerEvents="box-none">
                <View style={styles.statusIcon}>
                    <FontAwesome6
                        name="satellite-dish"
                        size={isTV ? 30 : 22}
                        color={C.warning}
                        iconStyle="solid"
                    />
                </View>
                <Text style={[styles.statusTitle, isTV && styles.statusTitleTV]}>
                    Señal no disponible
                </Text>
                <Text style={[styles.statusSub, isTV && styles.statusSubTV]}>
                    {count > 1
                        ? 'Ninguna opción responde. Seguimos intentando solos.'
                        : 'Seguimos intentando automáticamente.'}
                </Text>
                {!isTV && (
                    <Pressable onPress={onRetry} style={styles.retryBtn} hitSlop={8}>
                        <FontAwesome6
                            name="rotate-right"
                            size={14}
                            color={C.onContainer}
                            iconStyle="solid"
                        />
                        <Text style={styles.retryText}>Reintentar ahora</Text>
                    </Pressable>
                )}
            </View>
        );
    }

    return (
        <View style={styles.statusOverlay} pointerEvents="none">
            <ActivityIndicator size={isTV ? 'large' : 'small'} color={C.accentSoft} />
            <Text style={[styles.statusTitle, isTV && styles.statusTitleTV]}>
                {status === 'reconnecting' ? 'Reconectando…' : 'Conectando…'}
            </Text>
            {optionText && (
                <View style={styles.statusChip}>
                    <Text style={styles.statusChipText}>{optionText}</Text>
                </View>
            )}
        </View>
    );
}
