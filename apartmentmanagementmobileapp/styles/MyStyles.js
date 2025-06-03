import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
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
      titlee: {
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        alignSelf: "center",
        width: "100%",
      },
      header: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
      },
      input: {
        borderWidth: 1,
        borderColor: "#fff",
        marginVertical: 10,
        borderRadius: 5,
        width: "100%",
      },
      button: {
        backgroundColor: "#007BFF",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
        width: "100%",
      },
      createButton: {
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginVertical: 10,
      },
      createButtonn: {
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
      },
      createButtonText: {
          color: "#fff",
          fontWeight: "bold",
          fontSize: 16,
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
      cardd: {
        backgroundColor: "#f9f9f9",
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
        marginTop: 5,
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
      modalButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
      },
      modalOverlay: {
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(192, 181, 181, 0)", // Làm mờ nền
      },
      name: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
      },
      email: {
          fontSize: 14,
          color: "#555",
      },
      role: {
          fontSize: 14,
          color: "#555",
      },
      containerr: {
        flex: 1,
        padding: 20,
      },
      buttonText: {
        color: "#000",
        fontWeight: "bold",
      },
      buttonn: {
        padding: 10,
        borderRadius: 7,
        alignItems: "center",
        marginTop: 15,
      },
      buttonCancel: {
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        width: "48%",
        backgroundColor: "#999",
      },
      buttonnn: {
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        width: "48%",
        backgroundColor: "#FF6F61",
      },
      modalButtonText: {
        color: "#fff",
        fontWeight: "bold",
      },
      modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
      },
      searchInput: {
        height: 50, // Chiều cao của ô nhập
        borderColor: "#ccc", // Màu viền
        borderWidth: 1, // Độ dày viền
        borderRadius: 5, // Bo góc
        paddingHorizontal: 10, // Khoảng cách nội dung bên trong
        marginBottom: 10, // Khoảng cách phía dưới
        backgroundColor: "#fff", // Màu nền
        fontSize: 16, // Kích thước chữ
      },
      userItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
      },
      picker: {
        width: "100%",
        height: 60,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        backgroundColor: "#fff",
        marginBottom: 20,
      },
      userName: {
          fontSize: 16,
          fontWeight: "bold",
      },
      userEmail: {
          fontSize: 14,
          color: "#666",
      },
      noData: {
          textAlign: "center",
          fontSize: 16,
          color: "#999",
          marginTop: 20,
      },
      bellIcon: {
        fontSize: 20,
        color: "#ff4081",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 8,
        marginBottom: 12,
        marginLeft: 8,
        alignSelf: "flex-end",
        // Đổ bóng cho Android
        elevation: 4,
        // Đổ bóng cho iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
});

