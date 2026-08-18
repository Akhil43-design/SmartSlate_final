/* Shared Firebase Configuration & Client Initialization */

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDummyKeyForSmartSlate2026",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "smartslate-app.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "smartslate-app",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "smartslate-app.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "100000000000",
    appId: process.env.FIREBASE_APP_ID || "1:100000000000:web:dummyappid2026"
};

module.exports = { firebaseConfig };
