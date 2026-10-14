import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

/**
 * Separador de categoría de la lista (mismo estilo que la web): barra verde a
 * la izquierda, línea arriba y abajo, nombre y cantidad de canales.
 *  onToggle: solo en el celular — la categoría se pliega y se despliega
 *            (TV no la lleva: con el control remoto sería un foco de más).
 *  height:   alto fijo de la fila (la lista calcula posiciones con él)
 */
export default function SectionHeader({ title, count, first, collapsed, onToggle, tv, height }) {
    const bar = (
        <View style={[styles.sectionBar, !first && styles.sectionBarTop, tv && styles.sectionBarTV]}>
            {onToggle && (
                <FontAwesome6
                    name="chevron-down"
                    size={13}
                    color={C.textDim}
                    iconStyle="solid"
                    style={collapsed ? styles.sectionChevronClosed : undefined}
                />
            )}
            <Text style={[styles.sectionName, tv && styles.sectionNameTV]} numberOfLines={1}>
                {title}
            </Text>
            {count != null && (
                <Text style={[styles.sectionCount, tv && styles.sectionCountTV]}>{count}</Text>
            )}
        </View>
    );
    if (!onToggle) return <View style={[styles.sectionRow, { height }]}>{bar}</View>;
    return (
        <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: !collapsed }}
            accessibilityLabel={`${title}, ${count} canales`}
            style={({ pressed }) => [styles.sectionRow, { height }, pressed && styles.ctrlBtnPressed]}
        >
            {bar}
        </Pressable>
    );
}
