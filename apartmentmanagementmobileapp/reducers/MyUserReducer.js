import AsyncStorage from "@react-native-async-storage/async-storage";

export default async (current, action) => {
    switch (action.type) {
        case "login":
            return { user: action.payload };
        case "logout":
            await AsyncStorage.removeItem("token");
            return {user: null};
    }

    return current;
}