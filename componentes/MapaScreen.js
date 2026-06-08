import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlertas, fetchEventos, validarIncidenciaRTDB, validarIncidenciaBanoRTDB, descartarIncidenciaRTDB, descartarIncidenciaBanoRTDB } from '../redux/ActionCreators';
import { COLORS } from '../comun/comun';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../comun/firebase';

// Helper function to calculate distance in meters between two GPS coordinates
const calcularDistanciaMetros = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default function MapaScreen() {
  const dispatch = useDispatch();

  // Escuchamos el estado global de alertas, baños, eventos y del usuario logueado
  const { alertas, banos, isLoading } = useSelector((state) => state.alertas);
  const { resultado: listaEventos } = useSelector((state) => state.eventos);
  const { datos: usuarioDatos, estaLogueado } = useSelector((state) => state.usuario);
  const loggedInUserId = usuarioDatos?.uid || 'anonimo';

  const [pinSeleccionado, setPinSeleccionado] = React.useState(null);
  const [userLocation, setUserLocation] = React.useState(null);
  const [alertasValidadasLocales, setAlertasValidadasLocales] = React.useState([]);
  const [tracksViewChanges, setTracksViewChanges] = React.useState(true);
  const [zonasInteres, setZonasInteres] = React.useState([]);

  // Escuchar zonas de interés en tiempo real
  useEffect(() => {
    const zonasRef = ref(rtdb, 'zonasInteres');
    const unsubscribeZonas = onValue(zonasRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arrayZonas = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      setZonasInteres(arrayZonas);
    }, (error) => {
      console.error("Error al escuchar zonas de interés:", error);
    });

    return () => unsubscribeZonas();
  }, []);

  // Optimización de rendimiento para evitar parpadeos y que los marcadores salten al moverse el usuario
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [alertas, banos, listaEventos, isLoading]);

  // Al cargar el mapa por primera vez, descargamos los puntos de Firebase y pedimos localización
  useEffect(() => {
    dispatch(fetchAlertas());
    dispatch(fetchEventos());

    // Obtener la posición del usuario en tiempo real (GPS)
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de localización denegado 📍');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      } catch (error) {
        console.error("Error obteniendo localización:", error);
      }
    })();
  }, [dispatch]);

  // Helpers de estilos y opacidad
  const obtenerColorFiabilidad = (fiabilidad) => {
    switch (fiabilidad) {
      case 'Alta': return COLORS.alertaAlta;
      case 'Media': return COLORS.alertaMedia;
      case 'Baja': return COLORS.alertaBaja;
      case 'Obsoleta': return COLORS.alertaObsoleta;
      default: return COLORS.alertaAlta;
    }
  };

  const obtenerIconoIncidencia = (tipo) => {
    switch (tipo) {
      case 'Calle colapsada': return 'account-group';
      case 'Policía': return 'shield-account';
      case 'Baño':
      case 'Baño lleno': return 'toilet';
      case 'Evento':
      case 'Evento cancelado': return 'calendar-remove';
      default: return 'alert';
    }
  };

  const obtenerOpacidadFiabilidad = (fiabilidad) => {
    switch (fiabilidad) {
      case 'Alta': return 1.0;
      case 'Media': return 0.6;
      case 'Baja': return 0.3;
      default: return 1.0;
    }
  };

  // 1. Cálculo de proximidad y validación para el modal activo
  const esBano = pinSeleccionado && pinSeleccionado.lat !== undefined;
  const tieneIncidenciaBano = esBano && !!pinSeleccionado.incidencia;
  const esCalleColapsada = pinSeleccionado && pinSeleccionado.tipo === 'Calle colapsada';
  const esAlerta = pinSeleccionado && (!!pinSeleccionado.timestamp || tieneIncidenciaBano);

  const esCreador = pinSeleccionado && (
    esBano
      ? (tieneIncidenciaBano && loggedInUserId === pinSeleccionado.incidencia.userId)
      : (loggedInUserId === pinSeleccionado.userId)
  );

  const distancia = (pinSeleccionado && userLocation) ? calcularDistanciaMetros(
    userLocation.latitude,
    userLocation.longitude,
    pinSeleccionado.latitud || pinSeleccionado.lat,
    pinSeleccionado.longitud || pinSeleccionado.lng
  ) : Infinity;

  const puedeValidar = estaLogueado && esCalleColapsada && !esCreador && (distancia < 100);
  const puedeValidarBano = estaLogueado && tieneIncidenciaBano && !esCreador && (distancia < 100);

  // 2. Buscar si hay alguna alerta de calle colapsada cercana en el mapa para mostrar la tarjeta flotante directa
  const alertaCercana = alertas.find((alerta) => {
    if (!estaLogueado) return false;
    if (alerta.tipo !== 'Calle colapsada') return false;
    if (loggedInUserId === alerta.userId) return false;
    if (alertasValidadasLocales.includes(alerta.id)) return false; // Ocultar si ya fue validada en esta sesión
    if (!userLocation) return false;

    const dist = calcularDistanciaMetros(
      userLocation.latitude,
      userLocation.longitude,
      alerta.latitud,
      alerta.longitud
    );
    return dist < 100;
  });

  return (
    <View style={styles.contenedor}>
      {isLoading && (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      )}

      <MapView
        style={styles.mapa}
        initialRegion={{
          latitude: 42.816876,
          longitude: -1.643234,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Renderizado de Baños Públicos (con marcador premium personalizado) */}
        {banos && banos.map((b) => {
          const opacidad = b.incidencia
            ? obtenerOpacidadFiabilidad(b.incidencia.fiabilidad)
            : 1.0;

          return (
            <Marker
              key={`bano-${b.id}`}
              coordinate={{
                latitude: b.lat,
                longitude: b.lng,
              }}
              opacity={opacidad}
              tracksViewChanges={tracksViewChanges}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => {
                setPinSeleccionado(b);
              }}
            >
              <View style={[
                styles.marcadorContenedor,
                { backgroundColor: b.incidencia ? '#E65100' : '#0288D1' }
              ]}>
                <Text style={styles.marcadorEmoji}>🚽</Text>
              </View>
            </Marker>
          );
        })}


        {/* Renderizado de Marcadores de Alertas Colaborativas Personalizados */}
        {alertas.filter(alerta => alerta.tipo !== 'Evento' && alerta.tipo !== 'Evento cancelado' && alerta.tipo !== 'Evento trasladado').map((alerta) => {
          if (alerta.latitud === undefined || alerta.latitud === null || alerta.longitud === undefined || alerta.longitud === null) {
            return null;
          }

          const opacidad = obtenerOpacidadFiabilidad(alerta.fiabilidad);

          let colorMarcador = '#E65100'; // Default naranja
          if (alerta.tipo === 'Calle colapsada') {
            colorMarcador = '#D32F2F'; // Rojo
          } else if (alerta.tipo === 'Policía') {
            colorMarcador = '#1A237E'; // Azul oscuro
          }

          return (
            <Marker
              key={alerta.id}
              coordinate={{
                latitude: alerta.latitud,
                longitude: alerta.longitud,
              }}
              opacity={opacidad}
              tracksViewChanges={tracksViewChanges}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => {
                setPinSeleccionado(alerta);
              }}
            >
              <View style={[
                styles.marcadorContenedor,
                { backgroundColor: colorMarcador }
              ]}>
                <Text style={styles.marcadorEmojiAlert}>⚠️</Text>
              </View>
            </Marker>
          );
        })}

        {/* Renderizado de Círculos de Zonas de Interés */}
        {zonasInteres && zonasInteres.map((zona) => {
          const latitude = zona.latitud !== undefined ? zona.latitud : zona.lat;
          const longitude = zona.longitud !== undefined ? zona.longitud : zona.lng;
          if (latitude === undefined || longitude === undefined) return null;

          return (
            <Circle
              key={`circulo-zona-${zona.id}`}
              center={{ latitude, longitude }}
              radius={40} // Radio de 20 metros
              fillColor="rgba(103, 58, 183, 0.22)" // Morado muy suave translúcido
              strokeColor="rgba(103, 58, 183, 0.65)" // Borde morado semi-transparente
              strokeWidth={1.5}
            />
          );
        })}

        {/* Renderizado de Marcadores de Zonas de Interés */}
        {zonasInteres && zonasInteres.map((zona) => {
          const latitude = zona.latitud !== undefined ? zona.latitud : zona.lat;
          const longitude = zona.longitud !== undefined ? zona.longitud : zona.lng;
          if (latitude === undefined || longitude === undefined) return null;

          return (
            <Marker
              key={`marcador-zona-${zona.id}`}
              coordinate={{ latitude, longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => {
                setPinSeleccionado({
                  esZona: true,
                  nombre: zona.nombre || zona.name || 'Zona de Interés',
                  descripcion: zona.descripcion || 'Punto de interés destacado de las fiestas de San Fermín.',
                  latitud: latitude,
                  longitud: longitude,
                });
              }}
            >
              <View style={[
                styles.marcadorContenedor,
                { backgroundColor: '#673AB7' } // Color morado destacado para zonas de interés
              ]}>
                <MaterialCommunityIcons name="office-building" size={16} color="#ffffff" />
              </View>
            </Marker>
          );
        })}

      </MapView>

      {/* ⚠️ TARJETA FLOTANTE PROACTIVA: Aparece directamente en el mapa si estás cerca de una calle colapsada */}
      {alertaCercana && (
        <View style={styles.tarjetaFlotante}>
          <Text style={styles.tarjetaFlotanteTitulo}>⚠️ Calle Colapsada Cercana</Text>
          <Text style={styles.tarjetaFlotanteDescripcion}>
            {alertaCercana.descripcion || 'Sin descripción adicional'}
          </Text>
          <Text style={styles.tarjetaFlotantePregunta}>¿Sigue la calle colapsada?</Text>
          <View style={styles.tarjetaFlotanteContenedorBotones}>
            <TouchableOpacity
              style={[styles.tarjetaFlotanteBoton, { backgroundColor: '#388E3C', flex: 1, marginRight: 8 }]}
              onPress={() => {
                dispatch(validarIncidenciaRTDB(alertaCercana.id));
                setAlertasValidadasLocales((prev) => [...prev, alertaCercana.id]);
                Alert.alert(
                  "¡Incidencia Validada! 👍",
                  "Has confirmado que la calle sigue colapsada."
                );
              }}
            >
              <Text style={styles.tarjetaFlotanteBotonTexto}>👍 Sí</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tarjetaFlotanteBoton, { backgroundColor: '#D32F2F', flex: 1 }]}
              onPress={() => {
                dispatch(descartarIncidenciaRTDB(alertaCercana.id));
                setAlertasValidadasLocales((prev) => [...prev, alertaCercana.id]);
                Alert.alert(
                  "Reporte enviado 👎",
                  "Has informado de que la calle ya no está colapsada."
                );
              }}
            >
              <Text style={styles.tarjetaFlotanteBotonTexto}>👎 Ya no</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal para mostrar los detalles del elemento pulsado (Baño o Alerta) */}
      <Modal
        visible={pinSeleccionado !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPinSeleccionado(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setPinSeleccionado(null)}
            activeOpacity={1}
          />

          {pinSeleccionado && (
            <View style={styles.modalContent}>
              <View style={styles.barraArrastreModal} />
              <View style={styles.calloutBox}>
                <View style={styles.contenedorTituloModal}>
                  <Text style={styles.emojiModal}>
                    {pinSeleccionado.esZona ? '🏛️' : (esBano ? '🚽' : '⚠️')}
                  </Text>

                  <Text style={styles.tituloAlertaNativo}>
                    {pinSeleccionado.esZona
                      ? pinSeleccionado.nombre
                      : (esBano ? `Aseo: ${pinSeleccionado.name}` : (pinSeleccionado.calle || pinSeleccionado.tipo))
                    }
                  </Text>
                </View>

                {pinSeleccionado.esZona ? (
                  <Text style={styles.descripcionNativa}>
                    {pinSeleccionado.descripcion || 'Punto de interés destacado de las fiestas de San Fermín.'}
                  </Text>
                ) : esBano ? (
                  tieneIncidenciaBano ? (
                    <>
                      <Text
                        style={[
                          styles.subtituloAlertaNativo,
                          { color: obtenerColorFiabilidad(pinSeleccionado.incidencia.fiabilidad || 'Alta') },
                        ]}
                      >
                        Fiabilidad: {pinSeleccionado.incidencia.fiabilidad || 'Alta'}
                      </Text>
                      <Text style={styles.descripcionNativa}>
                        {pinSeleccionado.incidencia.descripcion || 'Sin descripción adicional'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.descripcionNativa}>
                      Aseo público portátil instalado para la semana de fiestas de San Fermín.
                    </Text>
                  )
                ) : (
                  <>
                    <Text
                      style={[
                        styles.subtituloAlertaNativo,
                        { color: obtenerColorFiabilidad(pinSeleccionado.fiabilidad || 'Alta') },
                      ]}
                    >
                      Fiabilidad: {pinSeleccionado.fiabilidad || 'Alta'}
                    </Text>
                    <Text style={styles.descripcionNativa}>
                      {pinSeleccionado.descripcion || 'Sin descripción adicional'}
                    </Text>
                  </>
                )}

                {/* Sección de Validación Colaborativa por cercanía para Calles Colapsadas */}
                {puedeValidar && (
                  <View style={styles.contenedorValidacionModal}>
                    <Text style={styles.preguntaModal}>¿Sigue la calle colapsada?</Text>
                    <View style={styles.contenedorBotonesModal}>
                      <TouchableOpacity
                        style={[styles.botonValidarModal, { backgroundColor: '#388E3C', flex: 1, marginRight: 8 }]}
                        onPress={() => {
                          dispatch(validarIncidenciaRTDB(pinSeleccionado.id));
                          setAlertasValidadasLocales((prev) => [...prev, pinSeleccionado.id]);
                          Alert.alert(
                            "¡Incidencia Validada! 👍",
                            "Has confirmado que la calle sigue colapsada."
                          );
                          setPinSeleccionado(null);
                        }}
                      >
                        <Text style={styles.textoBotonValidar}>👍 Sí</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.botonValidarModal, { backgroundColor: '#D32F2F', flex: 1 }]}
                        onPress={() => {
                          dispatch(descartarIncidenciaRTDB(pinSeleccionado.id));
                          setAlertasValidadasLocales((prev) => [...prev, pinSeleccionado.id]);
                          Alert.alert(
                            "Reporte enviado 👎",
                            "Has informado de que la calle ya no está colapsada."
                          );
                          setPinSeleccionado(null);
                        }}
                      >
                        <Text style={styles.textoBotonValidar}>👎 Ya no</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Sección de Validación Colaborativa por cercanía para Baños */}
                {puedeValidarBano && (
                  <View style={styles.contenedorValidacionModal}>
                    <Text style={styles.preguntaModal}>¿Sigue habiendo incidencia en el baño?</Text>
                    <View style={styles.contenedorBotonesModal}>
                      <TouchableOpacity
                        style={[styles.botonValidarModal, { backgroundColor: '#388E3C', flex: 1, marginRight: 8 }]}
                        onPress={() => {
                          dispatch(validarIncidenciaBanoRTDB(pinSeleccionado.id));
                          Alert.alert(
                            "¡Incidencia Validada! 👍",
                            "Has confirmado que la incidencia sigue activa."
                          );
                          setPinSeleccionado(null);
                        }}
                      >
                        <Text style={styles.textoBotonValidar}>👍 Sí</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.botonValidarModal, { backgroundColor: '#D32F2F', flex: 1 }]}
                        onPress={() => {
                          dispatch(descartarIncidenciaBanoRTDB(pinSeleccionado.id));
                          Alert.alert(
                            "Reporte enviado 👎",
                            "Has informado de que la incidencia ya no está activa."
                          );
                          setPinSeleccionado(null);
                        }}
                      >
                        <Text style={styles.textoBotonValidar}>👎 Ya no</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.botonCerrar, { marginTop: (puedeValidar || puedeValidarBano) ? 12 : 8 }]}
                  onPress={() => setPinSeleccionado(null)}
                >
                  <Text style={styles.textoBotoncerrar}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  mapa: { width: '100%', height: '100%' },
  loader: { position: 'absolute', top: 20, alignSelf: 'center', zIndex: 999 },

  // ESTILOS DEL MODAL
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    zIndex: 1000,
  },
  barraArrastreModal: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  calloutBox: {
    backgroundColor: 'transparent',
  },
  contenedorTituloModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconoModal: {
    marginRight: 12,
  },
  tituloAlertaNativo: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#212529',
    flex: 1,
  },
  subtituloAlertaNativo: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  descripcionNativa: {
    fontSize: 13,
    color: '#495057',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },
  botonCerrar: {
    backgroundColor: '#757575',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textoBotoncerrar: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },

  // ESTILOS DE LA VALIDACIÓN COLABORATIVA (MODAL)
  contenedorValidacionModal: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
    marginVertical: 10,
    alignItems: 'center',
  },
  preguntaModal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  botonValidarModal: {
    backgroundColor: '#388E3C',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  textoBotonValidar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  // ⚠️ ESTILOS DE LA TARJETA FLOTANTE PROACTIVA EN PANTALLA PRINCIPAL
  tarjetaFlotante: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(178, 30, 41, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  tarjetaFlotanteTitulo: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#D32F2F',
    marginBottom: 4,
  },
  tarjetaFlotanteDescripcion: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 10,
    lineHeight: 18,
  },
  tarjetaFlotantePregunta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
    textAlign: 'center',
  },
  tarjetaFlotanteBoton: {
    backgroundColor: '#388E3C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tarjetaFlotanteBotonTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  marcadorContenedor: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
  },
  marcadorEmoji: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  marcadorEmojiAlert: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 16,
  },
  emojiModal: {
    fontSize: 28,
    marginRight: 12,
  },
  tarjetaFlotanteContenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  contenedorBotonesModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
});