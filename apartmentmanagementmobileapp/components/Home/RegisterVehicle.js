import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { endpoints, authApis } from "../../configs/Apis";

const RegisterVehicle = ({ navigation }) => {
    const [visitorName, setVisitorName] = useState(""); 
    const [vehicleNumber, setVehicleNumber] = useState(""); 
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!visitorName || !vehicleNumber) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const userData = await AsyncStorage.getItem("user");

            if (!userData) {
                Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
                return;
            }

            const user = JSON.parse(userData);
            const api = authApis(token);

            const res = await api.post(endpoints.visitorVehicleRegistrations, {
                resident: user.resident_id,
                resident_email: user.email,
                visitor_name: visitorName,
                vehicle_number: vehicleNumber,
            });

            if (res.status === 201 || res.status === 200) {
                Alert.alert("Thành công", "Đăng ký xe thành công.");
                navigation.goBack();
            } else {
                console.error("Lỗi khi gọi API:", res.data);
                Alert.alert("Lỗi", res.data.detail || "Đăng ký xe thất bại.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']} 
            style={{ flex: 1 }}
        >
            <View style={[styles.container]}>
            <Text style={[styles.title]}>Đăng ký xe cho người thân</Text>
            <Text style={{ marginBottom: 5, fontSize: 16 }}>
                <Text style={{ fontWeight: "bold" }}>Lưu ý:</Text> 
                {"\n"}- Đăng ký xe cho người thân trong gia đình.
                {"\n"}- Không đăng ký xe cho người ngoài.
                {"\n"}- Không đăng ký xe cho người không có giấy tờ tùy thân.
                {"\n"}- Không đăng ký xe cho người không có giấy tờ xe.
                {"\n"}- Không đăng ký xe cho người không có giấy tờ chứng minh quan hệ với người thân.
                {"\n"}- Chỉ chấp nhận các loại xe được pháp luật cho phép lưu hành.
                {"\n"}- Người thân của cư dân có đăng ký trước với Ban quản lý.
            </Text>
            <Text style={{ marginBottom: 10, fontSize: 16 }}>
                Nhập thông tin xe của người thân để đăng ký.
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Tên khách"
                value={visitorName}
                onChangeText={setVisitorName}
            />
            <TextInput
                style={styles.input}
                placeholder="Biển số xe"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
            />
            <Button
                title={loading ? "Đang xử lý..." : "Đăng ký"}
                onPress={handleRegister}
                disabled={loading}
            />
        </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
    },
});

export default RegisterVehicle;