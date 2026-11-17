/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  jest.useFakeTimers();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  // desmonta DURANTE o splash: sem timer sobrevivente (não renderiza Home nem dá fetch)
  await ReactTestRenderer.act(async () => {
    view.unmount();
  });
});
