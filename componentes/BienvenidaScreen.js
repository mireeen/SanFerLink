import React from 'react';
import { StyleSheet, View, Image, ImageBackground, ScrollView } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { COLORS } from '../comun/comun';

export default function BienvenidaScreen({ onEntrarInvitado, onIrALogin }) {
    return (
        <ImageBackground
            source={require('../assets/txupinazo.jpg')} // Aprovechamos los assets que ya tenéis
            style={styles.fondo}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <ScrollView contentContainerStyle={styles.scrollContenedor}>

                    <View style={styles.contenedorLogotipo}>
                        <Text variant="displaySmall" style={styles.tituloApp}>SanFerLink</Text>
                        <Text variant="titleMedium" style={styles.subtituloApp}>Vivir las fiestas de forma inteligente</Text>
                    </View>

                    <Card style={styles.tarjetaInfo}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.tituloTarjeta}>¡Bienvenido a Pamplona! 🔴⚪</Text>
                            <Text variant="bodyMedium" style={styles.textoInfo}>
                                SanFerLink te permite consultar el programa oficial de actos de San Fermín 2025 en tiempo real,
                                localizar los aseos públicos de la ciudad y comprobar la saturación de las calles gracias a los reportes de otros ciudadanos.
                            </Text>
                        </Card.Content>
                    </Card>

                    <View style={styles.contenedorBotones}>
                        <Button
                            mode="contained"
                            buttonColor={COLORS.primary}
                            onPress={onIrALogin}
                            style={styles.botonPrincipal}
                            icon="account-key"
                        >
                            Iniciar Sesión / Registro
                        </Button>

                        <Button
                            mode="outlined"
                            textColor="#ffffff"
                            style={styles.botonInvitado}
                            onPress={onEntrarInvitado}
                            icon="eye"
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    scrollContenedor: { flexGrow: 1, padding: 24, justifyContent: 'space-between', paddingVertical: 50 },
    contenedorLogotipo: { alignItems: 'center', marginTop: 20 },
    tituloApp: { color: '#ffffff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    subtituloApp: { color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' },
    tarjetaInfo: { backgroundColor: 'rgba(255, 255, 255, 0.92)', borderRadius: 16, marginVertical: 30, elevation: 5 },
    tituloTarjeta: { fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
    textoInfo: { color: '#4A4A4A', lineHeight: 20, fontSize: 14 },
    contenedorBotones: { width: '100%', gap: 12, marginBottom: 20 },
    botonPrincipal: { paddingVertical: 6, borderRadius: 12 },
    botonInvitado: { paddingVertical: 6, borderRadius: 12, borderColor: '#ffffff', borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.1)' }
});