import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Avatar, Card, Text, List, Button, IconButton } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../comun/comun';
import { useNetInfo } from '@react-native-community/netinfo';
import { usuarioCerrarSesion } from '../redux/ActionCreators';
import * as ImagePicker from 'expo-image-picker';
import { ref, onValue, set } from 'firebase/database';
import { rtdb } from '../comun/firebase';

export default function PerfilScreen({ onIrALogin }) {
  const dispatch = useDispatch();
  const { datos, estaLogueado } = useSelector((state) => state.usuario);
  const netInfo = useNetInfo();

  const [fotoPerfil, setFotoPerfil] = useState(null);

  // Escuchar en tiempo real la foto de perfil desde Firebase
  useEffect(() => {
    if (!estaLogueado || !datos?.uid) {
      setFotoPerfil(null);
      return;
    }

    const fotoRef = ref(rtdb, `usuarios/${datos.uid}/fotoPerfil`);
    const unsubscribe = onValue(fotoRef, (snapshot) => {
      setFotoPerfil(snapshot.val());
    }, (error) => {
      console.error("Error al obtener foto de perfil:", error);
    });

    return () => unsubscribe();
  }, [estaLogueado, datos?.uid]);

  const iniciales = datos?.email ? datos.email.substring(0, 2).toUpperCase() : 'IN';

  // Mostrar diálogo nativo para elegir el origen de la foto
  const seleccionarOrigenFoto = () => {
    Alert.alert(
      "Foto de Perfil",
      "Selecciona una opción para actualizar tu foto de perfil:",
      [
        { text: "Hacer Foto 📸", onPress: () => abrirCamara() },
        { text: "Elegir de Galería 🖼️", onPress: () => abrirGaleria() },
        { text: "Eliminar Foto 🗑️", onPress: () => eliminarFoto(), style: "destructive" },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  // Tomar una foto usando la cámara
  const abrirCamara = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Permiso denegado 📍",
          "Necesitamos acceso a la cámara para poder tomar una foto de perfil."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.15, // Calidad comprimida para reducir el tamaño base64
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await set(ref(rtdb, `usuarios/${datos.uid}/fotoPerfil`), base64Image);
        Alert.alert("¡Éxito!", "Foto de perfil actualizada.");
      }
    } catch (error) {
      console.error("Error al abrir cámara:", error);
      Alert.alert("Error", "Ocurrió un error al intentar tomar la foto.");
    }
  };

  // Elegir una foto de la galería
  const abrirGaleria = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Permiso denegado 📍",
          "Necesitamos tu permiso para acceder a la galería de fotos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.15, // Calidad comprimida
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await set(ref(rtdb, `usuarios/${datos.uid}/fotoPerfil`), base64Image);
        Alert.alert("¡Éxito!", "Foto de perfil actualizada.");
      }
    } catch (error) {
      console.error("Error al abrir galería:", error);
      Alert.alert("Error", "Ocurrió un error al intentar elegir la foto.");
    }
  };

  // Eliminar la foto de perfil actual
  const eliminarFoto = async () => {
    try {
      await set(ref(rtdb, `usuarios/${datos.uid}/fotoPerfil`), null);
      Alert.alert("Foto eliminada", "Se ha restablecido el avatar por defecto.");
    } catch (error) {
      console.error("Error al eliminar foto:", error);
      Alert.alert("Error", "No se pudo eliminar la foto.");
    }
  };

  return (
    <View style={styles.container}>

      {estaLogueado ? (
        // VISTA A: USUARIO AUTENTICADO COMPLETO
        <>
          <Card style={styles.tarjeta}>
            <Card.Content style={styles.avatarSeccion}>
              <TouchableOpacity onPress={seleccionarOrigenFoto} style={styles.contenedorAvatarBotones} activeOpacity={0.8}>
                {fotoPerfil ? (
                  <Avatar.Image size={80} source={{ uri: fotoPerfil }} style={styles.avatar} />
                ) : (
                  <Avatar.Text size={80} label={iniciales} style={styles.avatar} labelStyle={{ color: '#fff' }} />
                )}
                <View style={styles.badgeCamara}>
                  <IconButton icon="camera" size={14} iconColor="#ffffff" style={{ margin: 0 }} />
                </View>
              </TouchableOpacity>
              <Text variant="headlineSmall" style={styles.emailText}>{datos?.email || 'Usuario'}</Text>
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
  avatar: { backgroundColor: COLORS.primary, marginBottom: 5 },
  contenedorAvatarBotones: {
    position: 'relative',
    marginBottom: 10,
  },
  badgeCamara: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 4,
  },
  emailText: { fontWeight: 'bold', color: '#333' },
  subtext: { color: 'gray', marginTop: 4, fontSize: 12 },
  tarjetaDetalles: { backgroundColor: '#ffffff', elevation: 2 },
  tituloSeccion: { fontWeight: 'bold', marginBottom: 10, color: '#555' },
  botonLogOut: { marginTop: 20, borderRadius: 8, borderWidth: 1.5 },
  tarjetaInvitado: { backgroundColor: '#ffffff', borderRadius: 16, padding: 10, elevation: 3 },
  tituloInvitado: { fontWeight: 'bold', marginTop: 15, color: '#1A1A1A' },
  descripcionInvitado: { textAlign: 'center', color: '#6C757D', marginVertical: 15, lineHeight: 20 }
});