import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { M3U_URL } from '../constants/config';
import parseM3U from '../utils/parseM3U';

/**
 * Gestiona la carga del M3U, lista de canales, canal actual y navegación.
 */
export default function useChannels() {
    const [channels, setChannels] = useState([]);
    const [vlcGlobalOpts, setVlcGlobalOpts] = useState([]);
    const [current, setCurrent] = useState(null);
    const [loading, setLoading] = useState(true);

    const errorTimeout = useRef(null);

    const currentIndex = channels.findIndex((ch) => ch.url === current?.url);

    const selectChannel = useCallback(
        (ch, { showControls } = {}) => {
            if (!ch) return;
            clearTimeout(errorTimeout.current);
            setCurrent(ch);
            AsyncStorage.setItem('lastChannelUrl', ch.url).catch(() => {});
            if (showControls) showControls();
        },
        [],
    );

    const prevChannel = useCallback(() => {
        if (currentIndex > 0) {
            selectChannel(channels[currentIndex - 1]);
        }
    }, [currentIndex, channels, selectChannel]);

    const nextChannel = useCallback(() => {
        if (currentIndex < channels.length - 1) {
            selectChannel(channels[currentIndex + 1]);
        }
    }, [currentIndex, channels, selectChannel]);

    const loadM3U = useCallback(async () => {
        try {
            const res = await fetch(M3U_URL);
            const text = await res.text();
            const { channels: parsed, globalVlcOpts } = parseM3U(text);
            setChannels(parsed);
            setVlcGlobalOpts(globalVlcOpts);

            const savedUrl = await AsyncStorage.getItem('lastChannelUrl');
            const saved = savedUrl && parsed.find((ch) => ch.url === savedUrl);
            setCurrent(saved || parsed[0] || null);
        } catch (e) {
            console.log('Error loading M3U:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        channels,
        vlcGlobalOpts,
        current,
        setCurrent,
        loading,
        currentIndex,
        selectChannel,
        prevChannel,
        nextChannel,
        loadM3U,
        errorTimeout,
    };
}
