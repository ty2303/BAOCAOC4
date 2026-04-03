# Project Memory

Cap nhat ngay: 2026-04-03

## 1. Muc dich file

File nay dung de luu "bo nho lam viec" cho du an, giup nhung lan sau bam dung kien truc hien tai va style code cua chu repo thay vi suy doan lai tu dau.

Nguon hoc chinh cua file nay la project `BAOCAO` o thu muc goc. Bo qua thu muc `MẪU/`.

## 2. Tong quan du an

Day la backend Node.js + Express + MongoDB cho bai toan thuong mai dien tu don gian, gom:

- auth
- roles
- users
- products
- inventories
- carts
- categories
- upload anh
- import Excel

Cong nghe chinh:

- Node.js
- Express 4
- Mongoose
- JWT + cookie-parser
- bcrypt
- multer
- exceljs
- resend
- slugify

Script hien co:

- `npm start` -> `nodemon ./bin/www`

Tinh trang verification hien tai:

- Khong thay test tu dong.
- `postman_collection.json` duoc dung nhu bo test/API checklist thu cong.

## 3. Pham vi runtime can uu tien

Code runtime chinh nam o thu muc goc:

- `app.js`
- `bin/www`
- `routes/`
- `controllers/`
- `services/`
- `schemas/`
- `utils/`
- `uploads/`

Chi lay code o thu muc goc lam nguon su that de mo ta kien truc va style.

## 4. Kien truc hien tai

Du an theo mo hinh tach lop don gian:

1. `routes/`
   Dinh nghia endpoint va middleware.
2. `controllers/`
   Nhan request, goi service, tra response, bat loi.
3. `services/`
   Chua logic truy van/ghi du lieu bang Mongoose.
4. `schemas/`
   Dinh nghia Mongoose schema/model.
5. `utils/`
   Chua middleware va helper dung chung.

Nguyen tac hien tai:

- Route rat mong.
- Controller mong, chu yeu co `try/catch`.
- Service chua thao tac database va mot it business logic.
- Schema giu validation co ban, default value, hook.
- Khong dung class, khong dung dependency injection, khong tao abstraction phuc tap.

## 5. So do chuc nang theo module

### Auth

- Dang ky user moi.
- Tu dong tao cart rong sau khi register.
- Dang nhap bang username/password.
- Tao JWT, luu vao cookie `token`.
- Lay thong tin `me`.
- Doi mat khau.
- Quen mat khau va reset password qua token gui email.

Chi tiet dang nho:

- `JWT_SECRET` dang duoc khai bao truc tiep trong source.
- Reset password dung `forgotpasswordToken` va `forgotpasswordTokenExp`.
- Link reset dang tro ve endpoint backend local.

### Users

- CRUD co soft delete bang `isDeleted`.
- `getAll` va `getById` co `populate('role')`.
- `update` dung `findById` + gan tung field + `save()` de giu hook hash password neu password thay doi.

### Roles

- CRUD co soft delete bang `isDeleted`.
- Chuc nang quan tri danh cho `ADMIN`.

### Products

- CRUD co soft delete bang `isDeleted`.
- `getAll` ho tro query: `title`, `minPrice`, `maxPrice`, `page`, `limit`.
- `create` tao dong thoi `product` va `inventory` bang transaction.
- `slug` duoc tao tu `title` bang `slugify(..., { locale: 'vi', trim: true })`.

### Inventories

- Luu `stock`, `reserved`, `soldCount`.
- Tang/giam ton kho theo `product`.
- `getAll` co `populate` sang product de lay `title`, `price`.

### Carts

- Moi user co toi da 1 cart.
- Cart duoc tao lazily neu chua ton tai.
- Cart tra ve/lam viec tren mang `items`.
- `addItems` cong don quantity neu product da co.
- `decreaseItems` giam quantity, neu het thi xoa item.

### Categories

- CRUD co soft delete bang `isDeleted`.

### Upload

- Upload 1 anh.
- Upload nhieu anh.
- Xem file trong `uploads/`.
- Import Excel de tao product + inventory theo lo.

Chi tiet import Excel can nho:

