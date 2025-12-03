# DSUC Lab Backend API

Backend API cho DSUC Lab - Web3 Student Hub với Solana wallet authentication.

## 📋 Yêu cầu hệ thống

- Node.js >= 18.x
- npm hoặc yarn

## 🚀 Quick Start - Local Development

Chỉ cần 3 bước để bắt đầu phát triển local:

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Tạo file .env

```bash
cp .env.example.local .env
```

File `.env` đã được cấu hình sẵn với mock data - không cần Supabase!

### 3. Chạy server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3001` với mock data đã có sẵn.

### 🎯 Test với Mock Data

Backend đã có sẵn mock data để test. Bạn có thể dùng các wallet address sau:

**Mock Wallet Addresses:**
- **Thodium (Vice-President):** `GEeWZoVZq9JQ9RgWy9zzkhvTAnYBKSvS2gzjXetqutFe`
- **NekoNora (Tech-Lead):** `CYcvdzKjh8B699tbe3UnYM21Vzcp14JQqy5hXs9iUYBT`

Thử test API:
```bash
curl http://localhost:3001/api/members
curl http://localhost:3001/api/events
curl http://localhost:3001/api/projects
```

## 🔧 Production Deployment

Khi deploy lên production (Render, Vercel, etc.):

### 1. Cấu hình Supabase

#### Bước 1: Tạo project trên Supabase

1. Truy cập https://supabase.com/dashboard
2. Tạo project mới (miễn phí)
3. Đợi database khởi tạo xong

#### Bước 2: Chạy Database Schema

1. Vào **SQL Editor** trong Supabase Dashboard
2. Chạy file `database/schema.sql` để tạo các bảng
3. Chạy file `database/seed.sql` để thêm dữ liệu

#### Bước 3: Tạo Storage Bucket

1. Vào **Storage** trong Supabase Dashboard
2. Tạo bucket mới tên `avatars`
3. Set bucket thành **Public** để có thể truy cập ảnh

### 2. Cấu hình Environment Variables

Sử dụng file `.env.example.deployment` làm reference:

```env
USE_MOCK_DB=false
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://dsuc.fun

# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: ImageBB for uploads
IMAGEBB_API_KEY=your-imagebb-api-key
```

**Lấy Supabase credentials:**
- Vào **Settings > API** trong Supabase Dashboard
- Copy `Project URL` → `SUPABASE_URL`
- Copy `anon public` key → `SUPABASE_ANON_KEY`

## 🏃 Chạy Backend

### Development mode (hot reload)
```bash
npm run dev
```

### Build và Production mode
```bash
npm run build
npm start
```

Server sẽ chạy tại `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

Hầu hết các endpoints yêu cầu authentication thông qua Solana wallet address.

Gửi wallet address trong header:
```
x-wallet-address: YOUR_SOLANA_WALLET_ADDRESS
```

### Endpoints Overview

#### Members
- `GET /api/members` - Lấy danh sách tất cả thành viên
- `GET /api/members/:id` - Lấy thông tin chi tiết thành viên
- `GET /api/members/wallet/:wallet_address` - Lấy thành viên theo wallet
- `POST /api/members/auth` - Xác thực đăng nhập bằng wallet
- `PUT /api/members/:id` - Cập nhật profile (yêu cầu auth)

#### Projects
- `GET /api/projects` - Lấy danh sách dự án
- `GET /api/projects/:id` - Lấy chi tiết dự án
- `POST /api/projects` - Tạo dự án mới (yêu cầu auth)
- `PUT /api/projects/:id` - Cập nhật dự án (yêu cầu auth)
- `DELETE /api/projects/:id` - Xóa dự án (Admin only)

#### Events
- `GET /api/events` - Lấy danh sách sự kiện
- `GET /api/events/recent` - Lấy 3 sự kiện gần nhất (cho Dashboard)
- `GET /api/events/:id` - Lấy chi tiết sự kiện
- `POST /api/events` - Tạo sự kiện mới (yêu cầu auth)
- `PUT /api/events/:id` - Cập nhật sự kiện (yêu cầu auth)
- `DELETE /api/events/:id` - Xóa sự kiện (Admin only)
- `POST /api/events/:id/register` - Đăng ký tham gia sự kiện

#### Finance
- `POST /api/finance/request` - Gửi yêu cầu thanh toán (yêu cầu auth)
- `GET /api/finance/pending` - Lấy danh sách yêu cầu đang chờ (Admin only)
- `GET /api/finance/history` - Lấy lịch sử giao dịch (yêu cầu auth)
- `GET /api/finance/my-requests` - Lấy yêu cầu của bản thân (yêu cầu auth)
- `GET /api/finance/request/:id` - Lấy chi tiết yêu cầu với bank info
- `POST /api/finance/approve/:id` - Duyệt yêu cầu (Admin only)
- `POST /api/finance/reject/:id` - Từ chối yêu cầu (Admin only)
- `GET /api/finance/members-with-bank` - Lấy members có bank info

#### Work (Bounties & Repos)
- `GET /api/work/bounties` - Lấy danh sách bounties
- `GET /api/work/bounties/:id` - Lấy chi tiết bounty
- `POST /api/work/bounties` - Tạo bounty mới (yêu cầu auth)
- `PUT /api/work/bounties/:id` - Cập nhật bounty (yêu cầu auth)
- `DELETE /api/work/bounties/:id` - Xóa bounty (Admin only)
- `GET /api/work/repos` - Lấy danh sách repos
- `GET /api/work/repos/:id` - Lấy chi tiết repo
- `POST /api/work/repos` - Tạo repo mới (yêu cầu auth)
- `PUT /api/work/repos/:id` - Cập nhật repo (yêu cầu auth)
- `DELETE /api/work/repos/:id` - Xóa repo (Admin only)

#### Resources
- `GET /api/resources` - Lấy danh sách tài liệu
- `GET /api/resources/categories` - Lấy categories với số lượng
- `GET /api/resources/:id` - Lấy chi tiết tài liệu
- `POST /api/resources` - Tạo tài liệu mới (yêu cầu auth)
- `PUT /api/resources/:id` - Cập nhật tài liệu (yêu cầu auth)
- `DELETE /api/resources/:id` - Xóa tài liệu (Admin only)

### Example Requests

#### 1. Đăng nhập bằng Wallet

```bash
curl -X POST http://localhost:3001/api/members/auth \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "YOUR_WALLET_ADDRESS"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "wallet_address": "YOUR_WALLET_ADDRESS",
    "name": "Your Name",
    "role": "President",
    ...
  },
  "message": "Authentication successful"
}
```

#### 2. Cập nhật Profile

```bash
curl -X PUT http://localhost:3001/api/members/{member_id} \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: YOUR_WALLET_ADDRESS" \
  -d '{
    "name": "New Name",
    "skills": ["React", "Solana", "TypeScript"],
    "bank_info": {
      "bankId": "970422",
      "accountNo": "0123456789",
      "accountName": "NGUYEN VAN A"
    }
  }'
