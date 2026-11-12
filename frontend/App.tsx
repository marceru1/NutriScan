/**
 * NutriScan — Scanner de Rótulos (MVP — Onda 1, F01)
 *
 * Tela inicial do app: lê a face principal do produto (a que fica em
 * exposição na gôndola) e mostra o texto reconhecido por OCR
 * (react-native-vision-camera-ocr-plus).
 *
 * Próximos passos (Lean Inception):
 *  - F04: alertas visuais de açúcar/sódio/gordura saturada (RDC 429/2020 ANVISA)
 *  - F03: tradução da tabela nutricional em 3 níveis de profundidade
 *
 * Biblioteca: https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
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

// Área central da tela em que o OCR de fato roda — a face principal do
// produto (mesma proporção do overlay).
const SCAN_REGION: ScanRegion = {
  left: '10%',
  top: '25%',
  width: '80%',
  height: '40%',
};

const MIN_UPDATE_INTERVAL_MS = 500;

// O ocr-plus tipa o <Camera> contra os CameraProps do hook useCamera
// (que não incluem style); em runtime todos os props são repassados ao
// <Camera> do VisionCamera v5, que aceita style. Centralizamos o bridge aqui.
type OcrCameraProps = CameraTypes & { style?: StyleProp<ViewStyle> };
const OcrCamera = OcrPlusCamera as React.FC<OcrCameraProps>;

export default function App() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const isDarkMode = useColorScheme() === 'dark';

  const [recognizedText, setRecognizedText] = useState('');
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // OCR dispara a cada frame processado; limita a frequência de renderização.
  const handleOcr = useCallback((data: string | OcrText) => {
    if (typeof data === 'string' || !data?.resultText) {
      return;
    }
    const now = Date.now();
    if (now - lastUpdate.current < MIN_UPDATE_INTERVAL_MS) {
      return;
    }
    lastUpdate.current = now;
    setRecognizedText(data.resultText.trim());
  }, []);

  const clearText = useCallback(() => setRecognizedText(''), []);

  const palette = isDarkMode ? darkColors : lightColors;

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, styles.withSafeTop]}>
        <Text style={[styles.emoji, { color: palette.text }]}>📷</Text>
        <Text style={[styles.title, { color: palette.text }]}>
          NutriScan precisa da câmera
        </Text>
        <Text style={[styles.hint, { color: palette.subtle }]}>
          Usamos a câmera apenas para ler a frente da embalagem e traduzir a
          informação nutricional.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir câmera</Text>
        </Pressable>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.container, styles.centered, styles.withSafeTop]}>
        <Text style={[styles.title, { color: palette.text }]}>
          Nenhuma câmera encontrada
        </Text>
        <Text style={[styles.hint, { color: palette.subtle }]}>
          O scanner precisa de um celular (ou emulador com câmera virtual).
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OcrCamera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        mode="recognize"
        options={{
          language: 'latin',
          frameSkipThreshold: 10,
          scanRegion: SCAN_REGION,
          useLightweightMode: true,
        }}
        callback={handleOcr}
      />

      {/* Guia visual: alinhado com a scanRegion do OCR */}
      <View
        pointerEvents="none"
        style={{
          ...styles.scanGuide,
          left: SCAN_REGION.left,
          top: SCAN_REGION.top,
          width: SCAN_REGION.width,
          height: SCAN_REGION.height,
          borderColor: palette.accent,
        }}
      />

      <View style={styles.topBadge}>
        <Text style={styles.topBadgeText}>NutriScan — aponte para a frente da embalagem</Text>
      </View>

      {recognizedText.length > 0 && (
        <View style={[styles.resultCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.resultTitle, { color: palette.text }]}>
            Texto reconhecido
          </Text>
          <Text
            style={[styles.resultText, { color: palette.subtle }]}
            numberOfLines={6}>
            {recognizedText}
          </Text>
          <View style={styles.resultActions}>
            <Pressable style={styles.smallButton} onPress={clearText}>
              <Text style={styles.smallButtonText}>Limpar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const lightColors = {
  text: '#1c1c1e',
  subtle: '#55555a',
  card: '#ffffffee',
  accent: '#2f9e44',
};

const darkColors = {
  text: '#f2f2f7',
  subtle: '#b9b9c0',
  card: '#1c1c1eee',
  accent: '#69db7c',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  withSafeTop: {
    marginTop: 48,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2f9e44',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  topBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: '#00000099',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  scanGuide: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 2,
  },
  resultCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  smallButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
