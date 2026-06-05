# Destination B1 Vocabulary Trainer

Web tĩnh để học theo Unit, đọc PDF gốc kiểu ebook trong app, và làm bài kiểm tra viết lại từ tiếng Anh từ nghĩa tiếng Việt.

## Cách dùng

Mở `index.html` trong trình duyệt, hoặc chạy server trong đúng thư mục `D:\python\english-vocab-web`:

```powershell
python -m http.server 8080
```

Sau đó vào `http://localhost:8080`.

## Chỉnh danh sách từ

- App không chép toàn bộ nội dung sách thành HTML.
- Có thể đọc file PDF gốc dạng lật trang trong tab `PDF sách`.
- Có thể import dữ liệu luyện tập bằng JSON trong tab `Import`.
- Có thể thêm từ trực tiếp trên tab `Thêm từ`; dữ liệu tự thêm được lưu trong `localStorage` của trình duyệt.
