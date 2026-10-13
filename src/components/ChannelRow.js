import React, { useState, useCallback } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV, LOGO_HEADERS } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

/**
 * Fila de canal. El foco se guarda aquí (estado local) para que moverse por
 * la lista con el control remoto solo re-renderice las dos filas afectadas
 * y no toda la app.
 * Mantener presionado (OK en el control remoto) marca/desmarca favorito.
 */
const ChannelRow = React.memo(
    React.forwardRef(function ChannelRow(
        { item, index, active, favorite, onPress, onLongPress, onFocusIndex, hasTVPreferredFocus, nextFocusUp, nextFocusDown, nextFocusLeft, nextFocusRight },
        ref,
    ) {
        const [focused, setFocused] = useState(false);
        const [logoError, setLogoError] = useState(false);
        const count = item.sources.length;

        const handleFocus = useCallback(() => {
            setFocused(true);
            onFocusIndex?.(index);
        }, [onFocusIndex, index]);
        const handleBlur = useCallback(() => setFocused(false), []);
        const handlePress = useCallback(() => onPress(item), [onPress, item]);
        const handleLongPress = useCallback(() => onLongPress?.(item), [onLongPress, item]);

        return (
            <Pressable
                ref={ref}
                focusable={isTV}
                hasTVPreferredFocus={!!hasTVPreferredFocus}
                nextFocusUp={nextFocusUp}
                nextFocusDown={nextFocusDown}
                nextFocusLeft={nextFocusLeft}
                nextFocusRight={nextFocusRight}
                onPress={handlePress}
                onLongPress={onLongPress ? handleLongPress : undefined}
                delayLongPress={600}
                onFocus={handleFocus}
                onBlur={handleBlur}
                android_ripple={!isTV ? { color: C.accentTint } : undefined}
                style={[
                    styles.item,
                    isTV && styles.itemTV,
                    active && styles.activeItem,
                    focused && styles.focusedItem,
                ]}
            >
                {/* El número del canal que suena va en el bloque verde de la placa */}
                <View style={[styles.itemNumBox, active && !focused && styles.itemNumBoxActive]}>
                    <Text
                        style={[
                            styles.itemNum,
                            isTV && styles.itemNumTV,
                            active && styles.itemNumActive,
                            focused && styles.itemNumFocused,
                        ]}
                    >
                        {index + 1}
                    </Text>
                </View>

                <View style={[styles.logoTile, isTV && styles.logoTileTV]}>
                    {item.logo && !logoError ? (
                        <Image
                            source={{ uri: item.logo, headers: LOGO_HEADERS }}
                            style={styles.logoImg}
                            resizeMode="contain"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <Text style={styles.logoFallback}>{item.name.slice(0, 2)}</Text>
                    )}
                </View>

                <View style={styles.itemBody}>
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.itemName,
                            isTV && styles.itemNameTV,
                            active && styles.itemNameOn,
                            focused && styles.itemNameFocused,
                        ]}
                    >
                        {item.name}
                    </Text>
                    {(active || count > 1) && (
                        <Text
                            numberOfLines={1}
                            style={[styles.itemSub, active && styles.itemSubActive, focused && styles.itemSubFocused]}
                        >
                            {active ? 'Reproduciendo' : `${count} opciones`}
                        </Text>
                    )}
                </View>

                {favorite && (
                    <FontAwesome6
                        name="star"
                        size={isTV ? 14 : 12}
                        color={C.favorite}
                        iconStyle="solid"
                    />
                )}

                {active && (
                    <FontAwesome6
                        name="volume-high"
                        size={isTV ? 15 : 13}
                        color={C.accentSoft}
                        iconStyle="solid"
                    />
                )}
            </Pressable>
        );
    }),
);

export default ChannelRow;
