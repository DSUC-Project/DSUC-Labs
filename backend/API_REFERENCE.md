# DSUC Lab API Reference

Base URL: `http://localhost:3001/api` (Development)

## Authentication

Hầu hết endpoints yêu cầu header:
```
x-wallet-address: YOUR_SOLANA_WALLET_ADDRESS
```

---

## 👥 Members Endpoints

### GET /api/members
Lấy danh sách tất cả members

**Auth**: No

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "wallet_address": "...",
      "name": "Doan Do Thanh Danh",
      "role": "President",
      "avatar": "https://...",
      "skills": ["Leadership", "Web3"],
      "socials": {...},
      "bank_info": {...}
    }
  ],
  "count": 15
}
```

---

### GET /api/members/:id
Lấy thông tin chi tiết 1 member

**Auth**: No

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "...",
    ...
  }
}
```

---

### GET /api/members/wallet/:wallet_address
Lấy member theo wallet address

**Auth**: No

**URL Example**: `/api/members/wallet/CxPRESIDENT1111111111111111111111111111111`

---

### POST /api/members/auth
Đăng nhập bằng wallet address

**Auth**: No

**Body**:
```json
{
  "wallet_address": "CxPRESIDENT1111111111111111111111111111111"
}
```

**Success Response**:
```json
{
  "success": true,
  "data": {...},
  "message": "Authentication successful"
}
```

**Error Response** (404):
```json
{
  "error": "Not Found",
  "message": "Wallet address not registered. Only 15 pre-registered members can access."
}
```

---

### PUT /api/members/:id
Cập nhật profile của bản thân

**Auth**: Yes (phải là chính user đó)

**Body**:
```json
{
  "name": "New Name",
  "avatar": "https://... or base64",
  "skills": ["React", "Solana"],
  "socials": {
    "github": "https://github.com/username",
    "twitter": "https://x.com/username",
    "telegram": "https://t.me/username"
  },
  "bank_info": {
    "bankId": "970422",
    "accountNo": "0123456789",
    "accountName": "NGUYEN VAN A"
  }
}
```

**Note**:
- Avatar có thể là URL hoặc base64 string (data:image/png;base64,...)
- Backend sẽ tự động upload base64 lên Supabase Storage

---

## 📁 Projects Endpoints

### GET /api/projects
Lấy danh sách dự án

**Auth**: No

**Query Params**:
- `category` (optional): Filter by category

**Example**: `/api/projects?category=DeFi`

---

### GET /api/projects/:id
Lấy chi tiết dự án

**Auth**: No

---

### POST /api/projects
Tạo dự án mới

**Auth**: Yes

**Body**:
```json
{
  "name": "DeFi Protocol",
  "description": "A new DeFi protocol on Solana",
  "category": "DeFi",
  "builders": ["Alice", "Bob", "Charlie"],
  "link": "https://demo.com",
  "repo_link": "https://github.com/repo",
  "image_url": "https://... or base64"
}
```

---

### PUT /api/projects/:id
Cập nhật dự án

**Auth**: Yes (creator hoặc admin)

**Body**: Same as POST (all fields optional)

---

### DELETE /api/projects/:id
Xóa dự án

**Auth**: Yes (Admin only)

---

## 📅 Events Endpoints

### GET /api/events
Lấy danh sách sự kiện

**Auth**: No

**Query Params**:
- `upcoming=true`: Chỉ lấy sự kiện tương lai
- `limit=10`: Giới hạn số lượng

**Example**: `/api/events?upcoming=true&limit=5`

---

### GET /api/events/recent
Lấy 3 sự kiện gần nhất (cho Dashboard)

**Auth**: No

---

### POST /api/events
Tạo sự kiện mới

**Auth**: Yes

**Body**:
```json
{
  "title": "Solana Bootcamp 2025",
  "date": "2025-01-15",
  "time": "14:00",
  "type": "Workshop",
  "location": "HCMC University"
}
```

---

### PUT /api/events/:id
Cập nhật sự kiện

**Auth**: Yes (creator hoặc admin)

---

### DELETE /api/events/:id
Xóa sự kiện

**Auth**: Yes (Admin only)

---

### POST /api/events/:id/register
Đăng ký tham gia sự kiện (tăng attendees count)

**Auth**: Yes

---

## 💰 Finance Endpoints

### POST /api/finance/request
Gửi yêu cầu hoàn tiền

**Auth**: Yes

**Body**:
```json
{
  "amount": "500000",
  "reason": "Mua thiết bị cho workshop",
  "date": "2025-01-10",
  "bill_image": "https://... or base64"
}
```

---

### GET /api/finance/pending
Lấy danh sách yêu cầu đang chờ duyệt

