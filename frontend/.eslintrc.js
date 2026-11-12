module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // jest.setup.js usa o objeto global `jest` fornecido pelo Jest
      files: ['jest.setup.js', 'jest.config.js'],
      env: { jest: true },
    },
  ],
};
