import * as ActionTypes from './ActionTypes';
import { db, firebaseConfig } from '../comun/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


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

// --- THUNK 1: DESCARGAR ALERTAS (Para pintar en el mapa) ---
export const fetchAlertas = () => (dispatch) => {
    dispatch(alertasLoading());

    return fetch(`${baseUrlDb}alertas.json`)
        .then(response => {
            if (response.ok) return response;
            throw new Error('Error ' + response.status + ': ' + response.statusText);
        }, error => { throw new Error(error.message); })
        .then(response => response.json())
        .then(alertasJson => {
            // Como Firebase devuelve un objeto de objetos, lo transformamos a un Array clásico para el mapa
            const arrayAlertas = [];
            if (alertasJson) {
                Object.keys(alertasJson).forEach(key => {
                    arrayAlertas.push({ ...alertasJson[key], id: key });
                });
            }
            dispatch(addAlertas(arrayAlertas));
        })
        .catch(error => dispatch(alertasFailed(error.message)));
};

// --- THUNK 2: SUBIR UNA NUEVA ALERTA (Desde el formulario de reportar) ---
// Variant for RTDB: `postAlertaRTDB` accepts latitud/longitud and userId
export const postAlertaRTDB = (tipo, descripcion, latitud, longitud, userId) => (dispatch) => {
    const nuevaAlerta = {
        tipo,
        descripcion,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        userId, // Guardamos el UID del usuario que ha reportado la incidencia
        timestamp: new Date().toISOString()
    };

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
        dispatch(addNuevaAlertaLocal(alertaFinal));
    })
    .catch(error => {
        console.log('Error al reportar en Firebase:', error.message);
        // Lanzamos el error hacia arriba para que el 'catch' de la pantalla se entere y muestre el Alert.alert de fallo
        throw error; 
    });
};

// 🔥 THUNK C: ACTUALIZAR PRESENCIA (APPSTATE) 🔥
export const actualizarPresencia = (userId, estado) => (dispatch) => {
    const datosPresencia = {
        estado: estado, // 'online' o 'offline'
        ultimoAcceso: new Date().toISOString()
    };

    // Apuntamos al nodo /presencia/userId.json usando un PUT para machacar el estado previo
    return fetch(`${firebaseConfig.databaseURL}presencia/${userId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPresencia)
    })
    .catch(error => console.log('Error enviando presencia:', error.message));
};