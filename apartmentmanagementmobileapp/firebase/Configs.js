import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration object
export const firebaseConfig = {
    apiKey: "AIzaSyBAPZZ3Q3_a8aaaFmftELJ0na2ipuVbtp4",
    authDomain: "apartmentschat.firebaseapp.com",
    databaseURL: "https://apartmentschat-default-rtdb.firebaseio.com",
    projectId: "apartmentschat",
    storageBucket: "apartmentschat.firebasestorage.app",
    messagingSenderId: "31859761121",
    appId: "1:31859761121:web:2e691e66ab9462bf443ca0",
    measurementId: "G-5PV3802RYQ"
};

// Khởi tạo Firebase một lần duy nhất
const app = initializeApp(firebaseConfig);

// Khởi tạo database
const database = getDatabase(app);

// Export database
export { database };