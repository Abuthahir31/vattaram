import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDpQ9di-h_rv17djknnzQsE-9EXCpTJlIk",
  authDomain: "myeio-4b580.firebaseapp.com",
  projectId: "myeio-4b580",
  storageBucket: "myeio-4b580.firebasestorage.app",
  messagingSenderId: "873332102535",
  appId: "1:873332102535:web:61aaa784f8513ec7fd6f22",
  measurementId: "G-2J9Y7BMXDK"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider(); 

export { auth, googleProvider };