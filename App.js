import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import ReporteIncidenciaScreen from './componentes/ReporteIncidenciaScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

//const store = ConfigureStore();

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <ReporteIncidenciaScreen />
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
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
