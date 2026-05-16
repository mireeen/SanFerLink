import React, { Component } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { connect } from 'react-redux';

// --- Importaciones de vuestros componentes/pantallas ---
import LoginScreen from './LoginScreen';
import ReporteIncidenciaScreen from './ReporteIncidenciaScreen';
// Nota: Importaremos componentes vacíos temporales para Mapa, Eventos y Perfil hasta que los creéis
import { Text } from 'react-native-paper';

function VistaTemporal(props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{props.texto}</Text></View>
  );
}

// --- Importaciones de vuestro Redux Clásico ---
// (Aquí importarás tus futuros fetchers cuando conectemos la base de datos)
// import { fetchAlertas } from '../redux/ActionCreators';

import { COLORS } from '../comun/comun';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Mapeamos el estado para saber si el usuario está logueado en la app
const mapStateToProps = (state) => ({
  usuario: state.usuario // Lee vuestro reducer de usuario.js
});

class Campobase extends Component {
  
  componentDidMount() {
    // Aquí ejecutaréis los fetches iniciales de la app cuando tengáis la base de datos
    // Ej: this.props.fetchAlertas();
  }

  // --- 1. Navegador de la Pestaña Mapa ---
  MapaNavegador = () => {
    return (
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="MapaSanFermin"
          component={() => <VistaTemporal texto="Mapa de San Fermín 🗺️" />}
          options={{ title: 'Mapa Realtime' }}
        />
      </Stack.Navigator>
    );
  };

  // --- 2. Navegador de la Pestaña Reportar Alertas ---
  AlertasNavegador = () => {
    return (
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="ReportarIncidente"
          component={ReporteIncidenciaScreen}
          options={{ title: 'Reportar Incidencia' }}
        />
      </Stack.Navigator>
    );
  };

  // --- 3. Navegador de la Pestaña Lista de Eventos ---
  EventosNavegador = () => {
    return (
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: COLORS.primary },
        }}
      >
        <Stack.Screen
          name="ListaEventos"
          component={() => <VistaTemporal texto="Programa de Fiestas 📅" />}
          options={{ title: 'Eventos' }}
        />
      </Stack.Navigator>
    );
  };

  // --- 4. Navegador Principal del Menú de Pestañas (Bottom Tab) ---
  BottomTabNavegador = () => {
    return (
      <Tab.Navigator
        initialRouteName="MapaTab"
        screenOptions={{
          headerShown: false, // Ocultamos la cabecera del Tab porque ya la pinta el Stack superior
          tabBarActiveTintColor: COLORS.primary, // Rojo San Fermín
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: '#ffffff' }
        }}
      >
        <Tab.Screen
          name="MapaTab"
          component={this.MapaNavegador}
          options={{
            title: 'Mapa',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="map" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="AlertasTab"
          component={this.AlertasNavegador}
          options={{
            title: 'Alertar',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="alert-circle" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="EventosTab"
          component={this.EventosNavegador}
          options={{
            title: 'Eventos',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="calendar-text" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  };

  render() {
    // Extraemos la variable del estado que nos inyecta el connect()
    const { estaLogueado } = this.props.usuario;

    return (
      <NavigationContainer>
        <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 0 : Constants.statusBarHeight }}>
          
          {estaLogueado ? (
            // Si el usuario se ha logueado con éxito, ve la aplicación completa
            <this.BottomTabNavegador />
          ) : (
            // Si no está autenticado, la app le bloquea mostrándole únicamente el Login
            <LoginScreen />
          )}

        </View>
      </NavigationContainer>
    );
  }
}

// Conectamos el componente a Redux utilizando el patrón clásico que manejas
export default connect(mapStateToProps, null)(Campobase);