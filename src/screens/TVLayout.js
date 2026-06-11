import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StatusBar,
    useWindowDimensions,
    findNodeHandle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TVFocusGuideView } from 'react-native';
import { TV_ROW_H, TV_HEADER_H } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import ChannelRow from '../components/ChannelRow';
import PlayerView from '../components/PlayerView';
import InfoBar from '../components/InfoBar';
import TVControlBar from '../components/TVControlBar';

export default function TVLayout({
    channels,
    current,
    vlcGlobalOpts,
    currentIndex,
    playerKey,
    paused,
    muted,
    channelError,
    theater,
    // TV controls
    ctrlFocused,
    setCtrlFocused,
    playNode,
    registerPlayBtn,
    tvUiVisible,
    setTvUiVisible,
    listFocused,
    setListFocused,
    tvHideTimer,
    tvScrollRef,
    // Actions
    selectChannel,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    toggleTheater,
    tvScrollToIndex,
    // Recovery
    handleProgress,
    handlePlayerError,
    handleStopped,
}) {
    const { height: winH } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // ── Navegación circular: último↓→primero, primero↑→último ───────────
    const firstRowRef = useRef(null);
    const lastRowRef = useRef(null);
    const [firstNodeId, setFirstNodeId] = useState(null);
    const [lastNodeId, setLastNodeId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const fId = findNodeHandle(firstRowRef.current);
            const lId = findNodeHandle(lastRowRef.current);
            if (fId) setFirstNodeId(fId);
            if (lId) setLastNodeId(lId);
        }, 300);
        return () => clearTimeout(timer);
    }, [channels.length]);

    const playerColumn = (
        <View style={styles.tvPlayerCol}>
            <View style={styles.tvVideoBox}>
                <PlayerView
                    current={current}
                    playerKey={playerKey}
                    paused={paused}
                    muted={muted}
                    vlcGlobalOpts={vlcGlobalOpts}
                    channelError={channelError}
                    onProgress={handleProgress}
                    onError={handlePlayerError}
                    onStopped={handleStopped}
                />
                <View
                    style={[styles.tvTopGradient, { opacity: tvUiVisible ? 1 : 0 }]}
                    pointerEvents="box-none"
                >
                    <InfoBar channelName={current?.name} />
                </View>
                {!theater && playNode && (
                    <TVFocusGuideView
                        style={styles.tvFocusBridge}
                        destinations={[playNode]}
                    />
                )}
            </View>
            <TVControlBar
                tvUiVisible={tvUiVisible}
                insets={insets}
                ctrlFocused={ctrlFocused}
                setCtrlFocused={setCtrlFocused}
                registerPlayBtn={registerPlayBtn}
                paused={paused}
                muted={muted}
                prevChannel={prevChannel}
                nextChannel={nextChannel}
                togglePause={togglePause}
                toggleMute={toggleMute}
                theater={theater}
                toggleTheater={toggleTheater}
            />
        </View>
    );

    return (
        <SafeAreaView
            style={[styles.container, styles.containerTV]}
            edges={['top', 'bottom', 'left', 'right']}
        >
            <StatusBar hidden />

            {!theater && (
                <View style={[styles.tvListCol, { height: winH }]}>
                    <View style={[styles.tvBrandBar, { height: TV_HEADER_H }]}>
                        <Text style={styles.tvBrand}>
                            Buri<Text style={{ color: C.accentSoft }}>TV</Text>
                        </Text>
                        <Text style={styles.tvChannelCount}>
                            {channels.length} canales
                        </Text>
                    </View>
                    <TVFocusGuideView
                        style={{ height: winH - TV_HEADER_H }}
                        autoFocus
                    >
                        <ScrollView
                            ref={tvScrollRef}
                            style={{ height: winH - TV_HEADER_H }}
                            contentContainerStyle={styles.listContentTV}
                            showsVerticalScrollIndicator={false}
                        >
                            {channels.map((item, index) => {
                                const isFirst = index === 0;
                                const isLast = index === channels.length - 1;
                                return (
                                    <ChannelRow
                                        key={index}
                                        ref={
                                            isFirst
                                                ? firstRowRef
                                                : isLast
                                                  ? lastRowRef
                                                  : undefined
                                        }
                                        item={item}
                                        index={index}
                                        active={item.url === current?.url}
                                        focused={listFocused === index}
                                        hasTVPreferredFocus={
                                            currentIndex >= 0
                                                ? index === currentIndex
                                                : index === 0
                                        }
                                        nextFocusUp={isFirst ? lastNodeId : undefined}
                                        nextFocusDown={isLast ? firstNodeId : undefined}
                                        onFocus={() => {
                                            setListFocused(index);
                                            tvScrollToIndex(index);
                                            clearTimeout(tvHideTimer.current);
                                            setTvUiVisible(false);
                                        }}
                                        onBlur={() =>
                                            setListFocused((f) =>
                                                f === index ? -1 : f,
                                            )
                                        }
                                        onPress={() => selectChannel(item)}
                                    />
                                );
                            })}
                        </ScrollView>
                    </TVFocusGuideView>
                </View>
            )}

            {playerColumn}
        </SafeAreaView>
    );
}
