import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { Card, Text, Searchbar, Chip, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventos } from '../redux/ActionCreators';
import { COLORS } from '../comun/comun';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EventosScreen() {
    const dispatch = useDispatch();

    // 1. Escuchamos el estado global de Redux
    const { resultado: listaEventos, isLoading, errMess } = useSelector((state) => state.eventos);

    // 2. Estados locales para Filtros y Buscador
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
    const [diaSeleccionado, setDiaSeleccionado] = useState('Todos');

    // Categorías disponibles para los Chips de filtrado
    const categorias = ['Todos', 'Encierro', 'Concierto', 'Tradición', 'Infantil'];

    // Días disponibles para los Chips de filtrado de San Fermín (6 de julio al 14 de julio)
    const dias = ['Todos', '6 Jul', '7 Jul', '8 Jul', '9 Jul', '10 Jul', '11 Jul', '12 Jul', '13 Jul', '14 Jul'];

    // 3. Descarga inicial de datos al montar la pantalla
    useEffect(() => {
        dispatch(fetchEventos());
    }, [dispatch]);

    // 4. LÓGICA DE FILTRADO COMBINADO (Buscador + Chips + Día)
    const eventosFiltrados = listaEventos.filter(evento => {
        const coincideBusqueda = evento.name.toLowerCase().includes(busqueda.toLowerCase());
        const coincideCategoria = categoriaSeleccionada === 'Todos' || evento.category === categoriaSeleccionada;

        const coincideDia = diaSeleccionado === 'Todos' || (() => {
            if (!evento.date) return false;
            // Extracción segura de día y mes del string ISO (ej: "2025-07-06T12:00:00")
            const partes = evento.date.split('T')[0].split('-');
            if (partes.length === 3) {
                const dayNum = parseInt(partes[2], 10);
                const monthNum = parseInt(partes[1], 10);
                const selectedDayNum = parseInt(diaSeleccionado.split(' ')[0], 10);
                return dayNum === selectedDayNum && monthNum === 7;
            }
            return false;
        })();

        return coincideBusqueda && coincideCategoria && coincideDia;
    });

    // Función auxiliar para asignar iconos a las tarjetas según su tipo
    const obtenerIconoCategoria = (category) => {
        switch (category) {
            case 'Encierro': return 'cow';
            case 'Concierto': return 'music-note';
            case 'Tradición': return 'church';
            default: return 'calendar';
        }
    };

    // Función dinámica para obtener la imagen de cabecera según los filtros seleccionados
    const obtenerImagenCabecera = () => {
        const categoria = categoriaSeleccionada.toLowerCase();

        if (categoria === 'concierto' || busqueda.toLowerCase().includes('concierto')) {
            return require('../assets/concierto.jpg');
        }
        if (categoria === 'tradición' || busqueda.toLowerCase().includes('diana')) {
            return require('../assets/dianas.jpg');
        }
        if (categoria === 'fuegos' || busqueda.toLowerCase().includes('fuego')) {
            return require('../assets/fuegos.jpg');
        }
        if (categoria === 'música' || busqueda.toLowerCase().includes('charanga') || busqueda.toLowerCase().includes('txaranga')) {
            return require('../assets/txaranga.jpg');
        }
        if (categoria === 'encierro') {
            return require('../assets/pañuelo.jpg');
        }

        return require('../assets/txupinazo.jpg');
    };

    // Función para obtener la imagen pequeña de cada tarjeta según su categoría/nombre
    const obtenerImagenTarjeta = (categoria, name) => {
        const cat = categoria.toLowerCase();
        const nombre = name.toLowerCase();

        if (nombre.includes('charanga') || nombre.includes('txaranga') || nombre.includes('kai') || cat === 'música') {
            return require('../assets/txaranga.jpg'); // Usa la de txaranga
        }
        if (cat === 'concierto' || nombre.includes('concierto') || nombre.includes('dj')) {
            return require('../assets/concierto.jpg');
        }
        if (nombre.includes('gigantes') || nombre.includes('infantil') || cat === 'infantil') {
            return require('../assets/gigantes.png');
        }
        if (nombre.includes('diana') || nombre.includes('procesión')) {
            return require('../assets/dianas.jpg');
        }
        if (nombre.includes('fuego') || cat === 'fuegos') {
            return require('../assets/fuegos.jpg'); // Usa la de fuegos
        }
        if (nombre.includes('chupinazo') || nombre.includes('txupinazo')) {
            return require('../assets/txupinazo.jpg');
        }
        return require('../assets/pañuelo.jpg'); // default a pañuelo para las no especificadas
    };

    // 5. RENDERIZADO DE CADA TARJETA DE EVENTO
    const renderizarTarjetaEvento = ({ item }) => {
        const tieneIncidencia = !!item.incidencia;
        const esActivo = !tieneIncidencia;
        const formatoHora = new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const imagenFondo = obtenerImagenTarjeta(item.category, item.name);

        return (
            <Card style={[styles.tarjeta, !esActivo && styles.tarjetaInactiva]}>
                {/* Fila principal: Imagen a la izquierda (ocupa aprox. la mitad), detalles a la derecha */}
                <View style={styles.filaTarjeta}>
                    {/* Bloque de imagen izquierda */}
                    <View style={styles.contenedorImagenIzquierda}>
                        <Image
                            source={imagenFondo}
                            style={styles.imagenIzquierda}
                            resizeMode="cover"
                        />
                        {/* Overlay translúcido si está inactivo */}
                        {!esActivo && (
                            <View style={styles.overlayImagenInactiva} />
                        )}
                    </View>

                    {/* Bloque de detalles derecha */}
                    <View style={styles.contenedorDetalles}>
                        {/* Fila Categoría (Icono + Nombre de Categoría) */}
                        <View style={styles.filaCategoria}>
                            <MaterialCommunityIcons
                                name={obtenerIconoCategoria(item.category)}
                                size={12}
                                color={esActivo ? COLORS.primary : '#888888'}
                                style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.textoCategoria, { color: esActivo ? COLORS.primary : '#888888' }]}>
                                {item.category.toUpperCase()}
                            </Text>
                        </View>

                        {/* Título del Acto */}
                        <Text style={[styles.tituloTarjeta, !esActivo && styles.tituloTarjetaInactivo]} numberOfLines={1}>
                            {item.name}
                        </Text>

                        {/* Fila Ubicación y Hora */}
                        <View style={styles.filaUbicacionHora}>
                            <View style={styles.subFilaDetalle}>
                                <MaterialCommunityIcons name="map-marker" size={11} color="#6c757d" />
                                <Text style={styles.textoDetalle} numberOfLines={1}>
                                    {item.location}
                                </Text>
                            </View>
                            <Text style={styles.separadorDetalle}>•</Text>
                            <View style={styles.subFilaDetalle}>
                                <MaterialCommunityIcons name="clock-outline" size={11} color="#6c757d" />
                                <Text style={styles.textoDetalle}>
                                    {formatoHora}
                                </Text>
                            </View>
                        </View>

                        {/* Descripción del Acto (2 líneas para legibilidad) */}
                        <Text style={styles.descripcionTarjeta} numberOfLines={2}>
                            {item.description}
                        </Text>
                    </View>
                </View>

                {/* 🚨 RENDERIZADO CONDICIONAL DE INCIDENCIA (abajo en la tarjeta) */}
                {!esActivo && item.incidencia && (
                    <View style={styles.alertaContenedor}>
                        <View style={styles.alertaCabeceraFila}>
                            <MaterialCommunityIcons
                                name="alert-decagram"
                                size={14}
                                color="#D32F2F"
                                style={{ marginRight: 5 }}
                            />
                            <Text style={styles.alertaTitulo}>
                                INCIDENCIA EN EL ACTO
                            </Text>
                            {item.incidencia.fiabilidad && (
                                <Text style={{ fontSize: 9, color: '#D32F2F', marginLeft: 'auto', fontWeight: 'bold' }}>
                                    Fiabilidad: {item.incidencia.fiabilidad}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.alertaCuerpo}>
                            Motivo: {item.incidencia.descripcion}
                        </Text>
                        {item.incidencia.userId && (
                            <Text style={styles.alertaFooter}>
                                Reportado por: {item.incidencia.userId}
                            </Text>
                        )}
                    </View>
                )}
            </Card>
        );
    };




    // --- RENDER PRINCIPAL DE LA PANTALLA ---
    if (isLoading) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 10 }}>Cargando programa de actos...</Text>
            </View>
        );
    }

    if (errMess) {
        return (
            <View style={styles.centrado}>
                <Text style={{ color: 'red', textAlign: 'center' }}>❌ Error al cargar los eventos: {errMess}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Banner superior de San Fermín */}
            <View style={styles.contenedorBanner}>
                <Image
                    source={obtenerImagenCabecera()}
                    style={styles.imagenBanner}
                    resizeMode="cover"
                />
                <View style={styles.overlayBanner}>
                    <Text style={styles.tituloHeader}>Programa de Actos</Text>
                    <Text style={styles.subtituloHeader}>San Fermín 2025</Text>
                </View>
            </View>

            {/* Barra de Búsqueda */}
            <Searchbar
                placeholder="Buscar acto (ej: Chupinazo)..."
                onChangeText={setBusqueda}
                value={busqueda}
                style={styles.buscador}
                iconColor="#B21E29"
                rippleColor="rgba(178, 30, 41, 0.1)"
                placeholderTextColor="#888"
                selectionColor="#B21E29"
            />

            {/* Filtro por Categorías */}
            <Text style={styles.seccionTitulo}>Filtrar por Categoría</Text>
            <View style={styles.contenedorChips}>
                <FlatList
                    data={categorias}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <Chip
                            selected={categoriaSeleccionada === item}
                            onPress={() => setCategoriaSeleccionada(item)}
                            style={[
                                styles.chip,
                                categoriaSeleccionada === item ? styles.chipSeleccionado : styles.chipInactivo
                            ]}
                            textStyle={{
                                color: categoriaSeleccionada === item ? '#ffffff' : '#495057',
                                fontWeight: '600',
                                fontSize: 12
                            }}
                            showSelectedOverlay={false}
                        >
                            {item}
                        </Chip>
                    )}
                />
            </View>

            {/* Filtro por Días de San Fermín */}
            <Text style={styles.seccionTitulo}>Filtrar por Día</Text>
            <View style={styles.contenedorChips}>
                <FlatList
                    data={dias}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <Chip
                            selected={diaSeleccionado === item}
                            onPress={() => setDiaSeleccionado(item)}
                            style={[
                                styles.chip,
                                diaSeleccionado === item ? styles.chipSeleccionado : styles.chipInactivo
                            ]}
                            textStyle={{
                                color: diaSeleccionado === item ? '#ffffff' : '#495057',
                                fontWeight: '600',
                                fontSize: 12
                            }}
                            showSelectedOverlay={false}
                        >
                            {item}
                        </Chip>
                    )}
                />
            </View>

            {/* Lista Principal de Eventos */}
            <FlatList
                data={eventosFiltrados}
                keyExtractor={(item) => item.id}
                renderItem={renderizarTarjetaEvento}
                contentContainerStyle={styles.listaPad}
                ListEmptyComponent={
                    <Text style={styles.textoVacio}>No hay eventos que coincidan con los filtros aplicados.</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

    // Banner superior
    contenedorBanner: {
        height: 145,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    imagenBanner: {
        width: '100%',
        height: '100%',
    },
    overlayBanner: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Sutil sombreado oscuro neutro para legibilidad
        justifyContent: 'center',
        alignItems: 'center',
    },
    tituloHeader: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    subtituloHeader: {
        fontSize: 13,
        color: '#ffffff',
        marginTop: 4,
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },

    buscador: {
        margin: 15,
        marginBottom: 10,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    contenedorChips: { paddingVertical: 6, paddingLeft: 15 },
    chip: {
        marginRight: 8,
        height: 36,
        borderRadius: 18,
    },
    chipSeleccionado: {
        backgroundColor: '#B21E29',
    },
    chipInactivo: {
        backgroundColor: '#f0f0f0',
        borderWidth: 0,
    },
    seccionTitulo: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#495057',
        marginLeft: 15,
        marginTop: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listaPad: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tarjeta: {
        marginBottom: 10,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f3f5',
    },
    tarjetaInactiva: {
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
    },
    filaTarjeta: {
        flexDirection: 'row',
        alignItems: 'stretch',
        height: 105,
    },
    contenedorImagenIzquierda: {
        width: 130, // Imagen más ancha ocupando cerca de la mitad
        backgroundColor: '#f1f3f5',
        position: 'relative',
    },
    imagenIzquierda: {
        width: '100%',
        height: '100%',
    },
    overlayImagenInactiva: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(180, 20, 20, 0.35)', // Tinte rojo carmesí translúcido para eventos inactivos
    },
    contenedorDetalles: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    filaCategoria: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    textoCategoria: {
        fontSize: 9.5,
        fontWeight: 'bold',
        letterSpacing: 0.6,
    },
    tituloTarjeta: {
        fontSize: 14,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 2,
    },
    tituloTarjetaInactivo: {
        color: '#6c757d',
        textDecorationLine: 'line-through',
    },
    filaUbicacionHora: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 3,
    },
    subFilaDetalle: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 110,
    },
    textoDetalle: {
        fontSize: 11,
        color: '#6c757d',
        marginLeft: 2,
    },
    separadorDetalle: {
        marginHorizontal: 4,
        color: '#ced4da',
    },
    descripcionTarjeta: {
        fontSize: 11.5,
        color: '#495057',
        lineHeight: 15.5,
    },
    textoVacio: {
        textAlign: 'center',
        marginTop: 45,
        color: '#888888',
        fontStyle: 'italic',
    },
    alertaContenedor: {
        backgroundColor: '#FFF0F2',
        padding: 8,
        margin: 10,
        marginTop: 0,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#D32F2F',
    },
    alertaCabeceraFila: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    alertaTitulo: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    alertaCuerpo: {
        color: '#C62828',
        fontStyle: 'italic',
        fontSize: 11,
        lineHeight: 14,
    },
    alertaFooter: {
        color: '#777',
        fontSize: 9,
        marginTop: 2,
        textAlign: 'right',
    },
});