/**
 * Parsea un archivo M3U y extrae canales + opciones VLC globales.
 *
 * Soporta:
 *  - #EXTVLCOPT globales (antes del primer #EXTINF)
 *  - #EXTVLCOPT por canal (entre #EXTINF y la URL)
 *  - tvg-logo, group-title
 */
export default function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    const globalVlcOpts = [];
    let currentName = '';
    let currentLogo = '';
    let currentGroup = '';
    let currentVlcOpts = [];
    let seenFirstExtinf = false;

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        if (line.startsWith('#EXTVLCOPT:')) {
            const opt = line.substring(11).trim();
            if (!seenFirstExtinf) {
                globalVlcOpts.push(opt);
            } else {
                currentVlcOpts.push(opt);
            }
        } else if (line.startsWith('#EXTINF')) {
            seenFirstExtinf = true;
            const logo = line.match(/tvg-logo="([^"]*)"/i);
            const group = line.match(/group-title="([^"]*)"/i);
            currentLogo = logo ? logo[1] : '';
            currentGroup = group ? group[1] : '';
            const parts = line.split(',');
            currentName = parts[parts.length - 1]?.trim();
        } else if (!line.startsWith('#')) {
            channels.push({
                name: currentName || 'Sin nombre',
                url: line,
                logo: currentLogo,
                group: currentGroup,
                vlcOpts: currentVlcOpts.length ? currentVlcOpts : null,
            });
            currentName = '';
            currentLogo = '';
            currentGroup = '';
            currentVlcOpts = [];
        }
    }

    const toVlcFlags = (opts) =>
        opts.map((o) => (o.includes('=') ? `--${o}` : `--${o}`));

    return {
        channels,
        globalVlcOpts: toVlcFlags(globalVlcOpts),
    };
}
