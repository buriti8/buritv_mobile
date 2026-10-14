import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import ControlButton from './ControlButton';

/**
 * Celular: fila bajo el video (en lugar de "lo que suena") con cuántos
 * canales hay y cómo salir.
 */
export function MultiMobileSection({ count, max, fullscreen, onToggleFullscreen, onAdd, onExit }) {
    return (
        <View style={styles.multiSection}>
            <View style={styles.multiIcon}>
                <FontAwesome6 name="table-cells-large" size={18} color={C.white} iconStyle="solid" />
            </View>
            <View style={styles.itemBody}>
                <Text style={styles.multiTitle} numberOfLines={1}>
                    Varios canales · {count} de {max}
                </Text>
                <Text style={styles.multiSub} numberOfLines={1}>
                    Toca un canal para agregarlo; otra vez, para ver su siguiente opción
                </Text>
            </View>
            {count < max && (
                <Pressable
                    onPress={onAdd}
                    hitSlop={8}
                    style={styles.iconBtn}
                    accessibilityLabel="Agregar canal"
                >
                    <FontAwesome6 name="plus" size={16} color={C.chalk} iconStyle="solid" />
                </Pressable>
            )}
            <Pressable
                onPress={onToggleFullscreen}
                hitSlop={8}
                style={styles.iconBtn}
                accessibilityLabel={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
                <FontAwesome6
                    name={fullscreen ? 'compress' : 'expand'}
                    size={16}
                    color={C.chalk}
                    iconStyle="solid"
                />
            </Pressable>
            <Pressable onPress={onExit} hitSlop={8} style={styles.multiExitBtn}>
                <FontAwesome6 name="xmark" size={14} color={C.onContainer} iconStyle="solid" />
                <Text style={styles.multiExitText}>Salir</Text>
            </Pressable>
        </View>
    );
}

/** Celular en pantalla completa: la lista no se ve, así que salir va sobre el video. */
export function MultiFullscreenButtons({ onExitFullscreen, onExit }) {
    const insets = useSafeAreaInsets();
    return (
        <View
            style={[styles.multiFsBtns, { left: 12 + insets.left, top: 12 + insets.top }]}
            pointerEvents="box-none"
        >
            <Pressable
                onPress={onExitFullscreen}
                hitSlop={8}
                style={styles.iconBtn}
                accessibilityLabel="Salir de pantalla completa"
            >
                <FontAwesome6 name="compress" size={16} color={C.chalk} iconStyle="solid" />
            </Pressable>
            <Pressable
                onPress={onExit}
                hitSlop={8}
                style={styles.iconBtn}
                accessibilityLabel="Salir de varios canales"
            >
                <FontAwesome6 name="xmark" size={16} color={C.chalk} iconStyle="solid" />
            </Pressable>
        </View>
    );
}

/** TV: barra bajo el video con los botones y cómo se maneja con el control remoto. */
export function MultiTVBar({
    count,
    max,
    muted,
    theater,
    ctrlFocused,
    setCtrlFocused,
    registerTheaterBtn,
    toggleMute,
    toggleTheater,
    onAdd,
    onExit,
}) {
    const bind = id => ({
        focused: ctrlFocused === id,
        onFocus: () => setCtrlFocused(id),
        onBlur: () => setCtrlFocused(c => (c === id ? null : c)),
    });
    return (
        <View style={styles.multiTvBar}>
            <View style={styles.multiTvButtons}>
                {count < max && (
                    <ControlButton
                        icon="plus"
                        size={20}
                        label="Agregar canal"
                        onPress={onAdd}
                        {...bind('multi-add')}
                    />
                )}
                <ControlButton
                    icon="xmark"
                    size={20}
                    label="Salir de varios"
                    onPress={onExit}
                    {...bind('multi-exit')}
                />
                <ControlButton
                    icon={muted ? 'volume-xmark' : 'volume-high'}
                    size={20}
                    onPress={toggleMute}
                    {...bind('mute')}
                />
                <ControlButton
                    ref={registerTheaterBtn}
                    icon={theater ? 'compress' : 'expand'}
                    size={20}
                    onPress={toggleTheater}
                    {...bind('theater')}
                />
            </View>
            <Text style={styles.multiHint} numberOfLines={2}>
                {count} de {max} · El foco pasa el sonido · OK cambia de opción · Mantener OK quita
                el canal · Un mismo canal se puede agregar varias veces
            </Text>
        </View>
    );
}
