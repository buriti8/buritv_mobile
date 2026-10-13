import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StatusBar,
    Pressable,
    Keyboard,
    BackHandler,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { MOBILE_ROW_H, MOBILE_SECTION_H } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import ChannelRow from '../components/ChannelRow';
import PlayerView from '../components/PlayerView';
import MobileControls from '../components/MobileControls';
import OptionSegments from '../components/OptionSegments';
import ChannelFilters, { EmptyResults } from '../components/ChannelFilters';
import useChannelFilter, { ALL } from '../hooks/useChannelFilter';

export default function MobileLayout({
    channels,
    current,
    currentIndex,
    sourceIndex,
    status,
    paused,
    muted,
    playerProps,
    fullscreen,
    controlsVisible,
    inPip,
    // Actions
    selectChannel,
    selectSource,
    prevChannel,
    nextChannel,
    togglePause,
    toggleMute,
    toggleFullscreen,
    exitFullscreen,
    handleVideoPress,
    favorites,
    toggleFavorite,
}) {
    const { width } = useWindowDimensions();
    const count = current?.sources.length ?? 0;

    const filter = useChannelFilter(channels, favorites);
    const showSections = filter.category === ALL && !filter.query.trim();

    // Filas de la lista (filtradas); los títulos de sección solo sin filtro
    // (con su posición: alturas fijas, así la lista sabe dónde está cada fila)
    const rows = useMemo(() => {
        const out = [];
        let lastGroup;
        let y = 0;
        const push = (row, h) => {
            out.push({ ...row, y, h });
            y += h;
        };
        filter.items.forEach(({ ch, index }) => {
            if (showSections && ch.group && ch.group !== lastGroup) {
                push({ type: 'header', title: ch.group, key: `h-${index}` }, MOBILE_SECTION_H);
                lastGroup = ch.group;
            }
            push({ type: 'channel', ch, index, key: ch.id }, MOBILE_ROW_H);
        });
        return out;
    }, [filter.items, showSections]);

    const getItemLayout = useCallback(
        (data, i) => ({ length: data[i].h, offset: data[i].y, index: i }),
        [],
    );

    // Al abrir (y al volver de pantalla completa, que vuelve a montar la
    // lista): dejar centrado el canal que suena
    const listRef = useRef(null);
    const initialScrollDone = useRef(false);
    const currentId = current?.id;
    const handleListLayout = useCallback(
        e => {
            if (initialScrollDone.current) return;
            const row = rows.find(r => r.type === 'channel' && r.ch.id === currentId);
            if (!row) return;
            initialScrollDone.current = true;
            const h = e.nativeEvent.layout.height;
            listRef.current?.scrollToOffset({
                offset: Math.max(0, row.y - h / 2 + row.h / 2),
                animated: false,
            });
        },
        [rows, currentId],
    );
    // Con el video grande la lista no se muestra: al volver se centra de nuevo
    if (fullscreen || inPip) initialScrollDone.current = false;

    // Atrás con un filtro activo → primero vuelve a mostrar todos los canales
    const { filtering, clear } = filter;
    useEffect(() => {
        if (fullscreen || !filtering) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            clear();
            return true;
        });
        return () => sub.remove();
    }, [fullscreen, filtering, clear]);

    const handlePickChannel = useCallback(
        ch => {
            Keyboard.dismiss();
            selectChannel(ch);
        },
        [selectChannel],
    );

    const handleToggleFavorite = useCallback(ch => toggleFavorite(ch?.id), [toggleFavorite]);
    const isFav = !!current && favorites.has(current.id);

    // Picture-in-Picture: solo el video. El player se queda en el mismo lugar
    // del árbol en todos los modos (normal, pantalla completa, PiP): si se
    // montara en otro sitio, React lo recrearía y la señal se reconectaría
    // cada vez que se entra o se sale de la ventana flotante.
    const bigVideo = fullscreen || inPip;

    const playerBlock = (
        <View
            style={[
                styles.mobilePlayer,
                bigVideo ? styles.mobilePlayerFs : { height: Math.round((width * 9) / 16) },
            ]}
        >
            <PlayerView {...playerProps} compact={inPip} />
            {!inPip && <Pressable style={styles.videoTouchable} onPress={handleVideoPress} />}
            {!inPip && (
                <MobileControls
                    visible={controlsVisible}
                    fullscreen={fullscreen}
                    paused={paused}
                    muted={muted}
                    channel={current}
                    channelNumber={currentIndex + 1}
                    live={status === 'playing'}
                    sourceIndex={sourceIndex}
                    status={status}
                    selectSource={selectSource}
                    prevChannel={prevChannel}
                    nextChannel={nextChannel}
                    togglePause={togglePause}
                    toggleMute={toggleMute}
                    toggleFullscreen={toggleFullscreen}
                    exitFullscreen={exitFullscreen}
                />
            )}
        </View>
    );

    return (
        <SafeAreaView
            style={[styles.container, inPip && styles.pipRoot]}
            edges={bigVideo ? [] : ['top', 'bottom', 'left', 'right']}
        >
            <StatusBar barStyle="light-content" backgroundColor={C.bg} hidden={bigVideo} />
            {playerBlock}
            {!bigVideo && (
                <View style={styles.mobileListWrap}>
                    {current && (
                        <View style={styles.nowSection}>
                            <View style={styles.nowRow}>
                                <View style={styles.nowNum}>
                                    <Text style={styles.nowNumText}>{currentIndex + 1}</Text>
                                </View>
                                <View style={styles.itemBody}>
                                    <Text style={styles.nowTitle} numberOfLines={1}>
                                        {current.name}
                                    </Text>
                                    <View style={styles.nowStatus}>
                                        <View
                                            style={[
                                                styles.nowStatusDot,
                                                status === 'playing' && styles.nowStatusDotLive,
                                                status === 'failed' && styles.signalBad,
                                            ]}
                                        />
                                        <Text
                                            style={[
                                                styles.nowSub,
                                                status === 'playing' && styles.nowSubLive,
                                            ]}
                                        >
                                            {status === 'playing'
                                                ? 'En vivo'
                                                : status === 'failed'
                                                ? 'Sin señal, seguimos intentando'
                                                : 'Conectando…'}
                                        </Text>
                                    </View>
                                </View>
                                <Pressable
                                    onPress={() => toggleFavorite(current.id)}
                                    hitSlop={10}
                                    style={[styles.favBtn, isFav && styles.favBtnOn]}
                                    accessibilityLabel={
                                        isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'
                                    }
                                >
                                    <FontAwesome6
                                        name="star"
                                        size={18}
                                        color={isFav ? C.favorite : C.textDim}
                                        iconStyle={isFav ? 'solid' : 'regular'}
                                    />
                                </Pressable>
                            </View>
                            {count > 1 && (
                                <OptionSegments
                                    count={count}
                                    current={sourceIndex}
                                    status={status}
                                    onSelect={selectSource}
                                />
                            )}
                        </View>
                    )}

                    <ChannelFilters filter={filter} totalCount={channels.length} />
                    <FlatList
                        ref={listRef}
                        data={rows}
                        getItemLayout={getItemLayout}
                        onLayout={handleListLayout}
                        keyExtractor={r => r.key}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={14}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        extraData={favorites}
                        ListEmptyComponent={
                            <EmptyResults query={filter.query.trim()} onClear={filter.clear} />
                        }
                        renderItem={({ item: row }) =>
                            row.type === 'header' ? (
                                <Text style={styles.sectionTitle}>{row.title}</Text>
                            ) : (
                                <ChannelRow
                                    item={row.ch}
                                    index={row.index}
                                    active={row.ch.id === current?.id}
                                    favorite={favorites.has(row.ch.id)}
                                    onPress={handlePickChannel}
                                    onLongPress={handleToggleFavorite}
                                />
                            )
                        }
                    />
                </View>
            )}
        </SafeAreaView>
    );
}
