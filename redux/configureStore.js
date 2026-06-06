import { configureStore } from '@reduxjs/toolkit';
import { usuario } from './usuario';
import { alertas } from './alertas';
import {eventos} from './eventos';

export const ConfigureStore = () => {
    const store = configureStore({
        reducer: {
            usuario: usuario,
            alertas: alertas,
            eventos: eventos,
        }
    });
    return store;
};