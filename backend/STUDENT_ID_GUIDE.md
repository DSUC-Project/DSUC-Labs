# 🎓 Hướng dẫn sử dụng Student ID làm Member ID

## 📌 Tổng quan

Backend DSUC Lab sử dụng **mã số sinh viên (Student ID)** làm ID chính cho members thay vì UUID ngẫu nhiên.

**Lợi ích:**
- ✅ URL đẹp và dễ nhớ: `https://dsuc.fun/101240059` thay vì `https://dsuc.fun/a3b4c5d6-...`
- ✅ Dễ chia sẻ profile cá nhân
- ✅ Có ý nghĩa thực tế (mã số sinh viên thật)
- ✅ Không thể đoán được các members khác (vì mã số là private info)

## 🔧 Thay đổi trong Database Schema

### Trước đây (UUID):
```sql
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  ...
);
```

### Bây giờ (Student ID):
```sql
CREATE TABLE members (
  id TEXT PRIMARY KEY, -- Mã số sinh viên
  wallet_address TEXT UNIQUE NOT NULL,
  ...
);
```

## 📝 Cách cập nhật Student ID trong seed.sql

### Bước 1: Mở file `backend/database/seed.sql`

### Bước 2: Thay thế mã số sinh viên mẫu

Tìm và thay thế các Student ID sau bằng mã thật của 15 thành viên:

**President:**
```sql
('101240059', 'WALLET_ADDRESS', 'Doan Do Thanh Danh', 'President', ...)
   ↑ Thay bằng mã số sinh viên thật của President
```

**Vice-Presidents:**
```sql
('101240001', 'WALLET_ADDRESS', 'Nguyen Van A', 'Vice-President', ...)
('101240002', 'WALLET_ADDRESS', 'Tran Thi B', 'Vice-President', ...)
```

**Tech-Lead:**
```sql
('101240003', 'WALLET_ADDRESS', 'Le Van Tech', 'Tech-Lead', ...)
```

**Media-Lead:**
```sql
('101240004', 'WALLET_ADDRESS', 'Pham Thi Media', 'Media-Lead', ...)
```

**Members:**
```sql
('101240010', 'WALLET_ADDRESS', 'Hoang Van C', 'Member', ...)
('101240011', 'WALLET_ADDRESS', 'Nguyen Thi D', 'Member', ...)
('101240012', 'WALLET_ADDRESS', 'Tran Van E', 'Member', ...)
...
('101240019', 'WALLET_ADDRESS', 'Pham Thi M', 'Member', ...)
```

### Bước 3: Ví dụ hoàn chỉnh

```sql
INSERT INTO members (id, wallet_address, name, role, avatar, skills, socials, bank_info) VALUES
('101240059', -- ← Mã số sinh viên thật
 '7xKXt...PqR2Y', -- ← Wallet address Solana thật từ Phantom/Solflare
 'Doan Do Thanh Danh', -- ← Tên thật
 'President',
 'https://...',
 ARRAY['Leadership', 'Web3'],
 '{"github": "https://github.com/username", ...}',
 '{"bankId": "970422", "accountNo": "0123456789", "accountName": "DOAN DO THANH DANH"}');
```

## 🌐 URL Structure

### Member Profile URLs

Sau khi setup xong, URLs sẽ có dạng:

```
Frontend: https://dsuc.fun/member/101240059
API:      https://api.dsuc.fun/api/members/101240059
```

### Ví dụ sử dụng:

```typescript
// Frontend - Navigate to member profile
navigate(`/member/${memberId}`); // /member/101240059

// API Call
fetch(`/api/members/101240059`)
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🔐 Security & Privacy

### ✅ An toàn:
- Student ID không phải là thông tin bí mật
- Mỗi member vẫn được xác thực qua wallet address (bí mật)
- Không thể fake ID vì phải có wallet address tương ứng

### ⚠️ Lưu ý:
- Không nên share wallet private key
- Student ID có thể public (giống như username)
- Authentication thực sự vẫn dựa vào wallet signature

## 📊 Database Foreign Keys

Tất cả bảng khác reference đến `members.id` đã được update:

```sql
-- Events
created_by TEXT REFERENCES members(id)

-- Projects
created_by TEXT REFERENCES members(id)

-- Finance Requests
requester_id TEXT REFERENCES members(id)
processed_by TEXT REFERENCES members(id)

-- Bounties
created_by TEXT REFERENCES members(id)

-- Repos
created_by TEXT REFERENCES members(id)

-- Resources
created_by TEXT REFERENCES members(id)
```

## 🧪 Testing

### Test với curl:

```bash
# Get member by student ID
curl http://localhost:3001/api/members/101240059

# Response:
{
  "success": true,
  "data": {
    "id": "101240059",
    "wallet_address": "7xKXt...PqR2Y",
    "name": "Doan Do Thanh Danh",
    "role": "President",
    ...
  }
}
```

### Test trong Frontend:

```typescript
// Get member by student ID
const member = await fetch('/api/members/101240059').then(r => r.json());

// Navigate to profile
<Link to={`/member/${member.id}`}>
  View Profile
</Link>

// URL result: /member/101240059 ✅
```

## 🔄 Migration từ UUID sang Student ID

Nếu bạn đã chạy schema cũ với UUID:

1. Drop tất cả bảng:
```sql
DROP TABLE IF EXISTS finance_requests, bounties, repos, resources, projects, events, members CASCADE;
```

2. Chạy lại `schema.sql` mới
3. Chạy lại `seed.sql` mới với Student IDs

## 💡 Tips & Best Practices

1. **Giữ Student ID nhất quán**
   - Dùng đúng format: 9 chữ số (ví dụ: `101240059`)
   - Không thay đổi sau khi đã tạo
   - Không trùng lặp giữa các members

2. **Backup trước khi migrate**
   ```bash
   # Export data trước khi thay đổi
   pg_dump your_database > backup.sql
   ```

3. **Verify sau khi seed**
   ```sql
   -- Check all member IDs
   SELECT id, name, role FROM members;

   -- Should return student IDs, not UUIDs
   ```

## 🆘 Troubleshooting

### Lỗi: "duplicate key value violates unique constraint"

**Nguyên nhân:** Student ID bị trùng

**Giải pháp:** Đảm bảo mỗi member có Student ID duy nhất

---

### Lỗi: "invalid input syntax for type uuid"

**Nguyên nhân:** Đang dùng schema cũ (UUID) với seed mới (Student ID)

**Giải pháp:** Chạy lại schema.sql mới trước khi seed

---

### Lỗi: "foreign key violation"

**Nguyên nhân:** `created_by` references đến student ID không tồn tại

**Giải pháp:** Đảm bảo member được tạo trước khi tạo projects/events/...

---

**Chúc bạn setup thành công! 🚀**
