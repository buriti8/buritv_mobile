import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

export default function LoadingScreen() {
    return (
        <View style={styles.loader}>
            <View style={styles.logoMark}>
                <Text style={styles.logoText}>
                    Buri<Text style={{ color: C.accentSoft }}>TV</Text>
                </Text>
            </View>
            <ActivityIndicator
                size="large"
                color={C.accentSoft}
                style={{ marginTop: 18 }}
            />
            <Text style={styles.loadingText}>Cargando canales…</Text>
        </View>
    );
}
