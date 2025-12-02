# Fix RLS Policies - Migration Guide

## Vấn đề
- Navbar menu bị che (dropdown menu không hiển thị đúng) ✅ Fixed
- Popup Project và Resources không có nút đóng rõ ràng ✅ Fixed
- Events chỉ hiển thị cho người tạo, không public cho mọi người ⚠️ Cần fix database

## ⚠️ LỖI Khi Chạy Migration

**Error:** `column "uploaded_by" does not exist`

**Nguyên nhân:** 
- Table `resources` dùng column `created_by`, không phải `uploaded_by`
- Table `work` không tồn tại, đúng là table `bounties`

**Giải pháp:** Sử dụng file migration đơn giản hơn

---

## 🎯 CÁCH FIX ĐÚNG

### Option 1: Simple Fix (RECOMMENDED) ⭐

Sử dụng file **`fix_rls_simple.sql`** - Đơn giản nhất, không cần auth headers:

```sql
File: backend/database/fix_rls_simple.sql
```

**Điểm mạnh:**
- ✅ Đơn giản, ít lỗi
- ✅ Public full access cho tất cả tables
- ✅ Không cần wallet authentication headers
- ✅ Phù hợp với API backend

**Cách chạy:**
1. Mở Supabase Dashboard → SQL Editor
2. Copy toàn bộ nội dung `fix_rls_simple.sql`
3. Paste và Run
4. Check kết quả query ở cuối file

### Option 2: Advanced Fix (với wallet auth)

Sử dụng file **`fix_all_public_access.sql`** (đã fix lỗi):

```sql
File: backend/database/fix_all_public_access.sql
```

**Đã fix:**
- ✅ `uploaded_by` → `created_by` trong resources table
- ✅ `work` table → `bounties` table
- ✅ Policies dựa trên wallet_address headers

**Lưu ý:** Cần đảm bảo backend set headers đúng:
```typescript
current_setting('request.headers', true)::json->>'x-wallet-address'
```

---

## 📋 Tables được Fix

| Table | Column cho Auth | Mục đích |
|-------|----------------|----------|
| `events` | `created_by` | Timeline events, workshops |
| `projects` | `created_by` | Club projects showcase |
| `resources` | `created_by` | Knowledge base materials |
| `bounties` | `created_by` | Work/Bounties page |
| `finance_history` | N/A | Public transaction ledger |

---

## 🚀 Cách chạy Migration

### Bước 1: Chọn file migration
- **Recommended:** `fix_rls_simple.sql` (đơn giản nhất)
- **Advanced:** `fix_all_public_access.sql` (nếu muốn auth chi tiết)

### Bước 2: Chạy trên Supabase
1. Mở **Supabase Dashboard** → SQL Editor
2. Copy toàn bộ nội dung file đã chọn
3. Paste vào SQL Editor
4. Click **Run** hoặc `Ctrl/Cmd + Enter`
5. Đợi query chạy xong (~10 giây)

### Bước 3: Verify
Query cuối file sẽ tự động show policies:
```sql
SELECT tablename, policyname, cmd, permissive, roles
FROM pg_policies
WHERE tablename IN ('events', 'projects', 'resources', 'bounties', 'finance_history')
ORDER BY tablename, policyname;
```

**Expected Output:**
- `events` → policy: "Public full access for events"
- `projects` → policy: "Public full access for projects"
- `resources` → policy: "Public full access for resources"
- `bounties` → policy: "Public full access for bounties"
- `finance_history` → policy: "Public read access for finance_history"

---

### Test 1: Events Public Access
1. Người dùng A tạo event mới
2. Người dùng B (chưa connect wallet) vào trang Events
3. ✅ Phải thấy event của người A

### Test 2: Projects Public Access
1. Người A tạo project
2. Người B vào trang Projects
3. ✅ Phải thấy project của người A

### Test 3: Navbar Dropdown
1. Vào desktop mode
2. Click vào "More" trong navbar
3. ✅ Menu dropdown phải hiển thị đúng, không bị che

### Test 4: Modal Close Button
1. Vào Projects → Click "ADD PROJECT"
2. ✅ Phải thấy nút X ở góc trên phải
3. Click nút X hoặc click outside → modal đóng

## Rollback (Nếu cần)

Nếu có vấn đề, bạn có thể quay lại policies cũ:

```sql
-- Restore old policies
DROP POLICY IF EXISTS "Public read access for events" ON events;

CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);
```

## Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy lên Vercel/Netlify
```

### Backend
```bash
cd backend
npm run build
# Render sẽ tự động deploy khi push lên GitHub
```

## Support

Nếu vẫn còn vấn đề:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console: F12 → Console tab
3. Check network requests: F12 → Network tab → Filter XHR

## Summary

✅ **Fixed:**
- Navbar dropdown z-index → menu không bị che
- Modal z-index → popup hiển thị đúng
- Modal close button → rõ ràng hơn
- RLS policies → mọi người đều xem được tất cả content

🔧 **Action Required:**
- Chạy `fix_all_public_access.sql` trên Supabase SQL Editor
- Deploy frontend changes
