import * as ActionTypes from './ActionTypes';

export const eventos = (state = {
    isLoading: true,
    errMess: null,
    resultado: []
}, action) => {
    switch (action.type) {
        case ActionTypes.EVENTOS_LOADING:
            return { ...state, isLoading: true, errMess: null, resultado: [] };

        case ActionTypes.ADD_EVENTOS:
            return { ...state, isLoading: false, errMess: null, resultado: action.payload };

        case ActionTypes.EVENTOS_FAILED:
            return { ...state, isLoading: false, errMess: action.payload, resultado: [] };

        default:
            return state;
    }
};