import * as ActionTypes from './ActionTypes';
import { rtdb, db, firebaseConfig } from '../comun/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';


export const postAlerta = (tipo, descripcion, userId) => async (dispatch) => {
    dispatch(alertaRequest());

    try {
        await addDoc(collection(db, 'alertas'), {
            tipo: tipo,
            descripcion: descripcion,
            timestamp: serverTimestamp(),
            fiabilidad: 'Alta',
            userId: userId,
            ubicacion: { latitude: 42.8161, longitude: -1.6432 } // Coordenadas fijas por ahora
        });

        dispatch(alertaSuccess());
        return true;
    } catch (error) {
        dispatch(alertaFailed(error.message));
        throw error;
    }
};

// Acciones síncronas que cambian los estados de carga
export const alertaRequest = () => ({ type: ActionTypes.POST_ALERTA_REQUEST });
export const alertaSuccess = () => ({ type: ActionTypes.POST_ALERTA_SUCCESS });
export const alertaFailed = (errmess) => ({ type: ActionTypes.POST_ALERTA_FAILED, payload: errmess });


//AUTHENTICACIÓN DE USUARIOS
// --- ACCIONES PLANAS (Simples objetos) ---
export const usuarioLoginSolicitud = () => ({
    type: ActionTypes.USUARIO_LOGIN_SOLICITUD
});

export const usuarioLoginExito = (datosUsuario) => ({
    type: ActionTypes.USUARIO_LOGIN_EXITO,
    payload: datosUsuario
});

export const usuarioLoginFallo = (errmess) => ({
    type: ActionTypes.USUARIO_LOGIN_FALLO,
    payload: errmess
});

export const usuarioCerrarSesion = () => ({
    type: ActionTypes.USUARIO_CERRAR_SESION
});

// --- THUNK REAL CON FIREBASE HTTP POST ---
export const postRegistroFirebase = (correo, contrasena) => (dispatch) => {
    // 1. Avisamos al estado que empieza la carga (spinner ON)
    dispatch(usuarioLoginSolicitud());

    // Construimos la URL con vuestra API_KEY
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;

    // 2. Hacemos la petición HTTP POST tal cual pide la documentación
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: correo,
            password: contrasena,
            returnSecureToken: true
        })
    })
        .then(response => {
            if (response.ok) {
                return response;
            } else {
                // Si Firebase devuelve un error (ej: el email ya existe o contraseña muy corta)
                return response.json().then(errorData => {
                    // La API de Firebase suele devolver el código en error.message (ej: "EMAIL_EXISTS")
                    const mensajeError = errorData.error?.message || 'Error en el servidor de autenticación';
                    var error = new Error(mensajeError);
                    throw error;
                });
            }
        },
            error => {
                // Error de red (ej: el móvil no tiene internet)
                var errmess = new Error('No hay conexión a internet: ' + error.message);
                throw errmess;
            })
        .then(response => response.json())
        .then(data => {
            // Mapeamos la respuesta de Firebase a lo que vuestro Reducer espera.
            // Según tu tabla: 'localId' es el UID y 'email' es el correo.
            const datosUsuarioLogueado = {
                uid: data.localId,
                email: data.email,
                token: data.idToken // Por si lo necesitáis para el Realtime Database más adelante
            };

            // Guardamos el usuario en Redux y quitamos el estado de carga
            dispatch(usuarioLoginExito(datosUsuarioLogueado));
        })
        .catch(error => {
            // Si algo falla, disparamos la acción de fallo con el mensaje limpio
            dispatch(usuarioLoginFallo(error.message));
        });
};

