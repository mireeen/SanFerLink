import React from 'react';
import { StyleSheet, View, ImageBackground, ScrollView, Platform } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { COLORS } from '../comun/comun';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BienvenidaScreen({ onEntrarInvitado, onIrALogin }) {
    return (
        <ImageBackground
            source={require('../assets/gente.jpg')} // Aprovechamos los assets que ya tenéis
            style={styles.fondo}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <ScrollView contentContainerStyle={styles.scrollContenedor} showsVerticalScrollIndicator={false}>

                    <View style={styles.contenedorLogotipo}>
                        <View style={styles.emblemaContenedor}>
                            <MaterialCommunityIcons name="map-marker-radius" size={40} color="#B21E29" />
                        </View>
                        <Text variant="displaySmall" style={styles.tituloApp}>SanFerLink</Text>
                        <Text variant="titleMedium" style={styles.subtituloApp}>Vivir las fiestas de forma inteligente</Text>
                    </View>

                    <Card style={styles.tarjetaInfo}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.tituloTarjeta}>¡Bienvenido a Pamplona!</Text>
                            <Text variant="bodyMedium" style={styles.textoInfo}>
                                SanFerLink te permite consultar el programa oficial de actos de San Fermín en tiempo real,
                                localizar los aseos públicos de la ciudad y comprobar la saturación de las calles gracias a los reportes de la comunidad.
                            </Text>
                        </Card.Content>
                    </Card>

                    <View style={styles.contenedorBotones}>
                        <Button
                            mode="contained"
                            buttonColor="#B21E29"
                            onPress={onIrALogin}
                            style={styles.botonPrincipal}
                            labelStyle={styles.textoBotonPrincipal}
                            icon="account-key"
                            rippleColor="rgba(255,255,255,0.2)"
                        >
                            Iniciar Sesión / Registro
                        </Button>

                        <Button
                            mode="outlined"
                            textColor="#ffffff"
                            style={styles.botonInvitado}
                            labelStyle={styles.textoBotonInvitado}
                            onPress={onEntrarInvitado}
                            icon="eye"
                            rippleColor="rgba(255,255,255,0.15)"
                        >
                            Explorar como Invitado
                        </Button>
                    </View>

                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    fondo: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.62)' }, // Ligeramente más oscuro para contrastar con el texto blanco
    scrollContenedor: { flexGrow: 1, padding: 24, justifyContent: 'space-between', paddingVertical: 60 },
    contenedorLogotipo: { alignItems: 'center', marginTop: 10 },
    emblemaContenedor: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        elevation: 8,
        shadowColor: '#B21E29',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 2.5,
        borderColor: '#B21E29',
    },
    tituloApp: { color: '#ffffff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 32 },
    subtituloApp: { color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center', fontWeight: '500', fontSize: 13.5 },
    tarjetaInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)', // Glassmorphism sutil
        borderRadius: 20,
        marginVertical: 25,
        borderWidth: 1.2,
        borderColor: 'rgba(255, 255, 255, 0.22)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
    },
    tituloTarjeta: { fontWeight: 'bold', color: '#ffffff', marginBottom: 10, textAlign: 'center', fontSize: 17 },
    textoInfo: { color: 'rgba(255,255,255,0.9)', lineHeight: 22, fontSize: 14, textAlign: 'center' },
    contenedorBotones: { width: '100%', gap: 14, marginBottom: 10 },
    botonPrincipal: {
        paddingVertical: 6,
        borderRadius: 14,
        elevation: 4,
        shadowColor: '#B21E29',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    botonInvitado: {
        paddingVertical: 6,
        borderRadius: 14,
        borderColor: 'rgba(255, 255, 255, 0.45)',
        borderWidth: 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    textoBotonPrincipal: {
        fontSize: 14.5,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    textoBotonInvitado: {
        fontSize: 14.5,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: '#ffffff',
    },
});