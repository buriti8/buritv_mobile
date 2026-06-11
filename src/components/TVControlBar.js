import React from 'react';
import { View } from 'react-native';
import { TVFocusGuideView } from 'react-native';
import { styles } from '../styles/styles';
import ControlButton from './ControlButton';

export default function TVControlBar({
    tvUiVisible,
    insets,
    ctrlFocused,
    setCtrlFocused,
    registerPlayBtn,
    paused,
    muted,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    theater,
    toggleTheater,
}) {
    return (
        <TVFocusGuideView
            style={[
                styles.tvControlBar,
                {
                    opacity: tvUiVisible ? 1 : 0,
                    paddingBottom: 18 + insets.bottom,
                    paddingRight: 26 + insets.right,
                },
            ]}
            autoFocus
        >
            <ControlButton
                icon="backward-step"
                size={24}
                focused={ctrlFocused === 'prev'}
                onFocus={() => setCtrlFocused('prev')}
                onBlur={() => setCtrlFocused((c) => (c === 'prev' ? null : c))}
                onPress={prevChannel}
            />
            <ControlButton
                ref={registerPlayBtn}
                icon={paused ? 'play' : 'pause'}
                size={30}
                focused={ctrlFocused === 'play'}
                onFocus={() => setCtrlFocused('play')}
                onBlur={() => setCtrlFocused((c) => (c === 'play' ? null : c))}
                onPress={togglePause}
            />
            <ControlButton
                icon="forward-step"
                size={24}
                focused={ctrlFocused === 'next'}
                onFocus={() => setCtrlFocused('next')}
                onBlur={() => setCtrlFocused((c) => (c === 'next' ? null : c))}
                onPress={nextChannel}
            />
            <View style={styles.ctrlGap} />
            <ControlButton
                icon={muted ? 'volume-xmark' : 'volume-high'}
                size={24}
                focused={ctrlFocused === 'mute'}
                onFocus={() => setCtrlFocused('mute')}
                onBlur={() => setCtrlFocused((c) => (c === 'mute' ? null : c))}
                onPress={toggleMute}
            />
            <ControlButton
                icon={theater ? 'compress' : 'expand'}
                size={24}
                focused={ctrlFocused === 'theater'}
                onFocus={() => setCtrlFocused('theater')}
                onBlur={() => setCtrlFocused((c) => (c === 'theater' ? null : c))}
                onPress={toggleTheater}
            />
        </TVFocusGuideView>
    );
}
