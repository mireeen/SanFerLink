import * as ActionTypes from './ActionTypes';
import { db } from '../comun/firebase';
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