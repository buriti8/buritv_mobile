import React, { useRef } from 'react';
import { View, Text, FlatList, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOBILE_ROW_H } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import ChannelRow from '../components/ChannelRow';
import PlayerView from '../components/PlayerView';
import MobileControls from '../components/MobileControls';

export default function MobileLayout({
    channels,
    current,
    vlcGlobalOpts,
    currentIndex,
    playerKey,
    paused,
    muted,
    channelError,
    fullscreen,
    controlsVisible,
    // Actions
    selectChannel,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    toggleFullscreen,
    exitFullscreen,
    handleVideoPress,
    // Recovery
    handleProgress,
    handlePlayerError,
    handleStopped,
}) {
    const mobileListRef = useRef(null);

    const playerBlock = (
        <View style={[styles.mobilePlayer, fullscreen && styles.mobilePlayerFs]}>
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
            <Pressable style={styles.videoTouchable} onPress={handleVideoPress} />
            <MobileControls
                visible={controlsVisible}
                fullscreen={fullscreen}
                paused={paused}
                muted={muted}
                channelName={current?.name}
                prevChannel={prevChannel}
                nextChannel={nextChannel}
                togglePause={togglePause}
                toggleMute={toggleMute}
                toggleFullscreen={toggleFullscreen}
                exitFullscreen={exitFullscreen}
            />
        </View>
    );

    return (
        <SafeAreaView
            style={styles.container}
            edges={fullscreen ? [] : ['top', 'bottom', 'left', 'right']}
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor="#000"
                hidden={fullscreen}
            />
            {playerBlock}
            {!fullscreen && (
                <View style={styles.mobileListWrap}>
                    <View style={styles.mobileListHeader}>
                        <Text style={styles.mobileBrand}>
                            Buri<Text style={{ color: C.accentSoft }}>TV</Text>
                        </Text>
                        <Text style={styles.tvChannelCount}>
                            {channels.length} canales
                        </Text>
                    </View>
                    <FlatList
                        ref={mobileListRef}
                        data={channels}
                        keyExtractor={(_, i) => String(i)}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        getItemLayout={(_, index) => ({
                            length: MOBILE_ROW_H,
                            offset: MOBILE_ROW_H * index,
                            index,
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
