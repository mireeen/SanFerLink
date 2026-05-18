import { configureStore } from '@reduxjs/toolkit';
import { usuario } from './usuario';
import { alertas } from './alertas';

export const ConfigureStore = () => {
    const store = configureStore({
        reducer: {
            usuario: usuario,
            alertas: alertas,
        }
    });
    return store;
};