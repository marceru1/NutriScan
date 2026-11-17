import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DetalhesModal } from '../components/DetalhesModal';
import { IconeAlerta } from '../components/Icons';
import { TabelaNutricional } from '../components/TabelaNutricional';
import { textoAlerta } from '../domain/rdc';
import { urlImagem } from '../services/api';
import { colors, radius } from '../theme';
import type { ProdutoCompleto } from '../types';

export function Resumo({ produto }: { produto: ProdutoCompleto }) {
  const [detalhes, setDetalhes] = useState(false);
  const alerta = textoAlerta(produto.classificacao_rdc);
  return (
    <>
      <ScrollView contentContainerStyle={s.conteudo}>
        {produto.imagem_path ? (
          <>
            <Image source={{ uri: urlImagem(produto.id) }} style={s.foto} />
            <Text style={s.fotoLegenda}>Confirme se é esse produto (texto identifica, foto confirma)</Text>
          </>
        ) : null}
        <View style={s.card}>
          <Text style={s.h1}>Avaliação geral</Text>
          {/* F04: ícone de alerta SÓ quando há lupa RDC cadastrada — sem lupa, sem tom de warning */}
          {alerta ? (
            <View style={s.alerta}>
              <IconeAlerta />
              <Text style={s.alertaTxt}>{alerta}</Text>
            </View>
          ) : null}
          <Text style={s.p}>{produto.traducao_n1}</Text>
          <Text style={[s.p, { marginTop: 8 }]}>{produto.traducao_n2}</Text>
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
  foto: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    borderRadius: radius.xl,
    backgroundColor: colors.border,
  },
  fotoLegenda: { fontSize: 11, color: colors.subtle, textAlign: 'center', marginTop: 6, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20 },
  h1: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: colors.text, marginBottom: 12 },
  alerta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  alertaTxt: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: colors.primary },
  p: { fontSize: 13, lineHeight: 20, color: colors.subtle },
  verMais: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, marginTop: 4 },
  verMaisTxt: { fontSize: 13, fontWeight: '600', color: colors.text },
  h2: { fontSize: 16, fontWeight: '700', textAlign: 'center', color: colors.text, marginVertical: 20 },
});
