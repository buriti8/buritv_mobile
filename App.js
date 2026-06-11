import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import GoogleCast from 'react-native-google-cast';

import { isTV, TV_ROW_H, TV_HEADER_H } from './src/constants/config';
import useChannels from './src/hooks/useChannels';
import useStreamRecovery from './src/hooks/useStreamRecovery';
import useTVControls from './src/hooks/useTVControls';
import useMobileControls from './src/hooks/useMobileControls';
import LoadingScreen from './src/screens/LoadingScreen';
import TVLayout from './src/screens/TVLayout';
import MobileLayout from './src/screens/MobileLayout';

export default function IPTVPlayer() {
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [theater, setTheater] = useState(false);
    const [channelError, setChannelError] = useState(false);
    const [playerKey, setPlayerKey] = useState(0);

    const { height: winH } = useWindowDimensions();
    const tvScrollRef = useRef(null);

    // ── Hooks ───────────────────────────────────────────────────────────────

    const {
        channels,
        vlcGlobalOpts,
        current,
        loading,
        currentIndex,
        selectChannel,
        prevChannel,
        nextChannel,
        loadM3U,
        errorTimeout,
    } = useChannels();

    const { handleProgress, handleStopped } = useStreamRecovery({
        current,
        playerKey,
        setPlayerKey,
        paused,
        setPaused,
        setMuted,
        channelError,
    });

    const tvControls = useTVControls({
        theater,
        setTheater,
        setPaused,
    });

    const mobileControls = useMobileControls({ loading });

    // ── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        loadM3U();
    }, [loadM3U]);

    useEffect(() => {
        paused ? KeepAwake.deactivate() : KeepAwake.activate();
    }, [paused]);

    // ── Actions ─────────────────────────────────────────────────────────────

    const handleSelectChannel = useCallback(
        (ch) => {
            if (!ch) return;
            clearTimeout(errorTimeout.current);
            setChannelError(false);
            setPlayerKey(0);
            selectChannel(ch, { showControls: mobileControls.showControls });
            setPaused(false);
            if (!isTV) mobileControls.showControls();
        },
        [selectChannel, errorTimeout, mobileControls],
    );

    const handlePrevChannel = useCallback(() => {
        if (currentIndex > 0) handleSelectChannel(channels[currentIndex - 1]);
    }, [currentIndex, channels, handleSelectChannel]);

    const handleNextChannel = useCallback(() => {
        if (currentIndex < channels.length - 1) handleSelectChannel(channels[currentIndex + 1]);
    }, [currentIndex, channels, handleSelectChannel]);

    const togglePause = useCallback(() => {
        setPaused((p) => !p);
        if (!isTV) mobileControls.showControls();
    }, [mobileControls]);

    const toggleMute = useCallback(() => {
        setMuted((m) => !m);
        if (!isTV) mobileControls.showControls();
    }, [mobileControls]);

    const toggleTheater = useCallback(() => setTheater((t) => !t), []);

    // ── Player error → salta al siguiente ───────────────────────────────────

    const handlePlayerError = useCallback(() => {
        setChannelError(true);
        errorTimeout.current = setTimeout(() => {
            const nextIdx = currentIndex < channels.length - 1 ? currentIndex + 1 : 0;
            handleSelectChannel(channels[nextIdx]);
        }, 5000);
    }, [currentIndex, channels, handleSelectChannel, errorTimeout]);

    // ── TV: scroll centrado ─────────────────────────────────────────────────

    const tvScrollToIndex = useCallback(
        (index) => {
            if (!tvScrollRef.current || index < 0) return;
            const y = Math.max(
                0,
                index * TV_ROW_H - (winH - TV_HEADER_H) / 2 + TV_ROW_H / 2,
            );
            tvScrollRef.current.scrollTo({ y, animated: true });
        },
        [winH],
    );

    // ── Chromecast ──────────────────────────────────────────────────────────

    const startCasting = useCallback(async () => {
        try {
            const sessionManager = GoogleCast.getSessionManager();
            const session = await sessionManager.getCurrentCastSession();
            if (!session) {
                await GoogleCast.showCastDialog();
                return;
            }
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
    }, [current]);

    // ── Render ──────────────────────────────────────────────────────────────

    if (loading) return <LoadingScreen />;

    if (isTV) {
        return (
            <TVLayout
                channels={channels}
                current={current}
                vlcGlobalOpts={vlcGlobalOpts}
                currentIndex={currentIndex}
                playerKey={playerKey}
                paused={paused}
                muted={muted}
                channelError={channelError}
                theater={theater}
                ctrlFocused={tvControls.ctrlFocused}
                setCtrlFocused={tvControls.setCtrlFocused}
                playNode={tvControls.playNode}
                registerPlayBtn={tvControls.registerPlayBtn}
                tvUiVisible={tvControls.tvUiVisible}
                setTvUiVisible={tvControls.setTvUiVisible}
                listFocused={tvControls.listFocused}
                setListFocused={tvControls.setListFocused}
                tvHideTimer={tvControls.tvHideTimer}
                tvScrollRef={tvScrollRef}
                selectChannel={handleSelectChannel}
                prevChannel={handlePrevChannel}
                nextChannel={handleNextChannel}
                togglePause={togglePause}
                toggleMute={toggleMute}
                toggleTheater={toggleTheater}
                tvScrollToIndex={tvScrollToIndex}
                handleProgress={handleProgress}
                handlePlayerError={handlePlayerError}
                handleStopped={handleStopped}
            />
        );
    }

    return (
        <MobileLayout
            channels={channels}
            current={current}
            vlcGlobalOpts={vlcGlobalOpts}
            currentIndex={currentIndex}
            playerKey={playerKey}
            paused={paused}
            muted={muted}
            channelError={channelError}
            fullscreen={mobileControls.fullscreen}
            controlsVisible={mobileControls.controlsVisible}
            selectChannel={handleSelectChannel}
            prevChannel={handlePrevChannel}
            nextChannel={handleNextChannel}
            togglePause={togglePause}
            toggleMute={toggleMute}
            toggleFullscreen={mobileControls.toggleFullscreen}
            exitFullscreen={mobileControls.exitFullscreen}
            handleVideoPress={mobileControls.handleVideoPress}
            handleProgress={handleProgress}
            handlePlayerError={handlePlayerError}
            handleStopped={handleStopped}
        />
    );
}
