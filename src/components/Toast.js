import React from 'react';
import { View, Text } from 'react-native';
import { isTV } from '../constants/config';
import { styles } from '../styles/styles';
import { useToast } from '../utils/toast';

/** Aviso breve abajo al centro (ver src/utils/toast.js). */
export default function Toast() {
    const text = useToast();
    if (!text) return null;
    return (
        <View style={[styles.toastWrap, isTV && styles.toastWrapTV]} pointerEvents="none">
            <View style={[styles.toast, isTV && styles.toastTV]}>
                <Text style={[styles.toastText, isTV && styles.toastTextTV]}>{text}</Text>
            </View>
        </View>
    );
}
