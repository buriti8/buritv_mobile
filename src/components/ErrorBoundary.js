import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

const RECOVER_MS = 1500;

/**
 * Red de seguridad: si algo de la interfaz falla, en vez de cerrar la app
 * (lo que pasa en release con un error de JS) muestra "Recuperando…" y
 * vuelve a montar todo a los pocos segundos.
 */
export default class ErrorBoundary extends React.Component {
    state = { error: null, attempt: 0 };
    timer = null;

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.log('[BuriTV] Error en la interfaz:', error?.message, info?.componentStack);
        clearTimeout(this.timer);
        this.timer = setTimeout(
            () => this.setState((s) => ({ error: null, attempt: s.attempt + 1 })),
            RECOVER_MS,
        );
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
    }

    render() {
        if (this.state.error) {
            return (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={C.accentSoft} />
                    <Text style={styles.loadingText}>Recuperando…</Text>
                </View>
            );
        }
        // key distinto en cada intento: monta todo desde cero
        return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
    }
}
