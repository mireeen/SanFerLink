// REDUCER DE USUARIO

import * as ActionTypes from './ActionTypes';

const initialState = {
    userId: 'SanFerUser_' + Math.floor(Math.random() * 1000), // Genera un ID dinámico para la demo
    estado: 'offline', // Cambiará a 'connected' con la Realtime Database
    isLoading: false,
    errMess: null,
    datos: null,
    estaLogueado: false
};

export const usuario = (state = initialState, action) => {
    switch (action.type) {
         case ActionTypes.USUARIO_LOGIN_SOLICITUD:
            return { ...state, isLoading: true, errMess: null, datos: null, estaLogueado: false };

        case ActionTypes.USUARIO_LOGIN_EXITO:
            return { ...state, isLoading: false, errMess: null, datos: action.payload, estaLogueado: true };

        case ActionTypes.USUARIO_LOGIN_FALLO:
            return { ...state, isLoading: false, errMess: action.payload, datos: null, estaLogueado: false };

        case ActionTypes.USUARIO_CERRAR_SESION:
            return { ...state, isLoading: false, errMess: null, datos: null, estaLogueado: false };

        case ActionTypes.SET_USUARIO:
            return {
                ...state,
                userId: action.payload.userId,
                estado: action.payload.estado
            };
        default:
            return state;
    }
};


