# DSUC Lab Backend - Chi Tiết Kỹ Thuật

## 🏗️ Kiến trúc Backend

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js với TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Authentication**: Solana Wallet-based (Phantom/Solflare)

### Database Schema Overview

```
members (15 tài khoản cố định)
├── id (UUID)
├── wallet_address (TEXT UNIQUE) ← Key cho authentication
├── name (TEXT)
├── role (TEXT) ← Không thể thay đổi qua API
├── avatar (TEXT URL)
├── skills (TEXT[])
├── socials (JSONB)
├── bank_info (JSONB) ← Cho VietQR
└── is_active (BOOLEAN)

events
├── id (UUID)
├── title, date, time, location
├── type, attendees
└── created_by → members.id

projects
├── id (UUID)
├── name, description, category
├── builders (TEXT[])
├── link, repo_link, image_url
└── created_by → members.id

finance_requests
├── id (UUID)
├── requester_id → members.id
├── amount, reason, date
├── bill_image (URL)
├── status (pending/completed/rejected)
├── processed_by → members.id
└── processed_at

bounties
├── id (UUID)
├── title, description
├── reward, difficulty
├── tags (TEXT[])
├── status (Open/In Progress/Completed/Closed)
└── created_by → members.id

repos
├── id (UUID)
├── name, description, language
├── stars, forks, url
└── created_by → members.id

resources
├── id (UUID)
├── name, type, url, size
├── category (Learning/Media/Tools/Research)
└── created_by → members.id
```

## 🔐 Authentication Flow

### Wallet-based Authentication

Khác với hệ thống truyền thống dùng email/password, DSUC Lab sử dụng Solana wallet address làm identifier duy nhất.

**Flow đăng nhập:**

1. **Frontend**: User bấm "CONNECT" → Chọn ví (Phantom/Solflare)
2. **Wallet Extension**: Mở popup xin phép kết nối
3. **User**: Approve connection
4. **Frontend**: Nhận wallet address (public key)
5. **Frontend → Backend**: POST `/api/members/auth` với `wallet_address`
6. **Backend**:
   - Query database tìm member có `wallet_address` này
   - Nếu tìm thấy → Return thông tin member
   - Nếu không tìm thấy → Return 404 (chỉ 15 members cố định)
7. **Frontend**: Lưu thông tin user vào state

**Authentication cho các API calls:**

Mỗi request cần authentication sẽ gửi kèm header:
```
x-wallet-address: <USER_SOLANA_WALLET_ADDRESS>
```

Middleware `authenticateWallet` sẽ:
1. Lấy wallet address từ header
2. Validate format (phải là Solana address hợp lệ)
3. Query database tìm member
4. Attach thông tin member vào `req.user`
5. Cho phép request tiếp tục hoặc reject

### Role-based Authorization

Sau khi authenticated, một số endpoints yêu cầu role cụ thể:

```typescript
// Middleware requireAdmin
const adminRoles = ['President', 'Vice-President', 'Tech-Lead'];

// Middleware requireRole(['President', 'Tech-Lead'])
```

**Phân quyền:**
- **President**: Full access
- **Vice-President**: Admin access (không thể thay đổi role)
- **Tech-Lead**: Admin access cho tech-related features
- **Media-Lead**: Có thể quản lý resources, events
- **Member**: Chỉ có thể tạo và sửa nội dung của mình

## 📤 File Upload System

### Cơ chế upload

Backend hỗ trợ 2 cách upload:

#### 1. Base64 Upload (Hiện tại Frontend dùng)

**Flow:**
```
Frontend: File → FileReader → Base64 string
         ↓
Backend: Base64 → Buffer → Supabase Storage
         ↓
Database: Save public URL
```

**Code:**
```typescript
// Frontend
const reader = new FileReader();
reader.onload = (e) => {
  const base64 = e.target?.result; // data:image/png;base64,iVBOR...
  // Send to API
};

// Backend
import { uploadBase64ToSupabase } from './middleware/upload';
const imageUrl = await uploadBase64ToSupabase(base64String, 'avatars');
```

#### 2. Multipart Form Upload (Future enhancement)

```typescript
import { upload } from './middleware/upload';

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const url = await uploadToSupabase(file, 'folder');
  res.json({ url });
});
```

### Storage Structure

```
dsuc-lab/ (Supabase bucket)
├── avatars/
│   ├── uuid-1.png
│   └── uuid-2.jpg
├── projects/
│   ├── uuid-3.png
│   └── uuid-4.jpg
└── finance/
    └── bills/
        ├── uuid-5.png
        └── uuid-6.jpg
```

## 💰 Finance System - Chi Tiết

Finance module là phần phức tạp nhất, xử lý 2 luồng chính:

### 1. Submit Request (Yêu cầu hoàn tiền)

**Use case**: Member chi tiền cho CLB (mua đồ, trả phí...) và yêu cầu hoàn lại.

**Flow:**
1. Member điền form: Số tiền, lý do, ngày, upload bill
2. POST `/api/finance/request`
3. Backend lưu vào `finance_requests` với `status = 'pending'`
4. Admin vào tab "Pending" xem danh sách
5. Admin bấm vào 1 request → Xem chi tiết + Bank info của requester
6. Admin bấm "Generate QR" → Frontend tạo VietQR
7. Admin quét QR → Chuyển tiền cho member
8. Admin bấm "Confirm Transfer" → Backend update `status = 'completed'`

