/**
 * Parsea un archivo M3U y extrae canales + opciones VLC globales.
 *
 * Soporta:
 *  - #EXTVLCOPT globales (antes del primer #EXTINF)
 *  - #EXTVLCOPT por canal (entre #EXTINF y la URL)
 *  - tvg-logo, group-title
 *  - Canales web/embed (se reproducen en WebView en vez de VLC):
 *      · automático si la URL contiene /embed/ o termina en .html
 *      · explícito con tvg-type="web" en el #EXTINF
 */

const WEB_URL_RE = /\/embed\/|\.html?(\?|$)/i;
export default function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    const globalVlcOpts = [];
    let currentName = '';
    let currentLogo = '';
    let currentGroup = '';
    let currentType = '';
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
            const type = line.match(/tvg-type="([^"]*)"/i);
            currentLogo = logo ? logo[1] : '';
            currentGroup = group ? group[1] : '';
            currentType = type ? type[1].toLowerCase() : '';
            const parts = line.split(',');
            currentName = parts[parts.length - 1]?.trim();
        } else if (!line.startsWith('#')) {
            channels.push({
                name: currentName || 'Sin nombre',
                url: line,
                logo: currentLogo,
                group: currentGroup,
                type:
                    currentType === 'web' || WEB_URL_RE.test(line)
                        ? 'web'
                        : 'stream',
                vlcOpts: currentVlcOpts.length ? currentVlcOpts : null,
            });
            currentName = '';
            currentLogo = '';
            currentGroup = '';
            currentType = '';
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
