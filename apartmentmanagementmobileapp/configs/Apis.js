import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// const BASE_URL = "https://trngnhan.pythonanywhere.com/";
// const BASE_URL = "http://192.168.44.101:8000/";
const BASE_URL = "http://192.168.44.103:8000/";

export const endpoints = {
    login: "/o/token/",
    "current-user": "/users/current-user/",
    apartments: "/apartments/",
    transfer: (id) => `/apartments/${id}/transfer/`,
    residentsWithoutApartment: "/apartments/resident-without-apartment/",
};

// Hàm tạo instance của axios với token
export const authApis = (token) => {
    if (!token) {
        throw new Error("Token is required");
    }

    return axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export default axios.create({
    baseURL: BASE_URL,
});
