import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DetalhesModal } from '../components/DetalhesModal';
import { IconeAlerta } from '../components/Icons';
import { TabelaNutricional } from '../components/TabelaNutricional';
import { colors, radius } from '../theme';
import type { ProdutoCompleto } from '../types';

export function Resumo({ produto }: { produto: ProdutoCompleto }) {
  const [detalhes, setDetalhes] = useState(false);
  return (
    <>
      <ScrollView contentContainerStyle={s.conteudo}>
        <View style={s.card}>
          <Text style={s.h1}>Avaliação geral</Text>
          <View style={s.alerta}>
            <IconeAlerta />
            <Text style={s.alertaTxt}>{produto.traducao_n1}</Text>
          </View>
          <Text style={s.p}>{produto.traducao_n2}</Text>
          <Pressable onPress={() => setDetalhes(true)} style={s.verMais} accessibilityRole="button">
            <Text style={s.verMaisTxt}>Ver mais</Text>
          </Pressable>
        </View>

        <Text style={s.h2}>Tabela nutricional</Text>
        <TabelaNutricional produto={produto} />
      </ScrollView>
      <DetalhesModal produto={produto} visivel={detalhes} onFechar={() => setDetalhes(false)} />
    </>
  );
}

const s = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20 },
  h1: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: colors.text, marginBottom: 12 },
  alerta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  alertaTxt: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: colors.primary },
  p: { fontSize: 13, lineHeight: 20, color: colors.subtle },
  verMais: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, marginTop: 4 },
  verMaisTxt: { fontSize: 13, fontWeight: '600', color: colors.text },
  h2: { fontSize: 16, fontWeight: '700', textAlign: 'center', color: colors.text, marginVertical: 20 },
});
