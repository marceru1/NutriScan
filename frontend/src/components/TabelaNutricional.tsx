import { StyleSheet, Text, View } from 'react-native';
import { montarTabela } from '../domain/rdc';
import { colors } from '../theme';
import type { ProdutoCompleto } from '../types';

export function TabelaNutricional({ produto }: { produto: ProdutoCompleto }) {
  const t = montarTabela(produto);
  if (t.linhas.length === 0) {
    return <Text style={s.vazio}>Tabela nutricional ainda não cadastrada para este produto.</Text>;
  }
  return (
    <View style={s.caixa}>
      <Text style={s.titulo}>INFORMAÇÃO NUTRICIONAL</Text>
      {t.porcoesEmbalagem ? <Text style={s.meta}>Porções por embalagem: {t.porcoesEmbalagem}</Text> : null}
      {t.porcao ? <Text style={s.meta}>Porção: {t.porcao}</Text> : null}
      <View style={s.grossa} />
      <View style={s.linha}>
        <Text style={[s.cel, s.nome]} />
        <Text style={[s.cel, s.num, s.bold]}>{t.colunaBase}</Text>
        {t.temPorcao && <Text style={[s.cel, s.num, s.bold]}>Porção</Text>}
        {t.temPorcao && <Text style={[s.cel, s.num, s.bold]}>%VD*</Text>}
      </View>
      {t.linhas.map(l => (
        <View key={l.nome} style={[s.linha, s.sep]}>
          <Text style={[s.cel, s.nome, l.recuo && { paddingLeft: 10 }]}>{l.nome}</Text>
          <Text style={[s.cel, s.num]}>{l.v100}</Text>
          {t.temPorcao && <Text style={[s.cel, s.num]}>{l.vPorcao ?? '-'}</Text>}
          {t.temPorcao && <Text style={[s.cel, s.num]}>{l.vd ?? ''}</Text>}
        </View>
      ))}
      {t.temPorcao && <Text style={s.rodape}>*Percentual de valores diários fornecidos pela porção.</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  caixa: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.black, padding: 6 },
  titulo: { fontSize: 14, fontWeight: '800', color: colors.black },
  meta: { fontSize: 11, color: colors.black },
  grossa: { height: 5, backgroundColor: colors.black, marginVertical: 4 },
  linha: { flexDirection: 'row', alignItems: 'center' },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.black },
  cel: { fontSize: 11, color: colors.black, paddingVertical: 3 },
  nome: { flex: 1 },
  num: { width: 52, textAlign: 'center' },
  bold: { fontWeight: '800' },
  rodape: { fontSize: 9, color: colors.black, marginTop: 4 },
  vazio: { fontSize: 13, color: colors.subtle, textAlign: 'center', paddingVertical: 16 },
});
