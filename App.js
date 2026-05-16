import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { ConfigureStore } from './redux/configureStore';

import Campobase from './componentes/CampobaseComponent';

const store = ConfigureStore();

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Campobase />
      </SafeAreaProvider>
    </Provider>
  );
}
