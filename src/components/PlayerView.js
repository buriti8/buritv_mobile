import React from 'react';
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
    onError,
    onStopped,
    onRetry,
}) {
    if (!source) return null;
    // (al cambiar el modo lento, App llama a retry(): sube playerKey y el
    // player se rearma con el buffer/caché nuevos)
    const key = `${engine}-${source.url}-${playerKey}`;
    const vlcOpts = source.vlcOpts ? source.vlcOpts.map(o => `--${o}`) : vlcGlobalOpts;

    return (
        <>
            {engine === 'web' && (
                <WebPlayerView
                    key={key}
                    url={source.url}
                    muted={muted}
                    onLoaded={onPlaying}
                    onError={onError}
                />
            )}

            {engine === 'exo' && (
                <Video
                    key={key}
                    style={styles.player}
                    source={{
                        uri: source.url,
                        type: /\.m3u8(\?|$)/i.test(source.url) ? 'm3u8' : undefined,
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
                    onError={onError}
                    onEnd={onStopped}
                />
            )}

            {engine === 'vlc' && (
                <VLCPlayer
                    key={key}
                    style={styles.player}
                    source={{ uri: source.url }}
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
