import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV, MULTI_TILE_MAX_BITRATE } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import useStreamRecovery from '../hooks/useStreamRecovery';
import useDisplayStatus from '../hooks/useDisplayStatus';
import PlayerView from './PlayerView';

/**
 * Un canal dentro de "varios canales": su propio player y su propia
 * recuperación (si se cae, se reconecta solo sin tocar a los demás). Solo el
 * recuadro con el sonido suena y va a calidad completa.
 *
 *  Celular   toque → escuchar este canal · botón de arriba → quitarlo
 *  TV        el foco pasa el sonido · OK → siguiente opción · mantener OK → quitarlo
 */
const MultiTile = React.memo(function MultiTile({
    tile,
    number,
    width,
    height,
    listening,
    muted,
    paused,
    vlcGlobalOpts,
    slowMode,
    rankSources,
    getEnginePref,
    rememberSource,
    recordSourceResult,
    reportStall,
    reportBandwidth,
    onListen,
    onRemove,
}) {
    const { channel } = tile;
    const count = channel.sources.length;
    const [sourceIndex, setSourceIndex] = useState(tile.src);
    const source = channel.sources[sourceIndex] || channel.sources[0] || null;

    const recovery = useStreamRecovery({
        current: channel,
        source,
        sourceIndex,
        selectSource: setSourceIndex,
        paused,
        getEnginePref,
        onSourceWorking: rememberSource,
        rankSources,
        onSourceResult: recordSourceResult,
        onStall: reportStall,
        slowMode,
    });
    const { displayStatus, quiet } = useDisplayStatus(
        recovery.status,
        `${channel.id}|${sourceIndex}`,
    );

    // Siguiente opción del canal (da la vuelta)
    const { resetCycle } = recovery;
    const nextOption = useCallback(() => {
        if (count < 2) return;
        resetCycle();
        setSourceIndex(i => (i + 1) % count);
    }, [count, resetCycle]);

    const cap = recovery.maxBitRate;
    const maxBitRate = listening
        ? cap
        : cap
        ? Math.min(cap, MULTI_TILE_MAX_BITRATE)
        : MULTI_TILE_MAX_BITRATE;

    const handleListen = useCallback(() => onListen(tile.uid), [onListen, tile.uid]);
    const handleRemove = useCallback(() => onRemove(tile.uid), [onRemove, tile.uid]);

    return (
        <Pressable
            focusable={isTV}
            onPress={isTV ? nextOption : handleListen}
            onLongPress={isTV ? handleRemove : undefined}
            delayLongPress={600}
            onFocus={isTV ? handleListen : undefined}
            accessibilityLabel={channel.name}
            style={[styles.multiTile, { width, height }, listening && styles.multiTileOn]}
        >
            <PlayerView
                channel={channel}
                source={source}
                sourceIndex={sourceIndex}
                engine={recovery.engine}
                playerKey={recovery.playerKey}
                paused={paused}
                muted={muted || !listening || recovery.recoveryMuted}
                background={false}
                vlcGlobalOpts={vlcGlobalOpts}
                slowMode={slowMode}
                maxBitRate={maxBitRate}
                onBandwidth={listening ? reportBandwidth : undefined}
                status={displayStatus}
                quietReconnect={quiet}
                compact
                onProgress={recovery.handleProgress}
                onPlaying={recovery.handlePlaying}
                onPlaybackState={recovery.handlePlaybackState}
                onAudioTracks={recovery.handleAudioTracks}
                onError={recovery.handleError}
                onStopped={recovery.handleStopped}
                onRetry={recovery.retry}
            />

            <View style={[styles.multiBar, isTV && styles.multiBarTV]} pointerEvents="box-none">
                <View style={[styles.multiNum, isTV && styles.multiNumTV]}>
                    <Text style={[styles.multiNumText, isTV && styles.multiNumTextTV]}>
                        {number}
                    </Text>
                </View>
                <Text style={[styles.multiName, isTV && styles.multiNameTV]} numberOfLines={1}>
                    {channel.name}
                </Text>
                {count > 1 && (
                    <Pressable
                        onPress={nextOption}
                        focusable={false}
                        hitSlop={6}
                        accessibilityLabel="Cambiar de opción"
                        style={[styles.multiOpt, isTV && styles.multiOptTV]}
                    >
                        <Text style={[styles.multiOptText, isTV && styles.multiOptTextTV]}>
                            Opción {sourceIndex + 1}
                        </Text>
                    </Pressable>
                )}
                <FontAwesome6
                    name={listening && !muted ? 'volume-high' : 'volume-xmark'}
                    size={isTV ? 18 : 13}
                    color={listening ? C.accentSoft : C.textMute}
                    iconStyle="solid"
                />
            </View>

            {!isTV && (
                <Pressable
                    onPress={handleRemove}
                    hitSlop={8}
                    accessibilityLabel="Quitar de la vista"
                    style={styles.multiRemove}
                >
                    <FontAwesome6 name="xmark" size={13} color={C.chalk} iconStyle="solid" />
                </Pressable>
            )}
        </Pressable>
    );
});

export default MultiTile;
