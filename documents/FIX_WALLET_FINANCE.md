# 🔧 FIX: Wallet Authentication & Finance Database Integration

## ❌ Vấn Đề

1. **Wallet không lưu vào database** - Connect wallet thành công nhưng không persist
2. **Finance operations chỉ lưu local** - Approve/Reject không vào database
3. **Finance history không public** - Chỉ lưu trong browser state

---

## ✅ Giải Pháp

### 1. **Backend - Auto Log Finance History**

#### File: `backend/src/routes/finance.ts`

**Approve Request:**
```typescript
// After updating status to 'completed'
await supabase.from('finance_history').insert({
  requester_id: request.requester_id,
  requester_name: request.requester_name,
  amount: request.amount,
  reason: request.reason,
  date: request.date,
  bill_image: request.bill_image,
  status: 'completed',
  processed_by: req.user!.id,
  processed_by_name: req.user!.name,
  processed_at: new Date().toISOString(),
});
```

**Reject Request:**
```typescript
// Same flow, but status: 'rejected'
```

**Flow:**
1. Admin clicks Approve/Reject
2. Update `finance_requests` table
3. **Automatically** insert into `finance_history` table
4. Frontend refreshes history

---

### 2. **Frontend - Connect to Backend APIs**

#### File: `frontend/store/useStore.ts`

**Changed from local state to API calls:**

**Before (Local Only):**
```typescript
submitFinanceRequest: (req) =>
  set((state) => ({
    financeRequests: [...state.financeRequests, req],
  }))
```

**After (API Call):**
```typescript
submitFinanceRequest: async (req) => {
  const res = await fetch(`${base}/api/finance/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-wallet-address": state.walletAddress,
    },
    body: JSON.stringify({
      amount: req.amount,
      reason: req.reason,
      date: req.date,
      bill_image: req.billImage,
    }),
  });
  // Update local state after success
}
```

**New Functions:**
- ✅ `fetchPendingRequests()` - Load pending từ backend
- ✅ `approveFinanceRequest()` - Call API `/api/finance/approve/:id`
- ✅ `rejectFinanceRequest()` - Call API `/api/finance/reject/:id`

---

### 3. **Frontend - Auto Fetch Data**

#### File: `frontend/pages/Finance.tsx`

```typescript
useEffect(() => {
  if (activeTab === 'pending' && isWalletConnected && currentUser) {
    fetchPendingRequests(); // ✅ Fetch từ backend khi vào tab Pending
  }
}, [activeTab, isWalletConnected, currentUser]);
```

---

## 🔍 Authentication Header

Backend sử dụng header `x-wallet-address` để xác thực:

```typescript
// Frontend gửi
headers: {
  "x-wallet-address": state.walletAddress,
}

// Backend check
const walletAddress = req.headers['x-wallet-address'];
const { data: member } = await supabase
  .from('members')
  .select('*')
  .eq('wallet_address', walletAddress)
  .single();
```

---

## 📊 Data Flow

### Submit Finance Request

```
User fills form + uploads bill
  ↓
Frontend: submitFinanceRequest()
  ↓
POST /api/finance/request
  {
    amount, reason, date, bill_image (base64)
  }
  ↓
Backend: 
  - Upload image to Supabase Storage
  - Insert into finance_requests table
  ↓
Response: { success: true, data: {...} }
  ↓
Frontend: Add to local financeRequests state
```

### Approve Request (Admin)

```
Admin clicks Approve
  ↓
Frontend: approveFinanceRequest(id)
  ↓
POST /api/finance/approve/:id
  ↓
Backend:
  1. Update finance_requests.status = 'completed'
  2. Insert into finance_history (PUBLIC)
  ↓
Frontend:
  - Remove from financeRequests
  - Refresh financeHistory
