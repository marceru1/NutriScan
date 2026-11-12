module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Plugin obrigatório do react-native-worklets (frame processors do VisionCamera)
  plugins: ['react-native-worklets/plugin'],
};
