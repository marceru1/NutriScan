// Mocks de módulos nativos (Nitro/VisionCamera) que não existem no ambiente Jest.
// Ver jest.config.js → setupFiles.

jest.mock('react-native-vision-camera', () => ({
  useCameraDevice: jest.fn(() => ({
    id: 'back',
    devices: ['wide-angle-camera'],
    position: 'back',
    name: 'Fake Back Camera',
    hasFlash: false,
  })),
  useCameraPermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn(async () => true),
  })),
}));

jest.mock('react-native-vision-camera-ocr-plus', () => ({
  Camera: jest.fn(() => null),
  useTextRecognition: jest.fn(() => ({ scanText: jest.fn() })),
  useTranslate: jest.fn(() => ({ scanText: jest.fn(), translate: jest.fn(async () => '') })),
  PhotoRecognizer: jest.fn(async () => ({ resultText: '', blocks: [] })),
  RemoveLanguageModel: jest.fn(async () => true),
}));
