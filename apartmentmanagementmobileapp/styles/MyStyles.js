import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
        alignItems: "center"
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
          marginBottom: 12,
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
});