// --- THUNK REAL DE INICIO DE SESIÓN (LOGIN) CON FIREBASE ---
export const postLoginFirebase = (correo, contrasena) => (dispatch) => {
    // 1. Avisamos al estado que empieza la carga (spinner ON)
    dispatch(usuarioLoginSolicitud());

    // Construimos la URL de inicio de sesión según la documentación de Firebase
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;

    // 2. Hacemos la petición HTTP POST
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: correo,
            password: contrasena,
            returnSecureToken: true
        })
    })
        .then(response => {
            if (response.ok) {
                return response;
            } else {
                // Si Firebase deniega el acceso (ej: contraseña incorrecta o el usuario no existe)
                return response.json().then(errorData => {
                    // Firebase devuelve códigos claros como "INVALID_PASSWORD" o "EMAIL_NOT_FOUND"
                    const mensajeError = errorData.error?.message || 'Error al iniciar sesión';
                    var error = new Error(mensajeError);
                    throw error;
                });
            }
        },
            error => {
                // Error físico de red (sin datos o wifi roto)
                var errmess = new Error('No hay conexión a internet: ' + error.message);
                throw errmess;
            })
        .then(response => response.json())
        .then(data => {
            // Mapeamos la respuesta del endpoint a nuestro objeto clásico de usuario
            const datosUsuarioLogueado = {
                uid: data.localId,
                email: data.email,
                token: data.idToken
            };

            // Guardamos el usuario en Redux y quitamos el cargando. 
            // Reutilizamos 'usuarioLoginExito' porque al Reducer le da igual si vino de login o registro
            dispatch(usuarioLoginExito(datosUsuarioLogueado));
        })
        .catch(error => {
            // Si hay error, disparamos el fallo para pintarlo en la interfaz
            dispatch(usuarioLoginFallo(error.message));
        });
};



const baseUrlDb = firebaseConfig.databaseURL; // Ej: "https://sanfermin-rtdb.firebaseio.com/"

// --- ACCIONES PLANAS ---
export const alertasLoading = () => ({ type: ActionTypes.ALERTAS_LOADING });
export const alertasFailed = (errmess) => ({ type: ActionTypes.ALERTAS_FAILED, payload: errmess });
export const addAlertas = (alertas) => ({ type: ActionTypes.ADD_ALERTAS, payload: alertas });
export const addNuevaAlertaLocal = (alerta) => ({ type: ActionTypes.ADD_NUEVA_ALERTA_LOCAL, payload: alerta });

