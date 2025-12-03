# 🚨 KHÔNG CÓ QUYỀN FIX STORAGE RLS

## Vấn đề
```
ERROR: 42501: must be owner of table objects
```

Bạn không có quyền **owner** của Supabase project để disable RLS.

---

## ✅ GIẢI PHÁP 1: Tạo Policy (Qua Dashboard)

### Bước 1: Vào Policies
1. Supabase Dashboard
2. **Database** > **Policies** (menu trái)
3. Hoặc **Authentication** > **Policies**

### Bước 2: Tìm storage.objects
1. Scroll hoặc search: `storage.objects`
2. Xem có policies nào không

### Bước 3: Tạo Policy Mới
1. Click **"New Policy"** (bên cạnh storage.objects)
2. Template: **"For full customization"**
3. Điền form:
   ```
   Policy name: Public Storage Access
   
   Allowed operations: 
   ☑ SELECT
   ☑ INSERT  
   ☑ UPDATE
   ☑ DELETE
   
   Target roles: public
   
   USING expression: true
   
   WITH CHECK expression: true
   ```
4. **Save Policy**

---

## ✅ GIẢI PHÁP 2: Liên Hệ Admin

Nếu không thấy Policies section:

1. Liên hệ **owner** của Supabase project
2. Nhờ họ chạy SQL này:
   ```sql
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   ```
3. Hoặc nhờ họ tạo policy như trên

---

## ✅ GIẢI PHÁP 3: Dùng ImageBB (Temporary)

Nếu không fix được Supabase, tạm thời dùng external service:

### Get Free API Key:
1. Go to: https://imgbb.com/api
2. Sign up (free)
3. Get API key

### Add to Render Environment:
1. Render Dashboard > dsuc-labs > Environment
2. Add variable:
   ```
   IMAGEBB_API_KEY = your_api_key_here
   ```
3. Deploy

### Update Backend Code:

File: `backend/src/middleware/upload.ts`

Thêm function mới:

```typescript
export async function uploadBase64ToImageBB(
  base64String: string
): Promise<string> {
  const API_KEY = process.env.IMAGEBB_API_KEY;
  if (!API_KEY) throw new Error('IMAGEBB_API_KEY not set');

  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

  const formData = new URLSearchParams();
  formData.append('image', base64Data);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const result: any = await response.json();
  
  if (result.success) {
    return result.data.url;
  }
  throw new Error('Upload failed');
}
```

File: `backend/src/routes/members.ts`

Đổi:
```typescript
// OLD
const avatarUrl = await uploadBase64ToSupabase(avatar, 'avatars');

// NEW
const avatarUrl = await uploadBase64ToImageBB(avatar);
```

File: `backend/src/routes/finance.ts`

Đổi tương tự.

---

## 🎯 Khuyến Nghị

**Ưu tiên**: Giải pháp 1 (tạo policy qua Dashboard)

**Nếu không được**: Giải pháp 2 (liên hệ admin)

**Tạm thời**: Giải pháp 3 (ImageBB)

---

## 📞 Cần Giúp Thêm?

Screenshot và gửi:
1. Supabase Dashboard > Database > Policies (toàn bộ màn hình)
2. Supabase Dashboard > Storage > avatars > Configuration
3. Role của tài khoản đang dùng (Owner/Member/Admin?)
