# URGENT FIXES SUMMARY - December 3, 2025

## ✅ Đã Fix (Frontend)

### 1. Navbar Dropdown Stacking Context
- **Vấn đề**: Dropdown bị che bởi background effects (blur, transform)
- **Giải pháp**: Dùng ReactDOM.createPortal để render dropdown ngoài DOM tree
- **File**: `frontend/components/Layout.tsx`
- **Kết quả**: Dropdown hiện nay hiển thị trên tất cả content

### 2. Thêm Logging Chi Tiết
- **Vấn đề**: Không biết nguyên nhân avatar và finance request fail
- **Giải pháp**: Thêm console.log chi tiết cho:
  - `MyProfile.tsx` - handleSave với avatar data
  - `Finance.tsx` - handleSubmit với bill image
  - `useStore.ts` - submitFinanceRequest với full data flow
  - `useStore.ts` - updateCurrentUser với request/response
- **Kết quả**: Có thể debug qua browser console

### 3. Khóa Finance Khi Chưa Connect Wallet
- **Vấn đề**: User chưa connect có thể truy cập Finance
- **Giải pháp**: Check `isWalletConnected` và hiển thị locked screen
- **File**: `frontend/pages/Finance.tsx`
- **Kết quả**: Hiển thị "RESTRICTED ACCESS" với icon 🔒

### 4. Popup Thông Báo Wallet Không Phải Thành Viên
- **Vấn đề**: Wallet ngoài 15 wallet cố định vẫn có thể kết nối
- **Giải pháp**: Kiểm tra backend response và hiển thị alert:
  - "❌ BẠN KHÔNG PHẢI LÀ THÀNH VIÊN CLB"
  - "Wallet của bạn không có trong danh sách thành viên"
  - "Hãy đăng ký tham gia để được sử dụng website!"
- **File**: `frontend/store/useStore.ts` - connectWallet function
- **Kết quả**: Wallet không phải member sẽ bị disconnect và hiện popup

### 5. Xóa Fallback Local Matching
- **Vấn đề**: Code có fallback match wallet với mock data
- **Giải pháp**: Xóa fallback, chỉ dùng backend auth
- **File**: `frontend/store/useStore.ts`
- **Kết quả**: 100% auth qua backend

## ⚠️ CẦN FIX (Backend + Database)

### 1. RLS Policies - CRITICAL
**Vấn đề**: Backend trả về 500 error khi:
- Upload avatar (PUT /api/members/:id)
- Submit finance request (POST /api/finance/request)

**Nguyên nhân**: Supabase RLS (Row Level Security) blocking INSERT/UPDATE

**Giải pháp**: Chạy SQL fix trên Supabase

#### Bước 1: Fix Finance Requests Table
```sql
-- File: backend/database/fix_finance_rls.sql
-- Mở Supabase Dashboard > SQL Editor > New Query

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

-- Public full access (backend handles auth)
CREATE POLICY "Public full access for finance_requests"
ON finance_requests FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'finance_requests'
ORDER BY tablename, policyname;
```

#### Bước 2: Fix Members Table (Có thể cần)
```sql
-- Drop existing policies for members table
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

-- Public full access
CREATE POLICY "Public full access for members"
ON members FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'members'
ORDER BY tablename, policyname;
```

#### Bước 3: Fix Storage Bucket (Avatars)
```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';

-- If needed, create public access policy
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'avatars',
  'Public Upload',
  'bucket_id = ''avatars'''
);

-- Or simply make bucket public in Supabase Dashboard:
-- Storage > avatars bucket > Settings > Make public
```

### 2. Deploy Backend Changes
Backend đã có logging mới nhưng chưa deploy:

```bash
cd backend
git add .
git commit -m "Add detailed logging for members and finance endpoints"
git push origin main
```

Render sẽ auto-deploy sau 2-3 phút.

## 🧪 Testing Checklist

### Test 1: Navbar Dropdown
- [ ] Click "More" button
- [ ] Dropdown hiển thị trên tất cả content (không bị che)
- [ ] Click vào các link trong dropdown hoạt động
- [ ] Click ngoài dropdown để đóng

