# Hướng Dẫn Sửa Lỗi Backend - DSUC Lab

## 🔴 Các Lỗi Hiện Tại

### 1. ❌ Update Profile - 500 Error
**Lỗi**: `PUT /api/members/:id` trả về 500  
**Nguyên nhân có thể**:
- RLS policy chặn update
- Field không hợp lệ
- Avatar upload fail

### 2. ❌ Finance Request - 500 Error  
**Lỗi**: `POST /api/finance/request` trả về 500  
**Nguyên nhân có thể**:
- Table `finance_requests` chưa có RLS policy
- Missing permissions

---

## ✅ Đã Sửa (Frontend)

### 1. Navbar Dropdown Z-Index
**File**: `frontend/components/Layout.tsx`
- Changed: `z-[9100]` → `z-[10000]`
- Bây giờ dropdown luôn hiển thị trên cùng

---

## 🔧 Cần Làm Trên Supabase

### Bước 1: Chạy SQL Fix cho Finance Requests

**File**: `backend/database/fix_finance_rls.sql`

1. Mở Supabase Dashboard → SQL Editor
2. Copy nội dung file `fix_finance_rls.sql`
3. Paste và chạy

```sql
-- Drop existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'finance_requests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON finance_requests', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;

-- Public full access
CREATE POLICY "Public full access for finance_requests"
ON finance_requests FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

### Bước 2: Kiểm Tra Members Table

Chạy query này trên Supabase SQL Editor:

```sql
-- Check current policies on members table
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'members'
ORDER BY tablename, policyname;
```

Nếu không có policy nào hoặc policy quá strict, chạy:

```sql
-- Drop all policies on members
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON members', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Public full access (backend handles auth)
CREATE POLICY "Public full access for members"
ON members FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

---

## 🧪 Testing Backend Locally

### Test Update Profile Endpoint

```bash
# Get your wallet address from frontend after connecting
WALLET_ADDRESS="FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm"
USER_ID="101240059"

curl -X PUT "https://dsuc-labs-xmxl.onrender.com/api/members/${USER_ID}" \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: ${WALLET_ADDRESS}" \
  -d '{
    "name": "Test Name",
    "role": "Member",
    "skills": ["React", "TypeScript"],
    "socials": {
      "github": "https://github.com/test",
      "twitter": "https://x.com/test"
    },
    "bankInfo": {
      "bankId": "970422",
      "accountNo": "0123456789",
      "accountName": "TEST USER"
    }
  }'
```

### Test Finance Request Endpoint

```bash
curl -X POST "https://dsuc-labs-xmxl.onrender.com/api/finance/request" \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: ${WALLET_ADDRESS}" \
  -d '{
    "amount": "100000",
    "reason": "Test request",
    "date": "2025-12-03"
  }'
```

---

## 📊 Check Backend Logs

### Render Dashboard
1. Vào https://dashboard.render.com
2. Chọn service `dsuc-labs-xmxl`
3. Click tab **Logs**
4. Tìm các dòng log:
   - `[PUT /api/members/:id]`
   - `[POST /api/finance/request]`
   - `Supabase error:`

---

## 🔍 Debugging Steps

### 1. Kiểm Tra Wallet Authentication

```typescript
// Frontend - Check wallet address being sent
console.log('Wallet Address:', useStore.getState().walletAddress);
console.log('Is Connected:', useStore.getState().isWalletConnected);
```

### 2. Kiểm Tra Request Payload

Mở Browser DevTools → Network Tab:
- Tìm request `PUT /api/members/...`
- Check Headers → `x-wallet-address` có đúng không
- Check Payload → Data structure có đúng không

### 3. Check Backend Response

Trong Network Tab:
- Click vào failed request
- Tab **Response** → Xem error message chi tiết
- Tab **Preview** → Xem JSON response structure

---

## 🚀 Deploy Backend Changes

Backend code đã được update với logging. Deploy lại:

```bash
cd backend
git add .
git commit -m "Add detailed logging for debugging"
git push origin main
```

Render sẽ auto-deploy. Đợi ~2-3 phút.

---

## ✅ Expected Logs (After Fix)

### Update Profile Success
```
[PUT /api/members/:id] Request body: { name: "...", ... }
[PUT /api/members/:id] User ID: 101240059 Target ID: 101240059
[PUT /api/members/:id] Update data before avatar: { name: "...", ... }
Profile updated successfully
```

### Finance Request Success
```
[POST /api/finance/request] Request from: 101240059 Zah
[POST /api/finance/request] Body: { amount: "...", ... }
[POST /api/finance/request] Request data before image: { ... }
[POST /api/finance/request] Final request data: { ... }
[POST /api/finance/request] Supabase result: { data: {...}, error: null }
Finance request submitted successfully
```

---

## 🆘 Nếu Vẫn Lỗi

### Option 1: Tạo lại Database Tables

**⚠️ WARNING: Sẽ mất data hiện tại**

```sql
-- Drop và tạo lại finance_requests
DROP TABLE IF EXISTS finance_requests CASCADE;

CREATE TABLE finance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id TEXT REFERENCES members(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  reason TEXT,
  date DATE,
  bill_image TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  processed_by TEXT REFERENCES members(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS with public access
ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access for finance_requests"
ON finance_requests FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

### Option 2: Tắt RLS Tạm Thời (Testing Only)

```sql
-- Disable RLS for testing
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_requests DISABLE ROW LEVEL SECURITY;
```

**Nhớ bật lại sau khi test xong!**

---

## 📝 Checklist

Backend Changes:
- [x] Added logging to PUT /api/members/:id
- [x] Added logging to POST /api/finance/request
- [x] Support `role` field in profile update
- [x] Support `bankInfo` camelCase
- [ ] Deploy backend (waiting)

Database Changes:
- [ ] Run fix_finance_rls.sql on Supabase
- [ ] Verify members table policies
- [ ] Test with curl commands

Frontend Changes:
- [x] Navbar dropdown z-index → z-[10000]
- [x] All modals use Portal with stopPropagation
- [x] Social links format check
- [x] Profile update calls API

---

## 📞 Contact

Nếu vẫn gặp lỗi sau khi làm theo hướng dẫn:
1. Copy **toàn bộ** Backend Logs từ Render
2. Copy **Network Tab** response từ Browser DevTools
3. Copy **SQL query result** từ Supabase
4. Gửi cho dev team

**Last Updated**: December 3, 2025
