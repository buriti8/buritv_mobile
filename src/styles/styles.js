import { StyleSheet } from 'react-native';
import { C } from '../constants/colors';
import { TV_ROW_H, MOBILE_ROW_H } from '../constants/config';

export const styles = StyleSheet.create({

    // ── Container ───────────────────────────────────────────────────────────

    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    containerTV: {
        flexDirection: 'row',
    },

    // ── Loading ─────────────────────────────────────────────────────────────

    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: C.bg,
    },
    logoMark: {
        paddingHorizontal: 4,
    },
    logoText: {
        color: C.white,
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    loadingText: {
        color: C.textDim,
        marginTop: 12,
        fontSize: 14,
    },

    // ════════════ TV ════════════════════════════════════════════════════════

    tvListCol: {
        width: 340,
        backgroundColor: C.panel,
        borderRightWidth: 1,
        borderRightColor: C.border,
    },
    tvBrandBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    tvBrand: {
        color: C.white,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    tvChannelCount: {
        color: C.textMute,
        fontSize: 12,
        fontWeight: '600',
    },
    tvPlayerCol: {
        flex: 1,
        backgroundColor: '#000',
    },
    tvVideoBox: {
        flex: 1,
        backgroundColor: '#000',
    },
    tvTopGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingBottom: 28,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    tvFocusBridge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 110,
    },
    tvControlBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 26,
        paddingVertical: 18,
        backgroundColor: 'rgba(0,0,0,0.6)',
        gap: 14,
    },
    ctrlGap: {
        flex: 1,
    },

    // ── Lista ───────────────────────────────────────────────────────────────

    list: {
        flex: 1,
    },
    listContentTV: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        paddingBottom: 24,
    },
    listContent: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        paddingBottom: 24,
    },

    // ── Fila de canal ───────────────────────────────────────────────────────

    item: {
        height: MOBILE_ROW_H - 4,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: C.item,
        borderRadius: 10,
        marginBottom: 4,
        borderWidth: 1.5,
        borderColor: 'transparent',
        gap: 10,
    },
    itemTV: {
        height: TV_ROW_H - 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
    },
    activeItem: {
        borderColor: C.accent,
        backgroundColor: C.itemActive,
    },
    focusedItem: {
        borderColor: C.white,
        backgroundColor: '#3a3a3a',
        transform: [{ scale: 1.03 }],
    },
    pressedItem: {
        backgroundColor: '#2a2a2a',
    },

    // ── Badge de número ─────────────────────────────────────────────────────

    numBadge: {
        minWidth: 26,
        height: 22,
        paddingHorizontal: 5,
        borderRadius: 5,
        backgroundColor: '#303030',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numBadgeActive: {
        backgroundColor: C.accent,
    },
    numBadgeFocused: {
        backgroundColor: C.white,
    },
    itemNum: {
        fontSize: 12,
        color: C.textDim,
        fontWeight: '700',
    },
    itemNumOn: {
        color: '#0b0b0b',
    },

    // ── Logo y nombre de canal ──────────────────────────────────────────────

    channelLogo: {
        borderRadius: 4,
        backgroundColor: '#252525',
    },
    itemName: {
        flex: 1,
        color: C.text,
        fontSize: 14,
    },
    itemNameTV: {
        fontSize: 17,
    },
    activeText: {
        color: C.white,
        fontWeight: '600',
    },
    focusedText: {
        color: C.white,
        fontWeight: '700',
    },

    // ── Player móvil ────────────────────────────────────────────────────────

    mobilePlayer: {
        height: 230,
        backgroundColor: '#000',
    },
    mobilePlayerFs: {
        flex: 1,
        height: undefined,
    },
    player: {
        width: '100%',
        height: '100%',
    },
    videoTouchable: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },

    // ── Lista móvil ─────────────────────────────────────────────────────────

    mobileListWrap: {
        flex: 1,
        backgroundColor: C.panel,
    },
    mobileListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    mobileBrand: {
        color: C.white,
        fontSize: 18,
        fontWeight: '800',
    },

    // ── Overlay / controls ──────────────────────────────────────────────────

    overlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    topBarFs: {
        paddingTop: 14,
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    spacer: {
        flex: 1,
    },

    // ── Badges y títulos ────────────────────────────────────────────────────

    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: C.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    liveText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    channelTitle: {
        flex: 1,
        color: C.white,
        fontSize: 14,
        fontWeight: '600',
    },
    channelTitleTV: {
        fontSize: 20,
        flex: 0,
        maxWidth: '70%',
    },

    // ── Botones ─────────────────────────────────────────────────────────────

    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    playBtnMobile: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },

    // ── Botones de control TV ───────────────────────────────────────────────

    ctrlBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    ctrlBtnFocused: {
        borderColor: C.white,
        backgroundColor: C.accent,
        transform: [{ scale: 1.12 }],
    },
    ctrlBtnPressed: {
        opacity: 0.7,
    },

    // ── Error overlay ───────────────────────────────────────────────────────

    errorOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    errorTitle: {
        color: C.white,
        fontSize: 16,
        fontWeight: '700',
    },
    errorTitleTV: {
        fontSize: 24,
    },
    errorSub: {
        color: C.textDim,
        fontSize: 13,
    },
    errorSubTV: {
        fontSize: 17,
    },
    errorDots: {
        color: C.danger,
        fontSize: 16,
        letterSpacing: 4,
        marginTop: 6,
    },
});
