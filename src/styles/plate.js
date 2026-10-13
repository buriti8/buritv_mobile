import { StyleSheet } from 'react-native';
import { C } from '../constants/colors';
import { FONT_DISPLAY } from '../constants/config';

// Placa del canal (ChannelPlate). Medidas por tamaño:
//   tv 56 · osd 84 · mobile 34 de alto
export const plate = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'stretch',
        alignSelf: 'flex-start',
        maxWidth: '100%',
        gap: 4,
    },
    plate: {
        flexDirection: 'row',
        alignItems: 'stretch',
        flexShrink: 1,
        height: 56,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: C.scrim,
    },
    plateBig: {
        height: 84,
        borderRadius: 8,
    },
    plateSm: {
        height: 34,
        borderRadius: 5,
    },

    num: {
        minWidth: 52,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.accent,
    },
    numBig: {
        minWidth: 96,
        paddingHorizontal: 16,
    },
    numSm: {
        minWidth: 32,
        paddingHorizontal: 7,
    },
    numWarn: {
        backgroundColor: C.warning,
    },
    numText: {
        color: C.white,
        fontFamily: FONT_DISPLAY,
        fontSize: 30,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        includeFontPadding: false,
    },
    numTextBig: {
        fontSize: 54,
        letterSpacing: 2,
    },
    numTextSm: {
        fontSize: 18,
    },
    numTextWarn: {
        color: C.ink,
    },

    logo: {
        width: 56,
        padding: 7,
        backgroundColor: C.logoTile,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: C.logoTileLine,
    },
    logoBig: {
        width: 84,
        padding: 10,
    },
    logoSm: {
        width: 34,
        padding: 4,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },

    body: {
        flexShrink: 1,
        justifyContent: 'center',
        paddingLeft: 14,
        paddingRight: 18,
    },
    bodyBig: {
        paddingLeft: 20,
        paddingRight: 28,
    },
    bodySm: {
        paddingLeft: 9,
        paddingRight: 11,
    },
    name: {
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 24,
        fontWeight: '700',
        includeFontPadding: false,
    },
    nameBig: {
        fontSize: 36,
    },
    nameSm: {
        fontSize: 16,
    },
    sub: {
        color: C.textDim,
        fontSize: 13,
        marginTop: 1,
    },
    subBig: {
        fontSize: 17,
        marginTop: 3,
    },
    subWarn: {
        color: C.warning,
        fontWeight: '700',
    },

    live: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: C.live,
    },
    liveSm: {
        paddingHorizontal: 8,
        gap: 5,
        borderRadius: 5,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: C.white,
    },
    liveText: {
        color: C.white,
        fontFamily: FONT_DISPLAY,
        fontSize: 17,
        fontWeight: '700',
    },
    liveTextSm: {
        fontSize: 13,
    },
});
