# 🚀 DSUC Lab Backend - Quick Start Guide

Hướng dẫn nhanh để setup và chạy backend trong 5 phút!

## ✅ Prerequisites

- ✅ Node.js >= 18.x đã cài đặt
- ✅ Tài khoản Supabase (miễn phí)
- ✅ Git

## 📦 Bước 1: Cài đặt Dependencies

```bash
cd backend
npm install
```

## 🗄️ Bước 2: Setup Supabase

### 2.1. Tạo Project mới trên Supabase

1. Truy cập: https://supabase.com/dashboard
2. Click "New Project"
3. Điền thông tin:
   - Name: `dsuc-lab`
   - Database Password: (tự đặt và lưu lại)
   - Region: Southeast Asia (Singapore)
4. Click "Create new project"
5. Đợi 2-3 phút để database khởi tạo

### 2.2. Chạy Database Schema

1. Trong Supabase Dashboard, vào **SQL Editor** (thanh bên trái)
2. Click "New query"
3. Copy toàn bộ nội dung file `database/schema.sql` và paste vào
4. Click "Run" hoặc nhấn Ctrl+Enter
5. Xác nhận thấy message "Success. No rows returned"

### 2.3. Chạy Seed Data

1. Vẫn trong SQL Editor, tạo query mới
2. **QUAN TRỌNG**: Mở file `database/seed.sql`
3. **Thay thế các địa chỉ ví mẫu bằng địa chỉ ví Solana thật của 15 members**
   - Tìm: `CxPRESIDENT1111111111111111111111111111111`
   - Thay bằng: Địa chỉ ví Phantom/Solflare thật của President
   - Làm tương tự cho 14 members còn lại
4. Copy toàn bộ nội dung file `database/seed.sql` (đã sửa) và paste vào
5. Click "Run"
6. Xác nhận thấy bảng thống kê:
   ```
   Members: 15
   Events: 3
   Projects: 3
   Bounties: 3
   Repos: 3
   Resources: 4
   ```

### 2.4. Tạo Storage Bucket

1. Vào **Storage** (thanh bên trái)
2. Click "Create a new bucket"
3. Điền:
   - Name: `dsuc-lab`
   - Public bucket: **Bật ON** ✅
4. Click "Create bucket"
5. Click vào bucket `dsuc-lab` vừa tạo
6. Click tab "Policies"
7. Click "New policy" → "For full customization"
8. Chọn:
   - Policy name: `Public Access`
   - Allowed operations: **SELECT** (cho phép đọc file)
   - Target roles: `public`
9. Click "Review" → "Save policy"

### 2.5. Lấy API Credentials

1. Vào **Settings > API** (thanh bên trái)
2. Copy 2 giá trị:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (key rất dài)

## 🔧 Bước 3: Cấu hình Environment

1. Copy file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```

2. Mở file `.env` và điền thông tin:
   ```env
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

## 🏃 Bước 4: Chạy Backend

### Development mode (auto reload)
```bash
npm run dev
```

Bạn sẽ thấy:
```
╔═══════════════════════════════════════════╗
║   DSUC Lab Backend Server                 ║
║   Port: 3001                              ║
║   Environment: development                ║
║   Status: ONLINE ✓                        ║
╚═══════════════════════════════════════════╝
```

## ✅ Bước 5: Test Backend

### Option 1: Dùng Browser

Mở browser và truy cập: http://localhost:3001/api/health

Bạn sẽ thấy:
```json
{
  "status": "ok",
  "message": "DSUC Lab Backend is running",
  "timestamp": "2025-01-10T..."
}
```

### Option 2: Dùng curl

```bash
# Test health check
curl http://localhost:3001/api/health

# Test get members
curl http://localhost:3001/api/members

# Test login
curl -X POST http://localhost:3001/api/members/auth \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "YOUR_WALLET_ADDRESS"}'
```

### Option 3: Import Postman Collection

1. Mở Postman
2. Click "Import"
3. Chọn file `postman_collection.json`
4. Sửa biến `walletAddress` thành địa chỉ ví thật của bạn
5. Test các endpoints

## 🎯 Next Steps

### 1. Cập nhật Frontend để connect Backend

Mở file `frontend/store/useStore.ts` và thêm:

```typescript
// Thêm ở đầu file
const API_URL = 'http://localhost:3001/api';

// Sửa fetchMembers
fetchMembers: async () => {
  try {
    const response = await fetch(`${API_URL}/members`);
    const result = await response.json();
    if (result.success) {
      set({ members: result.data });
    }
  } catch (error) {
    console.error('Failed to fetch members:', error);
  }
},

// Sửa login function
loginWithWallet: async (walletAddress: string) => {
  try {
    const response = await fetch(`${API_URL}/members/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress })
    });
    const result = await response.json();
    if (result.success) {
      set({ currentUser: result.data });
      return result.data;
    }
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
},
```

### 2. Test Login Flow

1. Mở frontend (http://localhost:5173)
2. Click nút "CONNECT"
3. Chọn Phantom hoặc Solflare
4. Approve connection
5. Nếu wallet address của bạn có trong database → Login thành công!

### 3. Test các chức năng khác

- ✅ Xem danh sách members
- ✅ Xem chi tiết member
- ✅ Cập nhật profile (avatar, skills, bank info)
- ✅ Tạo project mới
- ✅ Tạo event mới
- ✅ Submit finance request
- ✅ Và nhiều hơn nữa...

## 🐛 Troubleshooting

### Lỗi: "Failed to connect to Supabase"

- ✅ Kiểm tra `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong `.env`
- ✅ Kiểm tra internet connection
- ✅ Kiểm tra Supabase project có đang hoạt động không

### Lỗi: "Wallet address not registered"

- ✅ Kiểm tra xem đã chạy seed.sql chưa
- ✅ Kiểm tra wallet address trong seed.sql có đúng không
- ✅ Chạy lại seed.sql nếu cần

### Lỗi: "Failed to upload file"

- ✅ Kiểm tra bucket `dsuc-lab` đã được tạo chưa
- ✅ Kiểm tra bucket có được set Public chưa
- ✅ Kiểm tra policies cho bucket

### Port 3001 đã được sử dụng

Sửa `PORT` trong `.env` thành port khác (ví dụ: 3002)

## 📚 Tài liệu chi tiết

- [README.md](./README.md) - Hướng dẫn đầy đủ
- [README_DETAILS.md](./README_DETAILS.md) - Chi tiết kỹ thuật
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation

## 🆘 Cần hỗ trợ?

- Tạo issue trên GitHub repo
- Liên hệ Tech-Lead
- Check Supabase documentation: https://supabase.com/docs

---

**Chúc bạn code vui vẻ! 🚀**
