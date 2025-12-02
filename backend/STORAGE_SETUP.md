# Hướng Dẫn Cấu Hình Storage cho Avatar

## Vấn đề
Backend đang upload avatar vào Supabase Storage bucket `avatars`, nhưng có thể bucket chưa tồn tại hoặc chưa có quyền public.

## Giải pháp 1: Cấu hình Supabase Storage (Khuyến nghị)

### Bước 1: Tạo Bucket
1. Mở Supabase Dashboard
2. Vào **Storage** (menu bên trái)
3. Click **Create a new bucket**
4. Bucket name: `avatars`
5. **Bật Public bucket** (toggle ON)
6. Click **Create bucket**

### Bước 2: Cấu hình Policies (Nếu không bật Public)
Nếu bạn không muốn bucket public, tạo policies:

```sql
-- Allow public read
CREATE POLICY "Public Avatar Read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated upload
CREATE POLICY "Authenticated Avatar Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

-- Allow owner update
CREATE POLICY "Owner Avatar Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'avatars');

-- Allow owner delete
CREATE POLICY "Owner Avatar Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'avatars');
```

### Bước 3: Test Upload
```bash
curl -X PUT https://dsuc-labs-xmxl.onrender.com/api/members/101240059 \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm" \
  -d '{
    "name": "Zah",
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

## Giải pháp 2: Dùng External Service (Alternative)

Nếu Supabase Storage phức tạp, có thể dùng service khác:

### ImageBB (Free, Easy)
```typescript
// backend/src/routes/members.ts

async function uploadToImageBB(base64Image: string): Promise<string> {
  const API_KEY = process.env.IMAGEBB_API_KEY; // Get free key from imagebb.com
  const formData = new FormData();
  formData.append('image', base64Image.split(',')[1]); // Remove data:image prefix
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.data.url;
}

// In PUT /:id endpoint, replace Supabase upload with:
if (avatar && avatar.startsWith('data:image')) {
  avatarUrl = await uploadToImageBB(avatar);
  updateData.avatar = avatarUrl;
}
```

### Cloudinary (Professional)
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(base64Image: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'dsuc-avatars',
    resource_type: 'image'
  });
  return result.secure_url;
}
```

## Kiểm tra Backend Log

Khi upload avatar, check backend logs để xem lỗi cụ thể:

1. Vào https://dashboard.render.com
2. Select service: **dsuc-labs**
3. Tab: **Logs**
4. Tìm:
   - `[members.ts] PUT /:id - Start`
   - `[members.ts] Uploading avatar to Supabase Storage`
   - `[members.ts] Avatar uploaded:` (success)
   - hoặc error messages

## Debug Frontend

Mở browser console (F12) khi save profile:

```javascript
// Expected logs:
[MyProfile] Saving profile with avatar: data:image/png;base64,iVBORw0...
[updateCurrentUser] Updating user: 101240059 {...}
[updateCurrentUser] Response status: 200
[updateCurrentUser] Success: {success: true, data: {...}}
```

## Troubleshooting

### Lỗi: "Storage bucket not found"
→ Chưa tạo bucket `avatars` trong Supabase Storage

### Lỗi: "Access denied"  
→ Bucket chưa public hoặc chưa có policies

### Lỗi: "File too large"
→ Resize image trước khi upload (frontend):
```typescript
const resizeImage = (file: File, maxWidth: 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
};
```

### Avatar không hiển thị sau khi save
→ URL không public, check bucket settings

## Khuyến nghị

**Cách đơn giản nhất**: 
1. Vào Supabase Dashboard > Storage
2. Tạo bucket `avatars` 
3. Bật **Public bucket** = ON
4. Done! ✅

**Hoặc**: Dùng ImageBB (free, không cần config)
