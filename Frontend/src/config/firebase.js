// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "lume-ad7ee.firebaseapp.com",
  projectId: "lume-ad7ee",
  storageBucket: "lume-ad7ee.firebasestorage.app",
  messagingSenderId: "546891420283",
  appId: "1:546891420283:web:68ed607aa2b1a0b867c8de",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, auth, provider };
