import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { db } from '../comun/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLORS } from '../comun/comun';

export default function ReporteIncidenciaScreen() {
    // Estados locales para capturar los datos del formulario
    const [tipo, setTipo] = useState('Calle colapsada');
    const [descripcion, setDescripcion] = useState('');
    const [enviando, setEnviando] = useState(false);

    const gestionarEnvio = async () => {
        if (!tipo) return;

        setEnviando(true);
        try {
            // 1. Enviamos el documento a la colección "alertas" de Cloud Firestore
            await addDoc(collection(db, 'alertas'), {
                tipo: tipo,
                descripcion: descripcion,
                timestamp: serverTimestamp(), // Hora oficial de Firebase
                fiabilidad: 'Alta', // Nivel inicial del algoritmo
                userId: 'user_test_123', // Temporal, luego usaremos el ID real del dispositivo
                // Coordenadas simuladas para la demo (Pamplona / Plaza del Castillo)
                ubicacion: {
                    latitude: 42.8161,
                    longitude: -1.6432
                }
            });

            Alert.alert('¡Éxito!', 'Alerta colaborativa enviada a SanFerLink.');
            setDescripcion(''); //Limpiamos el formulario
        } catch (error) {
            console.error("Error al enviar la incidencia: ", error);
            Alert.alert('Error', 'No se pudo enviar el reporte.');
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
                style={styles.input}
            />

            <Button
                mode="contained"
                onPress={gestionarEnvio}
                loading={enviando}
                disabled={enviando}
                style={styles.boton}
                buttonColor={COLORS.primary}
            >
                Enviar Alerta
            </Button>
        </View>
    );
}

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
        overflow: 'hidden'
    },
    input: {
        marginBottom: 20,
        backgroundColor: COLORS.background
    },
    boton: {
        marginTop: 14,
        paddingVertical: 8,
        alignSelf: 'center',
        width: '80%',
        maxWidth: 280
    }
});