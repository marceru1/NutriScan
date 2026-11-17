import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ProdutoRow } from '../components/ProdutoRow';
import { SearchBar } from '../components/SearchBar';
import { normalizar } from '../domain/rdc';
import { listarCatalogo } from '../services/api';
import { colors } from '../theme';
import type { ProdutoLista } from '../types';

interface Props {
  consultaInicial?: string;
  historico: string[];
  onBuscar: (q: string) => void;
  onAbrir: (id: number) => void;
}

export function Lista({ consultaInicial = '', historico, onBuscar, onAbrir }: Props) {
  const [q, setQ] = useState(consultaInicial);
  const [itens, setItens] = useState<ProdutoLista[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    listarCatalogo()
      .then(setItens)
      .catch(() => setErro(true));
  }, []);

  const filtrados = useMemo(() => {
    if (!itens) {
      return [];
    }
    const n = normalizar(q);
    return n ? itens.filter(p => normalizar(`${p.nome} ${p.marca}`).includes(n)) : itens;
  }, [itens, q]);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.busca}>
        <SearchBar valor={q} onChange={setQ} onEnviar={t => onBuscar(t)} historico={historico} />
      </View>
      {itens === null && !erro && <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />}
      {erro && <Text style={s.msg}>Não foi possível carregar os produtos.</Text>}
      <FlatList
        data={filtrados}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <ProdutoRow produto={item} onPress={() => onAbrir(item.id)} />}
        ListEmptyComponent={
          itens ? <Text style={s.msg}>Nenhum produto cadastrado com esse nome.</Text> : undefined
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  busca: { paddingHorizontal: 16, paddingBottom: 8, zIndex: 20 },
  msg: { textAlign: 'center', color: colors.subtle, padding: 24, fontSize: 14 },
});
