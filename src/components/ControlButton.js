import React from 'react';
import { Pressable, Text } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

/**
 * Botón redondo de los controles de TV.
 *  variant: 'util' (sonido, favorito…) | 'transport' (canal ±) | 'play'
 *  accent:  'favorite' pinta el ícono en ámbar (canal marcado)
 * Enfocado: anillo blanco sobre fondo oscuro, como el resto del foco.
 */
const ControlButton = React.forwardRef(function ControlButton(
    {
        icon,
        size,
        label,
        variant = 'util',
        accent,
        iconStyle = 'solid',
        onPress,
        onFocus,
        onBlur,
        focused,
        hasTVPreferredFocus,
        nextFocusDown,
    },
    ref,
) {
    const iconColor = focused
        ? C.onFocus
        : accent === 'favorite'
        ? C.favorite
        : C.chalk;
    return (
        <Pressable
            ref={ref}
            focusable={isTV}
            hasTVPreferredFocus={!!hasTVPreferredFocus}
            nextFocusDown={nextFocusDown ?? undefined}
            onPress={onPress}
            onFocus={onFocus}
            onBlur={onBlur}
            hitSlop={8}
            style={({ pressed }) => [
                styles.ctrlBtn,
                variant === 'transport' && styles.ctrlBtnTransport,
                variant === 'play' && styles.ctrlBtnPlay,
                label && styles.ctrlBtnPill,
                focused && styles.ctrlBtnFocused,
                pressed && !isTV && styles.ctrlBtnPressed,
            ]}
        >
            <FontAwesome6 name={icon} size={size} color={iconColor} iconStyle={iconStyle} />
            {label ? (
                <Text style={[styles.ctrlLabel, focused && styles.ctrlLabelFocused]}>{label}</Text>
            ) : null}
        </Pressable>
    );
});

export default ControlButton;
