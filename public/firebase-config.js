// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnfQSqfJSSQ6QBrYyF4rWUhCZmIAqGb90",
  authDomain: "clclc-24987.firebaseapp.com",
  projectId: "clclc-24987",
  storageBucket: "clclc-24987.firebasestorage.app",
  messagingSenderId: "266489305461",
  appId: "1:266489305461:web:2ce3fbdc212a61064d5b3c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firebase functions for evaluations
window.firebaseDB = {
  // Guardar evaluación en Firestore
  async guardarEvaluacion(evaluacionData) {
    try {
      const docRef = await addDoc(collection(db, 'evaluaciones'), {
        ...evaluacionData,
        fechaCreacion: new Date(),
        timestamp: Date.now()
      });
      console.log('Evaluación guardada en Firebase con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error guardando evaluación en Firebase:', error);
      throw error;
    }
  },

  // Cargar evaluaciones desde Firestore
  async cargarEvaluaciones(mes = null) {
    try {
      let q = collection(db, 'evaluaciones');
      
      if (mes) {
        q = query(q, where('mes', '==', mes), orderBy('fechaCreacion', 'desc'));
      } else {
        q = query(q, orderBy('fechaCreacion', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      const evaluaciones = [];
      
      querySnapshot.forEach((doc) => {
        evaluaciones.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`Cargadas ${evaluaciones.length} evaluaciones desde Firebase`);
      return evaluaciones;
    } catch (error) {
      console.error('Error cargando evaluaciones desde Firebase:', error);
      return [];
    }
  },

  // Verificar conexión a Firebase
  async verificarConexion() {
    try {
      const testCollection = collection(db, 'test');
      console.log('Conexión a Firebase establecida correctamente');
      return true;
    } catch (error) {
      console.error('Error conectando a Firebase:', error);
      return false;
    }
  }
};

console.log('Firebase configurado correctamente');
