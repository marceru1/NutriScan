import { StyleSheet, Text, View } from 'react-native';
import { Logo } from '../components/Logo';
import { colors } from '../theme';

export function Splash() {
  return (
    <View style={s.tela}>
      <Logo size={96} />
      <Text style={s.nome}>
        Nutri<Text style={s.scan}>Scan</Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  nome: { marginTop: 16, fontSize: 40, fontWeight: '800', color: colors.olive },
  scan: { color: '#90323D'},
});