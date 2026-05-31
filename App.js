import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, FlatList, ScrollView, StyleSheet,
    ActivityIndicator, Pressable, StatusBar, Platform,
    TVFocusGuideView, BackHandler, useTVEventHandler,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VLCPlayer } from 'react-native-vlc-media-player';
import Orientation from 'react-native-orientation-locker';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import GoogleCast, { CastButton } from 'react-native-google-cast';
import KeepAwake from 'react-native-keep-awake';

const isTV = Platform.isTV;

// BuriTV — UI/UX TV + Móvil (foco nativo Android TV)
const M3U_URL = 'https://drive.google.com/uc?export=download&id=1OK6_rn5hFGB0WgpG4XqIR-FR6qlIYBL7';

// Paleta
const C = {
    bg: '#0b0b0b',
    panel: '#101010',
    item: '#1c1c1c',
    itemActive: '#15301c',
    accent: '#0A7724',
    accentSoft: '#1db954',
    border: '#2a2a2a',
    text: '#ececec',
    textDim: '#9a9a9a',
    textMute: '#6a6a6a',
    white: '#ffffff',
    danger: '#ff4444',
};

const TV_ROW_H = 56;        // alto fila TV (incluye margen)
const TV_HEADER_H = 60;     // alto cabecera lista TV
const MOBILE_ROW_H = 48;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    let currentName = '';
    let currentLogo = '';
    let currentGroup = '';
    for (let raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('#EXTINF')) {
            const logo = line.match(/tvg-logo="([^"]*)"/i);
            const group = line.match(/group-title="([^"]*)"/i);
            currentLogo = logo ? logo[1] : '';
            currentGroup = group ? group[1] : '';
            const parts = line.split(',');
            currentName = parts[parts.length - 1]?.trim();
        } else if (!line.startsWith('#')) {
            channels.push({
                name: currentName || 'Sin nombre',
                url: line,
                logo: currentLogo,
                group: currentGroup,
            });
            currentName = '';
            currentLogo = '';
            currentGroup = '';
        }
    }
    return channels;
}

// ─── CountdownDots ────────────────────────────────────────────────────────────

function CountdownDots() {
    const [dots, setDots] = useState(3);
    useEffect(() => {
        const iv = setInterval(() => setDots(d => (d > 0 ? d - 1 : 0)), 1000);
        return () => clearInterval(iv);
    }, []);
    const filled = '● '.repeat(dots);
    const empty = '○ '.repeat(3 - dots);
    return <Text style={s.errorDots}>{filled}{empty}</Text>;
}

// ─── Botón de control (enfocable nativo en TV) ─────────────────────────────────

const ControlButton = React.forwardRef(function ControlButton(
    { icon, size, onPress, onFocus, onBlur, focused, big, hasTVPreferredFocus },
    ref,
) {
    return (
        <Pressable
            ref={ref}
            focusable={isTV}
            hasTVPreferredFocus={!!hasTVPreferredFocus}
            onPress={onPress}
            onFocus={onFocus}
            onBlur={onBlur}
            hitSlop={8}
            style={({ pressed }) => [
                s.ctrlBtn,
                big && s.ctrlBtnBig,
                focused && s.ctrlBtnFocused,
                pressed && !isTV && s.ctrlBtnPressed,
            ]}>
            <FontAwesome6 name={icon} size={size} color={focused ? C.white : '#e9e9e9'} iconStyle="solid" />
        </Pressable>
    );
});

// ─── Fila de canal ─────────────────────────────────────────────────────────────

