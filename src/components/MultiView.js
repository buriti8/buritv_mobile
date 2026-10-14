import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { isTV } from '../constants/config';
import { C } from '../constants/colors';
import { styles } from '../styles/styles';
import MultiTile from './MultiTile';
import ChannelPicker from './ChannelPicker';

/**
 * Reparte los recuadros en la cuadrícula que más grande los deje, siempre en
 * 16:9. Con 1 o 3 canales queda a la vista el recuadro que falta para
 * completar la cuadrícula (si todavía caben más).
 */
function fitGrid(w, h, slots) {
  let best = { cols: 1, rows: slots, tw: 0 };
  for (let cols = 1; cols <= slots; cols++) {
    const rows = Math.ceil(slots / cols);
    const tw = Math.min(w / cols, ((h / rows) * 16) / 9);
    // A igual tamaño, más columnas (se llena mejor el ancho)
    if (tw >= best.tw - 0.5) best = { cols, rows, tw };
  }
  const tw = Math.floor(best.tw);
  return { cols: best.cols, tw, th: Math.floor((tw * 9) / 16) };
}

export default function MultiView({
  tiles,
  channels,
  focusId,
  max,
  muted,
  paused,
  favorites,
  activeIds,
  picking,
  safeArea,
  onListen,
  onRemove,
  onAdd,
  onPick,
  onClosePicker,
  ...shared
}) {
  // Celular en pantalla completa: la cuadrícula queda dentro de las zonas
  // seguras (barra de navegación, muesca de la cámara)
  const insets = useSafeAreaInsets();
  const pad = safeArea
    ? {
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      }
    : null;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback(e => {
    const { width, height } = e.nativeEvent.layout;
    setBox(b =>
      b.w === width && b.h === height ? b : { w: width, h: height },
    );
  }, []);

  const n = tiles.length;
  const slot = (n === 1 || n === 3) && n < max;
  const slots = n + (slot ? 1 : 0);
  const { cols, tw, th } = fitGrid(box.w, box.h, slots);
  const numberOf = ch => channels.findIndex(c => c.id === ch.id) + 1;

  return (
    <View style={[styles.multiOuter, pad]}>
      <View style={styles.multiArea} onLayout={onLayout}>
        {box.w > 0 && tw > 0 && (
          <View style={[styles.multiGrid, { width: cols * tw }]}>
            {tiles.map(t => (
              <MultiTile
                key={`${t.uid}-${t.channel.id}`}
                tile={t}
                number={numberOf(t.channel)}
                width={tw}
                height={th}
                listening={t.uid === focusId}
                muted={muted}
                paused={paused}
                onListen={onListen}
                onRemove={onRemove}
                {...shared}
              />
            ))}
            {slot && (
              <Pressable
                focusable={isTV}
                onPress={onAdd}
                accessibilityLabel="Agregar otro canal"
                style={({ focused }) => [
                  styles.multiTile,
                  styles.multiTileEmpty,
                  focused && styles.multiTileOn,
                  { width: tw, height: th },
                ]}
              >
                <FontAwesome6
                  name="plus"
                  size={isTV ? 28 : 20}
                  color={C.textMute}
                  iconStyle="solid"
                />
                <Text
                  style={[
                    styles.multiEmptyText,
                    isTV && styles.multiEmptyTextTV,
                  ]}
                >
                  Agregar otro canal
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
      <ChannelPicker
        visible={!!picking}
        channels={channels}
        favorites={favorites}
        activeIds={activeIds}
        onPick={onPick}
        onClose={onClosePicker}
      />
    </View>
  );
}
