import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { ConfigureStore } from './redux/configureStore';

import ReporteIncidenciaScreen from './componentes/ReporteIncidenciaScreen';

const store = ConfigureStore();

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ReporteIncidenciaScreen />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
