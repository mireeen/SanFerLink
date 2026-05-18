import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlertas } from '../redux/ActionCreators';
import { COLORS } from '../comun/comun';

export default function MapaScreen() {
  const dispatch = useDispatch();
  
  // Escuchamos el estado global de alertas
  const { alertas, isLoading } = useSelector((state) => state.alertas);

  // Al cargar el mapa por primera vez, descargamos los puntos de Firebase
  useEffect(() => {
    dispatch(fetchAlertas());
  }, [dispatch]);

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
        {/* Recorremos el array de alertas de Redux y pintamos los pines */}
        {alertas.map((alerta) => (
          <Marker
            key={alerta.id}
            coordinate={{
              latitude: alerta.latitud,
              longitude: alerta.longitud,
            }}
            title={alerta.tipo}
            description={alerta.descripcion}
            // Cambiamos el color del pin según el tipo para que quede pro
            pinColor={alerta.tipo === 'Punto Policial' ? 'blue' : 'red'}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  mapa: { width: '100%', height: '100%' },
  loader: { position: 'absolute', top: 20, selfAlign: 'center', zIndex: 999 }
});