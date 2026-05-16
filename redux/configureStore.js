import { configureStore } from '@reduxjs/toolkit';
import { usuario } from './usuario';

export const ConfigureStore = () => {
    const store = configureStore({
        reducer: {
            usuario: usuario
            //Aquí añadiremos más reducers en el futuro
        }
    });
    return store;
};