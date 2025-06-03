import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration object
const firebaseConfig1 = {
    apiKey: "AIzaSyBAPZZ3Q3_a8aaaFmftELJ0na2ipuVbtp4",
    authDomain: "apartmentschat.firebaseapp.com",
    databaseURL: "https://apartmentschat-default-rtdb.firebaseio.com",
    projectId: "apartmentschat",
    storageBucket: "apartmentschat.firebasestorage.app",
    messagingSenderId: "31859761121",
    appId: "1:31859761121:web:2e691e66ab9462bf443ca0",
    measurementId: "G-5PV3802RYQ"
};

const firebaseConfig2 = {
    apiKey: "AIzaSyDdy2oeoK0vm2M30lHT5RQ46EwP2rR3loo",
    authDomain: "apartmentlocker.firebaseapp.com",
    databaseURL: "https://apartmentlocker-default-rtdb.firebaseio.com",
    projectId: "apartmentlocker",
    storageBucket: "apartmentlocker.firebasestorage.app",
    messagingSenderId: "430007039203",
    appId: "1:430007039203:web:d3a0cc058e75760a7881d6",
    measurementId: "G-MF2FVBF9PX"
};

let app1;
if (!getApps().find(app => app.name === "[DEFAULT]")) {
    app1 = initializeApp(firebaseConfig1);
} else {
    app1 = getApp();
}

// Khởi tạo app 2 với tên khác
let app2;
if (!getApps().find(app => app.name === "SECOND_DB")) {
    app2 = initializeApp(firebaseConfig2, "SECOND_DB");
} else {
    app2 = getApp("SECOND_DB");
}

// Khởi tạo 2 database
const database1 = getDatabase(app1);
const database2 = getDatabase(app2);

// Export database
export { database1, database2 };