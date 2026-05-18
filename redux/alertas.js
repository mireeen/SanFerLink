import * as ActionTypes from './ActionTypes';

export const alertas = (state = { 
    isLoading: true,
    errMess: null,
    alertas: [] 
}, action) => {
    switch (action.type) {
        case ActionTypes.ADD_ALERTAS:
            return { ...state, isLoading: false, errMess: null, alertas: action.payload };

        case ActionTypes.ALERTAS_LOADING:
            return { ...state, isLoading: true, errMess: null, alertas: [] };

        case ActionTypes.ALERTAS_FAILED:
            return { ...state, isLoading: false, errMess: action.payload };

        case ActionTypes.ADD_NUEVA_ALERTA_LOCAL:
            // Añade la alerta recién creada por el usuario al array local para que aparezca al instante
            return { ...state, alertas: state.alertas.concat(action.payload) };

        default:
            return state;
    }
};