import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { LOGO_HEADERS } from '../constants/config';
import { plate as s } from '../styles/plate';

/**
 * Placa del canal al estilo del marcador de una transmisión deportiva:
 * bloques pegados (número · logo · nombre · en vivo) sobre una sola pieza.
 *
 *  size: 'tv' (cabecera del reproductor) | 'osd' (cambio de canal, grande)
 *        | 'mobile' (sobre el video en el celular)
 *  number puede ser texto ("1_" mientras se teclea un canal).
 */
export default function ChannelPlate({ number, channel, sub, live, warn, size = 'tv' }) {
    const [logoError, setLogoError] = useState(false);
    const big = size === 'osd';
    const small = size === 'mobile';

    return (
        <View style={s.row} pointerEvents="none">
            <View style={[s.plate, big && s.plateBig, small && s.plateSm]}>
                {number != null && (
                    <View style={[s.num, big && s.numBig, small && s.numSm, warn && s.numWarn]}>
                        <Text
                            style={[
                                s.numText,
                                big && s.numTextBig,
                                small && s.numTextSm,
                                warn && s.numTextWarn,
                            ]}
                        >
                            {number}
                        </Text>
                    </View>
                )}
                {channel?.logo && !logoError ? (
                    <View style={[s.logo, big && s.logoBig, small && s.logoSm]}>
                        <Image
                            source={{ uri: channel.logo, headers: LOGO_HEADERS }}
                            style={s.logoImg}
                            resizeMode="contain"
                            onError={() => setLogoError(true)}
                        />
                    </View>
                ) : null}
                {(channel || sub) && (
                    <View style={[s.body, big && s.bodyBig, small && s.bodySm]}>
                        {channel && (
                            <Text
                                numberOfLines={1}
                                style={[s.name, big && s.nameBig, small && s.nameSm]}
                            >
                                {channel.name}
                            </Text>
                        )}
                        {sub ? (
                            <Text
                                numberOfLines={1}
                                style={[s.sub, big && s.subBig, warn && s.subWarn]}
                            >
                                {sub}
                            </Text>
                        ) : null}
                    </View>
                )}
            </View>
            {live && (
                <View style={[s.live, small && s.liveSm]}>
                    <View style={s.liveDot} />
                    <Text style={[s.liveText, small && s.liveTextSm]}>En vivo</Text>
                </View>
            )}
        </View>
    );
}
