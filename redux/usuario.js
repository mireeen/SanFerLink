// REDUCER DE USUARIO

import * as ActionTypes from './ActionTypes';

const initialState = {
    userId: 'SanFerUser_' + Math.floor(Math.random() * 1000), // Genera un ID dinámico para la demo
    estado: 'offline' // Cambiará a 'connected' con la Realtime Database
};

export const usuario = (state = initialState, action) => {
    switch (action.type) {
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