import React from 'react';
import { View } from 'react-native';
import { VLCPlayer } from 'react-native-vlc-media-player';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { Text } from 'react-native';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import CountdownDots from './CountdownDots';

export default function PlayerView({
    current,
    playerKey,
    paused,
    muted,
    vlcGlobalOpts,
    channelError,
    onProgress,
    onError,
    onStopped,
}) {
    return (
        <>
            {current && (
                <VLCPlayer
                    key={`${current.url}-${playerKey}`}
                    style={styles.player}
                    source={{ uri: current.url }}
                    paused={paused}
                    muted={muted}
                    onProgress={onProgress}
                    onError={onError}
                    onStopped={onStopped}
                    onEnd={onStopped}
                    initOptions={
                        current.vlcOpts
                            ? current.vlcOpts.map((o) => `--${o}`)
                            : vlcGlobalOpts
                    }
                />
            )}

            {channelError && (
                <View style={styles.errorOverlay}>
                    <FontAwesome6
                        name="triangle-exclamation"
                        size={isTV ? 50 : 30}
                        color={C.danger}
                        iconStyle="solid"
                    />
                    <Text style={[styles.errorTitle, isTV && styles.errorTitleTV]}>
                        Canal no disponible
                    </Text>
                    <Text style={[styles.errorSub, isTV && styles.errorSubTV]}>
                        Pasando al siguiente canal…
                    </Text>
                    <CountdownDots />
                </View>
            )}
        </>
    );
}
