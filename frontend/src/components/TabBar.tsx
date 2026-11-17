import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT, colors, radius } from '../theme';
import { Camera, Compasso } from './Icons';

export type Aba = 'explorar' | 'escanear';

export function TabBar({ ativa, onSelecionar }: { ativa: Aba; onSelecionar: (a: Aba) => void }) {
  const insets = useSafeAreaInsets();
  const item = (id: Aba, rotulo: string, icone: React.ReactNode) => (
    <Pressable
      style={s.itemWrap}
      onPress={() => onSelecionar(id)}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa === id }}>
      <View style={[s.pilula, ativa === id && { backgroundColor: colors.tabActive }]}>
        {icone}
        <Text style={s.rotulo}>{rotulo}</Text>
      </View>
    </Pressable>
  );
  return (
    <View style={[s.bar, { paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }]}>
      {item('explorar', 'Explorar', <Compasso />)}
      {item('escanear', 'Escanear produto', <Camera />)}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pilula: {
    minWidth: 112,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.xl,
    alignItems: 'center',
    gap: 2,
  },
  rotulo: { fontSize: 12, fontWeight: '700', color: colors.text },
});
