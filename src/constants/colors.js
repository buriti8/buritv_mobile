// Paleta BuriTV (siempre oscura), por roles y capas:
//
//  Capas    bg → panel → surface → surfaceHi: cada nivel un poco más claro,
//           así la profundidad se lee sin sombras ni bordes de más.
//  Marca    accent (#0A7724) solo para lo principal: Play y el número de la
//           placa del canal. La selección usa la versión tonal (container /
//           onContainer), que no grita como un verde saturado.
//  Foco     anillo blanco (focus) sobre una superficie un poco más clara
//           (focusFill): se ve desde el sofá y la app sigue siendo oscura.
//  Semánticos  rojo = en vivo, ámbar = favoritos y avisos.
//  Texto    tres niveles: text (alto), textDim (medio), textMute (bajo).
export const C = {
    bg: '#0E1513',
    panel: '#131C19',
    surface: '#1A2421',
    surfaceHi: '#222E2A',
    border: '#2D3A35',

    accent: '#0A7724', // marca: Play, número de la placa
    accentSoft: '#3FBF68', // indicadores (punto de señal, ícono "suena")
    container: '#143523', // selección tonal
    onContainer: '#8FE0A9', // texto sobre la selección
    accentTint: 'rgba(20,53,35,0.9)',

    focus: '#F2F5F3', // anillo de foco
    focusFill: '#26342F', // fondo de lo enfocado
    onFocus: '#FFFFFF', // texto sobre lo enfocado
    chalk: '#F2F5F3', // alias de focus (texto principal sobre video)
    ink: '#0E1513', // texto oscuro sobre ámbar (número de canal inválido)

    logoTile: '#000000', // fondo de los logos: negro, como el resto
    logoTileLine: 'rgba(242,245,243,0.10)',

    live: '#EF4652',
    success: '#3FBF68',
    warning: '#F0B43C',
    danger: '#EF4652',
    favorite: '#F0B43C',

    text: '#E8EEEB',
    textDim: '#9EADA6',
    textMute: '#66756F',
    white: '#FFFFFF',

    scrim: 'rgba(8,12,11,0.8)',
    scrimSoft: 'rgba(8,12,11,0.45)',
    onVideo: 'rgba(14,21,19,0.66)', // botones y segmentos sobre el video
    onVideoLine: 'rgba(242,245,243,0.26)',
};
