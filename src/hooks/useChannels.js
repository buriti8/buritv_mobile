import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { M3U_URLS, M3U_TIMEOUT_MS, M3U_RETRY_MS } from '../constants/config';
import parseM3U from '../utils/parseM3U';

const K_LAST_CHANNEL = 'lastChannelId';
const K_SOURCE_PREFS = 'sourcePrefs';
const K_M3U_CACHE = 'm3uCache';
const K_ENGINE_PREFS = 'enginePrefs';
const K_SOURCE_STATS = 'sourceStats';

// Historial de estabilidad por opción: cada resultado nuevo pesa más que los
// viejos (los anteriores se multiplican por STATS_DECAY), así una opción que
// mejoró o empeoró se nota en pocos intentos.
const STATS_DECAY = 0.85;

// Probabilidad estimada de que la opción funcione (0..1, 0.5 sin datos)
const scoreOf = (st) => (st ? (st.ok + 1) / (st.ok + st.fail + 2) : 0.5);

/** fetch con tiempo límite (en Android fetch puede esperar indefinidamente) */
async function fetchText(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, { signal: ctrl.signal, headers: { 'Cache-Control': 'no-cache' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

/** Prueba cada URL de la lista en orden; devuelve el primer texto válido */
async function downloadList() {
    let lastError;
    for (const url of M3U_URLS) {
        try {
            const text = await fetchText(url, M3U_TIMEOUT_MS);
            if (text.includes('#EXTINF')) return text;
            lastError = new Error('Respuesta sin canales');
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError;
}

/**
 * Gestiona la carga del M3U, la lista de canales, el canal actual y la
 * fuente (opción) que se está reproduciendo dentro de ese canal.
 *
 *  - La lista se guarda en caché: al abrir se muestra la última copia al
 *    instante y se refresca desde la red en segundo plano.
 *  - Se recuerda por canal la última opción en la que estabas (la que
 *    elegiste a mano o la última que sonó) y al volver al canal —o al abrir
 *    la app— se sigue en esa. También el motor (ExoPlayer/VLC) de cada opción.
 *  - Cada opción lleva un historial de cuántas veces arrancó y cuántas se
 *    cayó en ESTA red: se usa para el canal que todavía no tiene opción
 *    recordada y, si la opción falla, para elegir en qué orden probar las
 *    demás (rankSources).
 */
export default function useChannels() {
    const [channels, setChannels] = useState([]);
    const [vlcGlobalOpts, setVlcGlobalOpts] = useState([]);
    const [current, setCurrent] = useState(null);
    const [sourceIndex, setSourceIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    // Sin lista: 'error' muestra el aviso con "Reintentar" en la pantalla de carga
    const [loadError, setLoadError] = useState(null);
    const retryTimer = useRef(null);
    const retryCount = useRef(0);
    const hasList = useRef(false);

    const sourcePrefs = useRef({});
    const enginePrefs = useRef({});
    const sourceStats = useRef({}); // { [url]: { ok, fail } }
    const statsSaveTimer = useRef(null);
    const currentRef = useRef(null);
    currentRef.current = current;

    const currentIndex = current ? channels.findIndex((ch) => ch.id === current.id) : -1;
    const source = current?.sources[sourceIndex] || current?.sources[0] || null;

    /**
     * Orden en que probar las opciones del canal: primero la última en la que
     * estabas (siempre se respeta) y después el resto, de la más a la menos
     * estable según el historial.
     */
    const rankSources = useCallback((ch) => {
        if (!ch) return [];
        const pref = sourcePrefs.current[ch.id];
        const hasPref = Number.isInteger(pref) && pref >= 0 && pref < ch.sources.length;
        const rest = ch.sources
            .map((s, i) => ({ i, score: scoreOf(sourceStats.current[s.url]) }))
            .filter((r) => !hasPref || r.i !== pref)
            .sort((a, b) => b.score - a.score || a.i - b.i)
            .map((r) => r.i);
        return hasPref ? [pref, ...rest] : rest;
    }, []);

    /** La opción que suena mejor (o se cae menos) gana un punto; la que falla, uno en contra. */
    const recordSourceResult = useCallback((url, ok) => {
        if (!url) return;
        const prev = sourceStats.current[url] ?? { ok: 0, fail: 0 };
        sourceStats.current = {
            ...sourceStats.current,
            [url]: {
                ok: prev.ok * STATS_DECAY + (ok ? 1 : 0),
                fail: prev.fail * STATS_DECAY + (ok ? 0 : 1),
            },
        };
        // Guardar de a varios resultados juntos (los fallos pueden venir seguidos)
        clearTimeout(statsSaveTimer.current);
        statsSaveTimer.current = setTimeout(() => {
            statsSaveTimer.current = null;
            AsyncStorage.setItem(K_SOURCE_STATS, JSON.stringify(sourceStats.current)).catch(
                () => {},
            );
        }, 3000);
    }, []);

    const selectChannel = useCallback((ch) => {
        if (!ch) return;
        setCurrent(ch);
        setSourceIndex(rankSources(ch)[0] ?? 0);
        AsyncStorage.setItem(K_LAST_CHANNEL, ch.id).catch(() => {});
    }, [rankSources]);

    const selectSource = useCallback((i) => setSourceIndex(i), []);

    const saveSourcePref = useCallback((channelId, index) => {
        if (sourcePrefs.current[channelId] === index) return;
        sourcePrefs.current = { ...sourcePrefs.current, [channelId]: index };
        AsyncStorage.setItem(K_SOURCE_PREFS, JSON.stringify(sourcePrefs.current)).catch(() => {});
    }, []);

    // El usuario eligió una opción a mano: se recuerda ya (aunque todavía no
    // haya arrancado), así al cerrar y volver a abrir la app sigue en esa
    const chooseSource = useCallback((i) => {
        setSourceIndex(i);
        const ch = currentRef.current;
        if (ch) saveSourcePref(ch.id, i);
    }, [saveSourcePref]);

    // La fuente actual reprodujo bien → preferirla (y su motor) la próxima vez
    const rememberSource = useCallback((channelId, index, engine) => {
        saveSourcePref(channelId, index);
        const url = currentRef.current?.sources[index]?.url;
        if (url && (engine === 'exo' || engine === 'vlc') && enginePrefs.current[url] !== engine) {
            enginePrefs.current = { ...enginePrefs.current, [url]: engine };
            AsyncStorage.setItem(K_ENGINE_PREFS, JSON.stringify(enginePrefs.current)).catch(
                () => {},
            );
        }
    }, [saveSourcePref]);

    const getEnginePref = useCallback((url) => enginePrefs.current[url], []);

    const applyList = useCallback(async (text) => {
        const { channels: parsed, globalVlcOpts } = parseM3U(text);
        if (!parsed.length) return false;
        setChannels(parsed);
        setVlcGlobalOpts(globalVlcOpts);
        hasList.current = true;

        // Mantener el canal que ya suena (si sigue en la lista) o el último visto.
        // "¿Es la primera carga?" se mira ANTES de setCurrent: fuera de un
        // evento de React, en esta arquitectura el estado se aplica al
        // instante y currentRef ya tendría el canal (y nunca se restauraba la
        // opción recordada: siempre arrancaba en la 1).
        const firstLoad = !currentRef.current;
        const keepId = currentRef.current?.id ?? (await AsyncStorage.getItem(K_LAST_CHANNEL));
        const keep = keepId && parsed.find((ch) => ch.id === keepId);
        if (keep) {
            setCurrent(keep);
            // Primera carga: seguir en la opción en la que estabas
            if (firstLoad) setSourceIndex(rankSources(keep)[0] ?? 0);
        } else {
            setCurrent(parsed[0]);
            setSourceIndex(0);
        }
        return true;
    }, [rankSources]);

    const loadM3U = useCallback(async () => {
        clearTimeout(retryTimer.current);
        setLoadError(null);
        let cached = null;
        try {
            let prefs, engines, stats;
            [prefs, engines, stats, cached] = await Promise.all([
                AsyncStorage.getItem(K_SOURCE_PREFS),
                AsyncStorage.getItem(K_ENGINE_PREFS),
                AsyncStorage.getItem(K_SOURCE_STATS),
                AsyncStorage.getItem(K_M3U_CACHE),
            ]);
            sourcePrefs.current = prefs ? JSON.parse(prefs) : {};
            enginePrefs.current = engines ? JSON.parse(engines) : {};
            sourceStats.current = stats ? JSON.parse(stats) : {};
            if (cached && (await applyList(cached))) setLoading(false);
        } catch (e) {
            console.log('Error reading cache:', e);
        }

        try {
            const text = await downloadList();
            retryCount.current = 0;
            if (text !== cached && (await applyList(text))) {
                AsyncStorage.setItem(K_M3U_CACHE, text).catch(() => {});
            }
            setLoading(false);
        } catch (e) {
            console.log('Error loading M3U:', e?.message ?? e);
            if (hasList.current) {
                // Ya hay canales (de la copia guardada): seguir con esos
                setLoading(false);
                return;
            }
            // Sin canales: avisar y reintentar solo con espera creciente
            const wait = M3U_RETRY_MS[Math.min(retryCount.current, M3U_RETRY_MS.length - 1)];
            retryCount.current += 1;
            setLoadError({ message: 'No pudimos cargar los canales. Revisa tu conexión.', retryIn: wait });
            retryTimer.current = setTimeout(() => loadM3U(), wait);
        }
    }, [applyList]);

    // Reintento manual desde la pantalla de carga
    const retryLoad = useCallback(() => {
        retryCount.current = 0;
        loadM3U();
    }, [loadM3U]);

    useEffect(
        () => () => {
            clearTimeout(retryTimer.current);
            // Si quedó un guardado del historial pendiente, hacerlo ya
            if (statsSaveTimer.current) {
                clearTimeout(statsSaveTimer.current);
                AsyncStorage.setItem(K_SOURCE_STATS, JSON.stringify(sourceStats.current)).catch(
                    () => {},
                );
            }
        },
        [],
    );

    return {
        channels,
        vlcGlobalOpts,
        current,
        currentIndex,
        source,
        sourceIndex,
        loading,
        loadError,
        retryLoad,
        selectChannel,
        selectSource,
        chooseSource,
        rememberSource,
        rankSources,
        recordSourceResult,
        getEnginePref,
        loadM3U,
    };
}
