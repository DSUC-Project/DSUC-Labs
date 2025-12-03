# 🔥 URGENT: Fix Storage Upload Error

## Lỗi hiện tại:
```
StorageApiError: new row violates row-level security policy
status: 403
```

## Nguyên nhân:
Bucket `avatars` có RLS policies đang BLOCK upload!

---

## ✅ GIẢI PHÁP NHANH NHẤT (2 phút)

### Cách 1: Dùng Dashboard (Dễ nhất)

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project DSUC
3. Click **Storage** (menu trái)
4. Click vào bucket **avatars**
5. Click tab **Configuration**
6. Toggle **"Public bucket"** = **ON** ✅
7. Click **Save**
8. Done! Test lại upload

### Cách 2: Dùng SQL (Nếu cách 1 không work)

1. Mở Supabase Dashboard > SQL Editor
2. New Query
3. Copy paste code này:

```sql
-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'avatars';

-- Delete all restrictive policies
DELETE FROM storage.policies WHERE bucket_id = 'avatars';

-- Add public access policies
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES 
  ('Public Read', 'avatars', 'true', 'SELECT'),
  ('Public Upload', 'avatars', 'true', 'INSERT'),
  ('Public Update', 'avatars', 'true', 'UPDATE'),
  ('Public Delete', 'avatars', 'true', 'DELETE');

-- Verify
SELECT * FROM storage.buckets WHERE name = 'avatars';
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
```

4. Click **RUN**
5. Xem kết quả - bucket phải có `public = true`
6. Done! Test lại

---

## 🧪 TEST

### Test Avatar Upload:
```bash
curl -X PUT https://dsuc-labs-xmxl.onrender.com/api/members/101240059 \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm" \
  -d '{
    "name": "Zah",
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

**Expect**: Status 200, không có error

### Test Finance Submit:
1. Login với wallet Zah
2. Go to /finance
3. Submit request với bill image
4. Expect: No error, request created

---

## 📋 Checklist Đầy Đủ

- [ ] **Step 1**: Chạy `fix_all_rls.sql` (fix table RLS)
- [ ] **Step 2**: Chạy `fix_storage_rls.sql` HOẶC toggle Public = ON
- [ ] **Step 3**: Verify bucket public = true
- [ ] **Step 4**: Test avatar upload
- [ ] **Step 5**: Test finance submit

---

## ❓ Nếu vẫn lỗi

### Check 1: Bucket có public không?
```sql
SELECT name, public FROM storage.buckets WHERE name = 'avatars';
-- Expect: public = true
```

### Check 2: Có policies nào block không?
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
-- Nếu có policies với definition phức tạp → DELETE chúng
-- Chỉ giữ policies với definition = 'true'
```

### Check 3: Backend có dùng đúng bucket không?
```bash
# Check backend logs
https://dashboard.render.com > dsuc-labs > Logs
Search: "avatars"
# Phải thấy: .from('avatars')
# KHÔNG được thấy: .from('dsuc-lab')
```

### Check 4: Supabase credentials đúng không?
```bash
# Kiểm tra env variables trên Render
https://dashboard.render.com > dsuc-labs > Environment
# Phải có:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
```

---

## 🎯 Priority Actions

1. **NGAY BÂY GIỜ**: Toggle "Public bucket" = ON trong Dashboard
2. **SAU ĐÓ**: Test upload avatar
3. **NẾU FAIL**: Chạy SQL fix policies
4. **NẾU VẪN FAIL**: Contact với logs

---

**Status**: ⏳ Chờ fix storage policies  
**ETA**: 2 phút  
**Priority**: 🔴 CRITICAL