```

#### 3. Tạo Project mới

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: YOUR_WALLET_ADDRESS" \
  -d '{
    "name": "DeFi Protocol",
    "description": "A new DeFi protocol on Solana",
    "category": "DeFi",
    "builders": ["Alice", "Bob"],
    "link": "https://demo.com",
    "repo_link": "https://github.com/repo"
  }'
```

## 🔐 Security & Permissions

### Role-based Access Control

**Admin Roles** (có quyền cao):
- `President`
- `Vice-President`
- `Tech-Lead`

**Leadership Roles** (quyền trung bình):
- `Media-Lead`

**Member Role** (quyền cơ bản):
- `Member`

### Important Notes

1. **Role Changes**: Không thể thay đổi role qua API. Chỉ có thể thay đổi trực tiếp trong database Supabase.

2. **Fixed Members**: Hệ thống giới hạn 15 members cố định. Không thể tạo member mới qua API.

3. **Wallet Authentication**: Mỗi member có 1 wallet address duy nhất. Wallet address không thể thay đổi.

## 📁 Cấu trúc Project

```
backend/
├── database/
│   ├── schema.sql      # Database schema với wallet support
│   └── seed.sql        # 15 tài khoản cố định
├── src/
│   ├── middleware/
│   │   ├── auth.ts     # Wallet authentication middleware
│   │   └── upload.ts   # File upload middleware
│   ├── routes/
│   │   ├── members.ts
│   │   ├── projects.ts
│   │   ├── events.ts
│   │   ├── finance.ts
│   │   ├── work.ts
│   │   └── resources.ts
│   └── index.ts        # Main Express server
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Troubleshooting

### Lỗi "Wallet address not registered"
- Kiểm tra xem wallet address có trong database chưa
- Chạy lại seed.sql với địa chỉ ví đúng

### Lỗi "Failed to upload file"
- Kiểm tra xem bucket `dsuc-lab` đã được tạo chưa
- Kiểm tra bucket có được set thành Public chưa
- Kiểm tra policies cho bucket

### Lỗi kết nối Supabase
- Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY trong .env
- Kiểm tra internet connection
- Kiểm tra Supabase project có đang hoạt động không

## 📝 Notes

- Database sử dụng PostgreSQL thông qua Supabase
- File uploads được lưu trên Supabase Storage
- Authentication dựa trên Solana wallet address
- Tất cả responses đều có format JSON chuẩn:
  ```json
  {
    "success": true/false,
    "data": {...},
    "message": "...",
    "error": "..." (nếu có lỗi)
  }
  ```

## 📞 Support

Nếu gặp vấn đề, vui lòng liên hệ Tech-Lead hoặc tạo issue trong repository.
