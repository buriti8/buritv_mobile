import React, { useRef, useEffect, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import { styles } from '../styles/styles';

/**
 * Reproduce canales tipo "web" (embeds/iframes) en un WebView.
 * Sirve tanto para URLs de embed directo (p. ej. …/embed/dsports-ar)
 * como para páginas con la señal en vivo (p. ej. ….html).
 *
 * AUTOPLAY_JS intenta dar play y desmutear automáticamente (clave en TV,
 * donde no hay touch):
 *  - Desmutea y reproduce cualquier <video> del frame principal,
 *    respetando el mute del usuario (window.__buriMuted).
 *  - Hace clic en overlays tipo "Click to Unmute" o botones de play.
 *  - Si la página no tiene <video> y solo contiene un iframe (p. ej.
 *    sudamericaplay), navega dentro del iframe para que el reproductor
 *    quede en el frame principal (en Android el JS inyectado no llega
 *    a iframes de otro origen).
 */
const AUTOPLAY_JS = `
(function () {
    var tries = 0;
    var timer = setInterval(function () {
        tries++;
        var wantMuted = !!window.__buriMuted;
        var vids = document.querySelectorAll('video');
        var playing = false;
        vids.forEach(function (v) {
            v.muted = wantMuted;
            v.volume = 1;
            if (v.paused) {
                var p = v.play();
                if (p && p.catch) p.catch(function () {});
            }
            if (!v.paused && v.muted === wantMuted) playing = true;
        });

        if (!playing) {
            // Overlays/botones típicos: "Click to Unmute", big play, etc.
            var sels = [
                '[class*="unmute" i]',
                '[id*="unmute" i]',
                '.jw-display-icon-container',
                '.vjs-big-play-button',
                '.plyr__control--overlaid',
                '[class*="play-btn" i]',
                '[class*="btn-play" i]',
            ].join(',');
            document.querySelectorAll(sels).forEach(function (el) {
                if (el.offsetParent === null) return; // oculto
                try { el.click(); } catch (e) {}
            });
        }

        // YouTube (watch normal, no embed): la Fullscreen API real requiere
        // un gesto de usuario genuino, así que no se puede disparar por script.
        // En su lugar movemos el player a un hijo directo de <body> (para que
        // quede fuera de cualquier stacking context de la página) y lo
        // forzamos a cubrir toda la pantalla, ocultando el resto.
        if (location.hostname.indexOf('youtube.com') !== -1) {
            var mp = document.getElementById('movie_player');
            if (mp && !mp.__buriFs) {
                mp.__buriFs = true;
                document.body.appendChild(mp);
                mp.style.cssText =
                    'position:fixed !important; top:0 !important; left:0 !important;' +
                    'width:100vw !important; height:100vh !important;' +
                    'z-index:2147483647 !important; background:#000 !important;';
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
                Array.prototype.forEach.call(document.body.children, function (el) {
                    if (el !== mp) el.style.display = 'none';
                });

                var hideStyle = document.createElement('style');
                hideStyle.textContent =
                    '.ytp-mute-button, .ytp-unmute, .ytp-chrome-top,' +
                    '.ytp-pause-overlay, .ytp-ce-element, .ytp-endscreen-content' +
                    ' { display: none !important; }';
                document.head.appendChild(hideStyle);
            }
        }

        // Sin <video> en el frame principal: si hay un único iframe, entrar
        if (!vids.length && tries === 4) {
            var frames = document.querySelectorAll('iframe[src^="http"]');
            if (frames.length === 1 && frames[0].src !== location.href) {
                clearInterval(timer);
                location.replace(frames[0].src);
                return;
            }
        }

        // No se detiene aunque ya esté "playing": algunos reproductores
        // (p. ej. YouTube) vuelven a mutear el video por su cuenta pasado
        // un rato, así que seguimos corrigiendo el estado indefinidamente.
    }, 700);
})();
true;
`;

export default function WebPlayerView({ current, playerKey, muted, onError }) {
    const webRef = useRef(null);

    const injectMute = useCallback((m) => {
        webRef.current?.injectJavaScript(`
            window.__buriMuted = ${m};
            document.querySelectorAll('video').forEach(function (v) {
                v.muted = ${m};
            });
            true;
        `);
    }, []);

    useEffect(() => {
        injectMute(muted);
    }, [muted, injectMute]);

    return (
        <WebView
            ref={webRef}
            key={`${current.url}-${playerKey}`}
            style={styles.player}
            containerStyle={styles.player}
            source={{ uri: current.url }}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScript={AUTOPLAY_JS}
            // Reaplica el estado de mute en cada página (incluye el salto al iframe)
            onLoadEnd={() => injectMute(muted)}
            // Evita que los popups de publicidad abran ventanas nuevas
            setSupportMultipleWindows={false}
            onError={onError}
            onHttpError={(e) => {
                if (e?.nativeEvent?.statusCode >= 400) onError?.(e);
            }}
        />
    );
}
