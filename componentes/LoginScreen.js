import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../comun/comun';

// Importamos el Thunk asíncrono
import { postRegistroFirebase } from '../redux/ActionCreators';


export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const dispatch = useDispatch();

  // Escuchamos el sub-estado 'usuario' de nuestro almacén Redux
  const { isLoading, errMess, estaLogueado, datos } = useSelector((state) => state.usuario);

  const manejarLogin = () => {
    // Disparamos el Thunk clásico pasándole los inputs del formulario
    dispatch(postRegistroFirebase(correo, contrasena));
  };

  return (
    <View style={styles.contenedor}>
      <Text variant="headlineMedium" style={styles.titulo}>Iniciar Sesión</Text>

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

      {/* Si hay un error guardado en el Reducer, lo pintamos aquí en rojo */}
      {errMess && (
        <HelperText type="error" visible={true} style={styles.errorText}>
          {errMess}
        </HelperText>
      )}

      {/* Si está cargando mostramos una ruedecita, si no, el botón */}
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <Button mode="contained" onPress={manejarLogin} style={styles.boton}>
          Entrar
        </Button>
      )}

      {/* Cartel flotante temporal para validar que te ha logueado en Redux */}
      {estaLogueado && (
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
  loader: { marginTop: 15 },
  errorText: { marginBottom: 10 },
  successText: { textAlign: 'center', marginTop: 20, color: 'green', fontWeight: 'bold' }
});