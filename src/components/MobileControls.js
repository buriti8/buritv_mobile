import React from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { CastButton } from 'react-native-google-cast';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import ChannelPlate from './ChannelPlate';
import OptionSegments from './OptionSegments';

function IconBtn({ icon, size = 18, onPress, style, label }) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={12}
            style={[styles.iconBtn, style]}
            accessibilityLabel={label}
        >
            <FontAwesome6 name={icon} size={size} color={C.chalk} iconStyle="solid" />
        </Pressable>
    );
}

/**
 * Controles sobre el video en el celular (aparecen al tocar):
 *   arriba   la placa del canal (y volver, en pantalla completa) + Cast
 *   centro   canal anterior · reproducir/pausar · canal siguiente
 *   abajo    opciones del canal a la izquierda (solo en pantalla completa;
 *            en vertical están bajo el video), sonido y pantalla completa
 */
export default function MobileControls({
    visible,
    fullscreen,
    paused,
    muted,
    channel,
    channelNumber,
    live,
    sourceIndex,
    status,
    selectSource,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    toggleFullscreen,
    exitFullscreen,
}) {
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    const sidePad = fullscreen
        ? { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }
        : null;
    const count = channel?.sources.length ?? 0;

    return (
        <View style={styles.overlay} pointerEvents="box-none">
            <View
                style={[styles.topBar, fullscreen && styles.topBarFs, sidePad]}
                pointerEvents="box-none"
            >
                {fullscreen && (
                    <IconBtn
                        icon="arrow-left"
                        onPress={exitFullscreen}
                        label="Salir de pantalla completa"
                    />
                )}
                <View style={styles.spacerShrink}>
                    {channel && (
                        <ChannelPlate
                            size="mobile"
                            number={channelNumber > 0 ? channelNumber : null}
                            channel={channel}
                            live={live}
                        />
                    )}
                </View>
                <CastButton style={styles.castBtn} />
            </View>

            <View style={styles.centerControls} pointerEvents="box-none">
                <IconBtn
                    icon="backward-step"
                    size={20}
                    onPress={prevChannel}
                    style={styles.iconBtnLg}
                    label="Canal anterior"
                />
                <Pressable
                    onPress={togglePause}
                    hitSlop={12}
                    style={styles.playBtnMobile}
                    accessibilityLabel={paused ? 'Reproducir' : 'Pausar'}
                >
                    <FontAwesome6
                        name={paused ? 'play' : 'pause'}
                        size={22}
                        color={C.chalk}
                        iconStyle="solid"
                    />
                </Pressable>
                <IconBtn
                    icon="forward-step"
                    size={20}
                    onPress={nextChannel}
                    style={styles.iconBtnLg}
                    label="Canal siguiente"
                />
            </View>

            <View
                style={[
                    styles.bottomBar,
                    sidePad,
                    fullscreen && { paddingBottom: insets.bottom + 12 },
                ]}
                pointerEvents="box-none"
            >
                {/* En vertical las opciones ya están bajo el video: aquí solo en pantalla completa */}
                {fullscreen && count > 1 ? (
                    <OptionSegments
                        count={count}
                        current={sourceIndex}
                        status={status}
                        onSelect={selectSource}
                        overVideo
                    />
                ) : (
                    <View />
                )}
                <View style={styles.bottomUtil}>
                    <IconBtn
                        icon={muted ? 'volume-xmark' : 'volume-high'}
                        onPress={toggleMute}
                        label={muted ? 'Activar sonido' : 'Silenciar'}
                    />
                    <IconBtn
                        icon={fullscreen ? 'compress' : 'expand'}
                        onPress={toggleFullscreen}
                        label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    />
                </View>
            </View>
        </View>
    );
}
