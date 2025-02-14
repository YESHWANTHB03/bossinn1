import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-pRxNph8ECQEi2IzUWgPAq06fi-3wKK8",
  authDomain: "bossinn-7fbb9.firebaseapp.com",
  projectId: "bossinn-7fbb9",
  storageBucket: "bossinn-7fbb9.firebasestorage.app",
  messagingSenderId: "138358328390",
  appId: "1:138358328390:web:e04ab1e548d7c56e5fce47",
  measurementId: "G-8KRR5T7YJQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export authentication functions
export { auth, provider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword };
