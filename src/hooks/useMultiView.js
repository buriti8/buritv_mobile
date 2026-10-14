import { useState, useRef, useCallback, useMemo } from 'react';
import { showToast } from '../utils/toast';

/**
 * Varios canales a la vez. Cada recuadro { uid, channel, src } tiene su propio
 * player y su propia recuperación (ver MultiTile); aquí solo vive la lista de
 * recuadros y cuál tiene el sonido.
 *
 *  - Elegir un canal de la lista (o del selector) lo agrega. Elegir uno que ya
 *    está en pantalla agrega otra opción del mismo canal, hasta ver todas.
 *  - Un recuadro se quita con su botón (celular) o manteniendo OK (TV).
 *  - Al salir se vuelve al canal que tenía el sonido.
 */
export default function useMultiView({ current, sourceIndex, selectChannel, rankSources, max }) {
    const [tiles, setTiles] = useState(null); // null = apagada
    const [focusId, setFocusId] = useState(null);
    const [picking, setPicking] = useState(false);
    const uidRef = useRef(0);
    const active = tiles !== null;

    const newTile = useCallback(
        (ch, taken = []) => {
            // Si el canal ya está en pantalla, arranca en una opción que no se esté viendo
            const free = ch.sources.findIndex((_, i) => !taken.includes(i));
            const src = taken.length && free >= 0 ? free : rankSources(ch)[0] ?? 0;
            return { uid: ++uidRef.current, channel: ch, src };
        },
        [rankSources],
    );

    const enter = useCallback(() => {
        if (!current) return;
        const tile = { uid: ++uidRef.current, channel: current, src: sourceIndex };
        setTiles([tile]);
        setFocusId(tile.uid);
    }, [current, sourceIndex]);

    const exit = useCallback(() => {
        const keep = tiles?.find(t => t.uid === focusId) ?? tiles?.[0];
        setTiles(null);
        setFocusId(null);
        setPicking(false);
        if (keep && keep.channel.id !== current?.id) selectChannel(keep.channel);
    }, [tiles, focusId, current, selectChannel]);

    const add = useCallback(
        ch => {
            if (!tiles) return;
            if (tiles.length >= max) {
                showToast(`Máximo ${max} canales a la vez. Quita uno primero.`);
                return;
            }
            const taken = tiles.filter(t => t.channel.id === ch.id).map(t => t.src);
            if (taken.length >= ch.sources.length) {
                showToast(
                    ch.sources.length > 1
                        ? `Ya ves todas las opciones de ${ch.name}.`
                        : `${ch.name} ya está en pantalla.`,
                );
                return;
            }
            const tile = newTile(ch, taken);
            setTiles([...tiles, tile]);
            setFocusId(tile.uid);
        },
        [tiles, max, newTile],
    );

    const remove = useCallback(
        uid => {
            if (!tiles) return;
            const next = tiles.filter(t => t.uid !== uid);
            if (!next.length) {
                exit();
                return;
            }
            setTiles(next);
            if (focusId === uid) setFocusId(next[0].uid);
        },
        [tiles, focusId, exit],
    );

    /** Canal elegido en la lista: lo agrega (otra opción, si ya estaba). */
    const toggleChannel = add;

    const openPicker = useCallback(() => setPicking(true), []);
    const closePicker = useCallback(() => setPicking(false), []);
    /** Canal elegido en el selector: se agrega y el selector se cierra. */
    const pick = useCallback(
        ch => {
            setPicking(false);
            add(ch);
        },
        [add],
    );

    const activeIds = useMemo(
        () => (tiles ? new Set(tiles.map(t => t.channel.id)) : null),
        [tiles],
    );

    return {
        active,
        tiles,
        focusId,
        setFocusId,
        activeIds,
        picking,
        openPicker,
        closePicker,
        pick,
        max,
        enter,
        exit,
        remove,
        toggleChannel,
    };
}