// THUNK 1: FETCH ALERTAS REFACTORIZADO CON ALGORITMO DE FIABILIDAD EN TIEMPO REAL
export const fetchAlertas = () => (dispatch) => {
    dispatch(alertasLoading());

    // 1. Escuchamos el nodo global de la base de datos (raíz) para traer alertas, presencia y baños a la vez
    const dbRef = ref(rtdb);

    // 2. Activamos el escuchador 'onValue'. 
    // Cada vez que cambie algo en la base de datos, esta función se ejecuta sola automáticamente.
    onValue(dbRef, (snapshot) => {
        const dataJson = snapshot.val() || {};
        const alertasJson = dataJson.alertas || {};
        const presenciaJson = dataJson.presencia || {};
        const banosJson = dataJson.baños || dataJson.banos || {};
        const arrayAlertasCalculadas = [];
        const arrayBanosCalculados = [];

        // A. RECORREMOS CADA ALERTA GENERAL PARA APLICAR EL ALGORITMO
        Object.keys(alertasJson).forEach(key => {
            const alerta = alertasJson[key];
            const emisorId = alerta.userId;

            //Averiguamos si el creador está 'online', 'background' o si no existe ('offline')
            const estadoCreador = presenciaJson[emisorId]?.estado || 'offline';

            //Si alguien ha validado la alerta, el temporizador usa la hora del último voto.
            // Si nadie ha votado aún, usamos el timestamp de creación original.
            const horaReferenciaAlgoritmo = alerta.ultimoVotoTimestamp || alerta.timestamp;

            const tiempoReferencia = new Date(horaReferenciaAlgoritmo);
            const ahora = new Date();
            const diferenciaMinutos = (ahora - tiempoReferencia) / (1000 * 60);


            //Multiplicador de presencia: Si está offline/background, el tiempo "pesa" el doble (degradación rápida)
            const factorVelocidad = (estadoCreador === 'online') ? 1 : 2;
            const minutosVirtuales = diferenciaMinutos * factorVelocidad;

            //Clasificación de los niveles de fiabilidad basados en el tiempo
            let fiabilidadCalculada = 'Alta';

            if (minutosVirtuales > 15) {
                fiabilidadCalculada = 'Obsoleta'; //Eliminación automática
                
                // Eliminación física automática de Firebase Realtime Database
                const alertaRef = ref(rtdb, `alertas/${key}`);
                set(alertaRef, null).catch(err => 
                    console.log(`Error al limpiar alerta obsoleta ${key} de Firebase:`, err.message)
                );
            } else if (minutosVirtuales > 10) {
                fiabilidadCalculada = 'Baja';
            } else if (minutosVirtuales > 5) {
                fiabilidadCalculada = 'Media';
            }

            //Si no está obsoleta, la metemos en el mapa; si está obsoleta, se ignora
            if (fiabilidadCalculada !== 'Obsoleta') {
                arrayAlertasCalculadas.push({
                    ...alerta,
                    id: key,
                    fiabilidad: fiabilidadCalculada // Machacamos la fiabilidad con el cálculo del algoritmo
                });
            }
        });

        // B. RECORREMOS CADA BAÑO PARA APLICAR EL ALGORITMO A SU INCIDENCIA (SI TIENE)
        Object.keys(banosJson).forEach(banoId => {
            const bano = banosJson[banoId];
            let incidenciaCalculada = null;

            if (bano.incidencia) {
                const emisorId = bano.incidencia.userId;
                const estadoCreador = presenciaJson[emisorId]?.estado || 'offline';
                const horaReferenciaAlgoritmo = bano.incidencia.ultimoVotoTimestamp || bano.incidencia.timestamp;

                const tiempoReferencia = new Date(horaReferenciaAlgoritmo);
                const ahora = new Date();
                const diferenciaMinutos = (ahora - tiempoReferencia) / (1000 * 60);

                const factorVelocidad = (estadoCreador === 'online') ? 1 : 2;
                const minutosVirtuales = diferenciaMinutos * factorVelocidad;

                let fiabilidadCalculada = 'Alta';

                if (minutosVirtuales > 15) {
                    fiabilidadCalculada = 'Obsoleta';
                    // Limpieza física automática del nodo de incidencia en el baño
                    const banoIncidenciaRef = ref(rtdb, `baños/${banoId}/incidencia`);
                    set(banoIncidenciaRef, null).catch(err => 
                        console.log(`Error al limpiar incidencia obsoleta del baño ${banoId}:`, err.message)
                    );
                } else if (minutosVirtuales > 10) {
                    fiabilidadCalculada = 'Baja';
                } else if (minutosVirtuales > 5) {
                    fiabilidadCalculada = 'Media';
                }

                if (fiabilidadCalculada !== 'Obsoleta') {
                    incidenciaCalculada = {
                        ...bano.incidencia,
                        fiabilidad: fiabilidadCalculada
                    };
                }
            }

            arrayBanosCalculados.push({
                id: banoId,
                ...bano,
                incidencia: incidenciaCalculada
            });
        });

        // Despachamos las alertas y baños con la fiabilidad calculada en vivo al Store de Redux
        dispatch(addAlertas({ alertas: arrayAlertasCalculadas, banos: arrayBanosCalculados }));
    }, (error) => {
        dispatch(alertasFailed(error.message));
    });
};


