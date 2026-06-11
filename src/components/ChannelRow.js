import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

const ChannelRow = React.forwardRef(function ChannelRow(
    {
        item,
        index,
        active,
        focused,
        onPress,
        onFocus,
        onBlur,
        hasTVPreferredFocus,
        nextFocusUp,
        nextFocusDown,
    },
    ref,
) {
    const logoSize = isTV ? 28 : 22;
    const [logoError, setLogoError] = useState(false);

    return (
        <Pressable
            ref={ref}
            focusable={isTV}
            hasTVPreferredFocus={!!hasTVPreferredFocus}
            nextFocusUp={nextFocusUp}
            nextFocusDown={nextFocusDown}
            onPress={onPress}
            onFocus={onFocus}
            onBlur={onBlur}
            android_ripple={!isTV ? { color: '#2a2a2a' } : undefined}
            style={({ pressed }) => [
                styles.item,
                isTV && styles.itemTV,
                active && styles.activeItem,
                focused && styles.focusedItem,
                pressed && !isTV && styles.pressedItem,
            ]}
        >
            <View
                style={[
                    styles.numBadge,
                    active && styles.numBadgeActive,
                    focused && styles.numBadgeFocused,
                ]}
            >
                <Text style={[styles.itemNum, (active || focused) && styles.itemNumOn]}>
                    {index + 1}
                </Text>
            </View>

            {item.logo && !logoError ? (
                <Image
                    source={{
                        uri: item.logo,
                        headers: { 'User-Agent': 'BuriTV/1.0' },
                    }}
                    style={[styles.channelLogo, { width: logoSize, height: logoSize }]}
                    resizeMode="contain"
                    onError={() => setLogoError(true)}
                />
            ) : null}

            <Text
                numberOfLines={1}
                style={[
                    styles.itemName,
                    isTV && styles.itemNameTV,
                    active && styles.activeText,
                    focused && styles.focusedText,
                ]}
            >
                {item.name}
            </Text>

            {active && (
                <FontAwesome6
                    name="signal"
                    size={isTV ? 14 : 11}
                    color={focused ? C.white : C.accentSoft}
                    iconStyle="solid"
                />
            )}
        </Pressable>
    );
});

export default ChannelRow;
