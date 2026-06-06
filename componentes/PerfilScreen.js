import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Card, Text, List, Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../comun/comun';
import { useNetInfo } from '@react-native-community/netinfo';
// Importamos la acción de cerrar sesión
import { usuarioCerrarSesion } from '../redux/ActionCreators';

export default function PerfilScreen({ onIrALogin }) {
  const dispatch = useDispatch();
  const { datos, estaLogueado } = useSelector((state) => state.usuario);
  const netInfo = useNetInfo();

  const iniciales = datos?.email ? datos.email.substring(0, 2).toUpperCase() : 'IN';

  return (
    <View style={styles.container}>

      {estaLogueado ? (
        // VISTA A: USUARIO AUTENTICADO COMPLETO
        <>
          <Card style={styles.tarjeta}>
            <Card.Content style={styles.avatarSeccion}>
              <Avatar.Text size={80} label={iniciales} style={styles.avatar} labelStyle={{ color: '#fff' }} />
              <Text variant="headlineSmall" style={styles.emailText}>{datos?.email || 'Usuario'}</Text>
              <Text variant="bodyMedium" style={styles.subtext}>ID Único: {datos?.uid || 'Sin UID'}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.tarjetaDetalles}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.tituloSeccion}>Privacidad y Aplicación</Text>

              <List.Item
                title="Estado de la Aplicación"
                description="Sesión Colaborativa Activa"
                left={props => <List.Icon {...props} icon="check-circle" color="green" />}
              />

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

              {/* BOTÓN DE CIERRE DE SESIÓN EXPLICITO COMPLETADO */}
              <Button
                mode="outlined"
                borderColor={COLORS.primary}
                textColor={COLORS.primary}
                onPress={() => dispatch(usuarioCerrarSesion())}
                style={styles.botonLogOut}
                icon="logout"
              >
                Cerrar Sesión
              </Button>
            </Card.Content>
          </Card>
        </>
      ) : (
        // VISTA B: PANTALLA INTELIGENTE DE PERFIL PARA INVITADOS
        <Card style={styles.tarjetaInvitado}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Avatar.Icon size={70} icon="account-question" backgroundColor="#e0e0e0" color="gray" />
            <Text variant="titleLarge" style={styles.tituloInvitado}>Perfil de Invitado</Text>
            <Text variant="bodyMedium" style={styles.descripcionInvitado}>
              Estás explorando SanFerLink en modo lectura. Inicia sesión para unirte a la red de cuadrillas,
              reportar incidencias en vivo y votar la fiabilidad de las calles.
            </Text>
            <Button
              mode="contained"
              buttonColor={COLORS.primary}
              onPress={onIrALogin}
              style={{ width: '100%', marginTop: 10 }}
              icon="login"
            >
              Iniciar Sesión / Registrarse
            </Button>
          </Card.Content>
        </Card>
      )}

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
  tituloSeccion: { fontWeight: 'bold', marginBottom: 10, color: '#555' },
  botonLogOut: { marginTop: 20, borderRadius: 8, borderWidth: 1.5 },
  tarjetaInvitado: { backgroundColor: '#ffffff', borderRadius: 16, padding: 10, elevation: 3 },
  tituloInvitado: { fontWeight: 'bold', marginTop: 15, color: '#1A1A1A' },
  descripcionInvitado: { textAlign: 'center', color: '#6C757D', marginVertical: 15, lineHeight: 20 }
});