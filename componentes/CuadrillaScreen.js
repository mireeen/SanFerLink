import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, FlatList, TouchableOpacity, Share, Image, Platform, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { TextInput, Button, Text, Card, Avatar, Chip, Divider, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ref, onValue, set, get, child } from 'firebase/database';
import { rtdb } from '../comun/firebase';
import { COLORS } from '../comun/comun';

export default function CuadrillaScreen() {
    // 1. SELECTORES DE REDUX
    const { datos: usuarioDatos, estaLogueado } = useSelector((state) => state.usuario);
    const userId = usuarioDatos?.uid || 'anonimo';
    const email = usuarioDatos?.email || 'Usuario';

    // 2. ESTADOS LOCALES
    const [grupoCode, setGrupoCode] = useState('');
    const [cuadrillaInfo, setCuadrillaInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [nombreNuevaCuadrilla, setNombreNuevaCuadrilla] = useState('');
    const [codigoEntrada, setCodigoEntrada] = useState('');
    const [creandoGrupo, setCreandoGrupo] = useState(false);
    const [uniendoGrupo, setUniendoGrupo] = useState(false);

    const [grupos, setGrupos] = useState({}); // { [grupoCode]: nombreGrupo }
    const [modalNuevoGrupoVisible, setModalNuevoGrupoVisible] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState('Todos');
    const dias = ['Todos', '6 Jul', '7 Jul', '8 Jul', '9 Jul', '10 Jul', '11 Jul', '12 Jul', '13 Jul', '14 Jul'];

    // 3. ESCUCHAR EL CÓDIGO DE CUADRILLA DEL USUARIO EN TIEMPO REAL
    useEffect(() => {
        if (!userId || userId === 'anonimo') {
            setLoading(false);
            return;
        }

        // 3.1. Escuchar el listado de grupos de la cuadrilla
        const groupsRef = ref(rtdb, `usuarios/${userId}/grupos`);
        const unsubscribeGroups = onValue(groupsRef, (snapshot) => {
            const val = snapshot.val() || {};
            setGrupos(val);
        }, (error) => {
            console.error("Error al escuchar grupos del usuario:", error);
        });

        // 3.2. Escuchar el grupo activo actual
        const activeRef = ref(rtdb, `usuarios/${userId}/grupoActivo`);
        const unsubscribeActive = onValue(activeRef, (snapshot) => {
            const activeCode = snapshot.val() || '';
            setGrupoCode(activeCode);
            if (!activeCode) {
                setCuadrillaInfo(null);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error al escuchar grupo activo:", error);
            setLoading(false);
        });

        // 3.3. Migración de datos legacy
        const legacyRef = ref(rtdb, `usuarios/${userId}/grupoCode`);
        const unsubscribeLegacy = onValue(legacyRef, async (snapshot) => {
            const legacyCode = snapshot.val();
            if (legacyCode) {
                try {
                    const activeSnap = await get(ref(rtdb, `usuarios/${userId}/grupoActivo`));
                    if (!activeSnap.exists()) {
                        await set(ref(rtdb, `usuarios/${userId}/grupoActivo`), legacyCode);
                        const groupNameSnap = await get(ref(rtdb, `cuadrillas/${legacyCode}/nombre`));
                        const groupName = groupNameSnap.exists() ? groupNameSnap.val() : 'Mi Cuadrilla';
                        await set(ref(rtdb, `usuarios/${userId}/grupos/${legacyCode}`), groupName);
                    }
                    await set(ref(rtdb, `usuarios/${userId}/grupoCode`), null);
                } catch (e) {
                    console.error("Error al migrar grupoCode legacy:", e);
                }
            }
        });

        return () => {
            unsubscribeGroups();
            unsubscribeActive();
            unsubscribeLegacy();
        };
    }, [userId]);

    // 4. ESCUCHAR LA INFORMACIÓN DE LA CUADRILLA EN TIEMPO REAL
    useEffect(() => {
        if (!grupoCode) return;

        setLoading(true);
        const groupRef = ref(rtdb, `cuadrillas/${grupoCode}`);
        const unsubscribeGroup = onValue(groupRef, async (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                // El grupo activo ya no existe. Limpiar del perfil de usuario de forma auto-curativa
                try {
                    await set(ref(rtdb, `usuarios/${userId}/grupoActivo`), null);
                    await set(ref(rtdb, `usuarios/${userId}/grupos/${grupoCode}`), null);
                } catch (e) {
                    console.error("Error al autolimpiar grupo inactivo:", e);
                }
            } else {
                setCuadrillaInfo(data);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error al escuchar cuadrilla:", error);
            setLoading(false);
        });

        return () => unsubscribeGroup();
    }, [grupoCode]);

    // 5. AUXILIAR: GENERAR CÓDIGO ÚNICO DE GRUPO
    const generarCodigoGrupo = () => {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo = '';
        for (let i = 0; i < 6; i++) {
            codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return codigo;
    };

    // 6. AUXILIAR: IMAGENES SEGÚN CATEGORÍA
    const obtenerImagenTarjeta = (categoria, name) => {
        const cat = categoria.toLowerCase();
        const nombre = name.toLowerCase();

        if (nombre.includes('charanga') || nombre.includes('txaranga') || nombre.includes('kai') || cat === 'música') {
            return require('../assets/txaranga.jpg');
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
            return require('../assets/fuegos.jpg');
        }
        if (nombre.includes('chupinazo') || nombre.includes('txupinazo')) {
            return require('../assets/txupinazo.jpg');
        }
        return require('../assets/pañuelo.jpg');
    };

    // Helper para formatear nombres de correo (parte local anterior a la @)
    const obtenerNombreCorto = (emailStr) => {
        if (!emailStr) return 'Amigo';
        return emailStr.split('@')[0];
    };

    // 7. ACCIÓN: CREAR CUADRILLA
    const gestionarCrearCuadrilla = async () => {
        if (nombreNuevaCuadrilla.trim() === '') {
            Alert.alert("Faltan datos", "Por favor, introduce el nombre de la cuadrilla.");
            return;
        }

        setCreandoGrupo(true);
        try {
            let codigo = '';
            let codigoUnico = false;
            let intentos = 0;

            // Generamos y validamos unicidad del código (max 5 intentos)
            while (!codigoUnico && intentos < 5) {
                codigo = generarCodigoGrupo();
                const snap = await get(child(ref(rtdb), `cuadrillas/${codigo}`));
                if (!snap.exists()) {
                    codigoUnico = true;
                }
                intentos++;
            }

            // Guardamos la cuadrilla en RTDB
            const nuevaCuadrilla = {
                nombre: nombreNuevaCuadrilla.trim(),
                codigo: codigo,
                creador: userId,
                miembros: {
                    [userId]: email
                },
                agenda: {}
            };

            await set(ref(rtdb, `cuadrillas/${codigo}`), nuevaCuadrilla);

            // Asociamos el grupo al usuario
            await set(ref(rtdb, `usuarios/${userId}/grupos/${codigo}`), nombreNuevaCuadrilla.trim());
            await set(ref(rtdb, `usuarios/${userId}/grupoActivo`), codigo);
            await set(ref(rtdb, `usuarios/${userId}/email`), email);

            Alert.alert("¡Cuadrilla creada!", `Se ha creado tu grupo con el código: ${codigo}. Compártelo con tus amigos.`);
            setNombreNuevaCuadrilla('');
            setModalNuevoGrupoVisible(false);
        } catch (error) {
            console.error("Error creando cuadrilla:", error);
            Alert.alert("Error", "No se pudo crear la cuadrilla. Revisa tu conexión.");
        } finally {
            setCreandoGrupo(false);
        }
    };

    // 8. ACCIÓN: UNIRSE A CUADRILLA
    const gestionarUnirseCuadrilla = async () => {
        const codigoLimpio = codigoEntrada.trim().toUpperCase();
        if (codigoLimpio.length !== 6) {
            Alert.alert("Formato incorrecto", "El código debe tener exactamente 6 caracteres alfanuméricos.");
            return;
        }

        setUniendoGrupo(true);
        try {
            const snap = await get(child(ref(rtdb), `cuadrillas/${codigoLimpio}`));
            if (snap.exists()) {
                const groupData = snap.val();

                // Añadimos el usuario como miembro en la cuadrilla
                await set(ref(rtdb, `cuadrillas/${codigoLimpio}/miembros/${userId}`), email);

                // Guardamos el grupo en la información del usuario
                await set(ref(rtdb, `usuarios/${userId}/grupos/${codigoLimpio}`), groupData.nombre || 'Mi Cuadrilla');
                await set(ref(rtdb, `usuarios/${userId}/grupoActivo`), codigoLimpio);
                await set(ref(rtdb, `usuarios/${userId}/email`), email);

                Alert.alert("¡Bienvenido!", `Te has unido a la cuadrilla: ${groupData.nombre}`);
                setCodigoEntrada('');
                setModalNuevoGrupoVisible(false);
            } else {
                Alert.alert("No encontrada", "No existe ninguna cuadrilla con el código introducido.");
            }
        } catch (error) {
            console.error("Error al unirse a cuadrilla:", error);
            Alert.alert("Error", "No se pudo unir a la cuadrilla. Revisa tu conexión.");
        } finally {
            setUniendoGrupo(false);
        }
    };

    // 9. ACCIÓN: ABANDONAR CUADRILLA
    const gestionarAbandonarCuadrilla = () => {
        if (!grupoCode) return;
        Alert.alert(
            "Abandonar Cuadrilla",
            `¿Estás seguro de que quieres salir del grupo "${cuadrillaInfo?.nombre}"? Ya no podrás ver la agenda compartida.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir del grupo",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const grupoAbandonado = grupoCode;

                            // 1. Quitar el grupo del listado del usuario
                            await set(ref(rtdb, `usuarios/${userId}/grupos/${grupoAbandonado}`), null);

                            // 2. Eliminar el usuario de los miembros del grupo
                            await set(ref(rtdb, `cuadrillas/${grupoAbandonado}/miembros/${userId}`), null);

                            // 3. Seleccionar otra cuadrilla como activa si existe
                            const snapGrupos = await get(ref(rtdb, `usuarios/${userId}/grupos`));
                            let nuevoGrupoActivo = null;
                            if (snapGrupos.exists()) {
                                const listaG = Object.keys(snapGrupos.val() || {});
                                if (listaG.length > 0) {
                                    nuevoGrupoActivo = listaG[0];
                                }
                            }
                            await set(ref(rtdb, `usuarios/${userId}/grupoActivo`), nuevoGrupoActivo);

                            // 4. Si no quedan miembros en el grupo, lo eliminamos de Firebase
                            const miembrosRef = ref(rtdb, `cuadrillas/${grupoAbandonado}/miembros`);
                            const miembrosSnap = await get(miembrosRef);
                            if (!miembrosSnap.exists() || Object.keys(miembrosSnap.val() || {}).length === 0) {
                                await set(ref(rtdb, `cuadrillas/${grupoAbandonado}`), null);
                            }

                            if (!nuevoGrupoActivo) {
                                setGrupoCode('');
                                setCuadrillaInfo(null);
                            }
                        } catch (error) {
                            console.error("Error al abandonar cuadrilla:", error);
                            Alert.alert("Error", "No se pudo procesar la salida. Revisa tu conexión.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // 10. ACCIÓN: COMPARTIR CÓDIGO
    const gestionarCompartirCodigo = async () => {
        if (!grupoCode) return;
        try {
            await Share.share({
                message: `¡Únete a mi cuadrilla "${cuadrillaInfo?.nombre}" en la app SanFerLink usando este código de acceso único: ${grupoCode} y organicemos los planes de San Fermín juntos!`
            });
        } catch (error) {
            console.error("Error compartiendo código:", error);
        }
    };

    // 11. ACCIÓN: ME APUNTO / YA NO VOY A UN PLAN
    const gestionarAsistenciaPlan = async (planId, asisteActualmente) => {
        try {
            const planAsistentesRef = ref(rtdb, `cuadrillas/${grupoCode}/agenda/${planId}/asistentes/${userId}`);
            if (asisteActualmente) {
                // Si asiste, se desapunta
                await set(planAsistentesRef, null);
            } else {
                // Si no asiste, se apunta
                await set(planAsistentesRef, email);
            }
        } catch (error) {
            console.error("Error al gestionar asistencia:", error);
            Alert.alert("Error", "No se pudo actualizar tu asistencia.");
        }
    };

    // 12. ACCIÓN: ELIMINAR PLAN DE LA AGENDA
    const gestionarEliminarPlan = (planId, planNombre) => {
        Alert.alert(
            "Eliminar Plan",
            `¿Quieres quitar "${planNombre}" de la agenda de la cuadrilla?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await set(ref(rtdb, `cuadrillas/${grupoCode}/agenda/${planId}`), null);
                        } catch (error) {
                            console.error("Error al eliminar plan:", error);
                        }
                    }
                }
            ]
        );
    };

    // 13. RENDERIZADO DE PLANES EN LA AGENDA
    const renderizarPlanItem = ({ item }) => {
        const asistentes = item.asistentes || {};
        const listaAsistentes = Object.values(asistentes);
        const asiste = !!asistentes[userId];
        const imagenPlan = obtenerImagenTarjeta(item.category || '', item.name || '');
        let horaFormateada = '';
        let fechaFormateada = '';
        if (item.date) {
            const partes = item.date.split('T');
            if (partes.length === 2) {
                const fechaPartes = partes[0].split('-');
                const horaPartes = partes[1].split(':');
                if (fechaPartes.length === 3 && horaPartes.length >= 2) {
                    fechaFormateada = `${fechaPartes[2]}/${fechaPartes[1]}`;
                    horaFormateada = `${horaPartes[0]}:${horaPartes[1]}`;
                }
            }
        }
        if (!fechaFormateada || !horaFormateada) {
            const fechaObj = new Date(item.date);
            horaFormateada = isNaN(fechaObj.getTime()) ? '' : fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            fechaFormateada = isNaN(fechaObj.getTime()) ? '' : fechaObj.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
        }

        return (
            <Card style={styles.tarjetaPlan}>
                <View style={styles.filaPlan}>
                    {/* Imagen de categoría */}
                    <View style={styles.contenedorImagenPlan}>
                        <Image source={imagenPlan} style={styles.imagenPlan} resizeMode="cover" />
                    </View>

                    {/* Detalles */}
                    <View style={styles.contenedorDetallesPlan}>
                        <View style={styles.filaCabeceraPlan}>
                            <Text style={styles.textoCategoriaPlan}>{item.category?.toUpperCase()}</Text>
                            <TouchableOpacity onPress={() => gestionarEliminarPlan(item.id, item.name)} style={styles.botonBorrarPlan}>
                                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#e63946" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.tituloPlan} numberOfLines={1}>{item.name}</Text>

                        {/* Fecha, Hora e Ubicación */}
                        <View style={styles.filaMetaPlan}>
                            <MaterialCommunityIcons name="calendar" size={11} color="#6c757d" />
                            <Text style={styles.textoMetaPlan}>{fechaFormateada} • {horaFormateada}</Text>
                            <Text style={{ marginHorizontal: 3, color: '#ced4da' }}>|</Text>
                            <MaterialCommunityIcons name="map-marker" size={11} color="#6c757d" />
                            <Text style={styles.textoMetaPlan} numberOfLines={1}>{item.location}</Text>
                        </View>
                    </View>
                </View>

                {/* Nota compartida si existe */}
                {item.nota ? (
                    <View style={styles.contenedorNotaPlan}>
                        <MaterialCommunityIcons name="note-text-outline" size={14} color="#F57C00" style={{ marginRight: 6 }} />
                        <Text style={styles.textoNotaPlan} numberOfLines={2}>
                            Nota: "{item.nota}"
                        </Text>
                    </View>
                ) : null}

                {/* Zona de Asistentes y Botón Apuntarse */}
                <Divider style={{ marginHorizontal: 12, backgroundColor: '#f1f3f5' }} />
                <View style={styles.filaFooterPlan}>
                    {/* Lista corta de asistentes */}
                    <View style={styles.contenedorAsistentesList}>
                        <MaterialCommunityIcons name="account-multiple" size={15} color="#555" style={{ marginRight: 4 }} />
                        <Text style={styles.textoAsistentesCount}>
                            {listaAsistentes.length === 0
                                ? 'Nadie apuntado'
                                : `${listaAsistentes.length} asistirán: ${listaAsistentes.map(obtenerNombreCorto).join(', ')}`
                            }
                        </Text>
                    </View>

                    {/* Botón de apúntame */}
                    <Button
                        mode={asiste ? "contained" : "outlined"}
                        onPress={() => gestionarAsistenciaPlan(item.id, asiste)}
                        style={styles.botonAsistencia}
                        labelStyle={{ fontSize: 11, fontWeight: 'bold', marginVertical: 6, marginHorizontal: 12 }}
                        buttonColor={asiste ? "#388E3C" : undefined}
                        textColor={asiste ? "#ffffff" : COLORS.primary}
                        borderColor={asiste ? undefined : COLORS.primary}
                    >
                        {asiste ? "¡Voy! 👍" : "Apuntarse"}
                    </Button>
                </View>
            </Card>
        );
    };

    // --- PANTALLA PRINCIPAL ---
    if (loading) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 10 }}>Cargando cuadrilla...</Text>
            </View>
        );
    }

    if (!estaLogueado || userId === 'anonimo') {
        return (
            <View style={[styles.centrado, { padding: 30 }]}>
                <Avatar.Icon size={80} icon="account-group" backgroundColor="#FFF0F2" color={COLORS.primary} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 20, textAlign: 'center', color: '#212529' }}>
                    Planificación de Cuadrillas
                </Text>
                <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#6c757d', marginVertical: 15, lineHeight: 20 }}>
                    Para poder crear una cuadrilla de amigos, unirte a un grupo existente mediante un código único y planificar vuestra agenda compartida de San Fermín, necesitas iniciar sesión.
                </Text>
                <Text style={{ fontStyle: 'italic', color: COLORS.primary, fontWeight: 'bold', textAlign: 'center' }}>
                    💡 Inicia sesión desde la pestaña de Perfil
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Cabecera Estilo Pañuelico Curvo */}
            <View style={styles.cabeceraPanuelico}>
                <Text style={styles.tituloHeader}>Mi Cuadrilla</Text>
                <Text style={styles.subtituloHeader}>Organiza planes de San Fermín con amigos</Text>
            </View>

            {/* Pestañas de Cuadrillas horizontales (si el usuario tiene grupos) */}
            {Object.keys(grupos).length > 0 && (
                <View style={styles.contenedorPestanasGrupos}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPestanas}>
                        {Object.keys(grupos).map((gCode) => {
                            const esActivo = gCode === grupoCode;
                            const gNombre = grupos[gCode];
                            return (
                                <TouchableOpacity
                                    key={gCode}
                                    onPress={async () => {
                                        setLoading(true);
                                        try {
                                            await set(ref(rtdb, `usuarios/${userId}/grupoActivo`), gCode);
                                        } catch (error) {
                                            console.error("Error al cambiar grupo activo:", error);
                                            Alert.alert("Error", "No se pudo cambiar de grupo.");
                                            setLoading(false);
                                        }
                                    }}
                                    style={[
                                        styles.pestanaGrupo,
                                        esActivo ? styles.pestanaGrupoActiva : styles.pestanaGrupoInactiva
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={esActivo ? "account-group" : "account-group-outline"}
                                        size={16}
                                        color={esActivo ? "#ffffff" : "#495057"}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[
                                        styles.textoPestana,
                                        esActivo ? styles.textoPestanaActivo : styles.textoPestanaInactivo
                                    ]}>
                                        {gNombre}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Botón Añadir Grupo (+) */}
                        <TouchableOpacity
                            onPress={() => setModalNuevoGrupoVisible(true)}
                            style={styles.pestanaAnadirGrupo}
                        >
                            <MaterialCommunityIcons name="plus" size={16} color="#B21E29" />
                            <Text style={styles.textoAnadirGrupo}>Nuevo</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            )}

            {grupoCode && cuadrillaInfo ? (
                // --- VISTA GRUPO ACTIVO ---
                <View style={{ flex: 1 }}>
                    {/* Info de la cuadrilla y código */}
                    <Card style={styles.tarjetaInfoGrupo}>
                        <View style={styles.filaInfoGrupo}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.contenedorNombreGrupoDetalle}>
                                    <Text style={styles.nombreGrupoText}>{cuadrillaInfo.nombre}</Text>
                                </View>
                                <View style={styles.contenedorCodigoGrupo}>
                                    <Text style={styles.codigoEtiqueta}>Código: </Text>
                                    <Text style={styles.codigoMonospace}>{grupoCode}</Text>
                                    <IconButton
                                        icon="share-variant"
                                        size={18}
                                        iconColor={COLORS.primary}
                                        onPress={gestionarCompartirCodigo}
                                        style={{ margin: 0, padding: 0 }}
                                    />
                                </View>
                            </View>
                            <Button
                                mode="text"
                                textColor="#e63946"
                                labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                                onPress={gestionarAbandonarCuadrilla}
                            >
                                Salir del grupo
                            </Button>
                        </View>

                        {/* Chips de miembros */}
                        <View style={styles.contenedorMiembrosChips}>
                            <Text style={styles.miembrosTituloSecundario}>Miembros:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                                {cuadrillaInfo.miembros && Object.values(cuadrillaInfo.miembros).map((memberEmail, index) => (
                                    <Chip
                                        key={index}
                                        style={styles.chipMiembro}
                                        textStyle={styles.chipMiembroTexto}
                                        avatar={<Avatar.Icon icon="account" size={18} backgroundColor="#ddd" color="#333" />}
                                    >
                                        {obtenerNombreCorto(memberEmail)}
                                    </Chip>
                                ))}
                            </ScrollView>
                        </View>
                    </Card>

                    <Text style={styles.agendaTituloSeccion}>Agenda de la Cuadrilla</Text>

                    {/* Filtro por Días de San Fermín */}
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

                    {/* Lista de planes de la agenda */}
                    <FlatList
                        data={(() => {
                            const agenda = cuadrillaInfo.agenda || {};
                            let list = Object.keys(agenda).map(key => ({
                                id: key,
                                ...agenda[key]
                            }));

                            // Filtrar por día seleccionado
                            if (diaSeleccionado !== 'Todos') {
                                list = list.filter(plan => {
                                    if (!plan.date) return false;
                                    const partes = plan.date.split('T')[0].split('-');
                                    if (partes.length === 3) {
                                        const dayNum = parseInt(partes[2], 10);
                                        const monthNum = parseInt(partes[1], 10);
                                        const selectedDayNum = parseInt(diaSeleccionado.split(' ')[0], 10);
                                        return dayNum === selectedDayNum && monthNum === 7;
                                    }
                                    return false;
                                });
                            }

                            // Orden cronológico ascendente
                            return list.sort((a, b) => {
                                if (!a.date) return 1;
                                if (!b.date) return -1;
                                return a.date.localeCompare(b.date);
                            });
                        })()}
                        keyExtractor={(item) => item.id}
                        renderItem={renderizarPlanItem}
                        contentContainerStyle={styles.listaPlanesContainer}
                        ListEmptyComponent={
                            <View style={styles.contenedorVacio}>
                                <MaterialCommunityIcons name="calendar-blank-multiple" size={48} color="#bbb" />
                                <Text style={styles.textoVacio}>Tu cuadrilla aún no tiene planes.</Text>
                                <Text style={styles.subTextoVacio}>
                                    Ve a la pestaña de "Eventos" y pulsa en el icono de grupo de cualquier acto para añadirlo a la agenda.
                                </Text>
                            </View>
                        }
                    />
                </View>
            ) : (
                // --- VISTA CREACIÓN / UNIÓN A GRUPO ---
                <ScrollView contentContainerStyle={styles.setupContainer}>
                    <View style={styles.logoContenedor}>
                        <Avatar.Icon icon="account-group" size={72} backgroundColor={COLORS.primary} color="#ffffff" style={styles.logoSetup} />
                        <Text style={styles.setupTitulo}>¿Listo para planificar con amigos?</Text>
                        <Text style={styles.setupSubtitulo}>
                            Crea un grupo único para tu cuadrilla o únete a uno que ya haya sido creado por tus amigos.
                        </Text>
                    </View>

                    {/* Formulario Crear Cuadrilla */}
                    <Card style={styles.setupCard}>
                        <Card.Content>
                            <Text style={styles.setupCardTitulo}>Crear Nueva Cuadrilla</Text>
                            <Text style={styles.setupCardInfo}>
                                Genera un código de acceso único que podrás compartir con tus amigos para unirse.
                            </Text>
                            <TextInput
                                mode="outlined"
                                label="Nombre de tu cuadrilla"
                                placeholder="Ej: Los Pamplonicas, Cuadrilla San Fermín..."
                                value={nombreNuevaCuadrilla}
                                onChangeText={setNombreNuevaCuadrilla}
                                disabled={creandoGrupo || uniendoGrupo}
                                outlineColor="#ccc"
                                activeOutlineColor={COLORS.primary}
                                style={styles.setupInput}
                            />
                            <Button
                                mode="contained"
                                onPress={gestionarCrearCuadrilla}
                                loading={creandoGrupo}
                                disabled={creandoGrupo || uniendoGrupo}
                                buttonColor={COLORS.primary}
                                icon="account-multiple-plus"
                                style={styles.setupBoton}
                            >
                                Crear Cuadrilla
                            </Button>
                        </Card.Content>
                    </Card>

                    {/* Formulario Unirse a Cuadrilla */}
                    <Card style={styles.setupCard}>
                        <Card.Content>
                            <Text style={styles.setupCardTitulo}>Unirse a una Cuadrilla</Text>
                            <Text style={styles.setupCardInfo}>
                                Introduce el código único de 6 caracteres compartido por un amigo de tu cuadrilla.
                            </Text>
                            <TextInput
                                mode="outlined"
                                label="Código único"
                                placeholder="Ej: SFK87A"
                                value={codigoEntrada}
                                onChangeText={setCodigoEntrada}
                                autoCapitalize="characters"
                                maxLength={6}
                                disabled={creandoGrupo || uniendoGrupo}
                                outlineColor="#ccc"
                                activeOutlineColor={COLORS.primary}
                                style={styles.setupInput}
                            />
                            <Button
                                mode="contained"
                                onPress={gestionarUnirseCuadrilla}
                                loading={uniendoGrupo}
                                disabled={creandoGrupo || uniendoGrupo}
                                buttonColor="#495057"
                                icon="login"
                                style={styles.setupBoton}
                            >
                                Unirse al grupo
                            </Button>
                        </Card.Content>
                    </Card>
                </ScrollView>
            )}

            {/* Modal para Crear/Unirse a una Cuadrilla adicional */}
            <Modal
                visible={modalNuevoGrupoVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalNuevoGrupoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setModalNuevoGrupoVisible(false)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.barraArrastreModal} />
                        <Text style={styles.modalTitulo}>Añadir Nueva Cuadrilla</Text>

                        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                            {/* Formulario Crear */}
                            <Text style={[styles.setupCardTitulo, { marginTop: 10 }]}>Crear Nueva Cuadrilla</Text>
                            <TextInput
                                mode="outlined"
                                label="Nombre de tu cuadrilla"
                                placeholder="Ej: Los Pamplonicas, Cuadrilla..."
                                value={nombreNuevaCuadrilla}
                                onChangeText={setNombreNuevaCuadrilla}
                                disabled={creandoGrupo || uniendoGrupo}
                                outlineColor="#ccc"
                                activeOutlineColor={COLORS.primary}
                                style={styles.setupInput}
                            />
                            <Button
                                mode="contained"
                                onPress={gestionarCrearCuadrilla}
                                loading={creandoGrupo}
                                disabled={creandoGrupo || uniendoGrupo}
                                buttonColor={COLORS.primary}
                                icon="account-multiple-plus"
                                style={[styles.setupBoton, { marginBottom: 15 }]}
                            >
                                Crear Cuadrilla
                            </Button>

                            <Divider style={{ marginVertical: 12, backgroundColor: '#e0e0e0' }} />

                            {/* Formulario Unirse */}
                            <Text style={styles.setupCardTitulo}>Unirse a una Cuadrilla</Text>
                            <TextInput
                                mode="outlined"
                                label="Código único"
                                placeholder="Ej: SFK87A"
                                value={codigoEntrada}
                                onChangeText={setCodigoEntrada}
                                autoCapitalize="characters"
                                maxLength={6}
                                disabled={creandoGrupo || uniendoGrupo}
                                outlineColor="#ccc"
                                activeOutlineColor={COLORS.primary}
                                style={styles.setupInput}
                            />
                            <Button
                                mode="contained"
                                onPress={gestionarUnirseCuadrilla}
                                loading={uniendoGrupo}
                                disabled={creandoGrupo || uniendoGrupo}
                                buttonColor="#495057"
                                icon="login"
                                style={styles.setupBoton}
                            >
                                Unirse al grupo
                            </Button>
                        </ScrollView>

                        <Button
                            mode="outlined"
                            onPress={() => setModalNuevoGrupoVisible(false)}
                            style={{ marginTop: 15, borderRadius: 10 }}
                            textColor="#666"
                        >
                            Cancelar
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

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
        marginBottom: 10,
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
    },

    // setup (Creación/Unión)
    setupContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    logoContenedor: {
        alignItems: 'center',
        marginVertical: 15,
    },
    logoSetup: {
        marginBottom: 12,
        elevation: 4,
    },
    setupTitulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        textAlign: 'center',
    },
    setupSubtitulo: {
        fontSize: 12.5,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
        paddingHorizontal: 15,
    },
    setupCard: {
        marginBottom: 18,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    setupCardTitulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 4,
    },
    setupCardInfo: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 12,
    },
    setupInput: {
        marginBottom: 12,
        backgroundColor: '#ffffff',
    },
    setupBoton: {
        borderRadius: 10,
    },

    // Grupo Activo
    tarjetaInfoGrupo: {
        marginHorizontal: 15,
        marginTop: 5,
        marginBottom: 12,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    filaInfoGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
        paddingBottom: 10,
    },
    nombreGrupoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    contenedorCodigoGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    codigoEtiqueta: {
        fontSize: 12,
        color: '#6c757d',
    },
    codigoMonospace: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        fontWeight: 'bold',
        color: '#B21E29',
        letterSpacing: 1,
        backgroundColor: '#fbebeb',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    miembrosTituloSecundario: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#495057',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contenedorMiembrosChips: {
        marginTop: 10,
    },
    chipMiembro: {
        marginRight: 6,
        height: 28,
        backgroundColor: '#f1f3f5',
        borderRadius: 14,
    },
    chipMiembroTexto: {
        fontSize: 11,
        color: '#495057',
    },
    agendaTituloSeccion: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#495057',
        marginLeft: 15,
        marginTop: 10,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listaPlanesContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },

    // Tarjeta Plan Agenda
    tarjetaPlan: {
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
    filaPlan: {
        flexDirection: 'row',
        alignItems: 'stretch',
        height: 105,
    },
    contenedorImagenPlan: {
        width: 130,
        backgroundColor: '#f1f3f5',
        position: 'relative',
    },
    imagenPlan: {
        width: '100%',
        height: '100%',
    },
    contenedorDetallesPlan: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    filaCabeceraPlan: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    textoCategoriaPlan: {
        fontSize: 9.5,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 0.6,
    },
    botonBorrarPlan: {
        padding: 4,
        margin: -4,
    },
    tituloPlan: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 4,
    },
    filaMetaPlan: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    textoMetaPlan: {
        fontSize: 11,
        color: '#6c757d',
        marginLeft: 3,
    },
    contenedorNotaPlan: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#FFE082',
    },
    textoNotaPlan: {
        fontSize: 12,
        color: '#F57C00',
        fontStyle: 'italic',
        flex: 1,
    },
    filaFooterPlan: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fafafa',
    },
    contenedorAsistentesList: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
        maxWidth: '70%',
    },
    textoAsistentesCount: {
        fontSize: 11.5,
        color: '#495057',
        flex: 1,
        flexShrink: 1,
    },
    botonAsistencia: {
        borderRadius: 8,
        minWidth: 100,
        flexShrink: 0,
        marginLeft: 8,
    },

    // Vacío
    contenedorVacio: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 45,
        paddingHorizontal: 20,
    },
    textoVacio: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#495057',
        marginTop: 12,
    },
    subTextoVacio: {
        fontSize: 12,
        color: '#888888',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
        paddingHorizontal: 15,
    },
    contenedorNombreGrupoDetalle: {
        marginBottom: 2,
    },
    contenedorPestanasGrupos: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingVertical: 10,
    },
    scrollPestanas: {
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    pestanaGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#ffffff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    pestanaGrupoActiva: {
        backgroundColor: '#B21E29',
    },
    pestanaGrupoInactiva: {
        backgroundColor: '#f1f3f5',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    pestanaAnadirGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#fbebeb',
        borderWidth: 1,
        borderColor: '#F8D7DA',
        borderStyle: 'dashed',
    },
    textoPestana: {
        fontSize: 12.5,
        fontWeight: 'bold',
    },
    textoPestanaActivo: {
        color: '#ffffff',
    },
    textoPestanaInactivo: {
        color: '#495057',
    },
    textoAnadirGrupo: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#B21E29',
        marginLeft: 4,
    },
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
        textAlign: 'center',
    },
    contenedorChips: {
        paddingVertical: 10,
        paddingLeft: 15,
        marginBottom: 8,
    },
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
});
