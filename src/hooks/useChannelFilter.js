import { useMemo, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ALL = '__all__';
export const FAV = '__fav__';

const K_CATEGORY = 'filterCategory';

const norm = (s) =>
    (s || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

/**
 * Búsqueda + filtro por categoría (group-title del M3U) + favoritos.
 *
 *  - La búsqueda ignora mayúsculas y tildes ("caracol" encuentra "CARACOL").
 *  - Si se escribe un número, busca también por número de canal ("7").
 *  - Cada resultado conserva su número original de canal (index), así el
 *    número no cambia al filtrar.
 *  - La categoría elegida se recuerda al cerrar y volver a abrir la app.
 *    `ready` indica que ya se leyó (para no pintar la lista dos veces).
 */
export default function useChannelFilter(channels, favorites, persist = true) {
    const [query, setQuery] = useState('');
    const [category, setCategoryState] = useState(ALL);
    const [ready, setReady] = useState(!persist);

    useEffect(() => {
        // (el selector de "varios canales" no toca la categoría guardada de la lista)
        if (!persist) return;
        AsyncStorage.getItem(K_CATEGORY)
            .then((saved) => {
                if (saved) setCategoryState(saved);
            })
            .catch(() => {})
            .finally(() => setReady(true));
    }, [persist]);

    const setCategory = useCallback(
        (id) => {
            setCategoryState(id);
            if (persist) AsyncStorage.setItem(K_CATEGORY, id).catch(() => {});
        },
        [persist],
    );

    const favCount = useMemo(
        () => (favorites?.size ? channels.filter((ch) => favorites.has(ch.id)).length : 0),
        [channels, favorites],
    );

    // Categorías en el orden en que aparecen en la lista, con su cantidad
    const categories = useMemo(() => {
        const counts = new Map();
        channels.forEach((ch) => {
            if (ch.group) counts.set(ch.group, (counts.get(ch.group) || 0) + 1);
        });
        if (!counts.size && !favCount) return [];
        return [
            { id: ALL, label: 'Todos', count: channels.length },
            ...(favCount ? [{ id: FAV, label: 'Favoritos', count: favCount, fav: true }] : []),
            ...[...counts].map(([g, n]) => ({ id: g, label: g, count: n })),
        ];
    }, [channels, favCount]);

    // Una categoría guardada que ya no existe (o sin favoritos) → Todos
    const active = categories.some((c) => c.id === category) ? category : ALL;

    const items = useMemo(() => {
        const q = norm(query);
        const isNum = /^\d+$/.test(q);
        const out = [];
        channels.forEach((ch, index) => {
            if (active === FAV) {
                if (!favorites?.has(ch.id)) return;
            } else if (active !== ALL && ch.group !== active) return;
            if (q) {
                const byName = norm(ch.name).includes(q);
                const byNum = isNum && String(index + 1).startsWith(q);
                if (!byName && !byNum) return;
            }
            out.push({ ch, index });
        });
        return out;
    }, [channels, favorites, query, active]);

    const filtering = !!query.trim() || active !== ALL;

    const clear = useCallback(() => {
        setQuery('');
        setCategory(ALL);
    }, [setCategory]);

    return {
        query,
        setQuery,
        category: active,
        setCategory,
        categories,
        items,
        filtering,
        clear,
        ready,
    };
}
