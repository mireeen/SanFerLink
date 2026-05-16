import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

export const firebaseConfig = {
    apiKey: "AIzaSyBRWP1eMTlP5pFR2pOL1eN1XOAc4z8bGqQ",
    authDomain: "sanferlink-5a65c.firebaseapp.com",
    projectId: "sanferlink-5a65c",
    storageBucket: "sanferlink-5a65c.firebasestorage.app",
    messagingSenderId: "539998531895",
    appId: "1:539998531895:web:7ff1140c0fc273f55deab2",
    databaseURL: "https://sanferlink-5a65c-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);   //Para las alertas/incidencias
export const rtdb = getDatabase(app); //Para el estado "connected"