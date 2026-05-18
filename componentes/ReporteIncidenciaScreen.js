import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../comun/comun';

// Importamos los Hooks modernos de Redux en vez de connect
import { useDispatch, useSelector } from 'react-redux';
import { postAlertaRTDB } from '../redux/ActionCreators';

// Importamos la librería nativa de localización de Expo
import * as Location from 'expo-location';

export default function ReporteIncidenciaScreen() {
    // 1. GANCHOS MODERNOS DE REDUX
    const dispatch = useDispatch();
    
    // Leemos el userId (o email) del estado global de usuario
    const { datos } = useSelector((state) => state.usuario);
    const userId = datos?.uid || 'anonimo'; // Evitamos crasheos si no hay UID

    // 2. ESTADOS LOCALES PARA EL FORMULARIO
    const [tipo, setTipo] = useState('Calle colapsada');
    const [descripcion, setDescripcion] = useState('');
    const [enviando, setEnviando] = useState(false);

    // 3. LOGICA DE CAPTURA GPS Y ENVÍO A FIREBASE
    const gestionarEnvio = async () => {
        if (!tipo) return;
        
        if (descripcion.trim() === '') {
            Alert.alert('Faltan datos', 'Por favor, añade algún detalle sobre lo que pasa.');
            return;
        }

        setEnviando(true);

        try {
            // A. Solicitar permisos de localización al sistema operativo del móvil
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso denegado 📍', 
                    'Necesitamos tu localización para colocar la incidencia en el mapa de San Fermín.'
                );
                setEnviando(false);
                return;
            }

            // B. Obtener las coordenadas actuales (Hardware GPS)
            let ubicacion = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = ubicacion.coords;

            // C. Disparar el Thunk con los datos combinados (Formulario + GPS + Usuario)
            // Usamos `postAlertaRTDB` que acepta latitud/longitud y userEmail
            await dispatch(postAlertaRTDB(tipo, descripcion, latitude, longitude, userId));
            
            Alert.alert('¡Éxito!', 'Alerta colaborativa enviada y fijada en el mapa.');
            setDescripcion(''); // Reseteamos la caja de texto
            
        } catch (error) {
            console.error("Error al enviar la incidencia: ", error);
            Alert.alert('Error', 'No se pudo enviar el reporte. Revisa tu conexión.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Reportar Incidencia</Text>

            <Text style={styles.label}>¿Qué está pasando?</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={tipo}
                    onValueChange={(itemValue) => setTipo(itemValue)}
                    enabled={!enviando}
                >
                    <Picker.Item label="Calle colapsada / Masificación" value="Calle colapsada" />
                    <Picker.Item label="Presencia Policial / Control" value="Policía" />
                    <Picker.Item label="Baño inaccesible" value="Baño lleno" />
                    <Picker.Item label="Evento cancelado" value="Evento cancelado" />
                </Picker>
            </View>

            <Text style={styles.label}>Detalles adicionales (opcional):</Text>
            <TextInput
                mode="outlined"
                placeholder="Ej: En la Estafeta a la altura de la Bajada Javier..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={4}
                disabled={enviando}
                style={styles.input}
                outlineColor="#ccc"
                activeOutlineColor={COLORS.primary}
            />

            <Button
                mode="contained"
                onPress={gestionarEnvio}
                loading={enviando}
                disabled={enviando}
                style={styles.boton}
                buttonColor={COLORS.primary}
            >
                {enviando ? 'Obteniendo GPS...' : 'Enviar Alerta'}
            </Button>
        </View>
    );
}

// Mantenemos exactamente vuestros estilos originales
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 50,
        paddingTop: 100,
        backgroundColor: COLORS.background
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: '#333'
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        overflow: 'hidden',
        backgroundColor: '#fff'
    },
    input: {
        marginBottom: 20,
        backgroundColor: '#fff'
    },
    boton: {
        marginTop: 14,
        paddingVertical: 8,
        alignSelf: 'center',
        width: '80%',
        maxWidth: 280
    }
});