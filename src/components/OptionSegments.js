import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles/styles';

/**
 * Selector de opción para el celular: "Opción" + segmentos numerados.
 * La que suena va en verde con un punto que dice si tiene señal.
 *  overVideo: versión sobre el video (fondo translúcido)
 */
export default function OptionSegments({ count, current, status, onSelect, overVideo }) {
    const signal = status === 'playing' ? 'ok' : status === 'failed' ? 'bad' : 'wait';
    return (
        <View style={styles.segGroup}>
            <Text style={[styles.segLabel, overVideo && styles.segLabelOver]}>Opción</Text>
            <View style={[styles.segTrack, overVideo && styles.segTrackOver]}>
                {Array.from({ length: count }, (_, i) => {
                    const on = i === current;
                    return (
                        <Pressable
                            key={i}
                            onPress={() => onSelect(i)}
                            hitSlop={4}
                            accessibilityLabel={`Opción ${i + 1}`}
                            accessibilityState={{ selected: on }}
                            style={[styles.seg, on && styles.segOn]}
                        >
                            <Text style={[styles.segText, on && styles.segTextOn]}>{i + 1}</Text>
                            {on && (
                                <View
                                    style={[
                                        styles.segSignal,
                                        signal === 'ok' && styles.signalOk,
                                        signal === 'bad' && styles.signalBad,
                                    ]}
                                />
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
