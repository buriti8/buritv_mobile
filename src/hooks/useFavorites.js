import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const K_FAVORITES = 'favorites';

/**
 * Canales favoritos (por id), guardados en el equipo.
 *  - Móvil: mantener presionado un canal o tocar la estrella del canal actual.
 *  - TV: mantener presionado OK sobre un canal o el botón estrella de los
 *    controles.
 */
export default function useFavorites() {
    const [favorites, setFavorites] = useState(() => new Set());

    useEffect(() => {
        AsyncStorage.getItem(K_FAVORITES)
            .then((raw) => {
                const ids = raw ? JSON.parse(raw) : [];
                if (Array.isArray(ids) && ids.length) setFavorites(new Set(ids));
            })
            .catch(() => {});
    }, []);

    const toggleFavorite = useCallback((id) => {
        if (!id) return;
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            AsyncStorage.setItem(K_FAVORITES, JSON.stringify([...next])).catch(() => {});
            return next;
        });
    }, []);

    return { favorites, toggleFavorite };
}