### Test 2: Finance Locked
- [ ] Disconnect wallet
- [ ] Truy cập /finance
- [ ] Thấy màn hình "RESTRICTED ACCESS" với icon 🔒
- [ ] Connect wallet
- [ ] Finance page mở được

### Test 3: Non-Member Wallet
- [ ] Disconnect wallet
- [ ] Connect với wallet KHÔNG có trong 15 members
- [ ] Thấy popup: "❌ BẠN KHÔNG PHẢI LÀ THÀNH VIÊN CLB"
- [ ] Wallet bị disconnect tự động
- [ ] Không thể truy cập website

### Test 4: Member Wallet
- [ ] Connect với 1 trong 15 wallet members
- [ ] Không có popup lỗi
- [ ] Wallet connected thành công
- [ ] Có thể truy cập tất cả pages

### Test 5: Avatar Upload (Sau khi fix RLS)
- [ ] Mở browser console (F12)
- [ ] Go to /profile
- [ ] Upload ảnh avatar mới
- [ ] Click Save
- [ ] Check console logs:
   - `[MyProfile] Saving profile with avatar:`
   - `[updateCurrentUser] Updating user:`
   - `[updateCurrentUser] Response status: 200`
   - `[updateCurrentUser] Success:`
- [ ] Thấy alert "PROTOCOL UPDATED SUCCESSFULLY"
- [ ] Avatar cập nhật thành công
- [ ] Refresh page, avatar vẫn giữ nguyên

### Test 6: Finance Request (Sau khi fix RLS)
- [ ] Mở browser console (F12)
- [ ] Go to /finance
- [ ] Fill form disbursement
- [ ] Upload bill image
- [ ] Click Submit
- [ ] Check console logs:
   - `[Finance] Submitting request with image:`
   - `[submitFinanceRequest] Submitting:`
   - `[submitFinanceRequest] Response status: 200`
   - `[submitFinanceRequest] Success:`
- [ ] Request được tạo thành công
- [ ] Chuyển sang tab Pending
- [ ] Thấy request mới

## 🔍 Debug Commands

### Check Backend Logs
```bash
# Xem logs của Render deployment
# Go to: https://dashboard.render.com
# Select: dsuc-labs service
# Tab: Logs
# Search for:
# - "[members.ts]" for profile updates
# - "[finance.ts]" for finance requests
```

### Check Frontend Logs
```javascript
// In browser console
// Filter logs:
localStorage.debug = '*';  // Show all logs
// Or specific:
localStorage.debug = 'submitFinanceRequest,updateCurrentUser';
```

### Test Backend Direct
```bash
# Get your wallet address
WALLET="FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm"

# Test update member
curl -X PUT https://dsuc-labs-xmxl.onrender.com/api/members/101240059 \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: $WALLET" \
  -d '{
    "name": "Zah Test",
    "role": "President",
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'

# Test submit finance
curl -X POST https://dsuc-labs-xmxl.onrender.com/api/finance/request \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: $WALLET" \
  -d '{
    "amount": "100000",
    "reason": "Test request",
    "date": "2025-12-10",
    "bill_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

## 📝 Summary

### Hoàn thành:
✅ Navbar dropdown hiển thị đúng (Portal solution)  
✅ Finance locked khi chưa connect wallet  
✅ Popup thông báo wallet không phải member  
✅ Logging chi tiết cho debug  
✅ Xóa fallback local auth  

### Đang chờ:
⏳ Fix RLS policies trên Supabase (CRITICAL)  
⏳ Deploy backend với logging mới  
⏳ Test avatar upload  
⏳ Test finance request submit  

### Priority:
1. **HIGHEST**: Fix RLS trên Supabase (chạy SQL)
2. **HIGH**: Deploy backend mới
3. **MEDIUM**: Test toàn bộ flows
4. **LOW**: Monitor logs và optimize

---
**Last Updated**: December 3, 2025
**Status**: Waiting for RLS fix on Supabase
