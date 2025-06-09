import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// const BASE_URL = "https://trngnhan.pythonanywhere.com/";
const BASE_URL = "http://192.168.44.106:8000/";
// const BASE_URL = "http://192.168.44.103:8000/";

export const endpoints = {
    login: "/o/token/",

    users: "/users/",
    admin: "/users/admins/",
    userLock: (id) => `/users/${id}/`,

    "current-user": "/users/current-user/",
    unregisteredUsers: "/users/unregistered-users/",

    apartments: "/apartments/",
    transfer: (id) => `/apartments/${id}/transfer/`,
    residentsWithoutApartment: "/apartments/resident-without-apartment/",
    apartmentTransferHistories: "/apartmentstranshistories/",
    
    residents: "/residents/",

    feedbacks: "/feedbacks/",
    myFeedbacks: "/feedbacks/my-feedbacks/",

    surveys: "/surveys/",
    surveyResponses: "/surveyresponses/",
    mySurveyResponses: "/surveyresponses/my-responses/",

    countResident: "/residents/count-resident/",
    totalApartments: "/apartments/total-apartments/",

    lockers: "/parcellockers/",
    unregisteredResidentsLocker: "/parcellockers/resident-without-locker/",

    lockerItems: (lockerId) => `/parcellockers/${lockerId}/items/`,
    addLockerItem: (lockerId) => `/parcellockers/${lockerId}/add-item/`,

    updateLockerItemStatus: (lockerId) => `/parcellockers/${lockerId}/update-item-status/`,
    visitorVehicleRegistrations: "/visitorvehicleregistrations/",
    approveVisitorVehicleRegistration: (id) => `/visitorvehicleregistrations/${id}/set-approval/`,

    paymentCategories: "/paymentcategories/",
    paymentCategoryLock: (id) => `/paymentcategories/${id}/`,
    paymentsTransactions: "/paymenttransactions/",
    updatePaymentStatus: (id) => `/paymenttransactions/${id}/update-payment/`,

    surveys: "/surveys/",
    surveyOptions: "/surveyoptions/",
    surveyResponses: (surveyId) => `/surveys/${surveyId}/get-responses/`,

    myVehicleRegistrations: "/visitorvehicleregistrations/my-registrations/",
    getApartment: "/apartments/get-apartment/",
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
