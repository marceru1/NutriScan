import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';
import { IconeBusca } from './Icons';

interface Props {
  valor: string;
  onChange: (t: string) => void;
  onEnviar: (t: string) => void;
  historico?: string[]; // mostrado ao focar a barra (tela 2 do protótipo)
}

export function SearchBar({ valor, onChange, onEnviar, historico = [] }: Props) {
  const [foco, setFoco] = useState(false);
  const mostrarLista = foco && historico.length > 0;
  return (
    <View>
      <View style={[s.barra, mostrarLista && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
        <IconeBusca />
        <TextInput
          style={s.input}
          value={valor}
          onChangeText={onChange}
          placeholder="Pesquise por um produto e sua tabela nutricional"
          placeholderTextColor={colors.subtle}
          returnKeyType="search"
          onFocus={() => setFoco(true)}
          onBlur={() => setTimeout(() => setFoco(false), 150)}
          onSubmitEditing={() => valor.trim() && onEnviar(valor.trim())}
          accessibilityLabel="Pesquisar produto"
        />
      </View>
      {mostrarLista && (
        <View style={s.lista}>
          {historico.map(h => (
            <Pressable key={h} style={s.item} onPress={() => onEnviar(h)}>
              <IconeBusca />
              <Text style={s.itemTxt}>{h}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    height: 48,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0 },
  lista: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingBottom: 8,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, height: 44 },
  itemTxt: { fontSize: 14, color: colors.text },
});
