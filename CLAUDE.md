---
noteId: "54af1690300011f1b3f547826a8c8672"
tags: []

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

```bash
npm start          # chạy server với nodemon (auto-reload)
```

Server chạy tại `http://localhost:3000`. Không có test runner hay lint script.

**Frontend:** HTML tĩnh trong `frontend/`, được serve tự động qua `express.static`. Mở bằng Live Server (VSCode) hoặc truy cập qua `http://localhost:3000`.

## Architecture Overview

Express.js + MongoDB (Mongoose) REST API theo pattern phân tầng:

```
routes/ → controllers/ → services/ → schemas/
```

- **`routes/`** — Định nghĩa endpoint và áp dụng middleware auth
- **`controllers/`** — Nhận request, gọi service, trả response
- **`services/`** — Business logic, truy vấn Mongoose
- **`schemas/`** — Mongoose schema (định nghĩa model)
- **`utils/`** — `authHandler.js`, `uploadHandler.js`, `sendMailHandler.js`
- **`bin/www`** — Entry point: khởi tạo HTTP server + Socket.IO

## Auth System

- JWT secret hardcoded: `'BAOCAOCHIUTHU4'` (dùng chung ở `utils/authHandler.js` và `bin/www`)
- Token truyền qua **cookie `token`** (ưu tiên) hoặc header **`Authorization: Bearer <token>`**
- Middleware: `checkLogin` → xác thực JWT, `checkRole(['ADMIN'])` → kiểm tra role
- Role chỉ có 2 loại: `ADMIN` và `USER`

## Socket.IO (Real-time Chat)

Khởi tạo trong `bin/www`. Flow:
- Socket middleware tự xác thực JWT từ `socket.handshake.auth.token`
- USER tự động join room `user_<userId>` khi connect
- ADMIN phải emit `join-room` với `{ userId }` để vào room của user cụ thể
- Event `send-message` → lưu DB qua `chatsService` → tự động tạo notification cho bên nhận

## Key Business Logic

**Order + Payment flow** (dùng MongoDB session/transaction để chống oversell):
1. `POST /orders` → tạo order, lock hàng (`stock -= qty`, `reserved += qty`), tạo `transaction` pending, xóa cart — tất cả trong 1 session
2. `PUT /payments/:orderId/confirm` (ADMIN) → xác nhận thanh toán, chuyển `reserved → soldCount`
3. `PUT /payments/:orderId/cancel` → hủy, hoàn hàng về `stock`
4. `POST /payments/:orderId/pay-online` (USER) → thanh toán online

**Shipping address:** khi tạo order có thể truyền `shippingAddress` (text) hoặc `addressId` (ObjectId) — `addressesService.getOrderAddressText()` xử lý cả 2 trường hợp.

## Upload Files

- Ảnh: `POST /upload/single` hoặc `/upload/multiple` — lưu vào thư mục `uploads/`, giới hạn 5MB
- Excel: `POST /upload/excel` — dùng `exceljs` để import
- Xem file: `GET /upload/:filename`

## Database

MongoDB Atlas (connection string hardcoded trong `app.js`). Các schema dùng soft-delete (`isDeleted: Boolean`). Schema `transaction` có unique index `{ orderId, type }`.

## API Base URL

Tất cả API có prefix `/api/v1/`. Postman collection đầy đủ tại `postman_collection.json`.