// --- THUNK 2: SUBIR UNA NUEVA ALERTA (Desde el formulario de reportar) ---
// Variant for RTDB: `postAlertaRTDB` accepts latitud/longitud, userId and optionally calle
export const postAlertaRTDB = (tipo, descripcion, latitud, longitud, userId, calle) => (dispatch) => {
    const nuevaAlerta = {
        tipo,
        descripcion,
        userId, // Guardamos el UID del usuario que ha reportado la incidencia
        timestamp: new Date().toISOString()
    };

    if (latitud !== null && latitud !== undefined && longitud !== null && longitud !== undefined) {
        nuevaAlerta.latitud = parseFloat(latitud);
        nuevaAlerta.longitud = parseFloat(longitud);
    }

    if (calle) {
        nuevaAlerta.calle = calle;
    }

    // Hacemos un POST al nodo alertas.json usando la URL de vuestra base de datos
    return fetch(`${baseUrlDb}alertas.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaAlerta)
    })
        .then(response => {
            if (response.ok) return response;
            throw new Error('No se pudo guardar la alerta en el servidor');
        }, error => {
            // Captura si el servidor de Firebase está caído o el móvil no tiene internet
            throw new Error('Error de red: ' + error.message);
        })
        .then(response => response.json())
        .then(data => {
            // Firebase nos devuelve el ID generado automáticamente por ellos en la propiedad 'name'
            const alertaFinal = { ...nuevaAlerta, id: data.name };

            // Despachamos la acción local para que Redux meta el punto en el array al instante
            //dispatch(addNuevaAlertaLocal(alertaFinal));
            console.log('¡Alerta subida con éxito! El escuchador reactivo onValue la pintará ahora.');
        })
        .catch(error => {
            console.log('Error al reportar en Firebase:', error.message);
            // Lanzamos el error hacia arriba para que el 'catch' de la pantalla se entere y muestre el Alert.alert de fallo
            throw error;
        });
};

// THUNK C: ACTUALIZAR PRESENCIA (APPSTATE Y ONDISCONNECT)
export const actualizarPresencia = (userId, estado) => (dispatch) => {
    // 1. Creamos la referencia al nodo de presencia de este usuario en concreto
    const presenciaRef = ref(rtdb, `presencia/${userId}`);

    const datosPresencia = {
        estado: estado, // 'online' o 'offline'
        ultimoAcceso: new Date().toISOString()
    };

    // 2. CONFIGURACIÓN DEL CHECKPOINT: Le programamos la orden de emergencia al servidor
    if (estado === 'online') {
        // Le decimos a Firebase: "Si este usuario que se acaba de conectar se cae de la red,
        // machaca su nodo y ponlo en offline automáticamente con la hora del corte".
        onDisconnect(presenciaRef).set({
            estado: 'offline',
            ultimoAcceso: new Date().toISOString()
        });
    }

    // 3. Hacemos la actualización normal del estado actual utilizando 'set' nativo (más eficiente que fetch)
    return set(presenciaRef, datosPresencia)
        .catch(error => console.log('Error enviando presencia:', error.message));

    // Apuntamos al nodo /presencia/userId.json usando un PUT para machacar el estado previo
    /*return fetch(`${firebaseConfig.dataRL}presencia/${userId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPresencia)
    })
        .catch(error => console.log('Error enviando presencia:', error.message));*/
};

// THUNK D: VALIDAR INCIDENCIA ("SIGUE AHÍ")
export const validarIncidenciaRTDB = (alertaId) => (dispatch) => {
    // Generamos la marca de tiempo con la hora exacta del botón en formato ISO
    const horaVoto = new Date().toISOString();

    // Hacemos una petición HTTP PATCH para modificar SOLO el campo del timestamp de validación
    // sin borrar la descripción, el creador o el tipo original de la alerta.
    return fetch(`${baseUrlDb}alertas/${alertaId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ultimoVotoTimestamp: horaVoto
        })
    })
        .then(response => {
            if (response.ok) {
                console.log(`[Validación] Alerta ${alertaId} relanzada a Fiabilidad Alta con éxito.`);
                return response;
            }
            throw new Error('No se pudo registrar la validación');
        })
        .catch(error => console.log('Error al validar la incidencia:', error.message));
};

// THUNK E: SUBIR UNA NUEVA INCIDENCIA DE BAÑO (Almacenado directo bajo el baño correspondiente)
export const postIncidenciaBanoRTDB = (banoId, descripcion, userId) => (dispatch) => {
    const nuevaIncidencia = {
        tipo: 'Baño',
        descripcion: descripcion,
        userId: userId,
        timestamp: new Date().toISOString()
    };

    return fetch(`${baseUrlDb}baños/${banoId}/incidencia.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaIncidencia)
    })
        .then(response => {
            if (response.ok) {
                console.log(`[Incidencia Baño] Incidencia registrada con éxito en baño ${banoId}.`);
                return response;
            }
            throw new Error('No se pudo guardar la incidencia de baño en el servidor');
        })
        .then(response => response.json())
        .catch(error => {
            console.log('Error al reportar incidencia de baño:', error.message);
            throw error;
        });
};

