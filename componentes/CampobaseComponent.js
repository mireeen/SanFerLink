import React, { Component } from 'react';
// 1. Importamos AppState desde react-native para el control de presencia
import { View, Platform, StyleSheet, AppState } from 'react-native';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { connect } from 'react-redux';

// --- Importaciones de vuestros componentes/pantallas ---
import LoginScreen from './LoginScreen';
import MapaScreen from './MapaScreen';
import ReporteIncidenciaScreen from './ReporteIncidenciaScreen';
import PerfilScreen from './PerfilScreen'; // ⬅️ Nueva pantalla de perfil
import { Text } from 'react-native-paper';

// Importamos el Thunk de presencia para actualizar Firebase
import { actualizarPresencia } from '../redux/ActionCreators';
import { COLORS } from '../comun/comun';

function VistaTemporal(props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{props.texto}</Text></View>
  );
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Mapeamos el estado global de Redux
const mapStateToProps = (state) => ({
  usuario: state.usuario
});

// Mapeamos la acción para inyectar el Thunk de presencia
const mapDispatchToProps = (dispatch) => ({
  cambiarPresencia: (userId, estado) => dispatch(actualizarPresencia(userId, estado))
});

class Campobase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Estado local para recordar el foco actual del móvil (active/background)
      appStateActual: AppState.currentState
    };
  }

  componentDidMount() {
    // 2. Iniciamos el escuchador nativo del teléfono
    this.appStateSubscription = AppState.addEventListener('change', this.controlarCambioAppState);
  }

  componentWillUnmount() {
    // 3. Limpieza de memoria obligatoria para evitar fugas en procesos de Expo
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    // Si destruyen la app del todo, intentamos marcar offline de emergencia
    const { estaLogueado, datos } = this.props.usuario;
    if (estaLogueado && datos?.uid) {
      this.props.cambiarPresencia(datos.uid, 'offline');
    }
  }

  // 4. LÓGICA DE PRESENCIA EN TIEMPO REAL CON HARDWARE
  controlarCambioAppState = (siguienteAppState) => {
    const { estaLogueado, datos } = this.props.usuario;

    // Solo interactuamos con Firebase si hay una sesión activa en Redux
    if (estaLogueado && datos?.uid) {

      // CASO A: El usuario regresa a la app (Background ➡️ Active)
      if (this.state.appStateActual.match(/inactive|background/) && siguienteAppState === 'active') {
        this.props.cambiarPresencia(datos.uid, 'online');
      }

      // CASO B: El usuario bloquea el móvil o abre otra app (Active ➡️ Background)
      else if (siguienteAppState === 'background') {
        this.props.cambiarPresencia(datos.uid, 'background');
      }
    }

    // Actualizamos el estado de la clase
    this.setState({ appStateActual: siguienteAppState });
  };

  componentDidUpdate(prevProps) {
    const { estaLogueado, datos } = this.props.usuario;
    const prevEstaLogueado = prevProps.usuario.estaLogueado;

    // Cuando el login pasa a true por primera vez, forzamos el estado 'online'
    if (estaLogueado && !prevEstaLogueado && datos?.uid) {
      this.props.cambiarPresencia(datos.uid, 'online');
    }
  }

  // --- Navegadores de Pestañas (Stack Navigators) ---
  MapaNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen name="MapaSanFermin" component={MapaScreen} options={{ title: 'Mapa Realtime' }} />
    </Stack.Navigator>
  );

  AlertasNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen name="ReportarIncidente" component={ReporteIncidenciaScreen} options={{ title: 'Reportar Incidencia' }} />
    </Stack.Navigator>
  );

  EventosNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen name="ListaEventos" component={() => <VistaTemporal texto="Programa de Fiestas 📅" />} options={{ title: 'Eventos' }} />
    </Stack.Navigator>
  );

  // 5. Añadimos el Navegador para la nueva pantalla de Perfil
  PerfilNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen name="MiPerfil" component={PerfilScreen} options={{ title: 'Mi Perfil' }} />
    </Stack.Navigator>
  );

  // --- Navegador Principal del Menú de Pestañas (Bottom Tab) ---
  BottomTabNavegador = () => {
    return (
      <Tab.Navigator
        initialRouteName="MapaTab"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: '#ffffff' }
        }}
      >
        <Tab.Screen
          name="MapaTab"
          component={this.MapaNavegador}
          options={{
            title: 'Mapa',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="AlertasTab"
          component={this.AlertasNavegador}
          options={{
            title: 'Alertar',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="alert-circle" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="EventosTab"
          component={this.EventosNavegador}
          options={{
            title: 'Eventos',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-text" color={color} size={size} />,
          }}
        />
        {/* 6. Inyectamos la pestaña de perfil en el menú inferior */}
        <Tab.Screen
          name="PerfilTab"
          component={this.PerfilNavegador}
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    );
  };

  render() {
    const { estaLogueado } = this.props.usuario;

    return (
      <NavigationContainer>
        <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 0 : Constants.statusBarHeight }}>

          {estaLogueado ? (
            <this.BottomTabNavegador />
          ) : (
            <LoginScreen />
          )}

        </View>
      </NavigationContainer>
    );
  }
}

const styles = StyleSheet.create({
  opcionesHeader: {
    headerTintColor: '#fff',
    headerStyle: { backgroundColor: COLORS.primary },
    headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
  }
});

// Conectamos el componente aplicando ambos mapeos (lectura y escritura de presencia)
export default connect(mapStateToProps, mapDispatchToProps)(Campobase);