import { useEffect, useState } from 'react';

/**
 * Avisos breves sobre la app (abajo al centro): "atrás otra vez para
 * salir", "modo internet lento activado"… Un solo aviso a la vez.
 */
let current = null;
let timer = null;
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn(current));

export function showToast(text, ms = 2500) {
    current = text;
    notify();
    clearTimeout(timer);
    timer = setTimeout(hideToast, ms);
}

export function hideToast() {
    clearTimeout(timer);
    current = null;
    notify();
}

/** El aviso que se está mostrando (o null). */
export function useToast() {
    const [text, setText] = useState(current);
    useEffect(() => {
        listeners.add(setText);
        return () => listeners.delete(setText);
    }, []);
    return text;
}