**Auth**: Yes (Admin only)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "requester_id": "uuid",
      "requester_name": "Nguyen Van A",
      "amount": "500000",
      "reason": "...",
      "date": "2025-01-10",
      "bill_image": "https://...",
      "status": "pending",
      "created_at": "..."
    }
  ],
  "count": 5
}
```

---

### GET /api/finance/history
Lấy lịch sử giao dịch (completed/rejected)

**Auth**: Yes

---

### GET /api/finance/my-requests
Lấy danh sách yêu cầu của bản thân

**Auth**: Yes

---

### GET /api/finance/request/:id
Lấy chi tiết yêu cầu (bao gồm bank info của requester)

**Auth**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requester_id": "uuid",
    "requester_name": "Nguyen Van A",
    "amount": "500000",
    "reason": "...",
    "requester_bank_info": {
      "bankId": "970422",
      "accountNo": "0123456789",
      "accountName": "NGUYEN VAN A"
    },
    ...
  }
}
```

**Use case**: Admin lấy bank info để tạo VietQR

---

### POST /api/finance/approve/:id
Duyệt yêu cầu (chuyển status thành completed)

**Auth**: Yes (Admin only)

---

### POST /api/finance/reject/:id
Từ chối yêu cầu

**Auth**: Yes (Admin only)

---

### GET /api/finance/members-with-bank
Lấy danh sách members có bank info (cho Direct Transfer)

**Auth**: Yes

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nguyen Van A",
      "avatar": "...",
      "role": "Member",
      "bank_info": {
        "bankId": "970422",
        "accountNo": "0123456789",
        "accountName": "NGUYEN VAN A"
      }
    }
  ]
}
```

---

## 💼 Work Endpoints (Bounties & Repos)

### Bounties

#### GET /api/work/bounties
Lấy danh sách bounties

**Query Params**:
- `status`: Filter by status (Open/In Progress/Completed/Closed)

---

#### POST /api/work/bounties
Tạo bounty mới

**Auth**: Yes

**Body**:
```json
{
  "title": "Build Solana Wallet Integration",
  "description": "Integrate Phantom and Solflare",
  "reward": "0.5 SOL",
  "difficulty": "Medium",
  "tags": ["Solana", "TypeScript", "React"]
}
```

---

#### PUT /api/work/bounties/:id
Cập nhật bounty

**Auth**: Yes (creator hoặc admin)

---

#### DELETE /api/work/bounties/:id
Xóa bounty

**Auth**: Yes (Admin only)

---

### Repos

#### GET /api/work/repos
Lấy danh sách repos

---

#### POST /api/work/repos
Tạo repo mới

**Auth**: Yes

**Body**:
```json
{
  "name": "solana-toolkit",
  "description": "Essential tools for Solana development",
  "language": "TypeScript",
  "url": "https://github.com/dsuc-lab/solana-toolkit",
  "stars": 42,
  "forks": 12
}
```

---

#### PUT /api/work/repos/:id
Cập nhật repo

**Auth**: Yes (creator hoặc admin)

---

#### DELETE /api/work/repos/:id
Xóa repo

**Auth**: Yes (Admin only)

---

## 📚 Resources Endpoints

### GET /api/resources
Lấy danh sách tài liệu

**Query Params**:
- `category`: Filter by category (Learning/Media/Tools/Research)
- `type`: Filter by type (Link/Document/Video)

**Example**: `/api/resources?category=Learning&type=Document`

---

### GET /api/resources/categories
Lấy danh sách categories với số lượng

**Response**:
```json
{
  "success": true,
  "data": [
    { "name": "Learning", "count": 15 },
    { "name": "Media", "count": 8 },
    { "name": "Tools", "count": 5 },
    { "name": "Research", "count": 3 }
  ]
}
```

---

### POST /api/resources
Tạo tài liệu mới

**Auth**: Yes

**Body**:
```json
{
  "name": "Solana Development Course",
  "type": "Document",
  "url": "https://drive.google.com/...",
  "size": "2.5GB",
  "category": "Learning"
}
```

---

### PUT /api/resources/:id
Cập nhật tài liệu

**Auth**: Yes (creator hoặc admin)

---

### DELETE /api/resources/:id
Xóa tài liệu

**Auth**: Yes (Admin or Media-Lead)

---

## 🔧 Utility Endpoints

### GET /api/health
Health check endpoint

**Auth**: No

**Response**:
```json
{
  "status": "ok",
  "message": "DSUC Lab Backend is running",
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Name and URL are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Wallet address is required in x-wallet-address header"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Only admins can delete projects"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Member not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Database connection failed"
}
```

---

## 📝 Notes

1. **Timestamps**: Tất cả timestamps đều dùng ISO 8601 format với timezone
2. **UUIDs**: Tất cả IDs đều là UUID v4
3. **Arrays**: Empty arrays được return là `[]`, không phải `null`
4. **Null values**: Fields optional có thể là `null`
5. **Image Upload**: Hỗ trợ cả URL và base64. Base64 sẽ được tự động upload lên Supabase Storage

---

## 🚀 Rate Limits (Future)

Hiện tại chưa có rate limiting. Production nên thêm:
- 100 requests / 15 minutes per IP
- 500 requests / hour per authenticated user
