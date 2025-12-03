# 🚀 DEPLOYMENT GUIDE - Finance History & Events Update

## 📋 Tổng Quan Thay Đổi

### 1. ✅ **Finance - Submit Disbursement**
- Thêm upload bill/receipt (bắt buộc)
- Preview ảnh trước khi submit
- Style theo đúng cyber theme

### 2. ✅ **Finance - History Tab** 
- Data được lưu vào database (công khai)
- Tất cả members đều xem được
- Hiển thị status (PAID/REJECTED)

### 3. ✅ **Events - Luma Integration**
- Thêm field Luma Link trong popup tạo event
- Register button redirect đến Luma
- Button disabled nếu không có link

---

## 🗄️ BƯỚC 1: Cập Nhật Database

### Chạy Migration SQL trên Supabase

1. Login vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project **dsuc-lab**
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `backend/database/migration_finance_history.sql`
5. Paste vào SQL Editor
6. Click **Run** hoặc Ctrl+Enter

**Migration sẽ:**
- ✅ Tạo bảng `finance_history` (công khai)
- ✅ Thêm column `luma_link` vào bảng `events`
- ✅ Tạo indexes cho performance

**Verify:**
```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('finance_history', 'events');

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'finance_history';
```

---

## 🔧 BƯỚC 2: Deploy Backend

### 2.1. Commit Changes
```bash
cd backend
git add .
git commit -m "feat: add finance history & luma link support"
git push origin main
```

### 2.2. Deploy lên Render (hoặc platform của bạn)
- Render sẽ tự động detect changes và rebuild
- Hoặc manual deploy từ Render Dashboard

### 2.3. Verify Backend Routes
Test các endpoint mới:

```bash
# Test finance history GET (public)
curl https://dsuc-labs-xmxl.onrender.com/api/finance-history

# Expected response:
{
  "success": true,
  "data": [],
  "count": 0
}
```

**New Routes:**
- `GET /api/finance-history` - Lấy toàn bộ history (public)
- `POST /api/finance-history` - Thêm record (admin only)

---

## 🎨 BƯỚC 3: Deploy Frontend

### 3.1. Build Frontend
```bash
cd frontend
npm run build
```

### 3.2. Deploy lên Netlify/Vercel
```bash
# Nếu dùng Vercel
vercel --prod

# Nếu dùng Netlify
netlify deploy --prod
```

### 3.3. Verify Environment Variables
Đảm bảo `VITE_API_BASE_URL` trỏ đúng backend:
```env
VITE_API_BASE_URL=https://dsuc-labs-xmxl.onrender.com
```

---

## ✅ BƯỚC 4: Testing

### 4.1. Test Finance - Submit Disbursement
1. Login với wallet
2. Vào Finance → Submit tab
3. Fill form + **Upload bill image** (required)
4. Preview image hiển thị
5. Submit → Request vào Pending tab

### 4.2. Test Finance - History
1. Vào Finance → History tab
2. Xem message: "PUBLIC LEDGER: All approved..."
3. History hiển thị đúng format (Status, Amount, Reason, Date)
4. Mọi user đều thấy được (không cần login)

### 4.3. Test Events - Luma Link
1. Click "INITIATE EVENT"
2. Fill form + **Luma Registration Link**
3. Create event
4. Click "REGISTER" button → Redirect sang Luma
5. Nếu không có link → Button disabled

---

## 🐛 Troubleshooting

### ❌ Lỗi: "finance_history table not found"
**Fix:** Chạy lại migration SQL trên Supabase

### ❌ Finance History không hiển thị data
**Fix:** 
1. Check browser console
2. Verify API response: `GET /api/finance-history`
3. Check CORS settings trong backend

### ❌ Upload bill không hoạt động
**Fix:**
1. Image được convert sang base64 (client-side)
2. Check file size < 10MB
3. Verify image format (PNG, JPG, JPEG)

### ❌ Luma link không redirect
**Fix:**
1. Verify link format: `https://lu.ma/...`
2. Check browser popup blocker
3. Xem console có lỗi window.open không

---

## 📊 Database Schema Changes

### New Table: `finance_history`
```sql
CREATE TABLE finance_history (
  id UUID PRIMARY KEY,
  requester_id TEXT,          -- Member who requested
  requester_name TEXT,         -- Cached name
  amount TEXT,                 -- Amount in VND
  reason TEXT,                 -- Justification
  date DATE,                   -- Target date
  bill_image TEXT,             -- Bill/receipt image URL
  status TEXT,                 -- 'completed' | 'rejected'
  processed_by TEXT,           -- Admin who approved/rejected
  processed_by_name TEXT,      -- Admin name
  processed_at TIMESTAMP,      -- When processed
  created_at TIMESTAMP         -- When created
);
```

### Updated Table: `events`
```sql
ALTER TABLE events 
ADD COLUMN luma_link TEXT;  -- Luma registration link
```

---

## 🎯 Next Steps (Future Improvements)

### Finance Module
- [ ] Auto upload ảnh lên Supabase Storage thay vì base64
- [ ] Notification khi request được approve/reject
- [ ] Export history to CSV/PDF
- [ ] Filter history by date range, status, member

### Events Module
- [ ] Sync attendee count từ Luma API
- [ ] Auto create calendar events
- [ ] Email reminder trước event
- [ ] QR code check-in system

---

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs (F12)
2. Verify Supabase connection
3. Test API endpoints với curl/Postman
4. Check database với SQL queries

---

**Happy Coding! 🚀**
