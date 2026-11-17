/**
 * Tela "Escanear produto". Mantém o OCR já existente (vision-camera + ocr-plus),
 * a região de leitura (SCAN_REGION) e o guia visual. O botão do obturador pega o
 * último texto reconhecido, consulta o backend e segue a regra do projeto:
 * forte → resumo | duvidoso → usuário confirma | nenhum → texto cru.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import {
  Camera as OcrPlusCamera,
  type CameraTypes,
  type ScanRegion,
  type Text as OcrText,
} from 'react-native-vision-camera-ocr-plus';
import { buscarPorTexto, obterProduto, ErroApi } from '../services/api';
import { colors, radius } from '../theme';
import type { ProdutoCompleto, ProdutoResumo } from '../types';

const SCAN_REGION: ScanRegion = { left: '10%', top: '22%', width: '80%', height: '46%' };
const MIN_UPDATE_INTERVAL_MS = 500;

type OcrCameraProps = CameraTypes & { style?: StyleProp<ViewStyle> };
const OcrCamera = OcrPlusCamera as React.FC<OcrCameraProps>;

interface Props {
  ativa: boolean; // câmera só liga quando a aba está em foco
  onProduto: (p: ProdutoCompleto) => void;
}

export function Scanner({ ativa, onProduto }: Props) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const texto = useRef('');
  const ultima = useRef(0);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<ProdutoResumo[] | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleOcr = useCallback((data: string | OcrText) => {
    if (typeof data === 'string' || !data?.resultText) {
      return;
    }
    const agora = Date.now();
    if (agora - ultima.current < MIN_UPDATE_INTERVAL_MS) {
      return;
    }
    ultima.current = agora;
    texto.current = data.resultText.trim();
  }, []);

  const abrir = useCallback(
    async (id: number) => {
      try {
        onProduto(await obterProduto(id));
      } catch {
        setAviso('Não foi possível carregar o produto. Tente de novo.');
      }
    },
    [onProduto],
  );

  const capturar = useCallback(async () => {
    if (ocupado) {
      return;
    }
    if (!texto.current) {
      setAviso('Ainda não consegui ler o texto. Aproxime e centralize a embalagem.');
      return;
    }
    setOcupado(true);
    setAviso(null);
    try {
      const r = await buscarPorTexto(texto.current);
      if (r.match === 'forte' && r.candidatos[0]) {
        await abrir(r.candidatos[0].id);
      } else if (r.match === 'duvidoso') {
        setCandidatos(r.candidatos); // nunca assume match fraco
      } else {
        setAviso('Produto ainda não cadastrado.');
      }
    } catch (e) {
      setAviso(e instanceof ErroApi ? e.message : 'Sem conexão com o servidor. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }, [abrir, ocupado]);

  if (!hasPermission) {
    return (
      <View style={[s.tela, s.centro]}>
        <Text style={s.instr}>O NutriScan precisa da câmera para ler a embalagem.</Text>
        <Pressable style={s.btn} onPress={requestPermission}>
          <Text style={s.btnTxt}>Permitir câmera</Text>
        </Pressable>
      </View>
    );
  }
  if (device == null) {
    return (
      <View style={[s.tela, s.centro]}>
        <Text style={s.instr}>Nenhuma câmera encontrada neste aparelho.</Text>
      </View>
    );
  }

  return (
    <View style={s.tela}>
      <OcrCamera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={ativa && candidatos === null}
        mode="recognize"
        options={{
          language: 'latin',
          frameSkipThreshold: 10,
          scanRegion: SCAN_REGION,
          useLightweightMode: true,
        }}
        callback={handleOcr}
      />

      <View
        pointerEvents="none"
        style={[
          s.guia,
          { left: SCAN_REGION.left, top: SCAN_REGION.top, width: SCAN_REGION.width, height: SCAN_REGION.height },
        ]}
      />
      <Text style={s.instr2} pointerEvents="none">
        Centralize a embalagem do produto abaixo
      </Text>

      {aviso && (
        <Pressable style={s.aviso} onPress={() => setAviso(null)}>
          <Text style={s.avisoTxt}>{aviso}</Text>
        </Pressable>
      )}

      <Pressable
        style={s.obturador}
        onPress={capturar}
        accessibilityRole="button"
        accessibilityLabel="Escanear produto">
        {ocupado ? <ActivityIndicator color={colors.primary} /> : <View style={s.obturadorMiolo} />}
      </Pressable>

      <Modal transparent visible={candidatos !== null} animationType="slide" onRequestClose={() => setCandidatos(null)}>
        <View style={s.modalFundo}>
          <View style={s.modalFolha}>
            <Text style={s.modalTitulo}>Qual destes é o seu produto?</Text>
            {candidatos?.map(c => (
              <Pressable
                key={c.id}
                style={s.cand}
                onPress={() => {
                  setCandidatos(null);
                  abrir(c.id);
                }}>
                <Text style={s.candNome}>{c.nome}</Text>
                {c.marca ? <Text style={s.candMarca}>{c.marca}</Text> : null}
              </Pressable>
            ))}
            <Pressable style={s.cand} onPress={() => setCandidatos(null)}>
              <Text style={[s.candNome, { textAlign: 'center', color: colors.primary }]}>
                Nenhum destes
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.black },
  centro: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  instr: { color: colors.white, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  instr2: { position: 'absolute', top: 16, alignSelf: 'center', color: colors.white, fontSize: 13, fontWeight: '600' },
  guia: { position: 'absolute', borderWidth: 2, borderColor: '#8FA14A', borderRadius: 4 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 24, paddingVertical: 12 },
  btnTxt: { color: colors.white, fontWeight: '700' },
  obturador: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturadorMiolo: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: colors.black },
  aviso: {
    position: 'absolute',
    bottom: 124,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: radius.md,
    padding: 12,
  },
  avisoTxt: { color: colors.white, fontSize: 13, textAlign: 'center' },
  modalFundo: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalFolha: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20 },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8 },
  cand: { paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  candNome: { fontSize: 15, fontWeight: '600', color: colors.text },
  candMarca: { fontSize: 12, color: colors.subtle, marginTop: 2 },
});
