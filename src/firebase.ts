import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Firebase Configuration
 * Environment variables are validated to ensure the app doesn't run without required keys.
 */
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Check if essential config is missing (Early return pattern)
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
        "Firebase Config Error: Required environment variables are missing. " +
        "Check your .env file."
    );
}

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Auth instance
 */
export const auth: Auth = getAuth(app);

/**
 * Firestore Database instance
 */
export const db: Firestore = getFirestore(app);

export default app;