- Doc worksheet dau tien.
- Mapping cot:
  - cot 1: `sku`
  - cot 2: `title`
  - cot 3: `category`
  - cot 4: `price`
  - cot 5: `stock`
- Validate co ban: price/stock >= 0, khong trung `sku`, khong trung `title`.
- Xu ly theo batch 50 dong.
- Moi batch dung transaction cho `products` + `inventories`.
- Xoa file Excel sau khi import bang `fs.unlinkSync`.

## 6. Style code cua chu repo

### 6.1 Muc tieu chung

Style hien tai uu tien:

- de doc
- truc dien
- it abstraction
- file ngan vua phai
- business flow de lan theo
- comment giai thich cho nguoi hoc/de bao cao

Day khong phai style "enterprise" nhieu framework. Day la style backend hoc thuat/thuc hanh, tach lop vua du, de demo va de cham bai.

### 6.2 Cu phap va to chuc code

- Dung CommonJS: `require(...)`, `module.exports = {...}`.
- Khong dung TypeScript.
- Khong dung class.
- Ham thuong viet dang:
  - `async function (req, res) { ... }`
  - `function (req, res, next) { ... }`
- Callback ngan moi dung arrow function.
- Thuong dung `let` rat nhieu, ke ca voi bien it thay doi.
- `const` chi duoc dung o mot so cho co y nghia ro nhu secret/schema.

### 6.3 Cach dat ten

- Ten thu muc va file theo noun so nhieu:
  - `users.controller.js`
  - `users.service.js`
  - `routes/users.js`
  - `schemas/users.js`
- Ten model la so it:
  - `mongoose.model('user', ...)`
  - `mongoose.model('product', ...)`
- Ten bien import thuong theo dang:
  - `usersService`
  - `userModel`
  - `authController`
  - `mailHandler`

Ten method theo mau CRUD rat on dinh:

- `getAll`
- `getById`
- `create`
- `update`
- `remove`

Them vao do la mot so ten dong tu nghiep vu ro nghia:

- `checkLogin`
- `checkRole`
- `changePassword`
- `forgotPassword`
- `resetPassword`
- `increaseStock`
- `decreaseStock`
- `addItems`
- `uploadSingle`
- `importExcel`

### 6.4 Cac quy uoc o tung lop

#### Routes

- `var express = require('express')`
- `var router = express.Router()`
- import controller/middleware bang `let`
- route khai bao tuyen tinh, rat it logic noi bo
- middleware auth/role dat ngay tren route

#### Controllers

- Export 1 object chua cac action.
- Moi action thuong boc trong `try/catch`.
- Goi service, tra ket qua bang `res.send(...)`.
- Loi thuong tra ve:
  - `res.status(400).send({ message: err.message })`
  - `res.status(404).send({ message: 'Khong tim thay' })`
  - `res.status(403).send({ message: 'Khong co quyen...' })`
- Controller giu muc "mong", khong nen nhan qua nhieu truy van DB neu co the day xuong service.

#### Services

- Service la noi chua thao tac Mongoose chinh.
- Khong boc `try/catch` tran lan.
- Tra ve document/document list truc tiep.
- Dung `populate`, `findOne`, `findByIdAndUpdate`, `save`, `insertMany` thang tay, khong tao repository layer rieng.
- Khi co hai collection can nhat quan thi dung transaction.

#### Schemas

- Dinh nghia field ro rang, default value ro.
- Dung `timestamps: true`.
- Mau soft delete: `isDeleted: { type: Boolean, default: false }`.
- Hook duoc dung khi thuc su can thiet, vi du hash password trong `pre('save')`.

#### Utils

- Utils giu middleware va helper dung chung.
- `authHandler.js` chua `checkLogin` va `checkRole`.
- `uploadHandler.js` chua config `multer`.
- `sendMailHandler.js` chua helper gui mail.

### 6.5 Response va message

- Response kha truc tiep, khong co wrapper tong quat kieu `{ success, code, ... }`.
- Co luc tra object co `message`, co luc tra thang document/list.
- Message va comment chu yeu bang tieng Viet.
- User-facing string uu tien ngon ngu tu nhien, de hieu.

Khi mo rong code, nen giu tinh than do:

