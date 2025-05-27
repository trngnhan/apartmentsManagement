import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Avatar, Card } from "react-native-paper";

const AdminChatScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Giả lập danh sách cư dân
  useEffect(() => {
    const loadResidents = async () => {
      try {
        setLoading(true);
        // Giả lập delay lấy dữ liệu từ server
        await new Promise((r) => setTimeout(r, 1000));

        // Dữ liệu mock (bạn thay bằng API thật sau)
        const data = [
          { id: "1", name: "Nguyễn Văn A", avatarUrl: "https://i.pravatar.cc/150?img=1", email: "a@example.com" },
          { id: "2", name: "Trần Thị B", avatarUrl: "https://i.pravatar.cc/150?img=2", email: "b@example.com" },
          { id: "3", name: "Lê Văn C", avatarUrl: "https://i.pravatar.cc/150?img=3", email: "c@example.com" },
        ];

        setResidents(data);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải danh sách cư dân: " + err.message);
        setLoading(false);
      }
    };

    loadResidents();
  }, []);

  // Tạo hoặc lấy room chat đơn giản
  const getOrCreateChatRoom = (adminId, residentId) => {
    // Trong thực tế bạn sẽ gọi API backend tạo hoặc lấy room chat
    // Ở đây mình sẽ tạo id phòng chat cố định kiểu "adminId_residentId"
    return Promise.resolve(`${adminId}_${residentId}`);
  };

  const navigateToChatWithResident = async (resident) => {
    try {
      const roomId = await getOrCreateChatRoom(user.id, resident.id);
      navigation.navigate("Chat", {
        roomId,
        candidateId: resident.id,
        candidateName: resident.name,
        candidateAvatar: resident.avatarUrl,
      });
    } catch (err) {
      alert("Không thể mở cuộc trò chuyện: " + err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Đang tải danh sách cư dân...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  if (residents.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>Chưa có cư dân nào để chat</Text>
      </View>
    );
  }

  const renderResidentItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigateToChatWithResident(item)}>
      <Card style={styles.chatCard}>
        <Card.Content style={styles.chatCardContent}>
          <Avatar.Image source={{ uri: item.avatarUrl || "https://via.placeholder.com/150" }} size={50} />
          <View style={styles.chatInfo}>
            <Text style={styles.residentName}>{item.name}</Text>
            <Text style={styles.residentEmail}>{item.email || ""}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={residents}
      renderItem={renderResidentItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  chatCard: {
    marginBottom: 10,
    elevation: 1,
  },
  chatCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatInfo: {
    marginLeft: 15,
    flex: 1,
  },
  residentName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  residentEmail: {
    fontSize: 14,
    color: "#757575",
  },
});

export default AdminChatScreen;