// THUNK F: VALIDAR INCIDENCIA DE BAÑO ("SIGUE AHÍ")
export const validarIncidenciaBanoRTDB = (banoId) => (dispatch) => {
    const horaVoto = new Date().toISOString();

    return fetch(`${baseUrlDb}baños/${banoId}/incidencia.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ultimoVotoTimestamp: horaVoto
        })
    })
        .then(response => {
            if (response.ok) {
                console.log(`[Validación Baño] Incidencia en baño ${banoId} relanzada.`);
                return response;
            }
            throw new Error('No se pudo registrar la validación del baño');
        })
        .catch(error => console.log('Error al validar la incidencia del baño:', error.message));
};



// Asegúrate de usar la URL real de tu base de datos Firebase


export const eventosLoading = () => ({ type: ActionTypes.EVENTOS_LOADING });
export const eventosFailed = (errmess) => ({ type: ActionTypes.EVENTOS_FAILED, payload: errmess });
export const addEventos = (eventos) => ({ type: ActionTypes.ADD_EVENTOS, payload: eventos });

// 🔥 THUNK PARA DESCARGAR LOS EVENTOS DE SAN FERMÍN EN TIEMPO REAL CON FIABILIDAD 🔥
export const fetchEventos = () => (dispatch) => {
    dispatch(eventosLoading());

    const dbRef = ref(rtdb);
    
    // Escuchamos el nodo global para tener acceso a eventos y presencia para el cálculo de fiabilidad
    onValue(dbRef, (snapshot) => {
        const dataJson = snapshot.val() || {};
        const eventosJson = dataJson.eventos || {};
        const presenciaJson = dataJson.presencia || {};
        const arrayEventos = [];
        
        Object.keys(eventosJson).forEach(id => {
            const evento = eventosJson[id];
            let incidenciaCalculada = null;

            if (evento.incidencia) {
                const emisorId = evento.incidencia.userId;
                const estadoCreador = presenciaJson[emisorId]?.estado || 'offline';
                const horaReferenciaAlgoritmo = evento.incidencia.ultimoVotoTimestamp || evento.incidencia.timestamp;

                const tiempoReferencia = new Date(horaReferenciaAlgoritmo);
                const ahora = new Date();
                const diferenciaMinutos = (ahora - tiempoReferencia) / (1000 * 60);

                const factorVelocidad = (estadoCreador === 'online') ? 1 : 2;
                const minutosVirtuales = diferenciaMinutos * factorVelocidad;

                let fiabilidadCalculada = 'Alta';

                if (minutosVirtuales > 15) {
                    fiabilidadCalculada = 'Obsoleta';
                    // Limpieza automática de la incidencia en el evento
                    const eventoIncidenciaRef = ref(rtdb, `eventos/${id}/incidencia`);
                    set(eventoIncidenciaRef, null).catch(err => 
                        console.log(`Error al limpiar incidencia obsoleta del evento ${id}:`, err.message)
                    );
                } else if (minutosVirtuales > 10) {
                    fiabilidadCalculada = 'Baja';
                } else if (minutosVirtuales > 5) {
                    fiabilidadCalculada = 'Media';
                }

                if (fiabilidadCalculada !== 'Obsoleta') {
                    incidenciaCalculada = {
                        ...evento.incidencia,
                        fiabilidad: fiabilidadCalculada
                    };
                }
            }

            arrayEventos.push({
                id: id,
                ...evento,
                incidencia: incidenciaCalculada
            });
        });
        
        dispatch(addEventos(arrayEventos));
    }, (error) => {
        dispatch(eventosFailed(error.message));
    });
};

// THUNK G: SUBIR UNA NUEVA INCIDENCIA DE EVENTO (Almacenado directo bajo el evento correspondiente)
export const postIncidenciaEventoRTDB = (eventoId, descripcion, userId) => (dispatch) => {
    const nuevaIncidencia = {
        tipo: 'Evento',
        descripcion: descripcion,
        userId: userId,
        timestamp: new Date().toISOString()
    };

    return fetch(`${baseUrlDb}eventos/${eventoId}/incidencia.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaIncidencia)
    })
        .then(response => {
            if (response.ok) {
                console.log(`[Incidencia Evento] Incidencia registrada con éxito en evento ${eventoId}.`);
                return response;
            }
            throw new Error('No se pudo guardar la incidencia de evento en el servidor');
        })
        .then(response => response.json())
        .catch(error => {
            console.log('Error al reportar incidencia de evento:', error.message);
            throw error;
        });
};