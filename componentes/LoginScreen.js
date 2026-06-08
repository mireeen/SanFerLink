import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform, ImageBackground, KeyboardAvoidingView, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, IconButton, Card, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../comun/comun';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importamos los dos Thunks de Firebase desde vuestro ActionCreators
import { postLoginFirebase, postRegistroFirebase } from '../redux/ActionCreators';

export default function LoginScreen({ onVolver }) {
  const paperTheme = useTheme();

  // Custom theme to ensure the floating label cutout is solid white and legible
  const inputTheme = {
    ...paperTheme,
    colors: {
      ...paperTheme.colors,
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#ffffff',
      primary: '#B21E29',
    }
  };

  // Estados locales para los inputs y el modo de pantalla
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [esPantallaDeRegistro, setEsPantallaDeRegistro] = useState(false); // false = Login, true = Registro

  const dispatch = useDispatch();

  // Traemos los datos del sub-estado 'usuario' usando el Hook moderno useSelector
  const { isLoading, errMess, estaLogueado, datos } = useSelector((state) => state.usuario);

  const manejarBotonPrincipal = () => {
    if (esPantallaDeRegistro) {
      dispatch(postRegistroFirebase(correo, contrasena));
    } else {
      dispatch(postLoginFirebase(correo, contrasena));
    }
  };

  return (
    <ImageBackground
      source={require('../assets/gente.jpg')}
      style={styles.fondo}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContenedor}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Cabecera con botón de volver */}
            <View style={styles.cabeceraFila}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor="#ffffff"
                containerColor="rgba(0,0,0,0.4)"
                onPress={onVolver}
                style={styles.botonVolver}
              />
            </View>

            {/* Contenedor del formulario estilo Glassmorphic */}
            <Card style={styles.tarjetaFormulario}>
              <Card.Content style={styles.cardContent}>
                {/* Icono de Seguridad/Usuario */}
                <View style={styles.emblemaContenedor}>
                  <MaterialCommunityIcons
                    name={esPantallaDeRegistro ? "account-plus-outline" : "lock-outline"}
                    size={34}
                    color="#B21E29"
                  />
                </View>

                {/* Título de la sección */}
                <Text variant="headlineSmall" style={styles.titulo}>
                  {esPantallaDeRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </Text>
                
                <Text variant="bodyMedium" style={styles.subtitulo}>
                  {esPantallaDeRegistro 
                    ? 'Únete a la comunidad de SanFerLink y planifica con tus amigos.' 
                    : 'Accede para gestionar tus grupos de amigos y reportar incidencias.'}
                </Text>

                {/* Campos del Formulario */}
                <TextInput
                  placeholder="Correo electrónico"
                  value={correo}
                  onChangeText={setCorreo}
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  disabled={isLoading}
                  style={styles.input}
                  activeOutlineColor="#B21E29"
                  outlineColor="#ced4da"
                  textColor="#212529"
                  theme={inputTheme}
                  left={<TextInput.Icon icon="email-outline" color="#6c757d" />}
                />

                <TextInput
                  placeholder="Contraseña"
                  value={contrasena}
                  onChangeText={setContrasena}
                  mode="outlined"
                  secureTextEntry={!mostrarContrasena}
                  disabled={isLoading}
                  style={styles.input}
                  activeOutlineColor="#B21E29"
                  outlineColor="#ced4da"
                  textColor="#212529"
                  theme={inputTheme}
                  left={<TextInput.Icon icon="lock-outline" color="#6c757d" />}
                  right={
                    <TextInput.Icon 
                      icon={mostrarContrasena ? "eye-off-outline" : "eye-outline"} 
                      color="#6c757d"
                      onPress={() => setMostrarContrasena(!mostrarContrasena)} 
                    />
                  }
                />

                {/* Mensaje de error de Firebase */}
                {errMess && (
                  <HelperText type="error" visible={true} style={styles.errorText}>
                    {errMess}
                  </HelperText>
                )}

                {/* Rueda de carga o Botones de acción */}
                {isLoading ? (
                  <ActivityIndicator size="large" color="#B21E29" style={styles.loader} />
                ) : (
                  <View style={styles.contenedorBotones}>
                    <Button
                      mode="contained"
                      onPress={manejarBotonPrincipal}
                      style={styles.boton}
                      buttonColor="#B21E29"
                      labelStyle={styles.textoBoton}
                      rippleColor="rgba(255,255,255,0.2)"
                    >
                      {esPantallaDeRegistro ? 'Registrarse' : 'Entrar'}
                    </Button>

                    <Button
                      mode="text"
                      onPress={() => {
                        setEsPantallaDeRegistro(!esPantallaDeRegistro);
                        setCorreo('');
                        setContrasena('');
                      }}
                      style={styles.botonCambio}
                      textColor="#ffffff"
                      labelStyle={styles.textoBotonCambio}
                    >
                      {esPantallaDeRegistro
                        ? '¿Ya tienes cuenta? Inicia sesión'
                        : '¿No tienes cuenta aún? Regístrate'}
                    </Button>
                  </View>
                )}

                {/* Mensaje de éxito temporal */}
                {estaLogueado && datos && (
                  <Text style={styles.successText}>¡Conectado como: {datos.email}!</Text>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Fondo oscuro para resaltar el texto y cristal
  },
  flexContainer: {
    flex: 1,
  },
  scrollContenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  cabeceraFila: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
  },
  botonVolver: {
    margin: 0,
    borderRadius: 12,
  },
  tarjetaFormulario: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // Cristal translúcido (Glassmorphism)
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 25,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emblemaContenedor: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#B21E29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  titulo: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    fontSize: 22,
  },
  subtitulo: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    fontSize: 14.5,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#ff8a80', // Rojo claro para que sea perfectamente visible sobre fondo oscuro
    marginBottom: 14,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginTop: 15,
  },
  contenedorBotones: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  boton: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#B21E29',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  textoBoton: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#ffffff',
  },
  botonCambio: {
    marginTop: 12,
  },
  textoBotonCambio: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
  successText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#81c784',
    fontWeight: 'bold',
    fontSize: 14,
  }
});