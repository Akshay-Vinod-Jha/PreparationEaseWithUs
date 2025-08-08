import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";
//got information from google-service-json
const firebaseConfig = {
  apiKey: "AIzaSyACWNlPrqXmSm5B0y93AoDn0Afd_hn0xNk", // Extracted from "api_key"
  authDomain: "prepase-9f5b8.firebaseapp.com", // Standard format
  projectId: "prepase-9f5b8", // Extracted from "project_info.project_id"
  storageBucket: "prepase-9f5b8.appspot.com", // Corrected from "storage_bucket"
  messagingSenderId: "1035444013770", // Extracted from "project_number"
  appId: "1:1035444013770:android:b36df513c205419ae18233", // Extracted from "mobilesdk_app_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, setDoc, doc, getDoc, collection, getDocs };
