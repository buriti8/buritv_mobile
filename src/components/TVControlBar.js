import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, findNodeHandle } from 'react-native';
import { styles } from '../styles/styles';
import ControlButton from './ControlButton';

/**
 * Controles del reproductor en TV, sobre el video:
 *
 *   ┌───────────────────────────────────────────┐
 *   │                                           │
 *   │            ⏮      ⏯      ⏭               │  ← en el centro del video
 *   │                                           │
 *   │  Opción [1][2][3][4]          🔊  ★  ⛶   │  ← abajo
 *   └───────────────────────────────────────────┘
 *
 * Desde Play: ↓ baja a las opciones y ↑ vuelve. La fila de abajo se recorre
 * de corrido: → en la última opción sigue a sonido / favorito / pantalla
 * completa, y ← en la primera vuelve a la lista. OK elige la opción.
 */
export default function TVControlBar({
    preferPlay,
    tvUiVisible,
    insets,
    ctrlFocused,
    setCtrlFocused,
    registerPlayBtn,
    registerTheaterBtn,
    paused,
    muted,
    channel,
    sourceIndex,
    status,
    selectSource,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    theater,
    toggleTheater,
    favorite,
    toggleFavorite,
    onMulti,
}) {
    const bind = id => ({
        focused: ctrlFocused === id,
        onFocus: () => setCtrlFocused(id),
        onBlur: () => setCtrlFocused(c => (c === id ? null : c)),
    });

    const sources = channel?.sources ?? [];

    // ↓ desde Play cae en la opción que está sonando, no en la más cercana
    const currentSeg = useRef(null);
    const [currentSegId, setCurrentSegId] = useState(null);
    useEffect(() => {
        const t = setTimeout(() => setCurrentSegId(findNodeHandle(currentSeg.current)), 200);
        return () => clearTimeout(t);
    }, [channel?.id, sourceIndex, sources.length]);

    return (
        <View
            style={[styles.tvControls, { opacity: tvUiVisible ? 1 : 0 }]}
            pointerEvents="box-none"
        >
            <View style={styles.tvTransport} pointerEvents="box-none">
                <ControlButton
                    icon="backward-step"
                    size={20}
                    variant="transport"
                    onPress={prevChannel}
                    {...bind('prev')}
                />
                <ControlButton
                    ref={registerPlayBtn}
                    icon={paused ? 'play' : 'pause'}
                    size={26}
                    variant="play"
                    hasTVPreferredFocus={preferPlay}
                    nextFocusDown={sources.length > 1 ? currentSegId : undefined}
                    onPress={togglePause}
                    {...bind('play')}
                />
                <ControlButton
                    icon="forward-step"
                    size={20}
                    variant="transport"
                    onPress={nextChannel}
                    {...bind('next')}
                />
            </View>

            <View
                style={[
                    styles.tvBottomRow,
                    {
                        paddingBottom: 26 + insets.bottom,
                        paddingRight: 32 + insets.right,
                    },
                ]}
                pointerEvents="box-none"
            >
                {sources.length > 1 ? (
                    <View style={styles.tvOptGroup}>
                        <Text style={styles.tvOptLabel}>Opción</Text>
                        <View style={styles.tvOptSegments}>
                            {sources.map((s, i) => (
                                <OptionSegment
                                    key={s.url}
                                    ref={i === sourceIndex ? currentSeg : undefined}
                                    number={i + 1}
                                    current={i === sourceIndex}
                                    status={status}
                                    onPress={() => selectSource(i)}
                                    {...bind(`opt-${i}`)}
                                />
                            ))}
                        </View>
                    </View>
                ) : (
                    <View />
                )}

                <View style={styles.tvUtilRow}>
                    <ControlButton
                        icon={muted ? 'volume-xmark' : 'volume-high'}
                        size={20}
                        onPress={toggleMute}
                        {...bind('mute')}
                    />
                    <ControlButton
                        icon="star"
                        iconStyle={favorite ? 'solid' : 'regular'}
                        accent={favorite ? 'favorite' : undefined}
                        size={20}
                        onPress={toggleFavorite}
                        {...bind('fav')}
                    />
                    {onMulti && (
                        <ControlButton
                            icon="table-cells-large"
                            size={20}
                            onPress={onMulti}
                            {...bind('multi')}
                        />
                    )}
                    <ControlButton
                        ref={registerTheaterBtn}
                        icon={theater ? 'compress' : 'expand'}
                        size={20}
                        onPress={toggleTheater}
                        {...bind('theater')}
                    />
                </View>
            </View>
        </View>
    );
}

/**
 * Un segmento numerado de "Opción". La que suena va en verde (con un punto
 * que dice si tiene señal); la enfocada en blanco tiza.
 */
const OptionSegment = React.forwardRef(function OptionSegment(
    { number, current, status, focused, onPress, onFocus, onBlur },
    ref,
) {
    const signal = status === 'playing' ? 'ok' : status === 'failed' ? 'bad' : 'wait';
    return (
        <Pressable
            ref={ref}
            focusable
            onPress={onPress}
            onFocus={onFocus}
            onBlur={onBlur}
            accessibilityLabel={`Opción ${number}`}
            style={[styles.tvSeg, current && styles.tvSegCurrent, focused && styles.tvSegFocused]}
        >
            <Text
                style={[
                    styles.tvSegText,
                    current && styles.tvSegTextCurrent,
                    focused && styles.tvSegTextFocused,
                ]}
            >
                {number}
            </Text>
            {current && (
                <View
                    style={[
                        styles.tvSegSignal,
                        signal === 'ok' && styles.signalOk,
                        signal === 'bad' && styles.signalBad,
                    ]}
                />
            )}
        </Pressable>
    );
});
