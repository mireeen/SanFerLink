import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, FlatList, Modal, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, Avatar, Chip, FAB } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../comun/comun';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importamos los Hooks modernos de Redux
import { useDispatch, useSelector } from 'react-redux';
import { postAlertaRTDB, fetchAlertas, fetchEventos, postIncidenciaBanoRTDB, postIncidenciaEventoRTDB } from '../redux/ActionCreators';

// Importamos la localización de Expo
import * as Location from 'expo-location';

// Función para obtener el nombre de la calle a partir de coordenadas GPS
const obtenerNombreCalle = async (latitud, longitud) => {
    try {
        // 1. Pedimos a Expo que traduzca las coordenadas
        const [resultado] = await Location.reverseGeocodeAsync({
            latitude: latitud,
            longitude: longitud
        });

        // 2. Extraemos el nombre de la calle (en Expo viene en la propiedad 'street')
        if (resultado && resultado.street) {
            // Ejemplo: "Calle de la Estafeta"
            return resultado.street;
        }

        return "Calle desconocida";
    } catch (error) {
        console.log("Error al obtener la calle:", error);
        return "Calle desconocida";
    }
};

export default function ReporteIncidenciaScreen() {
    const dispatch = useDispatch();

    // 1. SELECTORES DE REDUX
    const { alertas, banos: banosRedux, isLoading } = useSelector((state) => state.alertas);
    const { resultado: listaEventos } = useSelector((state) => state.eventos);
    const { datos: usuarioDatos } = useSelector((state) => state.usuario);
    const userId = usuarioDatos?.uid || 'anonimo';

    // 2. ESTADOS LOCALES
    const [filtro, setFiltro] = useState('Todos');
    const [modalVisible, setModalVisible] = useState(false);

    // Estados del Formulario de Creación
    const [tipo, setTipo] = useState('Calle colapsada');
    const [descripcion, setDescripcion] = useState('');
    const [eventoSeleccionado, setEventoSeleccionado] = useState('');
    const [banoSeleccionado, setBanoSeleccionado] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Tipos de filtro disponibles
    const categoriasFiltro = ['Todos', 'Calle colapsada', 'Baño', 'Evento'];

    // 3. DESCARGA INICIAL DE ALERTAS Y EVENTOS
    useEffect(() => {
        dispatch(fetchAlertas());
        dispatch(fetchEventos());
    }, [dispatch]);

    // Al abrir el modal, reiniciamos el formulario
    const abrirModalReporte = () => {
        setTipo('Calle colapsada');
        setDescripcion('');
        if (listaEventos && listaEventos.length > 0) {
            setEventoSeleccionado(listaEventos[0].id);
        } else {
            setEventoSeleccionado('');
        }
        if (banosRedux && banosRedux.length > 0) {
            setBanoSeleccionado(banosRedux[0].id);
        } else {
            setBanoSeleccionado('');
        }
        setModalVisible(true);
    };

    // 4. COMBINACIÓN Y FILTRADO DE INCIDENCIAS
    const todasLasIncidencias = React.useMemo(() => {
        const list = [...alertas];

        // Agregar incidencias de baños
        banosRedux.forEach(bano => {
            if (bano.incidencia) {
                list.push({
                    id: `bano-incidencia-${bano.id}`,
                    tipo: 'Baño',
                    descripcion: bano.incidencia.descripcion,
                    userId: bano.incidencia.userId,
                    timestamp: bano.incidencia.timestamp,
                    ultimoVotoTimestamp: bano.incidencia.ultimoVotoTimestamp,
                    fiabilidad: bano.incidencia.fiabilidad,
                    calle: `Aseo: ${bano.name}`, // Usamos el nombre del baño como título de la tarjeta
                    banoId: bano.id
                });
            }
        });

        // Agregar incidencias de eventos (con la misma estructura que baños)
        listaEventos.forEach(evento => {
            if (evento.incidencia) {
                list.push({
                    id: `evento-incidencia-${evento.id}`,
                    tipo: 'Evento',
                    descripcion: evento.incidencia.descripcion,
                    userId: evento.incidencia.userId,
                    timestamp: evento.incidencia.timestamp,
                    ultimoVotoTimestamp: evento.incidencia.ultimoVotoTimestamp,
                    fiabilidad: evento.incidencia.fiabilidad || 'Alta',
                    calle: `Acto: ${evento.name}`, // Usamos el nombre del evento como título de la tarjeta
                    eventoId: evento.id
                });
            }
        });

        // Ordenar por timestamp descendente
        return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [alertas, banosRedux, listaEventos]);

    const alertasFiltradas = todasLasIncidencias.filter(alerta => {
        if (filtro === 'Todos') return true;
        if (filtro === 'Baño') {
            return alerta.tipo === 'Baño' || alerta.tipo === 'Baño lleno';
        }
        if (filtro === 'Evento') {
            return alerta.tipo === 'Evento' || alerta.tipo === 'Evento cancelado';
        }
        return alerta.tipo === filtro;
    });

    // 5. ENVÍO DEL REPORTE
    const gestionarEnvio = async () => {
        if (!tipo) return;

        if (tipo === 'Evento' && !eventoSeleccionado) {
            Alert.alert('Faltan datos', 'Por favor, selecciona el evento afectado.');
            return;
        }

        if (tipo === 'Baño' && !banoSeleccionado) {
            Alert.alert('Faltan datos', 'Por favor, selecciona el baño afectado.');
            return;
        }

        if (descripcion.trim() === '') {
            Alert.alert('Faltan datos', 'Por favor, añade algún detalle o descripción de lo que ocurre.');
            return;
        }

        setEnviando(true);

        try {
            if (tipo === 'Baño') {
                const bano = banosRedux.find(b => b.id === banoSeleccionado);
                if (bano && bano.incidencia) {
                    Alert.alert(
                        'Reporte denegado 🚫',
                        `Este baño ya tiene una incidencia activa. Su validez debe finalizar para poder reportar otra.`
                    );
                    setEnviando(false);
                    return;
                }

                await dispatch(postIncidenciaBanoRTDB(banoSeleccionado, descripcion, userId));
                Alert.alert('¡Éxito!', 'Incidencia de baño enviada.');
            } else if (tipo === 'Evento') {
                const evento = listaEventos.find(e => e.id === eventoSeleccionado);
                if (evento && evento.incidencia) {
                    Alert.alert(
                        'Reporte denegado 🚫',
                        `Este evento ya tiene una incidencia activa.`
                    );
                    setEnviando(false);
                    return;
                }

                await dispatch(postIncidenciaEventoRTDB(eventoSeleccionado, descripcion, userId));
                Alert.alert('¡Éxito!', 'Incidencia de evento enviada.');
            } else {
                // Calle colapsada u otras alertas generales
                // A. Solicitar permisos GPS
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permiso denegado 📍',
                        'Necesitamos tu localización para colocar la incidencia en el mapa de San Fermín.'
                    );
                    setEnviando(false);
                    return;
                }

                // B. Obtener posición GPS
                let ubicacion = await Location.getCurrentPositionAsync({});
                const latitude = ubicacion.coords.latitude;
                const longitude = ubicacion.coords.longitude;

                let calle = null;
                if (tipo === 'Calle colapsada') {
                    calle = await obtenerNombreCalle(latitude, longitude);
                }

                // D. Enviar a Firebase Realtime Database
                await dispatch(postAlertaRTDB(tipo, descripcion, latitude, longitude, userId, calle));
                Alert.alert('¡Éxito!', 'Alerta colaborativa enviada.');
            }

            setDescripcion('');
            setModalVisible(false);

        } catch (error) {
            console.error("Error al enviar la incidencia: ", error);
            Alert.alert('Error', 'No se pudo enviar el reporte. Revisa tu conexión.');
        } finally {
            setEnviando(false);
        }
    };

    // 6. RENDERIZACIÓN DE TARJETAS DE ALERTA
    const renderizarTarjetaAlerta = ({ item }) => {
        const horaFormateada = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const fechaFormateada = new Date(item.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' });

        const obtenerIcono = (tipoAlerta) => {
            switch (tipoAlerta) {
                case 'Calle colapsada': return 'walk';
                case 'Baño':
                case 'Baño lleno': return 'toilet';
                case 'Evento':
                case 'Evento cancelado': return 'theater';
                default: return 'alert';
            }
        };

        const obtenerColorIcono = (tipoAlerta) => {
            switch (tipoAlerta) {
                case 'Calle colapsada': return '#D32F2F'; // Rojo
                case 'Baño':
                case 'Baño lleno': return '#E65100'; // Naranja
                case 'Evento':
                case 'Evento cancelado': return '#0288D1'; // Azul
                default: return '#757575';
            }
        };

        const fiabilidad = item.fiabilidad || 'Alta';

        const obtenerEstiloFiabilidadBadge = (nivel) => {
            switch (nivel) {
                case 'Alta': return { bg: '#E8F5E9', text: '#2E7D32', icon: 'shield-check' };
                case 'Media': return { bg: '#FFF3E0', text: '#EF6C00', icon: 'clock-outline' };
                case 'Baja': return { bg: '#FFEBEE', text: '#C62828', icon: 'alert-circle-outline' };
                default: return { bg: '#E8F5E9', text: '#2E7D32', icon: 'shield-check' };
            }
        };

        const badgeInfo = obtenerEstiloFiabilidadBadge(fiabilidad);

        return (
            <Card style={styles.tarjetaIncidencia}>
                <Card.Title
                    title={item.calle || item.tipo}
                    titleStyle={styles.tituloTarjetaIncidencia}
                    subtitle={`⏰ ${fechaFormateada} • ${horaFormateada}`}
                    subtitleStyle={styles.subtituloTarjetaIncidencia}
                    left={(props) => (
                        <View style={styles.contenedorAvatarDual}>
                            <View style={[styles.anilloExteriorAvatar, { borderColor: obtenerColorIcono(item.tipo) }]}>
                                <Avatar.Icon
                                    {...props}
                                    icon={obtenerIcono(item.tipo)}
                                    backgroundColor="transparent"
                                    color={obtenerColorIcono(item.tipo)}
                                    size={36}
                                />
                            </View>
                        </View>
                    )}
                />
                <Card.Content style={styles.contenidoTarjeta}>
                    <Text variant="bodyMedium" style={styles.descripcionTexto}>{item.descripcion}</Text>

                    <View style={styles.contenedorFilaInfo}>
                        <View style={[styles.badgeFiabilidad, { backgroundColor: badgeInfo.bg }]}>
                            <MaterialCommunityIcons
                                name={badgeInfo.icon}
                                size={14}
                                color={badgeInfo.text}
                                style={{ marginRight: 5 }}
                            />
                            <Text style={[styles.textoBadge, { color: badgeInfo.text }]}>
                                Fiabilidad {fiabilidad}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        );
    };


    const { estaLogueado } = useSelector((state) => state.usuario);

    if (!estaLogueado) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
                <Avatar.Icon size={80} icon="shield-lock-outline" backgroundColor="#FFF0F2" color={COLORS.primary} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 20, textAlign: 'center' }}>
                    Acceso Colaborativo Protegido
                </Text>
                <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#6c757d', marginVertical: 15, lineHeight: 20 }}>
                    Para poder crear incidencias de calles colapsadas, masificaciones en actos o reportar problemas en aseos,
                    necesitas formar parte de la comunidad registrada de SanFerLink.
                </Text>
                {/* Este botón puede llamar opcionalmente a un prop para mover la pestaña, lo manejaremos amigablemente */}
                <Text style={{ fontStyle: 'italic', color: COLORS.primary, fontWeight: 'bold' }}>
                    💡 Inicia sesión desde la pestaña de Perfil
                </Text>
            </View>
        );
    }
    // --- RENDER PRINCIPAL DE LA PANTALLA ---
    return (
        <View style={styles.container}>
            {/* Cabecera Estilo Pañuelico Curvo */}
            <View style={styles.cabeceraPanuelico}>
                <Text style={styles.tituloHeader}>Incidencias Activas</Text>
                <Text style={styles.subtituloHeader}>Comunidad colaborativa de San Fermín</Text>

                {/* Chips de Filtrado integrados en la cabecera */}
                <View style={styles.contenedorChips}>
                    <FlatList
                        data={categoriasFiltro}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <Chip
                                selected={filtro === item}
                                onPress={() => setFiltro(item)}
                                style={[
                                    styles.chip,
                                    filtro === item ? styles.chipSeleccionado : styles.chipInactivo
                                ]}
                                textStyle={{
                                    color: filtro === item ? '#B21E29' : '#ffffff',
                                    fontWeight: '600'
                                }}
                                showSelectedOverlay={false}
                            >
                                {item === 'Todos' ? 'Todos' : item === 'Calle colapsada' ? '🚶 Calles' : item === 'Baño' ? '🚽 Baños' : '🎭 Eventos'}
                            </Chip>
                        )}
                    />
                </View>
            </View>

            {/* Feed de Alertas */}
            <FlatList
                data={alertasFiltradas}
                keyExtractor={(item) => item.id}
                renderItem={renderizarTarjetaAlerta}
                contentContainerStyle={styles.listaPad}
                ListEmptyComponent={
                    <Text style={styles.textoVacio}>No hay incidencias activas en este momento.</Text>
                }
            />

            {/* Botón Flotante para reportar (FAB) */}
            <FAB
                style={styles.fab}
                icon="plus"
                label="Crear incidencia"
                color="#ffffff"
                onPress={abrirModalReporte}
            />

            {/* Modal de Creación de Reportes */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    {/* Fondo oscuro cerrable al pulsar fuera */}
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                    />
                    <View style={styles.modalContent}>
                        {/* Barra de arrastre superior (Bottom Sheet Handle) */}
                        <View style={styles.barraArrastreModal} />

                        <Text style={styles.modalTitulo}>Reportar Incidencia</Text>

                        <Text style={styles.label}>¿Qué tipo de incidencia es?</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={tipo}
                                onValueChange={(itemValue) => {
                                    setTipo(itemValue);
                                    if (itemValue === 'Evento' && listaEventos && listaEventos.length > 0) {
                                        setEventoSeleccionado(listaEventos[0].id);
                                    }
                                    if (itemValue === 'Baño' && banosRedux && banosRedux.length > 0) {
                                        setBanoSeleccionado(banosRedux[0].id);
                                    }
                                }}
                                enabled={!enviando}
                            >
                                <Picker.Item label="🚶 Calle colapsada" value="Calle colapsada" />
                                <Picker.Item label="🚽 Baño inaccesible" value="Baño" />
                                <Picker.Item label="🎭 Incidencia en Acto / Evento" value="Evento" />
                            </Picker>
                        </View>

                        {/* Dropdown condicional de Eventos si tipo es Evento */}
                        {tipo === 'Evento' && (
                            <>
                                <Text style={styles.label}>Selecciona el evento afectado:</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={eventoSeleccionado}
                                        onValueChange={(itemValue) => setEventoSeleccionado(itemValue)}
                                        enabled={!enviando}
                                    >
                                        {listaEventos && listaEventos.map((evento) => (
                                            <Picker.Item
                                                key={evento.id}
                                                label={evento.name}
                                                value={evento.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </>
                        )}

                        {/* Dropdown condicional de Baños si tipo es Baño */}
                        {tipo === 'Baño' && (
                            <>
                                <Text style={styles.label}>Selecciona el baño afectado:</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={banoSeleccionado}
                                        onValueChange={(itemValue) => setBanoSeleccionado(itemValue)}
                                        enabled={!enviando}
                                    >
                                        {banosRedux && banosRedux.map((bano) => (
                                            <Picker.Item
                                                key={bano.id}
                                                label={bano.name}
                                                value={bano.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </>
                        )}

                        <Text style={styles.label}>Detalles de la incidencia:</Text>
                        <TextInput
                            mode="outlined"
                            placeholder={
                                tipo === 'Calle colapsada'
                                    ? "Ej: Aglomeración masiva en Estafeta..."
                                    : tipo === 'Baño'
                                        ? "Ej: El baño portátil de Plaza del Castillo está roto..."
                                        : "Ej: Se cambia el concierto de Plaza del Castillo a Plaza de los Fueros..."
                            }
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            numberOfLines={3}
                            disabled={enviando}
                            style={styles.input}
                            outlineColor="#ccc"
                            activeOutlineColor={COLORS.primary}
                        />

                        <View style={styles.modalAcciones}>
                            <Button
                                mode="outlined"
                                onPress={() => setModalVisible(false)}
                                disabled={enviando}
                                style={[styles.botonModal, styles.botonCancelar]}
                                textColor="#666666"
                            >
                                Cancelar
                            </Button>

                            <Button
                                mode="contained"
                                onPress={gestionarEnvio}
                                loading={enviando}
                                disabled={enviando}
                                style={[styles.botonModal, styles.botonEnviar]}
                                buttonColor={COLORS.primary}
                            >
                                Enviar
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Cabecera Estilo Pañuelico
    cabeceraPanuelico: {
        backgroundColor: '#B21E29',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingTop: 24,
        paddingBottom: 22,
        elevation: 8,
        shadowColor: '#B21E29',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    tituloHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    subtituloHeader: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 15,
    },
    contenedorChips: {
        paddingLeft: 15,
    },
    chip: {
        marginRight: 8,
        height: 38,
        borderRadius: 19,
    },
    chipSeleccionado: {
        backgroundColor: '#ffffff',
    },
    chipInactivo: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 0,
    },

    listaPad: { padding: 15, paddingBottom: 85 },

    // Tarjeta Incidencia Glassmorphic
    tarjetaIncidencia: {
        marginBottom: 16,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(178, 30, 41, 0.08)',
        elevation: 3,
        shadowColor: '#1a1a1a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    tituloTarjetaIncidencia: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    subtituloTarjetaIncidencia: {
        fontSize: 11,
        color: '#6c757d',
        marginTop: 2,
    },
    contenedorAvatarDual: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 48,
        height: 48,
    },
    anilloExteriorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    contenidoTarjeta: {
        paddingTop: 8,
        paddingBottom: 12,
    },
    descripcionTexto: {
        color: '#495057',
        fontSize: 14,
        lineHeight: 20,
    },
    contenedorFilaInfo: {
        flexDirection: 'row',
        marginTop: 12,
        alignItems: 'center',
    },
    badgeFiabilidad: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    textoBadge: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    textoVacio: { textAlign: 'center', marginTop: 45, color: '#888888', fontStyle: 'italic' },

    // BOTÓN FLOTANTE (FAB)
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        elevation: 6,
        zIndex: 1000,
    },

    // ESTILOS DEL MODAL DE CREACIÓN (Bottom Sheet)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 36,
        elevation: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
    },
    barraArrastreModal: {
        width: 40,
        height: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 18,
        textAlign: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#495057',
        marginTop: 10,
        marginBottom: 6,
    },
    pickerContainer: {
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
    },
    input: {
        marginBottom: 18,
        backgroundColor: '#ffffff',
    },
    modalAcciones: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    botonModal: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 10,
    },
    botonCancelar: {
        borderColor: '#e0e0e0',
    },
    botonEnviar: {
        elevation: 2,
    },
});