import React, { Component } from 'react';
import { View, Platform, StyleSheet, AppState, BackHandler } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { connect } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BienvenidaScreen from './BienvenidaScreen'; // Nueva
import LoginScreen from './LoginScreen';
import EventosScreen from './EventoScreen';
import MapaScreen from './MapaScreen';
import ReporteIncidenciaScreen from './ReporteIncidenciaScreen';
import PerfilScreen from './PerfilScreen'; // ⬅️ Nueva pantalla de perfil
import CuadrillaScreen from './CuadrillaScreen'; // ⬅️ Nueva pantalla de cuadrilla


import { actualizarPresencia } from '../redux/ActionCreators';
import { COLORS } from '../comun/comun';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const mapStateToProps = (state) => ({
  usuario: state.usuario
});

const mapDispatchToProps = (dispatch) => ({
  cambiarPresencia: (userId, estado) => dispatch(actualizarPresencia(userId, estado))
});

const CustomHeader = ({ title }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.customHeaderContainer,
      {
        paddingTop: Platform.OS === 'ios' ? insets.top : 0,
        height: Platform.OS === 'ios' ? 56 + insets.top : 56,
      }
    ]}>
      <Text style={styles.customHeaderTitle}>{title}</Text>
    </View>
  );
};

class Campobase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appStateActual: AppState.currentState,
      // CONTROL CENTRALIZADO: 'bienvenida' | 'login' | 'app'
      rutaActualAcceso: 'bienvenida'
    };
  }

  componentDidMount() {
    this.appStateSubscription = AppState.addEventListener('change', this.controlarCambioAppState);
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.controlarBackPress);
  }

  componentWillUnmount() {
    if (this.appStateSubscription) this.appStateSubscription.remove();
    if (this.backHandler) this.backHandler.remove();
    const { estaLogueado, datos } = this.props.usuario;
    if (estaLogueado && datos?.uid) this.props.cambiarPresencia(datos.uid, 'offline');
  }

  controlarBackPress = () => {
    if (this.state.rutaActualAcceso === 'login') {
      this.setState({ rutaActualAcceso: 'bienvenida' });
      return true; // Evita el comportamiento por defecto (salir de la app)
    }
    return false; // Permite el comportamiento por defecto
  };

  controlarCambioAppState = (siguienteAppState) => {
    const { estaLogueado, datos } = this.props.usuario;
    if (estaLogueado && datos?.uid) {
      if (this.state.appStateActual.match(/inactive|background/) && siguienteAppState === 'active') {
        this.props.cambiarPresencia(datos.uid, 'online');
      } else if (siguienteAppState === 'background') {
        this.props.cambiarPresencia(datos.uid, 'background');
      }
    }
    this.setState({ appStateActual: siguienteAppState });
  };

  componentDidUpdate(prevProps) {
    const { estaLogueado, datos } = this.props.usuario;
    const prevEstaLogueado = prevProps.usuario.estaLogueado;

    // A. Si se loguea de verdad, saltamos directo a la App colaborativa
    if (estaLogueado && !prevEstaLogueado && datos?.uid) {
      this.props.cambiarPresencia(datos.uid, 'online');
      this.setState({ rutaActualAcceso: 'app' });
    }

    // B. Si cierra sesión (pasa a false), lo mandamos de vuelta a Bienvenida
    if (!estaLogueado && prevEstaLogueado) {
      this.setState({ rutaActualAcceso: 'bienvenida' });
    }
  }

  MapaNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen 
        name="MapaSanFermin" 
        component={MapaScreen} 
        options={{ 
          title: 'Mapa Realtime', 
          header: () => <CustomHeader title="Mapa Realtime" /> 
        }} 
      />
    </Stack.Navigator>
  );

  AlertasNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen name="ReportarIncidente" component={ReporteIncidenciaScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );

  EventosNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen name="Eventos" component={EventosScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );

  PerfilNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen 
        name="MiPerfil" 
        options={{ 
          title: 'Mi Perfil', 
          header: () => <CustomHeader title="Mi Perfil" /> 
        }}
      >
        {props => <PerfilScreen {...props} onIrALogin={() => this.setState({ rutaActualAcceso: 'login' })} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  // Navegador para la pantalla de Cuadrilla (con cabecera personalizada, sin doble cabecera)
  CuadrillaNavegador = () => (
    <Stack.Navigator screenOptions={styles.opcionesHeader}>
      <Stack.Screen name="MiCuadrilla" component={CuadrillaScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );

  BottomTabNavegador = () => (
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
        name="EventosTab"
        component={this.EventosNavegador}
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-text" color={color} size={size} />,
        }}
      />
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
        
        {/* Nueva pestaña de Cuadrilla para planificar con amigos */}
        <Tab.Screen
          name="CuadrillaTab"
          component={this.CuadrillaNavegador}
          options={{
            title: 'Cuadrilla',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />,
          }}
        />
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

  render() {
    const { rutaActualAcceso } = this.state;

    // RENDERIZADO POR MÁQUINA DE ESTADOS LIMPIA
    switch (rutaActualAcceso) {
      case 'bienvenida':
        return (
          <BienvenidaScreen
            onEntrarInvitado={() => this.setState({ rutaActualAcceso: 'app' })} // Saltamos directo a la App en modo lectura
            onIrALogin={() => this.setState({ rutaActualAcceso: 'login' })}
          />
        );
      case 'login':
        return (
          <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 0 : Constants.statusBarHeight }}>
            <LoginScreen onVolver={() => this.setState({ rutaActualAcceso: 'bienvenida' })} />
          </View>
        );
      case 'app':
        return (
          <NavigationContainer>
            <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 0 : Constants.statusBarHeight }}>
              <this.BottomTabNavegador />
            </View>
          </NavigationContainer>
        );
      default:
        return <WelcomeScreen onEntrarInvitado={() => this.setState({ rutaActualAcceso: 'app' })} />;;
    }
  }
}

const styles = StyleSheet.create({
  opcionesHeader: {
    headerTintColor: '#fff',
    headerStyle: { backgroundColor: COLORS.primary },
    headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
  },
  customHeaderContainer: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#B21E29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  customHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Campobase);