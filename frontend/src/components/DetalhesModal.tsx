import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import type { ProdutoCompleto } from '../types';
import { Fechar, IconeAlerta } from './Icons';

interface Props {
  produto: ProdutoCompleto;
  visivel: boolean;
  onFechar: () => void;
}

export function DetalhesModal({ produto, visivel, onFechar }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visivel} onRequestClose={onFechar}>
      <View style={s.fundo}>
        <View style={s.folha}>
          <View style={s.topo}>
            <Text style={s.topoTxt} numberOfLines={1}>
              Detalhes - {produto.nome}
            </Text>
            <Pressable onPress={onFechar} hitSlop={12} style={s.fechar} accessibilityLabel="Fechar">
              <Fechar />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.corpo}>
            <Text style={s.h1}>Avaliação geral</Text>
            <View style={s.alerta}>
              <IconeAlerta />
              <Text style={s.alertaTxt}>{produto.traducao_n1}</Text>
            </View>
            <Text style={s.p}>{produto.traducao_n2}</Text>
            <Text style={[s.p, { marginTop: 16 }]}>{produto.traducao_n3}</Text>
            {produto.consumo_diario ? (
              <>
                <Text style={s.h2}>Consumo diário recomendado</Text>
                <Text style={s.pc}>{produto.consumo_diario}</Text>
              </>
            ) : null}
            {produto.substituicoes ? (
              <>
                <Text style={s.h2}>Substituições saudáveis</Text>
                <Text style={s.pc}>{produto.substituicoes}</Text>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 20 },
  folha: { backgroundColor: colors.bg, borderRadius: radius.xl, maxHeight: '88%' },
  topo: { height: 56, justifyContent: 'center', paddingHorizontal: 56 },
  topoTxt: { fontSize: 15, fontWeight: '600', textAlign: 'center', color: colors.text },
  fechar: { position: 'absolute', right: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  corpo: { paddingHorizontal: 24, paddingBottom: 28 },
  h1: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: colors.text, marginBottom: 12 },
  alerta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  alertaTxt: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: colors.primary },
  p: { fontSize: 14, lineHeight: 21, color: colors.subtle },
  h2: { fontSize: 14, fontWeight: '700', textAlign: 'center', color: colors.text, marginTop: 28, marginBottom: 6 },
  pc: { fontSize: 14, lineHeight: 21, textAlign: 'center', color: colors.subtle },
});
