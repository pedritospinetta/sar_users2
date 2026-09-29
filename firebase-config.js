import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfMdbhfzSwLc7Jjaf7JnjgtyK5R-RcGJg",
  authDomain: "sar-members.firebaseapp.com",
  projectId: "sar-members",
  storageBucket: "sar-members.firebasestorage.app",
  messagingSenderId: "482152974938",
  appId: "1:482152974938:web:0ad508f4bd750b8cc4a663",
  measurementId: "G-8PZJYXSDN1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export {
  app,
  auth,
  db
};