### 2. Direct Transfer (Chuyển tiền nhanh)

**Use case**: Một member muốn chuyển tiền cho member khác (trả nợ, chia tiền...)

**Flow:**
1. Member A vào tab "Direct"
2. Chọn Member B từ danh sách (chỉ hiện những ai có bank_info)
3. Nhập số tiền, message, upload bill (optional)
4. Bấm "Generate QR"
5. Frontend call GET `/api/finance/members-with-bank`
6. Frontend tạo VietQR với bank_info của Member B
7. Member A quét QR → Chuyển tiền
8. (Optional) Có thể lưu lại transaction history

### VietQR Integration

Frontend sử dụng VietQR API để tạo mã QR:

```javascript
const generateQR = (bankInfo, amount, message) => {
  const { bankId, accountNo, accountName } = bankInfo;
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(message)}&accountName=${encodeURIComponent(accountName)}`;
  return qrUrl;
};
```

**VietQR Parameters:**
- `bankId`: Mã ngân hàng (970422 = MB Bank, 970436 = Vietcombank...)
- `accountNo`: Số tài khoản
- `accountName`: Tên chủ tài khoản
- `amount`: Số tiền
- `addInfo`: Nội dung chuyển khoản

## 🛣️ API Response Format

Tất cả API responses đều follow format chuẩn:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "count": 10  // Optional, for list endpoints
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized (role issue)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## 🔒 Security Considerations

### 1. Fixed Member System

**Tại sao cố định 15 members?**
- Đây là CLB nhỏ, số lượng cố định dễ quản lý
- Tránh spam registration
- Role được kiểm soát chặt chẽ

**Làm sao thêm member mới?**
1. Admin vào Supabase Dashboard
2. Vào Table Editor > members
3. Insert row mới với wallet_address thật
4. Set role phù hợp

### 2. Role Protection

Role KHÔNG thể thay đổi qua API:

```typescript
// This endpoint is DISABLED
router.patch('/:id/role', authenticateWallet, requireAdmin, (req, res) => {
  return res.status(403).json({
    error: 'Forbidden',
    message: 'Role changes are not allowed through API'
  });
});
```

Chỉ có thể sửa role trực tiếp trong Supabase Dashboard.

### 3. Wallet Signature Verification (Future)

Hiện tại backend chỉ kiểm tra wallet address có trong database.

**Enhancement**: Verify signature để chắc chắn user thật sự sở hữu wallet.

```typescript
// Future implementation
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

const verifySignature = (message, signature, publicKey) => {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = new PublicKey(publicKey).toBytes();

  return nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );
};
```

**Flow với signature:**
1. Frontend: Request nonce từ backend
2. Backend: Generate random nonce, lưu tạm
3. Frontend: Ký message = `Sign this message: ${nonce}`
4. Frontend: Gửi signature + wallet address + nonce
5. Backend: Verify signature → Grant access

### 4. Rate Limiting (Recommended)

Nên thêm rate limiting để tránh abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🚀 Deployment Guide

### Option 1: Deploy to Railway

1. Push code to GitHub
2. Vào Railway.app → New Project → Deploy from GitHub
3. Add environment variables
4. Deploy

### Option 2: Deploy to Render

1. Push code to GitHub
2. Vào Render.com → New Web Service
3. Connect GitHub repo
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

### Option 3: Deploy to VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone <repo-url>
cd backend

# Install dependencies
npm install

# Build
npm run build

# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "dsuc-backend"
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/dsuc-backend

# Nginx config:
server {
    listen 80;
    server_name api.dsuclab.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/dsuc-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📊 Monitoring & Logging

### Production Logging

Recommended: Add structured logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Use in routes
logger.info('User logged in', { wallet: user.wallet_address });
logger.error('Database error', { error: err.message });
```

## 🧪 Testing

### Setup Testing (Future)

```bash
npm install --save-dev jest @types/jest supertest @types/supertest
```

```typescript
// Example test
describe('Members API', () => {
  it('should get all members', async () => {
    const response = await request(app)
      .get('/api/members')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

## 📈 Performance Optimization

### Database Indexing

Đã có indexes trong schema.sql:
- `wallet_address` (members)
- `role` (members)
- `date` (events)
- `category` (projects, resources)
- `status` (finance_requests, bounties)

### Caching Strategy (Future)

```typescript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

router.get('/members', async (req, res) => {
  const cacheKey = 'all_members';
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  // Fetch from DB
  const data = await fetchMembers();
  cache.set(cacheKey, data);
  res.json(data);
});
```

## 🔄 Future Enhancements

1. **WebSocket for real-time updates**
   - Live notifications khi có finance request mới
   - Real-time event attendee count

2. **Email notifications**
   - Notify admin khi có pending request
   - Notify user khi request được approve/reject

3. **Advanced analytics**
   - Dashboard với charts
   - Finance report by month
   - Member contribution tracking

4. **Blockchain integration**
   - On-chain verification của transactions
   - NFT badges cho achievements
   - Token rewards cho contributions

5. **Mobile app**
   - React Native app
   - Push notifications
   - Offline mode

---

*Tài liệu này sẽ được cập nhật khi có thay đổi trong hệ thống.*
