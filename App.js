import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VLCPlayer } from 'react-native-vlc-media-player';
import Orientation from 'react-native-orientation-locker';
import { FontAwesome } from '@react-native-vector-icons/fontawesome';
import GoogleCast, { CastButton } from 'react-native-google-cast';

const M3U_URL = 'https://drive.google.com/uc?export=download&id=1OK6_rn5hFGB0WgpG4XqIR-FR6qlIYBL7';

function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    let currentName = '';
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith('#EXTINF')) {
            const parts = line.split(',');
            currentName = parts[parts.length - 1]?.trim();
        } else if (!line.startsWith('#')) {
            channels.push({ name: currentName || 'Sin nombre', url: line });
        }
    }
    return channels;
}

export default function IPTVPlayer() {
    const [channels, setChannels] = useState([]);
    const [current, setCurrent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimeout = useRef(null);

    useEffect(() => {
        loadM3U();
        return () => clearTimeout(hideTimeout.current);
    }, []);

    const loadM3U = async () => {
        try {
            const res = await fetch(M3U_URL);
            const text = await res.text();
            const parsed = parseM3U(text);
            setChannels(parsed);
            if (parsed.length) setCurrent(parsed[0]);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const selectChannel = ch => {
        setCurrent(ch);
        setPaused(false);
        startAutoHide();
    };

    const startAutoHide = () => {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => setControlsVisible(false), 10000);
    };

    const handleVideoPress = () => {
        if (controlsVisible) {
            clearTimeout(hideTimeout.current);
            setControlsVisible(false);
        } else {
            setControlsVisible(true);
            startAutoHide();
        }
    };

    const toggleFullscreen = () => {
        if (fullscreen) {
            Orientation.lockToPortrait();
        } else {
            Orientation.lockToLandscape();
        }
        setFullscreen(prev => !prev);
        startAutoHide();
    };

    const exitFullscreen = () => {
        Orientation.lockToPortrait();
        setFullscreen(false);
        startAutoHide();
    };

    const currentIndex = channels.findIndex(ch => ch.url === current?.url);
    const prevChannel = () => currentIndex > 0 && selectChannel(channels[currentIndex - 1]);
    const nextChannel = () => currentIndex < channels.length - 1 && selectChannel(channels[currentIndex + 1]);

    const startCasting = async () => {
        try {
            const sessionManager = GoogleCast.getSessionManager();
            const session = await sessionManager.getCurrentCastSession();

            if (!session) {
                console.log('No hay sesión activa');
                await GoogleCast.showCastDialog(); // abre selector
                return;
            }

            const mediaInfo = {
                contentUrl: current.url,
                contentType: 'application/x-mpegURL',
                streamType: 'LIVE',
                metadata: {
                    type: 'generic',
                    title: current.name,
                },
            };

            await session.loadMedia({ mediaInfo });
        } catch (error) {
            console.log('Error casting:', error);
        }
    };

    if (loading) {
        return (
            <View style={s.loader}>
                <ActivityIndicator size="large" color="#e24b4a" />
                <Text style={s.loadingText}>Cargando canales...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={[s.playerWrap, fullscreen && s.fullscreen]}>
                {current && (
                    <VLCPlayer
                        style={s.player}
                        source={{ uri: current.url }}
                        paused={paused}
                        muted={muted}
                    />
                )}

                <Pressable style={s.videoTouchable} onPress={handleVideoPress} />

                {controlsVisible && (
                    <View style={s.overlay} pointerEvents="box-none">
                        {/* top bar */}
                        <View style={s.topBar} pointerEvents="auto">
                            {fullscreen && (
                                <TouchableOpacity onPress={exitFullscreen} hitSlop={10} style={s.backBtn}>
                                    <FontAwesome name="arrow-left" size={16} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <View style={s.liveBadge}>
                                <Text style={s.liveText}>EN VIVO</Text>
                            </View>
                            <Text style={s.channelTitle} numberOfLines={1}>
                                {current?.name}
                            </Text>

                            <View style={s.spacer} />

                            <TouchableOpacity onPress={startCasting} hitSlop={10}>
                                <FontAwesome name={'chromecast'} size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* bottom controls */}
                        <View style={s.bottomBar} pointerEvents="auto">
                            <TouchableOpacity onPress={prevChannel} hitSlop={10}>
                                <FontAwesome name="step-backward" size={14} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setPaused(p => !p)} hitSlop={10}>
                                <FontAwesome name={paused ? 'play' : 'pause'} size={18} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={nextChannel} hitSlop={10}>
                                <FontAwesome name="step-forward" size={14} color="#fff" />
                            </TouchableOpacity>

                            <View style={s.spacer} />

                            <TouchableOpacity onPress={() => { setMuted(m => !m); startAutoHide(); }} hitSlop={10}>
                                <FontAwesome name={muted ? 'volume-mute' : 'volume-up'} size={14} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={toggleFullscreen} hitSlop={10}>
                                <FontAwesome name={fullscreen ? 'compress' : 'expand'} size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {!fullscreen && (
                <FlatList
                    data={channels}
                    keyExtractor={(_, i) => i.toString()}
                    style={s.list}
                    contentContainerStyle={s.listContent}
                    renderItem={({ item, index }) => {
                        const active = item.url === current?.url;
                        return (
                            <TouchableOpacity
                                style={[s.item, active && s.activeItem]}
                                onPress={() => selectChannel(item)}>
                                <Text style={s.itemNum}>{index + 1}</Text>
                                <Text style={[s.itemName, active && s.activeText]} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                {active && <View style={s.activeDot} />}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b0b0b' },

    playerWrap: { height: 220, backgroundColor: '#000' },
    fullscreen: { flex: 1 },
    player: { width: '100%', height: '100%' },

    videoTouchable: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
    },

    overlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        justifyContent: 'space-between',
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 7,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },

    backBtn: { marginRight: 4 },

    liveBadge: {
        backgroundColor: '#e24b4a',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },

    liveText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

    channelTitle: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '500' },

    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },

    spacer: { flex: 1 },

    list: { flex: 1, backgroundColor: '#0f0f0f' },
    listContent: { padding: 8 },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        marginBottom: 4,
        borderWidth: 0.5,
        borderColor: 'transparent',
        gap: 10,
    },

    activeItem: { borderColor: '#e24b4a', backgroundColor: '#1f1313' },

    itemNum: { fontSize: 11, color: '#555', minWidth: 20 },
    itemName: { flex: 1, color: '#ccc', fontSize: 13 },
    activeText: { color: '#fff', fontWeight: '500' },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e24b4a' },

    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0b0b' },
    loadingText: { color: '#888', marginTop: 10, fontSize: 13 },
});