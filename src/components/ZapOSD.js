import React, { useEffect, useRef } from 'react';
import { Animated, Easing, AccessibilityInfo } from 'react-native';
import { styles } from '../styles/styles';
import ChannelPlate from './ChannelPlate';

/**
 * Banner de cambio de canal (TV): la placa del canal en grande, como en un
 * decodificador. También muestra los números que se van tecleando y la
 * opción elegida con ←/→. Entra deslizándose desde la izquierda (es la
 * única animación del reproductor: responde a la tecla del control).
 */
export default function ZapOSD({ osd, channels }) {
    const slide = useRef(new Animated.Value(0)).current;
    const visible = !!osd;

    useEffect(() => {
        if (!visible) {
            slide.setValue(0);
            return;
        }
        let cancelled = false;
        AccessibilityInfo.isReduceMotionEnabled()
            .catch(() => false)
            .then(reduce => {
                if (cancelled) return;
                if (reduce) slide.setValue(1);
                else
                    Animated.timing(slide, {
                        toValue: 1,
                        duration: 220,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }).start();
            });
        return () => {
            cancelled = true;
        };
    }, [visible, slide]);

    if (!osd) return null;
    const ch = osd.index >= 0 ? channels[osd.index] : null;

    const number =
        osd.kind === 'digits' ? osd.digits.padEnd(osd.maxLen, '_') : String(osd.index + 1);

    let sub = null;
    if (osd.kind === 'digits' && osd.invalid) sub = 'Ese canal no existe';
    else if (osd.kind === 'option') sub = `Opción ${osd.option + 1} de ${osd.count}`;
    else if (ch && ch.sources.length > 1) sub = `${ch.sources.length} opciones`;

    return (
        <Animated.View
            style={[
                styles.osd,
                {
                    opacity: slide,
                    transform: [
                        {
                            translateX: slide.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-40, 0],
                            }),
                        },
                    ],
                },
            ]}
            pointerEvents="none"
        >
            <ChannelPlate
                size="osd"
                number={number}
                channel={osd.invalid ? null : ch}
                sub={sub}
                warn={!!osd.invalid}
            />
        </Animated.View>
    );
}
