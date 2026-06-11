import React from 'react';
import { Pressable } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

const ControlButton = React.forwardRef(function ControlButton(
    { icon, size, onPress, onFocus, onBlur, focused, hasTVPreferredFocus },
    ref,
) {
    return (
        <Pressable
            ref={ref}
            focusable={isTV}
            hasTVPreferredFocus={!!hasTVPreferredFocus}
            onPress={onPress}
            onFocus={onFocus}
            onBlur={onBlur}
            hitSlop={8}
            style={({ pressed }) => [
                styles.ctrlBtn,
                focused && styles.ctrlBtnFocused,
                pressed && !isTV && styles.ctrlBtnPressed,
            ]}
        >
            <FontAwesome6
                name={icon}
                size={size}
                color={focused ? C.white : '#e9e9e9'}
                iconStyle="solid"
            />
        </Pressable>
    );
});

export default ControlButton;
