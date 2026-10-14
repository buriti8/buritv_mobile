import { StyleSheet } from 'react-native';
import { C } from '../constants/colors';
import { TV_ROW_H, MOBILE_ROW_H, FONT_DISPLAY } from '../constants/config';

// Sistema visual "estadio de noche"
//  - Tipografía: Roboto Condensed (FONT_DISPLAY) para nombres, números y
//    títulos, como los marcadores de TV; Roboto normal para lo secundario.
//  - Escala TV (dp): 13 · 15 · 17 · 20 · 24 · 36 · 54   Móvil: 12 · 13 · 15 · 17 · 22
//  - Radios por jerarquía: 4–6 placas y segmentos, 8 filas y buscador,
//    círculo solo para los botones de reproducción.
//  - Foco en TV: blanco tiza con texto oscuro. Verde = lo que está sonando.

export const styles = StyleSheet.create({
    // ── Container ───────────────────────────────────────────────────────────

    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    containerTV: {
        flexDirection: 'row',
    },
    appRoot: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // ── Avisos breves (Toast) ───────────────────────────────────────────────

    toastWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 48,
        alignItems: 'center',
    },
    // En TV, por encima de la fila de botones del reproductor
    toastWrapTV: {
        bottom: 150,
    },
    toast: {
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 8,
        backgroundColor: C.surfaceHi,
        borderWidth: 1,
        borderColor: C.border,
    },
    toastTV: {
        paddingHorizontal: 26,
        paddingVertical: 14,
    },
    toastText: {
        color: C.text,
        fontSize: 14,
    },
    toastTextTV: {
        fontSize: 18,
    },
    pipRoot: {
        flex: 1,
        backgroundColor: '#000',
    },

    // ── Marca ───────────────────────────────────────────────────────────────

    brand: {
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 22,
        fontWeight: '700',
    },
    brandAccent: {
        color: C.accentSoft,
    },
    brandCount: {
        color: C.textMute,
        fontSize: 12,
    },

    // ── Loading ─────────────────────────────────────────────────────────────

    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: C.bg,
    },
    logoText: {
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 48,
        fontWeight: '700',
    },
    loaderSpinner: {
        marginTop: 22,
    },
    loadError: {
        alignItems: 'center',
        gap: 12,
        marginTop: 28,
        paddingHorizontal: 32,
    },
    loadErrorText: {
        color: C.text,
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    loadErrorSub: {
        color: C.textDim,
        fontSize: 14,
        marginBottom: 6,
    },
    loadingText: {
        color: C.textDim,
        marginTop: 12,
        fontSize: 14,
    },

    // ════════════ TV ════════════════════════════════════════════════════════

    tvListCol: {
        width: 300,
        backgroundColor: C.panel,
    },
    tvBrandBar: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 18,
    },
    tvPlayerCol: {
        flex: 1,
        backgroundColor: '#000',
    },
    tvVideoBox: {
        flex: 1,
        backgroundColor: '#000',
    },
    // Velo sobre el video mientras se ven los controles
    tvDim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: C.scrimSoft,
    },
    tvTopScrim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 26,
        paddingHorizontal: 32,
    },
    // Franja del logo: ↑ desde el buscador salta al último canal
    tvTopBridge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    // → desde la lista entra por aquí y salta a Play. Cubre solo la parte de
    // arriba del video, para no tapar los controles del centro ni los de abajo.
    tvFocusBridge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '62%',
    },
    tvKeyCatcher: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    // ── Banner de cambio de canal (TV) ──────────────────────────────────────

    osd: {
        position: 'absolute',
        top: 26,
        left: 32,
        right: 32,
    },

    // ── Controles sobre el video (TV) ───────────────────────────────────────

    tvControls: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    tvTransport: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
    },
    tvBottomRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingLeft: 32,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    tvUtilRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    // ── Opciones del canal (TV): "Opción [1][2][3][4]" ─────────────────────

    tvOptGroup: {
        gap: 8,
    },
    tvOptLabel: {
        color: C.chalk,
        fontSize: 15,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    tvOptSegments: {
        flexDirection: 'row',
        gap: 6,
    },
    tvSeg: {
        width: 52,
        height: 52,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.onVideo,
        borderWidth: 2,
        borderColor: C.onVideoLine,
    },
    tvSegCurrent: {
        backgroundColor: C.container,
        borderColor: C.accent,
    },
    tvSegFocused: {
        backgroundColor: C.focusFill,
        borderColor: C.focus,
        transform: [{ scale: 1.1 }],
    },
    tvSegText: {
        color: C.textDim,
        fontFamily: FONT_DISPLAY,
        fontSize: 24,
        fontWeight: '700',
        includeFontPadding: false,
    },
    tvSegTextCurrent: {
        color: C.onContainer,
    },
    tvSegTextFocused: {
        color: C.onFocus,
    },
    tvSegSignal: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: C.textDim,
    },
    signalOk: {
        backgroundColor: C.success,
    },
    signalBad: {
        backgroundColor: C.warning,
    },

    // ── Lista ───────────────────────────────────────────────────────────────

    list: {
        flex: 1,
    },
    listContentTV: {
        paddingTop: 6,
        paddingHorizontal: 8,
        paddingBottom: 40,
    },
    listContent: {
        paddingHorizontal: 8,
        paddingBottom: 24,
    },
    // Separador de categoría (mismo estilo que la web): barra verde a la
    // izquierda, línea arriba y abajo, nombre y cantidad
    sectionRow: {
        paddingTop: 8,
    },
    sectionBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 12,
        paddingRight: 12,
        backgroundColor: C.panel,
        borderLeftWidth: 3,
        borderLeftColor: C.accentSoft,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    sectionBarTop: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: C.border,
    },
    sectionBarTV: {
        paddingLeft: 10,
    },
    sectionChevronClosed: {
        transform: [{ rotate: '-90deg' }],
    },
    sectionName: {
        flex: 1,
        color: C.textDim,
        fontFamily: FONT_DISPLAY,
        fontSize: 13,
        fontWeight: '700',
    },
    sectionNameTV: {
        fontSize: 14,
    },
    sectionCount: {
        color: C.textMute,
        fontSize: 11,
        fontVariant: ['tabular-nums'],
    },
    sectionCountTV: {
        fontSize: 12,
    },

    // ── Fila de canal ───────────────────────────────────────────────────────
    // Filas planas, sin tarjeta: el número va en su columna, el que suena
    // lleva el número en el bloque verde de la placa y el foco es tiza.

    item: {
        height: MOBILE_ROW_H - 2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 2,
        gap: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemTV: {
        height: TV_ROW_H - 2,
    },
    activeItem: {
        backgroundColor: C.container,
    },
    focusedItem: {
        backgroundColor: C.focusFill,
        transform: [{ scale: 1.03 }],
        borderColor: C.focus,
    },
    itemNumBox: {
        minWidth: 30,
        height: 26,
        paddingHorizontal: 4,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemNumBoxActive: {
        backgroundColor: C.accent,
    },
    itemNum: {
        fontFamily: FONT_DISPLAY,
        fontSize: 16,
        fontWeight: '700',
        color: C.textMute,
        fontVariant: ['tabular-nums'],
        includeFontPadding: false,
    },
    itemNumTV: {
        fontSize: 15,
    },
    itemNumActive: {
        color: C.white,
    },
    itemNumFocused: {
        color: C.onFocus,
    },
    logoTile: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: C.logoTile,
        padding: 5,
        // Borde apenas visible: separa el logo de la fila enfocada (blanca)
        borderWidth: 1,
        borderColor: C.logoTileLine,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoTileTV: {
        width: 34,
        height: 34,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },
    logoFallback: {
        color: C.text,
        fontFamily: FONT_DISPLAY,
        fontSize: 14,
        fontWeight: '700',
    },
    itemBody: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        color: C.text,
        fontFamily: FONT_DISPLAY,
        fontSize: 17,
        fontWeight: '700',
    },
    itemNameTV: {
        fontSize: 17,
    },
    itemNameOn: {
        color: C.text,
    },
    itemNameFocused: {
        color: C.onFocus,
    },
    itemSub: {
        color: C.textMute,
        fontSize: 12,
        marginTop: 1,
    },
    itemSubActive: {
        color: C.onContainer,
    },
    itemSubFocused: {
        color: C.textDim,
    },

    // ── Player móvil ────────────────────────────────────────────────────────

    mobilePlayer: {
        backgroundColor: '#000',
    },
    mobilePlayerFs: {
        flex: 1,
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

    // Indicador al deslizar para cambiar volumen o brillo
    gestureHud: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: C.scrim,
    },
    gestureTrack: {
        width: 110,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: C.onVideoLine,
    },
    gestureFill: {
        height: '100%',
        backgroundColor: C.accentSoft,
    },
    gestureText: {
        minWidth: 38,
        color: C.chalk,
        fontSize: 13,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        textAlign: 'right',
    },

    // ── Lo que suena (móvil, bajo el video) ─────────────────────────────────

    mobileListWrap: {
        flex: 1,
        backgroundColor: C.bg,
    },
    nowSection: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        gap: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    nowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nowNum: {
        minWidth: 40,
        height: 40,
        paddingHorizontal: 6,
        borderRadius: 5,
        backgroundColor: C.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nowNumText: {
        color: C.white,
        fontFamily: FONT_DISPLAY,
        fontSize: 22,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        includeFontPadding: false,
    },
    nowTitle: {
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 22,
        fontWeight: '700',
    },
    nowStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 1,
    },
    nowStatusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: C.textMute,
    },
    nowStatusDotLive: {
        backgroundColor: C.live,
    },
    nowSub: {
        color: C.textDim,
        fontSize: 13,
    },
    nowSubLive: {
        color: C.text,
    },
    favBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.surface,
    },
    favBtnOn: {
        backgroundColor: 'rgba(240,180,60,0.14)',
    },

    // ── Selector de opción (móvil): "Opción [1][2][3]" ─────────────────────

    segGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    segLabel: {
        color: C.textDim,
        fontSize: 13,
    },
    segLabelOver: {
        color: C.chalk,
    },
    segTrack: {
        flexDirection: 'row',
        gap: 4,
        padding: 3,
        borderRadius: 7,
        backgroundColor: C.surface,
    },
    segTrackOver: {
        backgroundColor: C.onVideo,
    },
    seg: {
        minWidth: 38,
        height: 32,
        paddingHorizontal: 8,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segOn: {
        backgroundColor: C.container,
    },
    segText: {
        color: C.textDim,
        fontFamily: FONT_DISPLAY,
        fontSize: 17,
        fontWeight: '700',
        includeFontPadding: false,
    },
    segTextOn: {
        color: C.onContainer,
    },
    segSignal: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: C.textDim,
    },

    // ── Buscador y categorías ───────────────────────────────────────────────

    filters: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 4,
        gap: 10,
    },
    filtersTV: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 4,
        gap: 8,
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 44,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: C.surface,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    searchTV: {
        height: 40,
    },
    searchFocused: {
        borderColor: C.focus,
        backgroundColor: C.surfaceHi,
    },
    searchInput: {
        flex: 1,
        color: C.text,
        fontSize: 15,
        paddingVertical: 0,
    },
    searchInputTV: {
        fontSize: 15,
    },
    searchClear: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: C.textDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsRow: {
        gap: 6,
        paddingRight: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 6,
        backgroundColor: C.surface,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tabTV: {
        height: 34,
        paddingHorizontal: 13,
    },
    tabOn: {
        backgroundColor: C.container,
    },
    tabFocused: {
        backgroundColor: C.focusFill,
        transform: [{ scale: 1.06 }],
        borderColor: C.focus,
    },
    tabText: {
        color: C.textDim,
        fontFamily: FONT_DISPLAY,
        fontSize: 15,
        fontWeight: '700',
    },
    tabTextTV: {
        fontSize: 15,
    },
    tabTextOn: {
        color: C.onContainer,
    },
    tabTextFocused: {
        color: C.onFocus,
    },
    tabCount: {
        color: C.textMute,
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },
    tabCountOn: {
        color: C.onContainer,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        gap: 12,
    },
    emptyTitle: {
        color: C.textDim,
        fontSize: 15,
        textAlign: 'center',
    },
    emptyBtn: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: C.container,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emptyBtnFocused: {
        backgroundColor: C.focusFill,
        transform: [{ scale: 1.06 }],
        borderColor: C.focus,
    },
    emptyBtnText: {
        color: C.onContainer,
        fontSize: 14,
        fontWeight: '700',
    },

    // ── Overlay / controles (móvil) ─────────────────────────────────────────

    overlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
        backgroundColor: C.scrimSoft,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    topBarFs: {
        paddingTop: 16,
    },
    spacerShrink: {
        flex: 1,
        minWidth: 0,
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 34,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    bottomUtil: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    spacer: {
        flex: 1,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.onVideo,
        borderWidth: 2,
        borderColor: C.onVideoLine,
    },
    iconBtnLg: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    playBtnMobile: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.onVideo,
        borderWidth: 2,
        borderColor: C.onVideoLine,
    },

    // ── Botones de control TV ───────────────────────────────────────────────

    ctrlBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        // Tiza translúcida + borde: se lee igual sobre video claro u oscuro
        backgroundColor: C.onVideo,
        borderWidth: 2,
        borderColor: C.onVideoLine,
    },
    // Reproducción: mismo estilo que el resto (sin verde: el verde se leía
    // como "seleccionado"); Play solo un poco más grande por jerarquía
    ctrlBtnTransport: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    ctrlBtnPlay: {
        width: 68,
        height: 68,
        borderRadius: 34,
    },
    ctrlBtnPill: {
        width: undefined,
        paddingHorizontal: 20,
    },
    ctrlBtnFocused: {
        backgroundColor: C.focusFill,
        borderColor: C.focus,
        transform: [{ scale: 1.1 }],
    },
    ctrlBtnPressed: {
        opacity: 0.7,
    },
    ctrlLabel: {
        color: C.chalk,
        fontSize: 16,
        fontWeight: '700',
    },
    ctrlLabelFocused: {
        color: C.onFocus,
    },

    // ── Estado del stream (conectando / reconectando / sin señal) ──────────

    // Indicador discreto durante una reconexión breve (arriba a la derecha)
    quietSpinner: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.scrimSoft,
    },
    quietSpinnerTV: {
        top: 30,
        right: 32,
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    statusOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        backgroundColor: C.scrimSoft,
    },
    statusOverlayDark: {
        backgroundColor: C.scrim,
        paddingHorizontal: 24,
    },
    statusIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(240,180,60,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    statusTitle: {
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 18,
        fontWeight: '700',
    },
    statusTitleTV: {
        fontSize: 28,
    },
    statusSub: {
        color: C.textDim,
        fontSize: 13,
        textAlign: 'center',
    },
    statusSubTV: {
        fontSize: 17,
    },
    statusChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 5,
        backgroundColor: C.container,
    },
    statusChipText: {
        color: C.onContainer,
        fontSize: 12,
        fontWeight: '700',
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: C.container,
    },
    retryText: {
        color: C.onContainer,
        fontSize: 14,
        fontWeight: '700',
    },

    // ── Varios canales a la vez ─────────────────────────────────────────────

    multiOuter: {
        flex: 1,
        backgroundColor: '#000',
    },
    multiArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    multiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    multiTile: {
        backgroundColor: '#000',
        borderWidth: 2,
        borderColor: C.bg,
        overflow: 'hidden',
    },
    // El recuadro que tiene el sonido
    multiTileOn: {
        borderColor: C.accentSoft,
    },
    multiTileEmpty: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderStyle: 'dashed',
        borderColor: C.border,
        backgroundColor: C.bg,
    },
    multiEmptyText: {
        color: C.textMute,
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    multiEmptyTextTV: {
        fontSize: 17,
    },
    multiBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
        backgroundColor: C.scrim,
    },
    multiBarTV: {
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    multiNum: {
        minWidth: 20,
        height: 20,
        paddingHorizontal: 4,
        borderRadius: 3,
        backgroundColor: C.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    multiNumTV: {
        minWidth: 32,
        height: 32,
        borderRadius: 4,
    },
    multiNumText: {
        color: C.white,
        fontFamily: FONT_DISPLAY,
        fontSize: 13,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        includeFontPadding: false,
    },
    multiNumTextTV: {
        fontSize: 20,
    },
    multiName: {
        flex: 1,
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 13,
        fontWeight: '700',
    },
    multiNameTV: {
        fontSize: 21,
    },
    multiOpt: {
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 3,
        backgroundColor: C.container,
        alignItems: 'center',
        justifyContent: 'center',
    },
    multiOptTV: {
        height: 32,
        paddingHorizontal: 10,
    },
    multiOptText: {
        color: C.onContainer,
        fontSize: 11,
        fontWeight: '700',
    },
    multiOptTextTV: {
        fontSize: 16,
    },
    multiRemove: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.onVideo,
    },
    // Salir de pantalla completa / de varios canales (pantalla completa, móvil)
    multiFsBtns: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        gap: 10,
    },
    // Fila bajo el video en el celular (en lugar de "lo que suena")
    multiSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    multiIcon: {
        width: 40,
        height: 40,
        borderRadius: 5,
        backgroundColor: C.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    multiTitle: {
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 20,
        fontWeight: '700',
    },
    multiSub: {
        color: C.textDim,
        fontSize: 12,
    },
    multiExitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 38,
        paddingHorizontal: 14,
        borderRadius: 6,
        backgroundColor: C.container,
    },
    multiExitText: {
        color: C.onContainer,
        fontSize: 14,
        fontWeight: '700',
    },
    // Selector de canal (Modal)
    pickerHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    pickerTitle: {
        flex: 1,
        color: C.chalk,
        fontFamily: FONT_DISPLAY,
        fontSize: 22,
        fontWeight: '700',
    },
    // Barra bajo el video en TV
    multiTvBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#000',
    },
    multiTvButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    multiHint: {
        flexShrink: 1,
        color: C.textDim,
        fontSize: 15,
        textAlign: 'right',
    },
});
