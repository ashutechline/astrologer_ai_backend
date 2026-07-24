const { initializeApp } = require('firebase/app');

// Note: getAnalytics requires a browser environment and will throw an error in Node.js.
// If you only need to run this in Node.js, analytics should be disabled.
// const { getAnalytics } = require('firebase/analytics');

const firebaseConfig = {
  apiKey: "AIzaSyD4wbN36znQpOvylVhaD9ntWMdoNQrvm5c",
  authDomain: "astrologyai-3dcc3.firebaseapp.com",
  projectId: "astrologyai-3dcc3",
  storageBucket: "astrologyai-3dcc3.firebasestorage.app",
  messagingSenderId: "422404783854",
  appId: "1:422404783854:web:1deacce61aea43cbb8fdff",
  measurementId: "G-K174G4RNXM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

module.exports = { app };
