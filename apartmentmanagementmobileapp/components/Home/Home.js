import { View, Text } from "react-native";
import MyStyles from "../../styles/MyStyles";
import React from "react";

const Home = () => {
    return (
        <View style={MyStyles.container}>
            <Text>Chào mừng bạn đã đăng nhập thành công!</Text>
        </View>
    );
};


export default Home;
