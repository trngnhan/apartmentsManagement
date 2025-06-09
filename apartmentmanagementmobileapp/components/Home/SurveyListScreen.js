import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Card, Title, Paragraph, Button, RadioButton, Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { endpoints, authApis } from "../../configs/Apis";

const SurveyListScreen = () => {
    const [surveys, setSurveys] = useState([]);
    const [responses, setResponses] = useState({});
    const [submittedSurveyIds, setSubmittedSurveyIds] = useState(new Set());
    const [token, setToken] = useState("");

    const fetchSurveys = async (tokenParam) => {
        try {
            const api = authApis(tokenParam);
            const res = await api.get(endpoints.surveys || "/surveys/");
            if (res.status === 200) {
                setSurveys(res.data);
            } else {
                Alert.alert("Lỗi", "Không thể tải danh sách khảo sát.");
            }
        } catch (err) {
            console.error("Lỗi fetch surveys:", err);
        }
    };

    // Gọi API phản hồi khảo sát của người dùng
    const fetchMyResponses = async (tokenParam) => {
        try {
            const api = authApis(tokenParam);
            const res = await api.get(endpoints.mySurveyResponses || "/surveyresponses/");
            if (res.status === 200) {
                const data = res.data;
                console.log("Phản hồi khảo sát:", data);
                const surveyIds = new Set(data.map((r) => r.survey));
                setSubmittedSurveyIds(surveyIds);

                const prefillResponses = {};
                data.forEach((r) => {
                    prefillResponses[r.survey] = r.option.toString();
                });
                setResponses(prefillResponses);
            } else {
                console.warn("Không thể lấy phản hồi của cư dân.");
            }
        } catch (err) {
            console.error("Lỗi fetch responses:", err);
        }
    };

    // Lấy token và fetch data
    useEffect(() => {
        const loadData = async () => {
            try {
                const savedToken = await AsyncStorage.getItem("token");
                if (savedToken) {
                    setToken(savedToken);
                    await fetchSurveys(savedToken);
                    await fetchMyResponses(savedToken);
                } else {
                    console.warn("Không tìm thấy token.");
                }
            } catch (err) {
                console.error("Lỗi khi lấy token:", err);
            }
        };

        loadData();
    }, []);

    // Gửi phản hồi
    const submitResponse = async (surveyId, optionId) => {
        try {
            // const res = await fetch("http://192.168.44.103:8000/surveyresponses/", {
            // const res = await fetch("http://192.168.44.106:8000/surveyresponses/", {
            // const res = await fetch("http://192.168.44.103:8000/surveyresponses/", {
            const res = await fetch("http://10.17.36.153:8000/surveyresponses/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ survey: surveyId, option: optionId }),
            });

            if (res.ok) {
                Alert.alert("Thành công", "Bạn đã phản hồi khảo sát.");
                setResponses((prev) => ({ ...prev, [surveyId]: optionId.toString() }));
                setSubmittedSurveyIds((prev) => new Set(prev).add(surveyId));
            } else {
                const error = await res.json();
                Alert.alert("Lỗi", error.detail || "Không thể gửi phản hồi.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Không thể gửi phản hồi.");
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Title style={MyStyles.text}>Danh sách khảo sát</Title>

            {surveys.map((survey) => {
                const isSubmitted = submittedSurveyIds.has(survey.id);

                return (
                    <Card key={survey.id} style={{ marginBottom: 16 }}>
                        <Card.Content>
                            <Title>{survey.title}</Title>
                            <Paragraph>{survey.description}</Paragraph>

                            {isSubmitted ? (
                                <Text style={{ marginTop: 8, fontStyle: "italic", color: "green" }}>
                                    Cư dân đã thực hiện khảo sát này.
                                </Text>
                            ) : (
                                <>
                                    <RadioButton.Group
                                        onValueChange={(value) =>
                                            setResponses((prev) => ({ ...prev, [survey.id]: value }))
                                        }
                                        value={responses[survey.id]}
                                    >
                                        {survey.options.map((opt) => (
                                            <View
                                                key={opt.id}
                                                style={{ flexDirection: "row", alignItems: "center" }}
                                            >
                                                <RadioButton value={opt.id.toString()} />
                                                <Text>{opt.option_text}</Text>
                                            </View>
                                        ))}
                                    </RadioButton.Group>

                                    <Button
                                        mode="contained"
                                        onPress={() => {
                                            if (!responses[survey.id]) {
                                                Alert.alert("Thông báo", "Vui lòng chọn một lựa chọn.");
                                            } else {
                                                submitResponse(
                                                    parseInt(survey.id),
                                                    parseInt(responses[survey.id])
                                                );
                                            }
                                        }}
                                        style={{ marginTop: 8 }}
                                    >
                                        Gửi phản hồi
                                    </Button>
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            })}
        </ScrollView>
    );
};

export default SurveyListScreen;
