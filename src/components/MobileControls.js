import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { CastButton } from 'react-native-google-cast';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

export default function MobileControls({
    visible,
    fullscreen,
    paused,
    muted,
    channelName,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    toggleFullscreen,
    exitFullscreen,
}) {
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    return (
        <View style={styles.overlay} pointerEvents="box-none">
            {/* Barra superior */}
            <View
                style={[styles.topBar, fullscreen && styles.topBarFs, fullscreen && { paddingLeft: insets.left + 14, paddingRight: insets.right + 14 }]}
                pointerEvents="auto"
            >
                {fullscreen && (
                    <Pressable onPress={exitFullscreen} hitSlop={12} style={styles.iconBtn}>
                        <FontAwesome6
                            name="arrow-left"
                            size={18}
                            color={C.white}
                            iconStyle="solid"
                        />
                    </Pressable>
                )}
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>EN VIVO</Text>
                </View>
                <Text style={styles.channelTitle} numberOfLines={1}>
                    {channelName}
                </Text>
                <View style={styles.spacer} />
                <CastButton style={{ width: 24, height: 24, tintColor: C.white }} />
            </View>

            {/* Controles centrales */}
            <View style={styles.centerControls} pointerEvents="box-none">
                <Pressable onPress={prevChannel} hitSlop={12} style={styles.iconBtn}>
                    <FontAwesome6
                        name="backward-step"
                        size={20}
                        color={C.white}
                        iconStyle="solid"
                    />
                </Pressable>
                <Pressable onPress={togglePause} hitSlop={12} style={styles.playBtnMobile}>
                    <FontAwesome6
                        name={paused ? 'play' : 'pause'}
                        size={20}
                        color="#000"
                        iconStyle="solid"
                    />
                </Pressable>
                <Pressable onPress={nextChannel} hitSlop={12} style={styles.iconBtn}>
                    <FontAwesome6
                        name="forward-step"
                        size={20}
                        color={C.white}
                        iconStyle="solid"
                    />
                </Pressable>
            </View>

            {/* Barra inferior */}
            <View style={[styles.bottomBar, fullscreen && { paddingLeft: insets.left + 16, paddingRight: insets.right + 16, paddingBottom: insets.bottom + 10 }]} pointerEvents="auto">
                <Pressable onPress={toggleMute} hitSlop={12} style={styles.iconBtn}>
                    <FontAwesome6
                        name={muted ? 'volume-xmark' : 'volume-high'}
                        size={18}
                        color={C.white}
                        iconStyle="solid"
                    />
                </Pressable>
                <View style={styles.spacer} />
                <Pressable onPress={toggleFullscreen} hitSlop={12} style={styles.iconBtn}>
                    <FontAwesome6
                        name={fullscreen ? 'compress' : 'expand'}
                        size={18}
                        color={C.white}
                        iconStyle="solid"
                    />
                </Pressable>
            </View>
        </View>
    );
}
