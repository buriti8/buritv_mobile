import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

/**
 * Pantalla de arranque. Si la lista no se pudo descargar (y no hay copia
 * guardada) muestra el problema y un botón para reintentar; mientras tanto
 * la app sigue reintentando sola.
 */
export default function LoadingScreen({ error, onRetry }) {
    return (
        <View style={styles.loader}>
            <Text style={styles.logoText}>
                Buri<Text style={styles.brandAccent}>TV</Text>
            </Text>

            {error ? (
                <View style={styles.loadError}>
                    <FontAwesome6 name="wifi" size={isTV ? 30 : 24} color={C.warning} iconStyle="solid" />
                    <Text style={styles.loadErrorText}>{error.message}</Text>
                    <Text style={styles.loadErrorSub}>
                        Reintentamos solos en {Math.round(error.retryIn / 1000)} s
                    </Text>
                    <Pressable
                        focusable={isTV}
                        hasTVPreferredFocus
                        onPress={onRetry}
                        style={({ focused, pressed }) => [
                            styles.emptyBtn,
                            (focused || pressed) && styles.emptyBtnFocused,
                        ]}
                    >
                        <Text style={styles.emptyBtnText}>Reintentar ahora</Text>
                    </Pressable>
                </View>
            ) : (
                <>
                    <ActivityIndicator size="large" color={C.accentSoft} style={styles.loaderSpinner} />
                    <Text style={styles.loadingText}>Cargando canales…</Text>
                </>
            )}
        </View>
    );
}
