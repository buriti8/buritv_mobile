import React, { useCallback } from 'react';
import { View, Text, Modal, FlatList, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV, MOBILE_ROW_H, TV_ROW_H } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import useChannelFilter from '../hooks/useChannelFilter';
import ChannelFilters, { EmptyResults } from './ChannelFilters';
import ChannelRow from './ChannelRow';

const ROW_H = isTV ? TV_ROW_H : MOBILE_ROW_H;
const keyOf = item => item.ch.id;

/**
 * Selector de canal para "varios canales": lista completa con buscador y
 * categorías. Los canales que ya están en pantalla van marcados; elegir uno
 * de esos agrega otra de sus opciones.
 */
export default function ChannelPicker({ visible, channels, favorites, activeIds, onPick, onClose }) {
    // persist = false: elegir categoría aquí no cambia la de la lista principal
    const filter = useChannelFilter(channels, favorites, false);

    const getItemLayout = useCallback(
        (data, index) => ({ length: ROW_H, offset: ROW_H * index, index }),
        [],
    );
    const renderItem = useCallback(
        ({ item, index: i }) => (
            <ChannelRow
                item={item.ch}
                index={item.index}
                active={!!activeIds?.has(item.ch.id)}
                favorite={favorites.has(item.ch.id)}
                hasTVPreferredFocus={isTV && i === 0}
                onPress={onPick}
            />
        ),
        [activeIds, favorites, onPick],
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            supportedOrientations={['portrait', 'landscape']}
            statusBarTranslucent
        >
            <SafeAreaView style={styles.container}>
                <StatusBar hidden={isTV} barStyle="light-content" backgroundColor={C.bg} />
                <View style={styles.pickerHead}>
                    <FontAwesome6 name="plus" size={isTV ? 20 : 16} color={C.accentSoft} iconStyle="solid" />
                    <Text style={styles.pickerTitle} numberOfLines={1}>
                        Agregar a la vista
                    </Text>
                    <Pressable
                        focusable={isTV}
                        onPress={onClose}
                        hitSlop={10}
                        accessibilityLabel="Cerrar"
                        style={({ focused }) => [styles.iconBtn, focused && styles.ctrlBtnFocused]}
                    >
                        <FontAwesome6 name="xmark" size={16} color={C.chalk} iconStyle="solid" />
                    </Pressable>
                </View>
                <ChannelFilters filter={filter} totalCount={channels.length} />
                <FlatList
                    data={filter.items}
                    keyExtractor={keyOf}
                    getItemLayout={getItemLayout}
                    renderItem={renderItem}
                    extraData={activeIds}
                    style={styles.list}
                    contentContainerStyle={isTV ? styles.listContentTV : styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={14}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListEmptyComponent={
                        <EmptyResults query={filter.query.trim()} onClear={filter.clear} />
                    }
                />
            </SafeAreaView>
        </Modal>
    );
}
