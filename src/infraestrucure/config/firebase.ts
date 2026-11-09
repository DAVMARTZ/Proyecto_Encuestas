import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import envs from "./environment-vars";

// Para validar los tokens de los usuarios solo se necesita el ID del proyecto
const firebaseApp = initializeApp({ projectId: envs.FIREBASE_PROJECT_ID });

export const firebaseAuth = getAuth(firebaseApp);
