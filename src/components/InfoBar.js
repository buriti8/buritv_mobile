import React from 'react';
import { View, Text } from 'react-native';
import { CastButton } from 'react-native-google-cast';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

export default function InfoBar({ channelName }) {
    return (
        <View style={styles.topBar} pointerEvents="box-none">
            <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>EN VIVO</Text>
            </View>
            <Text
                style={[styles.channelTitle, isTV && styles.channelTitleTV]}
                numberOfLines={1}
            >
                {channelName || ''}
            </Text>
            {!isTV && (
                <CastButton style={{ width: 26, height: 26, tintColor: C.white }} />
            )}
        </View>
    );
}
