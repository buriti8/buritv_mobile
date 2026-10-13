import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    TVFocusGuideView,
    findNodeHandle,
} from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';

/**
 * Buscador + pestañas de categoría sobre la lista de canales.
 *
 *  - Móvil: se escribe y se filtra al instante; tocar una pestaña filtra.
 *  - TV: las pestañas filtran con solo enfocarlas (←/→), sin apretar OK.
 *    El buscador abre el teclado del TV (que en Android TV permite dictar).
 *    onLeftTarget recibe el nodo de la pestaña activa (o del buscador), para
 *    que ← y ↑ (desde el primer canal) lleven directo a los filtros.
 */
export default function ChannelFilters({ filter, totalCount, onLeftTarget }) {
    const { query, setQuery, category, setCategory, categories } = filter;
    const selectedTabRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isTV || !onLeftTarget) return;
        const t = setTimeout(() => {
            onLeftTarget(findNodeHandle(selectedTabRef.current ?? inputRef.current));
        }, 300);
        return () => clearTimeout(t);
    }, [category, categories.length, onLeftTarget]);

    return (
        <View style={[styles.filters, isTV && styles.filtersTV]}>
            <SearchBar
                inputRef={inputRef}
                query={query}
                setQuery={setQuery}
                totalCount={totalCount}
            />
            {categories.length > 0 && (
                // En TV: al entrar a la fila el foco vuelve a la última pestaña
                // usada (la seleccionada), no a la más cercana
                <TabsWrapper>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsRow}
                        keyboardShouldPersistTaps="handled"
                    >
                        {categories.map(c => (
                            <CategoryTab
                                key={c.id}
                                ref={c.id === category ? selectedTabRef : undefined}
                                label={c.label}
                                count={c.count}
                                fav={c.fav}
                                selected={c.id === category}
                                onSelect={() => setCategory(c.id)}
                            />
                        ))}
                    </ScrollView>
                </TabsWrapper>
            )}
        </View>
    );
}

function TabsWrapper({ children }) {
    if (!isTV) return children;
    return <TVFocusGuideView autoFocus>{children}</TVFocusGuideView>;
}

function SearchBar({ inputRef, query, setQuery, totalCount }) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.search, isTV && styles.searchTV, focused && styles.searchFocused]}>
            <FontAwesome6
                name="magnifying-glass"
                size={isTV ? 16 : 14}
                color={focused ? C.chalk : C.textMute}
                iconStyle="solid"
            />
            <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder={`Buscar en ${totalCount} canales`}
                placeholderTextColor={C.textMute}
                style={[styles.searchInput, isTV && styles.searchInputTV]}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                selectionColor={C.accentSoft}
                cursorColor={C.accentSoft}
            />
            {!!query && !isTV && (
                <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.searchClear}>
                    <FontAwesome6 name="xmark" size={12} color={C.bg} iconStyle="solid" />
                </Pressable>
            )}
        </View>
    );
}

const CategoryTab = React.forwardRef(function CategoryTab(
    { label, count, fav, selected, onSelect },
    ref,
) {
    const [focused, setFocused] = useState(false);
    const on = selected || focused;
    return (
        <Pressable
            ref={ref}
            focusable={isTV}
            onPress={onSelect}
            onFocus={() => {
                setFocused(true);
                onSelect(); // en TV, enfocar ya filtra
            }}
            onBlur={() => setFocused(false)}
            style={[
                styles.tab,
                isTV && styles.tabTV,
                selected && styles.tabOn,
                focused && styles.tabFocused,
            ]}
        >
            {fav && (
                <FontAwesome6
                    name="star"
                    size={isTV ? 13 : 11}
                    color={on && !focused ? C.onContainer : C.favorite}
                    iconStyle="solid"
                />
            )}
            <Text
                style={[
                    styles.tabText,
                    isTV && styles.tabTextTV,
                    selected && styles.tabTextOn,
                    focused && styles.tabTextFocused,
                ]}
            >
                {label}
            </Text>
            <Text
                style={[
                    styles.tabCount,
                    selected && styles.tabCountOn,
                    focused && styles.tabTextFocused,
                ]}
            >
                {count}
            </Text>
        </Pressable>
    );
});

/** Sin resultados: mensaje y botón para volver a ver todo. */
export function EmptyResults({ query, onClear }) {
    return (
        <View style={styles.empty}>
            <FontAwesome6 name="tv" size={isTV ? 30 : 24} color={C.textMute} iconStyle="solid" />
            <Text style={styles.emptyTitle}>
                {query ? `Sin resultados para "${query}"` : 'No hay canales en esta categoría'}
            </Text>
            <Pressable
                focusable={isTV}
                onPress={onClear}
                style={({ focused }) => [styles.emptyBtn, focused && styles.emptyBtnFocused]}
            >
                <Text style={styles.emptyBtnText}>Ver todos los canales</Text>
            </Pressable>
        </View>
    );
}
