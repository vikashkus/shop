import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDiO5sveiuGf3WaYZFomsAxciEQ1xDoFwQ",
    authDomain: "bansi-store.firebaseapp.com",
    projectId: "bansi-store",
    storageBucket: "bansi-store.firebasestorage.app",
    messagingSenderId: "521422296800",
    appId: "1:521422296800:web:adf0b7656642b656762285",
    measurementId: "G-M2ZKVGQM5G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
