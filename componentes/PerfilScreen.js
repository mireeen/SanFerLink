import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Card, Text, List } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { COLORS } from '../comun/comun';

// 1. Importamos el detector de red nativo
import { useNetInfo } from '@react-native-community/netinfo';

export default function PerfilScreen() {
  const { datos } = useSelector((state) => state.usuario);
  
  // 2. Escuchamos el estado de la red en tiempo real
  const netInfo = useNetInfo();

  const iniciales = datos?.email ? datos.email.substring(0, 2).toUpperCase() : 'US';

  return (
    <View style={styles.container}>
      
      <Card style={styles.tarjeta}>
        <Card.Content style={styles.avatarSeccion}>
          <Avatar.Text size={80} label={iniciales} style={styles.avatar} labelStyle={{ color: '#fff' }} />
          <Text variant="headlineSmall" style={styles.emailText}>{datos?.email || 'Usuario San Fermín'}</Text>
          <Text variant="bodyMedium" style={styles.subtext}>ID de Usuario: {datos?.uid || 'Sin UID'}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.tarjetaDetalles}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.tituloSeccion}>Privacidad y Aplicación</Text>
          
          <List.Item
            title="Estado de la Aplicación"
            description="Abierta (Sesión Activa)"
            left={props => <List.Icon {...props} icon="check-circle" color="green" />} 
          />

          {/* 3. Pintamos el estado de internet dinámicamente */}
          <List.Item
            title="Conexión a Internet"
            description={netInfo.isConnected ? `Conectado (${netInfo.type})` : 'Sin conexión a internet ❌'}
            left={props => (
              <List.Icon 
                {...props} 
                icon={netInfo.isConnected ? "wifi" : "wifi-off"} 
                color={netInfo.isConnected ? "green" : "red"} 
              />
            )}
          />
        </Card.Content>
      </Card>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background, justifyContent: 'center' },
  tarjeta: { marginBottom: 20, backgroundColor: '#ffffff', elevation: 3 },
  avatarSeccion: { alignItems: 'center', paddingVertical: 10 },
  avatar: { backgroundColor: COLORS.primary, marginBottom: 15 },
  emailText: { fontWeight: 'bold', color: '#333' },
  subtext: { color: 'gray', marginTop: 4, fontSize: 12 },
  tarjetaDetalles: { backgroundColor: '#ffffff', elevation: 2 },
  tituloSeccion: { fontWeight: 'bold', marginBottom: 10, color: '#555' }
});