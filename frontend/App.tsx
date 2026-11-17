/**
 * NutriScan — raiz do app.
 * Navegação própria e mínima (pilha + 2 abas), sem libs nativas extras.
 * Se a equipe preferir React Navigation, cada tela em src/screens já é independente.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './src/components/Header';
import { TabBar, type Aba } from './src/components/TabBar';
import { Home } from './src/screens/Home';
import { Lista } from './src/screens/Lista';
import { Resumo } from './src/screens/Resumo';
import { Scanner } from './src/screens/Scanner';
import { Splash } from './src/screens/Splash';
import { colors } from './src/theme';
import { ErroApi, obterProduto } from './src/services/api';
import type { ProdutoCompleto, Rota } from './src/types';

export default function App() {
  const [splash, setSplash] = useState(true);
  const [pilha, setPilha] = useState<Rota[]>([{ nome: 'home' }]);
  const [historico, setHistorico] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const rota = pilha[pilha.length - 1];
  const aba: Aba = pilha[0].nome === 'scanner' ? 'escanear' : 'explorar';

  const ir = useCallback((r: Rota) => setPilha(p => [...p, r]), []);
  const voltar = useCallback(() => setPilha(p => (p.length > 1 ? p.slice(0, -1) : p)), []);
  const trocarAba = useCallback(
    (a: Aba) => setPilha([{ nome: a === 'escanear' ? 'scanner' : 'home' }]),
    [],
  );

  // Home/Lista têm só o resumo do catálogo — a ficha completa vem de GET /{id}.
  const abrirId = useCallback(
    async (id: number) => {
      try {
        ir({ nome: 'resumo', produto: await obterProduto(id) });
      } catch (e) {
        Alert.alert('NutriScan', e instanceof ErroApi ? e.message : 'Não foi possível carregar o produto.');
      }
    },
    [ir],
  );

  // O Scanner já carrega a ficha inteira antes de navegar.
  const abrir = useCallback(
    (produto: ProdutoCompleto) => ir({ nome: 'resumo', produto }),
    [ir],
  );

  // Botão "voltar" do Android: desempilha; na raiz deixa o sistema sair do app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pilha.length > 1) {
        voltar();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [pilha.length, voltar]);

  const buscar = useCallback(
    (q: string) => {
      setHistorico(h => [q, ...h.filter(x => x !== q)].slice(0, 5));
      setPilha(p => (p[p.length - 1].nome === 'lista' ? [...p.slice(0, -1), { nome: 'lista', consulta: q }] : [...p, { nome: 'lista', consulta: q }]));
    },
    [],
  );
  if (splash) {
    return <Splash />;
  }

  const escuro = rota.nome === 'scanner';
  const titulo =
    rota.nome === 'lista'
      ? 'Produtos populares na região'
      : rota.nome === 'scanner'
      ? 'Escanear produto'
      : rota.nome === 'resumo'
      ? `Resumo - ${rota.produto.nome}`
      : '';

  return (
    <SafeAreaProvider>
      {/* RN 0.88 (edge-to-edge): StatusBar não aceita mais backgroundColor — o fondo é o da raiz */}
      <StatusBar barStyle={escuro ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[s.raiz, escuro && { backgroundColor: colors.black }]} edges={['top']}>
        {rota.nome !== 'home' && (
          <Header titulo={titulo} escuro={escuro} onVoltar={pilha.length > 1 ? voltar : undefined} />
        )}
        <View style={s.corpo}>
          {rota.nome === 'home' && (
            <Home
              historico={historico}
              onBuscar={buscar}
              onEscanear={() => trocarAba('escanear')}
              onAbrir={abrirId}
              onVerMais={() => ir({ nome: 'lista' })}
            />
          )}
          {rota.nome === 'lista' && (
            <Lista key={rota.consulta ?? ''} consultaInicial={rota.consulta} historico={historico} onBuscar={buscar} onAbrir={abrirId} />
          )}
          {rota.nome === 'scanner' && <Scanner ativa onProduto={abrir} />}
          {rota.nome === 'resumo' && <Resumo produto={rota.produto} />}
        </View>
        <TabBar ativa={aba} onSelecionar={trocarAba} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.bg },
  corpo: { flex: 1 },
});
