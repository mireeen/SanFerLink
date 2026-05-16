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