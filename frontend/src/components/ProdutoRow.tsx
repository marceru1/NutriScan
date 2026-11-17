import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { USE_MOCK, urlImagem } from '../services/api';
import { textoAlerta } from '../domain/rdc';
import { colors, radius } from '../theme';
import type { ProdutoCompleto } from '../types';
import { Avancar } from './Icons';

export function ProdutoRow({ produto, onPress }: { produto: ProdutoCompleto; onPress: () => void }) {
  const alerta = textoAlerta(produto.classificacao_rdc);
  const temFoto = !USE_MOCK && !!produto.imagem_path;
  return (
    <Pressable
      onPress={onPress}
      style={s.row}
      accessibilityRole="button"
      accessibilityLabel={`${produto.nome}. ${alerta ?? 'Ver detalhes'}`}>
      {temFoto ? (
        <Image source={{ uri: urlImagem(produto.id) }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, { backgroundColor: colors.olive }]} />
      )}
      <View style={s.textos}>
        <Text style={s.nome} numberOfLines={1}>
          {produto.nome}
        </Text>
        <Text style={[s.sub, { color: alerta ? colors.primary : colors.olive }]} numberOfLines={1}>
          {alerta ?? 'Ver detalhes'}
        </Text>
      </View>
      <Avancar />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10 },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  textos: { flex: 1 },
  nome: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