function ChannelRow({ item, index, active, focused, onPress, onFocus, onBlur, hasTVPreferredFocus }) {
    return (
        <Pressable
            focusable={isTV}
            hasTVPreferredFocus={!!hasTVPreferredFocus}
            onPress={onPress}
            onFocus={onFocus}
            onBlur={onBlur}
            android_ripple={!isTV ? { color: '#2a2a2a' } : undefined}
            style={({ pressed }) => [
                s.item,
                isTV && s.itemTV,
                active && s.activeItem,
                focused && s.focusedItem,
                pressed && !isTV && s.pressedItem,
            ]}>
            <View style={[s.numBadge, active && s.numBadgeActive, focused && s.numBadgeFocused]}>
                <Text style={[s.itemNum, (active || focused) && s.itemNumOn]}>{index + 1}</Text>
            </View>
            <Text
                numberOfLines={1}
                style={[
                    s.itemName,
                    isTV && s.itemNameTV,
                    active && s.activeText,
                    focused && s.focusedText,
                ]}>
                {item.name}
            </Text>
            {active && (
                <FontAwesome6 name="signal" size={isTV ? 14 : 11} color={focused ? C.white : C.accentSoft} iconStyle="solid" />
            )}
        </Pressable>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IPTVPlayer() {
    const [channels, setChannels] = useState([]);
    const [current, setCurrent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);       // móvil: landscape
    const [theater, setTheater] = useState(false);             // TV: oculta lista
    const [controlsVisible, setControlsVisible] = useState(false); // móvil overlay
    const [channelError, setChannelError] = useState(false);

    // Foco visual TV (solo estética; la navegación la maneja el motor nativo)
    const [listFocused, setListFocused] = useState(-1);
    const [ctrlFocused, setCtrlFocused] = useState(null);
    const [playNode, setPlayNode] = useState(null); // nodo del botón Play (puente de foco)
    const [tvUiVisible, setTvUiVisible] = useState(false); // TV: controles visibles

    // Alto real de la ventana (TV no resuelve flex/'100%' de forma fiable)
    const { height: winH } = useWindowDimensions();

    const hideTimeout = useRef(null);
    const errorTimeout = useRef(null);
    const tvScrollRef = useRef(null);
    const mobileListRef = useRef(null);
    const playBtnRef = useRef(null);
    const tvHideTimer = useRef(null);

    // Ref callback: guarda el nodo del botón Play para el puente de foco lista→controles
    const registerPlayBtn = useCallback((node) => {
        playBtnRef.current = node;
        setPlayNode(prev => (prev === node ? prev : node));
    }, []);

    const currentIndex = channels.findIndex(ch => ch.url === current?.url);

    // ── Lifecycle ──────────────────────────────────────────────────────────

    useEffect(() => {
        loadM3U();
        return () => {
            clearTimeout(hideTimeout.current);
            clearTimeout(errorTimeout.current);
            clearTimeout(tvHideTimer.current);
        };
    }, []);

    useEffect(() => {
        paused ? KeepAwake.deactivate() : KeepAwake.activate();
    }, [paused]);

    // Botón "atrás" del control remoto en TV: sale del modo teatro
    useEffect(() => {
        if (!isTV) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (theater) { setTheater(false); return true; }
            return false;
        });
        return () => sub.remove();
    }, [theater]);

    // TV: mostrar controles y reprogramar el auto-ocultar (4s sin actividad)
    const tvPing = useCallback(() => {
        setTvUiVisible(true);
        clearTimeout(tvHideTimer.current);
        tvHideTimer.current = setTimeout(() => setTvUiVisible(false), 4000);
    }, []);

    // Enfocar un control lo muestra (con auto-ocultar). El ocultar lo dispara la lista,
    // NO el blur transitorio entre botones (eso causaba el parpadeo).
    useEffect(() => {
        if (!isTV) return;
        if (ctrlFocused != null) tvPing();
    }, [ctrlFocused, tvPing]);

    // Remoto: play/pausa dedicado + reiniciar el auto-ocultar si estás en los controles
    useTVEventHandler(useCallback((evt) => {
        if (!isTV) return;
        if (evt?.eventType === 'playPause') setPaused(p => !p);
        if (ctrlFocused != null) tvPing();
    }, [ctrlFocused, tvPing]));

    // ── Controles móvil: auto-ocultar ───────────────────────────────────────

    const startAutoHide = useCallback(() => {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => setControlsVisible(false), 4500);
    }, []);

    const showControls = useCallback(() => {
        setControlsVisible(true);
        startAutoHide();
    }, [startAutoHide]);

    // Móvil: al abrir (terminó la carga) mostrar controles y dejar que se auto-oculten
    useEffect(() => {
        if (!loading && !isTV) showControls();
    }, [loading, showControls]);

    // ── Scroll TV (ScrollView, sin virtualización) ───────────────────────────

    const tvScrollToIndex = useCallback((index) => {
        if (!tvScrollRef.current || index < 0) return;
        const y = Math.max(0, index * TV_ROW_H - (winH - TV_HEADER_H) / 2 + TV_ROW_H / 2);
        tvScrollRef.current.scrollTo({ y, animated: true });
    }, [winH]);

    // ── Acciones ────────────────────────────────────────────────────────────

    const selectChannel = useCallback((ch) => {
        if (!ch) return;
        clearTimeout(errorTimeout.current);
        setChannelError(false);
        setCurrent(ch);
        setPaused(false);
        if (!isTV) showControls();
    }, [showControls]);

    const prevChannel = useCallback(() => {
        if (currentIndex > 0) selectChannel(channels[currentIndex - 1]);
    }, [currentIndex, channels, selectChannel]);

    const nextChannel = useCallback(() => {
        if (currentIndex < channels.length - 1) selectChannel(channels[currentIndex + 1]);
    }, [currentIndex, channels, selectChannel]);

    const togglePause = useCallback(() => {
        setPaused(p => !p);
        if (!isTV) showControls();
    }, [showControls]);

    const toggleMute = useCallback(() => {
        setMuted(m => !m);
        if (!isTV) showControls();
    }, [showControls]);

    const toggleFullscreenMobile = useCallback(() => {
        setFullscreen(prev => {
            prev ? Orientation.lockToPortrait() : Orientation.lockToLandscape();
            return !prev;
        });
        showControls();
    }, [showControls]);

    const exitFullscreenMobile = useCallback(() => {
        Orientation.lockToPortrait();
        setFullscreen(false);
        showControls();
    }, [showControls]);

    const toggleTheater = useCallback(() => setTheater(t => !t), []);

    // ── Data ────────────────────────────────────────────────────────────────

    const loadM3U = async () => {
        try {
            const res = await fetch(M3U_URL);
            const text = await res.text();
            const parsed = parseM3U(text);
            setChannels(parsed);
            if (parsed.length) setCurrent(parsed[0]);
        } catch (e) {
            console.log('Error loading M3U:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Player error → salta al siguiente ────────────────────────────────────

    const handlePlayerError = () => {
        clearTimeout(hideTimeout.current);
        setControlsVisible(false);
        setChannelError(true);
        errorTimeout.current = setTimeout(() => {
            const nextIndex = currentIndex < channels.length - 1 ? currentIndex + 1 : 0;
            selectChannel(channels[nextIndex]);
        }, 3000);
    };

    // ── Móvil: tap para mostrar/ocultar controles ────────────────────────────

    const handleVideoPress = () => {
        if (controlsVisible) {
            clearTimeout(hideTimeout.current);
            setControlsVisible(false);
        } else {
            showControls();
        }
    };

    // ── Chromecast ────────────────────────────────────────────────────────────

    const startCasting = async () => {
        try {
            const sessionManager = GoogleCast.getSessionManager();
            const session = await sessionManager.getCurrentCastSession();
            if (!session) { await GoogleCast.showCastDialog(); return; }
            await session.loadMedia({
                mediaInfo: {
                    contentUrl: current.url,
                    contentType: 'application/x-mpegURL',
                    streamType: 'LIVE',
                    metadata: { type: 'generic', title: current.name },
                },
            });
        } catch (error) {
            console.log('Error casting:', error);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <View style={s.loader}>
                <View style={s.logoMark}>
                    <Text style={s.logoText}>Buri<Text style={{ color: C.accentSoft }}>TV</Text></Text>
                </View>
                <ActivityIndicator size="large" color={C.accentSoft} style={{ marginTop: 18 }} />
                <Text style={s.loadingText}>Cargando canales…</Text>
            </View>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    //  VIDEO + OVERLAYS
    // ════════════════════════════════════════════════════════════════════════

    const videoLayer = (
        <>
            {current && (
                <VLCPlayer
                    style={s.player}
                    source={{ uri: current.url }}
                    paused={paused}
                    muted={muted}
                    onError={handlePlayerError}
                />
            )}
            {channelError && (
                <View style={s.errorOverlay}>
                    <FontAwesome6 name="triangle-exclamation" size={isTV ? 50 : 30} color={C.danger} iconStyle="solid" />
                    <Text style={[s.errorTitle, isTV && s.errorTitleTV]}>Canal no disponible</Text>
                    <Text style={[s.errorSub, isTV && s.errorSubTV]}>Pasando al siguiente canal…</Text>
                    <CountdownDots />
                </View>
            )}
        </>
    );

    const infoBar = (
        <View style={s.topBar} pointerEvents="box-none">
            <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>EN VIVO</Text>
            </View>
            <Text style={[s.channelTitle, isTV && s.channelTitleTV]} numberOfLines={1}>
                {current?.name || ''}
            </Text>
            {!isTV && (
                <CastButton style={{ width: 26, height: 26, tintColor: C.white }} />
            )}
        </View>
    );

    // ════════════════════════════════════════════════════════════════════════
    //  RENDER  ·  TV
    // ════════════════════════════════════════════════════════════════════════

    if (isTV) {
        const ctrlBar = (
            <TVFocusGuideView style={[s.tvControlBar, { opacity: tvUiVisible ? 1 : 0 }]} autoFocus>
                <ControlButton
                    icon="backward-step" size={24}
                    focused={ctrlFocused === 'prev'}
                    onFocus={() => setCtrlFocused('prev')}
                    onBlur={() => setCtrlFocused(c => (c === 'prev' ? null : c))}
                    onPress={prevChannel}
                />
                <ControlButton
                    ref={registerPlayBtn}
                    big
                    icon={paused ? 'play' : 'pause'} size={30}
                    focused={ctrlFocused === 'play'}
                    onFocus={() => setCtrlFocused('play')}
                    onBlur={() => setCtrlFocused(c => (c === 'play' ? null : c))}
                    onPress={togglePause}
                />
                <ControlButton
                    icon="forward-step" size={24}
                    focused={ctrlFocused === 'next'}
                    onFocus={() => setCtrlFocused('next')}
                    onBlur={() => setCtrlFocused(c => (c === 'next' ? null : c))}
                    onPress={nextChannel}
                />
                <View style={s.ctrlGap} />
                <ControlButton
                    icon={muted ? 'volume-xmark' : 'volume-high'} size={24}
                    focused={ctrlFocused === 'mute'}
                    onFocus={() => setCtrlFocused('mute')}
                    onBlur={() => setCtrlFocused(c => (c === 'mute' ? null : c))}
                    onPress={toggleMute}
                />
                <ControlButton
                    icon={theater ? 'compress' : 'expand'} size={24}
                    focused={ctrlFocused === 'theater'}
                    onFocus={() => setCtrlFocused('theater')}
                    onBlur={() => setCtrlFocused(c => (c === 'theater' ? null : c))}
                    onPress={toggleTheater}
                />
            </TVFocusGuideView>
        );

        const playerColumn = (
            <View style={s.tvPlayerCol}>
                <View style={s.tvVideoBox}>
                    {videoLayer}
                    <View style={[s.tvTopGradient, { opacity: tvUiVisible ? 1 : 0 }]} pointerEvents="box-none">
                        {infoBar}
                    </View>
                    {/* Puente de foco: al ir → desde la lista, el foco cae en Play */}
                    {!theater && playNode && (
                        <TVFocusGuideView style={s.tvFocusBridge} destinations={[playNode]} />
                    )}
                </View>
                {ctrlBar}
            </View>
        );

        return (
            <SafeAreaView style={[s.container, s.containerTV]} edges={[]}>
                <StatusBar hidden />
                {!theater && (
                    <View style={[s.tvListCol, { height: winH }]}>
                        <View style={[s.tvBrandBar, { height: TV_HEADER_H }]}>
                            <Text style={s.tvBrand}>Buri<Text style={{ color: C.accentSoft }}>TV</Text></Text>
                            <Text style={s.tvChannelCount}>{channels.length} canales</Text>
                        </View>
                        <TVFocusGuideView style={{ height: winH - TV_HEADER_H }} autoFocus>
                            <ScrollView
                                ref={tvScrollRef}
                                style={{ height: winH - TV_HEADER_H }}
                                contentContainerStyle={s.listContentTV}
                                showsVerticalScrollIndicator={false}>
                                {channels.map((item, index) => (
                                    <ChannelRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        active={item.url === current?.url}
                                        focused={listFocused === index}
                                        hasTVPreferredFocus={
                                            currentIndex >= 0 ? index === currentIndex : index === 0
                                        }
                                        onFocus={() => {
                                            setListFocused(index);
                                            tvScrollToIndex(index);
                                            clearTimeout(tvHideTimer.current);
                                            setTvUiVisible(false); // al entrar a la lista, ocultar controles
                                        }}
                                        onBlur={() => setListFocused(f => (f === index ? -1 : f))}
                                        onPress={() => selectChannel(item)}
                                    />
                                ))}
                            </ScrollView>
                        </TVFocusGuideView>
                    </View>
                )}
                {playerColumn}
            </SafeAreaView>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    //  RENDER  ·  MÓVIL
    // ════════════════════════════════════════════════════════════════════════

    const mobileControls = controlsVisible && (
        <View style={s.overlay} pointerEvents="box-none">
            <View style={[s.topBar, fullscreen && s.topBarFs]} pointerEvents="auto">
                {fullscreen && (
                    <Pressable onPress={exitFullscreenMobile} hitSlop={12} style={s.iconBtn}>
                        <FontAwesome6 name="arrow-left" size={18} color={C.white} iconStyle="solid" />
                    </Pressable>
                )}
                <View style={s.liveBadge}>
                    <View style={s.liveDot} />
                    <Text style={s.liveText}>EN VIVO</Text>
                </View>
                <Text style={s.channelTitle} numberOfLines={1}>{current?.name}</Text>
                <View style={s.spacer} />
                <CastButton style={{ width: 24, height: 24, tintColor: C.white }} />
            </View>

            <View style={s.centerControls} pointerEvents="box-none">
                <Pressable onPress={prevChannel} hitSlop={12} style={s.iconBtn}>
                    <FontAwesome6 name="backward-step" size={20} color={C.white} iconStyle="solid" />
                </Pressable>
                <Pressable onPress={togglePause} hitSlop={12} style={s.playBtnMobile}>
                    <FontAwesome6 name={paused ? 'play' : 'pause'} size={26} color={C.white} iconStyle="solid" />
                </Pressable>
                <Pressable onPress={nextChannel} hitSlop={12} style={s.iconBtn}>
                    <FontAwesome6 name="forward-step" size={20} color={C.white} iconStyle="solid" />
                </Pressable>
            </View>

            <View style={s.bottomBar} pointerEvents="auto">
                <Pressable onPress={toggleMute} hitSlop={12} style={s.iconBtn}>
                    <FontAwesome6 name={muted ? 'volume-xmark' : 'volume-high'} size={18} color={C.white} iconStyle="solid" />
                </Pressable>
                <View style={s.spacer} />
                <Pressable onPress={toggleFullscreenMobile} hitSlop={12} style={s.iconBtn}>
                    <FontAwesome6 name={fullscreen ? 'compress' : 'expand'} size={18} color={C.white} iconStyle="solid" />
                </Pressable>
            </View>
        </View>
    );

    const playerBlock = (
        <View style={[s.mobilePlayer, fullscreen && s.mobilePlayerFs]}>
            {videoLayer}
            <Pressable style={s.videoTouchable} onPress={handleVideoPress} />
            {mobileControls}
        </View>
    );

    return (
        <SafeAreaView
            style={s.container}
            edges={fullscreen ? [] : ['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" hidden={fullscreen} />
            {playerBlock}
            {!fullscreen && (
                <View style={s.mobileListWrap}>
                    <View style={s.mobileListHeader}>
                        <Text style={s.mobileBrand}>Buri<Text style={{ color: C.accentSoft }}>TV</Text></Text>
                        <Text style={s.tvChannelCount}>{channels.length} canales</Text>
                    </View>
                    <FlatList
                        ref={mobileListRef}
                        data={channels}
                        keyExtractor={(_, i) => String(i)}
                        style={s.list}
                        contentContainerStyle={s.listContent}
                        showsVerticalScrollIndicator={false}
                        getItemLayout={(_, index) => ({
                            length: MOBILE_ROW_H, offset: MOBILE_ROW_H * index, index,
                        })}
                        renderItem={({ item, index }) => (
                            <ChannelRow
                                item={item}
                                index={index}
                                active={item.url === current?.url}
                                focused={false}
                                onPress={() => selectChannel(item)}
                            />
                        )}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    containerTV: { flexDirection: 'row' },

    // ── Loading ──────────────────────────────────────────────────────────────
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    logoMark: { paddingHorizontal: 4 },
    logoText: { color: C.white, fontSize: 34, fontWeight: '800', letterSpacing: 0.5 },
    loadingText: { color: C.textDim, marginTop: 12, fontSize: 14 },

    // ════════════ TV ════════════
    tvListCol: {
        width: 340,
        backgroundColor: C.panel,
        borderRightWidth: 1,
        borderRightColor: C.border,
    },
    tvBrandBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    tvBrand: { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
    tvChannelCount: { color: C.textMute, fontSize: 12, fontWeight: '600' },

    tvPlayerCol: { flex: 1, backgroundColor: '#000' },
    tvVideoBox: { flex: 1, backgroundColor: '#000' },
    tvTopGradient: {
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingBottom: 28,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    // Cubre el video salvo la franja inferior de controles (para no robarles el foco)
    tvFocusBridge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 110 },

    tvControlBar: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 26,
        paddingVertical: 18,
        backgroundColor: 'rgba(0,0,0,0.6)',
        gap: 14,
    },
    ctrlGap: { flex: 1 },

    // ── Lista ────────────────────────────────────────────────────────────────
    list: { flex: 1 },
    listContentTV: { paddingVertical: 8, paddingHorizontal: 8, paddingBottom: 24 },
    listContent: { paddingVertical: 6, paddingHorizontal: 8, paddingBottom: 24 },

    item: {
        height: MOBILE_ROW_H - 4,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: C.item,
        borderRadius: 10,
        marginBottom: 4,
        borderWidth: 1.5,
        borderColor: 'transparent',
        gap: 10,
    },
    itemTV: {
        height: TV_ROW_H - 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
    },
    activeItem: { borderColor: C.accent, backgroundColor: C.itemActive },
    focusedItem: {
        borderColor: C.white,
        backgroundColor: '#3a3a3a',
        transform: [{ scale: 1.03 }],
    },
    pressedItem: { backgroundColor: '#2a2a2a' },

    numBadge: {
        minWidth: 26,
        height: 22,
        paddingHorizontal: 5,
        borderRadius: 5,
        backgroundColor: '#303030',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numBadgeActive: { backgroundColor: C.accent },
    numBadgeFocused: { backgroundColor: C.white },
    itemNum: { fontSize: 12, color: C.textDim, fontWeight: '700' },
    itemNumOn: { color: '#0b0b0b' },

    itemName: { flex: 1, color: C.text, fontSize: 14 },
    itemNameTV: { fontSize: 17 },
    activeText: { color: C.white, fontWeight: '600' },
    focusedText: { color: C.white, fontWeight: '700' },

    // ── Player móvil ─────────────────────────────────────────────────────────
    mobilePlayer: { height: 230, backgroundColor: '#000' },
    mobilePlayerFs: { flex: 1, height: undefined },
    player: { width: '100%', height: '100%' },
    videoTouchable: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },

    mobileListWrap: { flex: 1, backgroundColor: C.panel },
    mobileListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    mobileBrand: { color: C.white, fontSize: 18, fontWeight: '800' },

    // ── Overlay / controls ───────────────────────────────────────────────────
    overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'space-between' },
    topBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    topBarFs: { paddingTop: 14 },
    centerControls: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28,
    },
    bottomBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    spacer: { flex: 1 },

    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: C.accent,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    liveText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
    channelTitle: { flex: 1, color: C.white, fontSize: 14, fontWeight: '600' },
    channelTitleTV: { fontSize: 20, flex: 0, maxWidth: '70%' },

    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    playBtnMobile: {
        width: 60, height: 60, borderRadius: 30,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(10,119,36,0.85)',
    },

    // Botones de control TV
    ctrlBtn: {
        width: 52, height: 52, borderRadius: 26,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 2, borderColor: 'transparent',
    },
    ctrlBtnBig: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(10,119,36,0.5)' },
    ctrlBtnFocused: {
        borderColor: C.white,
        backgroundColor: C.accent,
        transform: [{ scale: 1.12 }],
    },
    ctrlBtnPressed: { opacity: 0.7 },

    // ── Error overlay ──────────────────────────────────────────────────────
    errorOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.88)',
        justifyContent: 'center', alignItems: 'center', gap: 10,
    },
    errorTitle: { color: C.white, fontSize: 16, fontWeight: '700' },
    errorTitleTV: { fontSize: 24 },
    errorSub: { color: C.textDim, fontSize: 13 },
    errorSubTV: { fontSize: 17 },
    errorDots: { color: C.danger, fontSize: 16, letterSpacing: 4, marginTop: 6 },
});
