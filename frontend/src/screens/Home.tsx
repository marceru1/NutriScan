import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProdutoRow } from '../components/ProdutoRow';
import { SearchBar } from '../components/SearchBar';
import { Camera } from '../components/Icons';
import { listarProdutos } from '../services/api';
import { colors, radius } from '../theme';
import type { ProdutoCompleto } from '../types';

interface Props {
  historico: string[];
  onBuscar: (q: string) => void;
  onEscanear: () => void;
  onAbrir: (p: ProdutoCompleto) => void;
  onVerMais: () => void;
}

export function Home({ historico, onBuscar, onEscanear, onAbrir, onVerMais }: Props) {
  const [q, setQ] = useState('');
  const [itens, setItens] = useState<ProdutoCompleto[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    listarProdutos()
      .then(setItens)
      .catch(() => setErro(true));
  }, []);

  return (
    <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      <View style={{ zIndex: 20 }}>
        <SearchBar valor={q} onChange={setQ} onEnviar={onBuscar} historico={historico} />
      </View>

      <Text style={s.h1}>Escanear um produto</Text>
      <Text style={s.sub}>
        Comece a fazer um scan da tabela nutricional de seu produto clicando no botão abaixo.
      </Text>
      <Pressable style={s.botao} onPress={onEscanear} accessibilityRole="button">
        <Camera color={colors.white} />
        <Text style={s.botaoTxt}>Escanear</Text>
      </Pressable>

      <View style={s.card}>
        <Text style={s.cardTitulo}>Produtos populares na região</Text>
        {itens === null && !erro && <ActivityIndicator color={colors.primary} style={{ margin: 24 }} />}
        {erro && <Text style={s.erro}>Não foi possível carregar os produtos. Verifique a conexão.</Text>}
        {itens?.slice(0, 5).map(p => (
          <ProdutoRow key={p.id} produto={p} onPress={() => onAbrir(p)} />
        ))}
        {itens && itens.length > 5 && (
          <Pressable onPress={onVerMais} style={s.verMais} accessibilityRole="button">
            <Text style={s.verMaisTxt}>Ver mais</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 24 },
  h1: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: colors.text, marginTop: 32 },
  sub: { fontSize: 13, textAlign: 'center', color: colors.subtle, marginTop: 8, lineHeight: 19 },
  botao: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    height: 48,
    marginTop: 20,
  },
  botaoTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 16, marginTop: 28 },
  cardTitulo: { fontSize: 15, fontWeight: '700', textAlign: 'center', color: colors.text, marginBottom: 8 },
  verMais: { alignItems: 'center', paddingVertical: 12 },
  verMaisTxt: { fontSize: 13, fontWeight: '600', color: colors.text },
  erro: { color: colors.primary, textAlign: 'center', padding: 16, fontSize: 13 },
});
