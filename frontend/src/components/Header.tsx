import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Voltar } from './Icons';

export function Header({ titulo, onVoltar, escuro }: { titulo: string; onVoltar?: () => void; escuro?: boolean }) {
  const cor = escuro ? colors.white : colors.text;
  return (
    <View style={[s.wrap, escuro && { backgroundColor: colors.black }]}>
      {onVoltar ? (
        <Pressable
          onPress={onVoltar}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={s.back}>
          <Voltar color={cor} />
        </Pressable>
      ) : null}
      <Text style={[s.titulo, { color: cor }]} numberOfLines={1}>
        {titulo}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: 56, justifyContent: 'center', paddingHorizontal: 56, backgroundColor: colors.bg },
  back: { position: 'absolute', left: 12, height: 44, width: 44, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
