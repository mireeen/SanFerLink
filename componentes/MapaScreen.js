import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlertas } from '../redux/ActionCreators';
import { COLORS } from '../comun/comun';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MapaScreen() {
  const dispatch = useDispatch();
  const [pinSeleccionado, setPinSeleccionado] = React.useState(null);

  // Escuchamos el estado global de alertas
  const { alertas, isLoading } = useSelector((state) => state.alertas);

  // Al cargar el mapa por primera vez, descargamos los puntos de Firebase
  useEffect(() => {
    dispatch(fetchAlertas());
  }, [dispatch]);

  // Debug: muestra si hay alertas cargadas
  useEffect(() => {
    console.log('📍 Alertas en MapaScreen:', alertas);
  }, [alertas]);

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
      case 'Baño lleno': return 'toilet';
      case 'Evento cancelado': return 'calendar-remove';
      default: return 'alert';
    }
  };

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
        {alertas.map((alerta) => {
          const nivelFiabilidad = alerta.fiabilidad;
          const colorPin = obtenerColorFiabilidad(nivelFiabilidad);

          return (
            <Marker
              key={alerta.id}
              coordinate={{
                latitude: alerta.latitud,
                longitude: alerta.longitud,
              }}
              pinColor={colorPin}
              onPress={() => {
                console.log('📍 Pin pulsado:', alerta.id, alerta.tipo);
                setPinSeleccionado(alerta);
              }}
            />
          );
        })}
      </MapView>

      {/* Modal para mostrar los detalles de la alerta */}
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
              <View style={styles.calloutBox}>
                <View style={styles.contenedorTituloModal}>
                  {/* Inyectamos el icono dinámico con el color corporativo rojo San Fermín */}
                  <MaterialCommunityIcons
                    name={obtenerIconoIncidencia(pinSeleccionado.tipo)}
                    size={26}
                    color={COLORS.primary || '#B21E29'}
                    style={styles.iconoModal}
                  />

                  <Text style={styles.tituloAlertaNativo}>
                    {pinSeleccionado.tipo}
                  </Text>
                </View>

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

                <TouchableOpacity
                  style={styles.botonCerrar}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    zIndex: 1000,
  },
  calloutBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  tituloAlertaNativo: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  subtituloAlertaNativo: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  descripcionNativa: {
    fontSize: 12,
    color: '#555555',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  botonCerrar: {
    backgroundColor: COLORS.primary || '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  textoBotoncerrar: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  contenedorTituloModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconoModal: {
    marginRight: 10, // Deja un espacio elegante entre el icono y el texto
  },
  tituloAlertaNativo: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#000000',
    flex: 1, // Permite que el texto se estire de forma fluida
  },
});