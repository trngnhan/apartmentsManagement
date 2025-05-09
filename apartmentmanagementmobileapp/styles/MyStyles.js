import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
      },
      m: {
        marginVertical: 8,
        marginHorizontal: 16,
      },
      center: {
        justifyContent: "center",
        alignItems: "center",
      },
      input: {
        marginVertical: 10,
      },
      button: {
        backgroundColor: "#FF6F61", // Màu nền nút
        borderRadius: 15, // Bo góc
        paddingVertical: 2, // Khoảng cách trên dưới
        width: 350,
        alignSelf: "center", // Căn giữa
        elevation: 5, // Đổ bóng
        marginTop: 20, // Khoảng cách phía trên
      },
      errorText: {
        color: "red",
        marginVertical: 4,
      },
      text: {
        fontSize: 20,
        fontWeight: "bold",
      },
      padding: {
        padding: 10
      },
      background: {
        backgroundColor: "red"
      },
      title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
      },
      header: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
      },
      input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginVertical: 10,
        borderRadius: 5,
        width: "100%",
      },
      button: {
        backgroundColor: "#007BFF",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        width: "100%",
      },
      scrollView: {
        width: "80%"
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 10,
      },
      card: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 5, // Hiệu ứng shadow trên Android
        shadowColor: "#000", // Màu shadow trên iOS
        shadowOffset: { width: 0, height: 2 }, // Độ lệch shadow trên iOS
        shadowOpacity: 0.2, // Độ mờ của shadow trên iOS
        shadowRadius: 5, // Bán kính của shadow trên iOS
      },
      textSmall: {
        fontSize: 10,
        marginBottom: 5,
      },
      image: {
        width: 60, // Chiều rộng hình ảnh
        height: 60, // Chiều cao hình ảnh
        alignSelf: "center", // Căn giữa hình ảnh
        marginTop: 20, // Khoảng cách phía trên
        borderRadius: 10, // Bo góc hình ảnh
      },
      imageContainer: {
        alignItems: "center",
      },
      error: {
        fontSize: 16,
        color: "red",
        textAlign: "center",
      },
      description: {
        fontSize: 14,
        color: "#555",
        marginBottom: 5,
      },
      date: {
          fontSize: 12,
          color: "#999",
      },
      noData: {
        fontSize: 16,
        textAlign: "center",
        color: "#999",
      },
      optionsHeader: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#333",
      },
      option: {
          fontSize: 14,
          color: "#555",
      },
      resident: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
      },
      response: {
          fontSize: 14,
          color: "#555",
      },
      modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      modalContent: {
          width: "90%",
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 10,
          elevation: 5,
      },
      modalTitle: {
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 15,
          textAlign: "center",
      },
});

