import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StatusBar,
    BackHandler,
    useWindowDimensions,
    findNodeHandle,
    TVFocusGuideView,
    UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TV_ROW_H, TV_SECTION_H, TV_HEADER_H } from '../constants/config';
import { styles } from '../styles/styles';
import ChannelRow from '../components/ChannelRow';
import SectionHeader from '../components/SectionHeader';
import PlayerView from '../components/PlayerView';
import InfoBar from '../components/InfoBar';
import TVControlBar from '../components/TVControlBar';
import ChannelFilters, { EmptyResults } from '../components/ChannelFilters';
import ZapOSD from '../components/ZapOSD';
import MultiView from '../components/MultiView';
import { MultiTVBar } from '../components/MultiBars';
import useChannelFilter, { ALL } from '../hooks/useChannelFilter';

const LIST_PAD_TOP = 6;

export default function TVLayout({
    channels,
    current,
    currentIndex,
    sourceIndex,
    status,
    paused,
    muted,
    theater,
    playerProps,
    // TV controls
    ctrlFocused,
    setCtrlFocused,
    playNode,
    registerPlayBtn,
    registerTheaterBtn,
    tvUiVisible,
    hideTvUi,
    tvPing,
    osd,
    // Actions
    selectChannel,
    selectSource,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    toggleTheater,
    favorites,
    toggleFavorite,
    // Varios canales a la vez
    multi,
    multiProps,
    onEnterMulti,
}) {
    const { height: winH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // En pantalla completa, con los controles ocultos, no se dejan enfocables
    // (en varios canales la barra de abajo siempre está a la vista)
    const controlsHidden = theater && !tvUiVisible && !multi.active;
    // La barra se desmonta sin disparar blur: olvidar el botón enfocado
    useEffect(() => {
        if (controlsHidden) setCtrlFocused(null);
    }, [controlsHidden, setCtrlFocused]);
    const filter = useChannelFilter(channels, favorites);
    const { filtering, clear } = filter;
    const [listH, setListH] = useState(0);
    // ← desde la lista lleva a la pestaña activa (o al buscador)
    const [filtersNode, setFiltersNode] = useState(null);
    // ↑ desde el buscador lleva al último canal de la lista
    const [lastRow, setLastRow] = useState(null);
    // → desde cualquier canal entra directo a Play (no al botón más cercano)
    const [playId, setPlayId] = useState(null);
    useEffect(() => {
        const t = setTimeout(() => setPlayId(playNode ? findNodeHandle(playNode) : null), 200);
        return () => clearTimeout(t);
    }, [playNode]);
    const toggleRowFavorite = useCallback(ch => toggleFavorite(ch?.id), [toggleFavorite]);
    const toggleCurrentFavorite = useCallback(
        () => toggleFavorite(current?.id),
        [toggleFavorite, current?.id],
    );

    // Atrás desde los controles del reproductor → vuelve a la lista, al canal
    // que está sonando (se registra después: tiene prioridad sobre el filtro)
    const focusListRef = useRef(null);
    const inControls = !theater && ctrlFocused != null;
    useEffect(() => {
        if (!inControls) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            focusListRef.current?.();
            return true;
        });
        return () => sub.remove();
    }, [inControls]);

    // Atrás con un filtro activo → primero vuelve a mostrar todos los canales
    useEffect(() => {
        if (theater || !filtering) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            clear();
            return true;
        });
        return () => sub.remove();
    }, [theater, filtering, clear]);

    return (
        <SafeAreaView
            style={[styles.container, styles.containerTV]}
            edges={['top', 'bottom', 'left', 'right']}
        >
            <StatusBar hidden />

            {!theater && (
                <View style={[styles.tvListCol, { height: winH }]}>
                    <View style={[styles.tvBrandBar, { height: TV_HEADER_H }]}>
                        <Text style={styles.brand}>
                            Buri<Text style={styles.brandAccent}>TV</Text>
                        </Text>
                        <Text style={styles.brandCount}>{channels.length} canales</Text>
                        {/* ↑ desde el buscador: el foco entra aquí y salta al último
                            canal (la lista es un círculo: canales → filtros → canales) */}
                        {lastRow && filter.items.length > 0 && (
                            <TVFocusGuideView style={styles.tvTopBridge} destinations={[lastRow]} />
                        )}
                    </View>
                    <ChannelFilters
                        filter={filter}
                        totalCount={channels.length}
                        onLeftTarget={setFiltersNode}
                    />
                    <View style={styles.list} onLayout={e => setListH(e.nativeEvent.layout.height)}>
                        {!filter.ready ? null : filter.items.length ? (
                            listH > 0 && (
                                <TVChannelList
                                    items={filter.items}
                                    filterKey={`${filter.category}|${filter.query.trim()}`}
                                    showSections={filter.category === ALL && !filter.query.trim()}
                                    currentId={current?.id}
                                    activeIds={multi.activeIds}
                                    favorites={favorites}
                                    initialIndex={currentIndex}
                                    height={listH}
                                    onSelect={selectChannel}
                                    onToggleFavorite={toggleRowFavorite}
                                    onRowFocus={hideTvUi}
                                    leftTargetId={filtersNode}
                                    rightTargetId={playId}
                                    focusRef={focusListRef}
                                    onLastRow={setLastRow}
                                />
                            )
                        ) : (
                            <EmptyResults query={filter.query.trim()} onClear={clear} />
                        )}
                    </View>
                </View>
            )}

            <View style={styles.tvPlayerCol}>
                <View style={styles.tvVideoBox}>
                    {multi.active ? (
                        <MultiView
                            tiles={multi.tiles}
                            channels={channels}
                            focusId={multi.focusId}
                            max={multi.max}
                            onListen={multi.setFocusId}
                            onRemove={multi.remove}
                            onAdd={multi.openPicker}
                            onPick={multi.pick}
                            onClosePicker={multi.closePicker}
                            picking={multi.picking}
                            activeIds={multi.activeIds}
                            favorites={favorites}
                            {...multiProps}
                        />
                    ) : (
                        <PlayerView {...playerProps} />
                    )}
                    {/* Con los controles a la vista se oscurece el video para que
                        los botones del centro se lean sobre cualquier imagen */}
                    {!multi.active && (
                        <>
                            <View
                                style={[styles.tvDim, { opacity: tvUiVisible && !osd ? 1 : 0 }]}
                                pointerEvents="none"
                            />
                            <View
                                style={[
                                    styles.tvTopScrim,
                                    {
                                        opacity:
                                            !osd && (tvUiVisible || status !== 'playing') ? 1 : 0,
                                    },
                                ]}
                                pointerEvents="none"
                            >
                                <InfoBar
                                    channel={current}
                                    sourceIndex={sourceIndex}
                                    channelNumber={currentIndex + 1}
                                    live={status === 'playing'}
                                />
                            </View>
                        </>
                    )}
                    <ZapOSD osd={osd} channels={channels} />
                    {/* Pantalla completa sin controles: este receptor tiene el foco,
                        así ↑/↓ y ←/→ llegan al control remoto (canal / opción) y OK
                        muestra los controles */}
                    {controlsHidden && (
                        <Pressable
                            focusable
                            hasTVPreferredFocus
                            style={styles.tvKeyCatcher}
                            onPress={tvPing}
                        />
                    )}
                    {!theater && !multi.active && playNode && (
                        <TVFocusGuideView style={styles.tvFocusBridge} destinations={[playNode]} />
                    )}
                </View>
                {multi.active && (
                    <MultiTVBar
                        count={multi.tiles.length}
                        max={multi.max}
                        muted={muted}
                        theater={theater}
                        ctrlFocused={ctrlFocused}
                        setCtrlFocused={setCtrlFocused}
                        registerTheaterBtn={registerTheaterBtn}
                        toggleMute={toggleMute}
                        toggleTheater={toggleTheater}
                        onAdd={multi.openPicker}
                        onExit={multi.exit}
                    />
                )}
                {!multi.active && !controlsHidden && (
                    <TVControlBar
                        preferPlay={theater}
                        tvUiVisible={tvUiVisible}
                        insets={insets}
                        ctrlFocused={ctrlFocused}
                        setCtrlFocused={setCtrlFocused}
                        registerPlayBtn={registerPlayBtn}
                        registerTheaterBtn={registerTheaterBtn}
                        paused={paused}
                        muted={muted}
                        channel={current}
                        sourceIndex={sourceIndex}
                        status={status}
                        selectSource={selectSource}
                        prevChannel={prevChannel}
                        nextChannel={nextChannel}
                        togglePause={togglePause}
                        toggleMute={toggleMute}
                        theater={theater}
                        toggleTheater={toggleTheater}
                        favorite={!!current && favorites.has(current.id)}
                        toggleFavorite={toggleCurrentFavorite}
                        onMulti={onEnterMulti}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

/**
 * Lista de canales para TV (ya filtrada).
 *  - Filas memoizadas: mover el foco solo re-renderiza las filas afectadas.
 *  - Navegación en círculo: ↓ en el último canal vuelve al primero; ↑ en
 *    el primero sube a las pestañas de categoría (luego al buscador y de
 *    ahí al último canal). ← también lleva a las pestañas / buscador.
 *  - Mantiene la fila enfocada centrada; si se mantiene apretada la flecha
 *    el scroll deja de animarse para no acumular animaciones.
 */
const TVChannelList = React.memo(function TVChannelList({
    items,
    filterKey,
    showSections,
    currentId,
    activeIds,
    favorites,
    initialIndex,
    height,
    onSelect,
    onToggleFavorite,
    onRowFocus,
    leftTargetId,
    rightTargetId,
    onLastRow,
    focusRef,
}) {
    // Varios canales: están "activos" todos los que hay en pantalla
    const isActive = id => (activeIds ? activeIds.has(id) : id === currentId);
    const scrollRef = useRef(null);
    const firstRowRef = useRef(null);
    const lastFocusAt = useRef(0);
    const lastRowRef = useRef(null);
    const activeRowRef = useRef(null);

    // Para "Atrás" desde el reproductor: enfocar el canal que suena (o el
    // primero, si el filtro actual no lo incluye)
    useEffect(() => {
        if (!focusRef) return;
        focusRef.current = () => {
            const row = activeRowRef.current ?? firstRowRef.current;
            const tag = row && findNodeHandle(row);
            // El ref del Pressable no trae requestTVFocus(): se pide directo
            // al view manager (ReactViewManager atiende "requestTVFocus")
            if (tag != null) UIManager.dispatchViewManagerCommand(tag, 'requestTVFocus', []);
        };
        return () => {
            focusRef.current = null;
        };
    }, [focusRef]);
    const [firstId, setFirstId] = useState(null);
    // Foco inicial: solo al montar (no robar el foco al cambiar de canal)
    const [preferredIndex] = useState(() => Math.max(0, initialIndex));
    // hasTVPreferredFocus solo vale al abrir la lista. Si se dejara puesto,
    // al cambiar de categoría la fila del canal en reproducción se vuelve a
    // montar y le roba el foco a las pestañas.
    const [initialFocusDone, setInitialFocusDone] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setInitialFocusDone(true), 800);
        return () => clearTimeout(t);
    }, []);

    const { rows, offsets } = useMemo(() => {
        const out = [];
        const ys = {};
        const counts = {};
        if (showSections) {
            items.forEach(({ ch }) => {
                if (ch.group) counts[ch.group] = (counts[ch.group] || 0) + 1;
            });
        }
        let y = LIST_PAD_TOP;
        let lastGroup;
        items.forEach(({ ch, index }) => {
            if (showSections && ch.group && ch.group !== lastGroup) {
                out.push({
                    type: 'header',
                    title: ch.group,
                    count: counts[ch.group],
                    first: out.length === 0,
                    key: `h-${index}`,
                });
                y += TV_SECTION_H;
                lastGroup = ch.group;
            }
            out.push({ type: 'channel', ch, index, key: ch.id });
            ys[index] = y;
            y += TV_ROW_H;
        });
        return { rows: out, offsets: ys };
    }, [items, showSections]);

    const firstIndex = items[0]?.index;
    const lastIndex = items[items.length - 1]?.index;

    useEffect(() => {
        const timer = setTimeout(() => {
            setFirstId(findNodeHandle(firstRowRef.current));
            onLastRow?.(lastRowRef.current);
        }, 300);
        return () => clearTimeout(timer);
    }, [firstIndex, lastIndex, onLastRow]);

    // La lista se desmonta (pantalla completa): olvidar el último canal
    useEffect(() => () => onLastRow?.(null), [onLastRow]);

    // Al cambiar el filtro (categoría o búsqueda), volver arriba. No con
    // cualquier cambio de items: también cambian al cargar los favoritos o
    // al llegar la lista actualizada, y eso mandaba la lista al inicio.
    const mounted = useRef(false);
    useEffect(() => {
        if (mounted.current) scrollRef.current?.scrollTo({ y: 0, animated: false });
        mounted.current = true;
    }, [filterKey]);

    const scrollToIndex = useCallback(
        index => {
            const y = offsets[index];
            if (y == null) return;
            const now = Date.now();
            const rapid = now - lastFocusAt.current < 180;
            lastFocusAt.current = now;
            scrollRef.current?.scrollTo({
                y: Math.max(0, y - height / 2 + TV_ROW_H / 2),
                animated: !rapid,
            });
        },
        [offsets, height],
    );

    // Al abrir: dejar centrado el canal que suena. Se hace cuando el
    // contenido ya está medido (antes, el scroll se perdía si la lista aún
    // no tenía alto y quedaba arriba del todo).
    const initialScrollDone = useRef(false);
    const handleContentSize = useCallback(
        (w, h) => {
            if (initialScrollDone.current || !h) return;
            initialScrollDone.current = true;
            const y = offsets[preferredIndex];
            if (y == null) return;
            scrollRef.current?.scrollTo({
                y: Math.max(0, Math.min(y - height / 2 + TV_ROW_H / 2, h - height)),
                animated: false,
            });
        },
        [offsets, preferredIndex, height],
    );

    const handleFocusIndex = useCallback(
        index => {
            scrollToIndex(index);
            onRowFocus();
        },
        [scrollToIndex, onRowFocus],
    );

    return (
        <TVFocusGuideView style={{ height }} autoFocus>
            <ScrollView
                ref={scrollRef}
                style={{ height }}
                contentContainerStyle={styles.listContentTV}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={handleContentSize}
            >
                {rows.map(row =>
                    row.type === 'header' ? (
                        <SectionHeader
                            key={row.key}
                            tv
                            title={row.title}
                            count={row.count}
                            first={row.first}
                            height={TV_SECTION_H}
                        />
                    ) : (
                        <ChannelRow
                            key={row.key}
                            ref={
                                row.index === firstIndex ||
                                row.index === lastIndex ||
                                isActive(row.ch.id)
                                    ? node => {
                                          // Con un solo canal es a la vez el primero y el último
                                          if (row.index === firstIndex) firstRowRef.current = node;
                                          if (row.index === lastIndex) lastRowRef.current = node;
                                          if (isActive(row.ch.id)) activeRowRef.current = node;
                                          else if (activeRowRef.current === node)
                                              activeRowRef.current = null;
                                      }
                                    : undefined
                            }
                            item={row.ch}
                            index={row.index}
                            active={isActive(row.ch.id)}
                            favorite={favorites.has(row.ch.id)}
                            hasTVPreferredFocus={!initialFocusDone && row.index === preferredIndex}
                            nextFocusUp={
                                row.index === firstIndex ? leftTargetId ?? undefined : undefined
                            }
                            nextFocusDown={
                                row.index === lastIndex ? firstId ?? undefined : undefined
                            }
                            nextFocusLeft={leftTargetId ?? undefined}
                            nextFocusRight={rightTargetId ?? undefined}
                            onFocusIndex={handleFocusIndex}
                            onPress={onSelect}
                            onLongPress={onToggleFavorite}
                        />
                    ),
                )}
            </ScrollView>
        </TVFocusGuideView>
    );
});
