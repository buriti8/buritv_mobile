import React from 'react';
import ChannelPlate from './ChannelPlate';

/** Cabecera sobre el video en TV: la placa del canal, como el marcador de una transmisión. */
export default function InfoBar({ channel, sourceIndex, channelNumber, live }) {
    if (!channel) return null;
    const count = channel.sources.length;

    return (
        <ChannelPlate
            number={channelNumber > 0 ? channelNumber : null}
            channel={channel}
            sub={count > 1 ? `Opción ${sourceIndex + 1} de ${count}` : null}
            live={live}
        />
    );
}
