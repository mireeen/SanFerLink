import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../comun/comun';

// Importamos los dos Thunks de Firebase desde vuestro ActionCreators
import { postLoginFirebase, postRegistroFirebase } from '../redux/ActionCreators';

export default function LoginScreen() {
  // Estados locales para los inputs y el modo de pantalla
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [esPantallaDeRegistro, setEsPantallaDeRegistro] = useState(false); // false = Login, true = Registro

  const dispatch = useDispatch();

  // Traemos los datos del sub-estado 'usuario' usando el Hook moderno useSelector
  const { isLoading, errMess, estaLogueado, datos } = useSelector((state) => state.usuario);

  const manejarBotonPrincipal = () => {
    if (esPantallaDeRegistro) {
      // Si estamos en modo registro, disparamos el Thunk de Registro
      dispatch(postRegistroFirebase(correo, contrasena));
    } else {
      // Si no, disparamos el Thunk de Iniciar Sesión
      dispatch(postLoginFirebase(correo, contrasena));
    }
  };

  return (
    <View style={styles.contenedor}>

      {/* El título cambia solo según el estado booleano */}
      <Text variant="headlineMedium" style={styles.titulo}>
        {esPantallaDeRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
      </Text>

      <TextInput
        label="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        disabled={isLoading}
        style={styles.input}
      />

      <TextInput
        label="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        mode="outlined"
        secureTextEntry
        disabled={isLoading}
        style={styles.input}
      />

      {/* Si Firebase nos escupe un error, Redux lo guarda y useSelector lo pinta aquí */}
      {errMess && (
        <HelperText type="error" visible={true} style={styles.errorText}>
          {errMess}
        </HelperText>
      )}

      {/* Rueda de carga si está haciendo el fetch, si no, botones */}
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <View>
          <Button mode="contained" onPress={manejarBotonPrincipal} style={styles.boton}>
            {esPantallaDeRegistro ? 'Registrarse' : 'Entrar'}
          </Button>

          {/* Botón plano para alternar el modo de la pantalla */}
          <Button
            mode="text"
            onPress={() => setEsPantallaDeRegistro(!esPantallaDeRegistro)}
            style={styles.botonCambio}
          >
            {esPantallaDeRegistro
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿No tienes cuenta aún? Regístrate aquí'}
          </Button>
        </View>
      )}

      {/* Mensaje flotante de éxito temporal */}
      {estaLogueado && datos && (
        <Text style={styles.successText}>¡Conectado como: {datos.email}!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: COLORS.background },
  titulo: { textAlign: 'center', marginBottom: 30, color: COLORS.primary, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  boton: { marginTop: 10, paddingVertical: 4 },
  botonCambio: { marginTop: 15 },
  loader: { marginTop: 15 },
  errorText: { marginBottom: 10 },
  successText: { textAlign: 'center', marginTop: 20, color: 'green', fontWeight: 'bold' }
});