- neu file quanh do dang tra `res.send(result)` thi tiep tuc theo cach do
- neu file quanh do dang tra `{ message: ... }` thi dung cung kieu
- khong ep du an vao mot response convention moi neu khong duoc yeu cau

### 6.6 Comment va cach dien giai

Comment hien tai co dac diem:

- viet bang tieng Viet
- giai thich "tai sao" hoac "nghiep vu nay lam gi"
- thuong phu hop voi boi canh hoc tap/bao cao
- khong qua ngan gon theo kieu production toi gian

Khi viet them comment:

- uu tien comment giai thich business flow
- khong nen chen qua nhieu comment formal/ly thuyet neu khong can

### 6.7 Formatting

Quan sat hien tai:

- Indent 4 spaces.
- Co dung semicolon.
- Dau nhay don va kep dang hoi pha tron theo tung file.
- Khong co dau hieu dang dung formatter nghiem ngat.

Quy tac lam viec an toan:

- Bam style cua file dang sua.
- Khong format lai hang loat chi de doi style.
- Khong doi quote style toan file neu khong can.

## 7. Mau lap lai quan trong trong code

Nhung pattern nen tai su dung khi them module moi:

### CRUD module co ban

Thuong se can:

1. schema co `isDeleted`
2. service `getAll/getById/create/update/remove`
3. controller CRUD tuong ung
4. route CRUD tuong ung
5. dang ky route trong `app.js`

### Soft delete

Khong xoa cung. Dung:

- `findByIdAndUpdate(id, { isDeleted: true }, { new: true })`
- query doc du lieu phai loc `isDeleted: false`

### Auth middleware

- `checkLogin` lay token tu cookie truoc, roi den header `Authorization`.
- `checkRole([...])` doc user + role tu DB roi kiem tra quyen.

### Tao du lieu lien doi

Neu mot nghiep vu tao/ghi tren nhieu collection ma can nhat quan, uu tien dung transaction nhu `products` + `inventories`.

## 8. Cach minh nen code cho dung style nay o nhung lan sau

Neu can them hoac sua tinh nang, uu tien theo thu tu sau:

1. Giu CommonJS va cau truc thu muc hien tai.
2. Them route -> controller -> service -> schema thay vi chen logic lon vao route.
3. Giu controller gon, business logic data o service.
4. Dung ten method theo mau hien co (`getAll`, `getById`, `create`, `update`, `remove`) neu bai toan la CRUD.
5. Giu comment va message bang tieng Viet neu phan code lien quan den message/comment hien huu.
6. Tiep tuc dung soft delete neu module co ban ghi quan ly.
7. Neu sua file cu, bam quote style va cach xuong dong cua chinh file do.
8. Khong lay pattern tu `MẪU/`; chi bam theo code trong `BAOCAO` thu muc goc.

## 9. Nhan xet quan trong de tranh hieu sai style

- Chu repo khong uu tien over-engineering.
- Chu repo chap nhan code thuc dung, ro luong chay, de theo doi.
- Tach lop da duoc ap dung, nhung van giu don gian.
- Nguon su that de hoc style la code dang chay trong `BAOCAO` thu muc goc.
- Moi ket luan trong file nay deu uu tien rut ra tu `app.js`, `routes/`, `controllers/`, `services/`, `schemas/`, `utils/`.

## 10. Ghi chu van hanh hien tai

Co mot so gia tri nhay cam dang duoc hard-code trong source runtime, gom:

- MongoDB connection string
- JWT secret
- Resend API key

Day la hien trang cua du an, can nho khi sua code:

- Neu chi dang sua tinh nang theo style hien tai, khong tu y doi het sang `.env` neu chu repo khong yeu cau.
- Neu co yeu cau hardening/refactor, day la diem uu tien can tach ra cau hinh.

## 11. Ket luan bo nho

Neu lam tiep tren repo nay, mac dinh hay nho:

- day la Express + Mongoose backend
- route mong, controller mong, service xu ly data
- CommonJS, code de doc, comment tieng Viet
- soft delete la pattern chinh
- auth dung JWT + cookie/header
- product va inventory di cung nhau
- cart la 1-1 voi user
- chi hoc tu code `BAOCAO` o thu muc goc