```

---

## 🗄️ Database Tables

### `finance_requests` (Pending queue)
```sql
- id (UUID)
- requester_id
- requester_name
- amount
- reason
- date
- bill_image
- status ('pending', 'completed', 'rejected')
- processed_by (admin id)
- processed_at
```

### `finance_history` (Public ledger)
```sql
- id (UUID)
- requester_id
- requester_name
- amount
- reason
- date
- bill_image
- status ('completed', 'rejected')
- processed_by (admin id)
- processed_by_name (admin name)
- processed_at
- created_at
```

**Key Difference:**
- `finance_requests` = Temporary, deleted after process
- `finance_history` = Permanent, public record

---

## 🚀 Deployment Checklist

### Backend

1. ✅ Run migration SQL trên Supabase
   ```sql
   -- backend/database/migration_finance_history.sql
   ```

2. ✅ Verify routes mounted:
   ```
   GET  /api/finance/pending
   POST /api/finance/request
   POST /api/finance/approve/:id
   POST /api/finance/reject/:id
   GET  /api/finance-history
   ```

3. ✅ Test với curl:
   ```bash
   # Test auth
   curl -X POST https://your-backend.com/api/auth/wallet \
     -H "Content-Type: application/json" \
     -d '{"wallet_address":"YOUR_WALLET"}'
   
   # Test submit request
   curl -X POST https://your-backend.com/api/finance/request \
     -H "Content-Type: application/json" \
     -H "x-wallet-address: YOUR_WALLET" \
     -d '{"amount":"100000","reason":"Test"}'
   ```

### Frontend

1. ✅ Set environment variable:
   ```env
   VITE_API_BASE_URL=https://dsuc-labs-xmxl.onrender.com
   ```

2. ✅ Build & Deploy:
   ```bash
   npm run build
   vercel --prod
   ```

3. ✅ Test flow:
   - Connect wallet
   - Submit disbursement with bill
   - Admin approve/reject
   - Check history tab (public)

---

## 🐛 Troubleshooting

### ❌ "Wallet address not registered"

**Cause:** Wallet chưa có trong database

**Fix:**
1. Kiểm tra `seed.sql` đã chạy chưa
2. Verify wallet address trong Supabase:
   ```sql
   SELECT id, name, wallet_address 
   FROM members 
   WHERE wallet_address = 'YOUR_WALLET';
   ```

### ❌ Finance request không submit được

**Causes:**
1. Missing `x-wallet-address` header
2. Image quá lớn (>10MB)
3. CORS issues

**Fix:**
```typescript
// Check console logs
console.log('Submitting with wallet:', state.walletAddress);
console.log('Response:', await res.text());
```

### ❌ History không hiển thị

**Causes:**
1. Table `finance_history` chưa tạo
2. Approve/Reject không trigger insert

**Fix:**
1. Run migration SQL lại
2. Check backend logs khi approve
3. Verify data:
   ```sql
   SELECT * FROM finance_history ORDER BY created_at DESC;
   ```

### ❌ Pending requests không load

**Cause:** User không phải admin hoặc không login

**Fix:**
1. Verify role:
   ```sql
   SELECT id, name, role FROM members WHERE wallet_address = 'YOUR_WALLET';
   ```
2. Check middleware `requireAdmin` trong backend

---

## 🔐 Admin Permissions

Chỉ members với role = `'President'`, `'Vice-President'`, hoặc `'Tech-Lead'` mới có thể:
- View pending requests
- Approve/Reject requests

**Check trong code:**
```typescript
// backend/src/middleware/auth.ts
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const adminRoles = ['President', 'Vice-President', 'Tech-Lead'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
};
```

---

## 📈 Testing Plan

### 1. Test Submit (Any Member)
- [ ] Connect wallet
- [ ] Fill form + upload bill image
- [ ] Submit → Verify in Pending tab
- [ ] Check Supabase `finance_requests` table

### 2. Test Approve (Admin Only)
- [ ] Login as admin
- [ ] Go to Pending tab
- [ ] Approve a request
- [ ] Verify:
  - Removed from Pending
  - Appears in History
  - Record in `finance_history` table

### 3. Test Reject (Admin Only)
- [ ] Same as approve, but click Reject
- [ ] Verify status = 'rejected' in history

### 4. Test Public History
- [ ] Logout
- [ ] Go to History tab
- [ ] Should see all approved/rejected records
- [ ] Non-members can also view

---

## 🎯 Next Improvements

- [ ] Real-time updates (Supabase Realtime)
- [ ] Email notifications on approve/reject
- [ ] Export history to CSV
- [ ] Image compression before upload
- [ ] Receipt OCR auto-fill amount

---

**All systems operational! 🚀**
