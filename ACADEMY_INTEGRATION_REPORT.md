# Báo Cáo Tích Hợp Academy Vào dsuc.fun

## 1) Mục tiêu tài liệu
Tài liệu này ghi lại toàn bộ quá trình tích hợp Academy vào web CLB DSUC theo hướng **native component** (chạy chung trong frontend hiện tại), dùng chung người dùng và phiên đăng nhập.

Mục tiêu:
- Người mới vào dự án có thể đọc và hiểu bối cảnh, kiến trúc, phạm vi thay đổi.
- Reviewer có checklist rõ ràng để kiểm tra local end-to-end.
- Làm căn cứ quyết định mở PR vào repo gốc.

## 2) Mục tiêu tích hợp và phạm vi

### 2.1 Mục tiêu đạt được
- Thêm mục **Academy** lên navbar chính của dsuc.fun.
- Tích hợp Academy theo route native trong app hiện tại, không dùng iframe.
- Dùng chung danh tính người dùng (member id/wallet/token) với hệ thống cũ.
- Có API backend để lưu tiến độ học theo user.
- Không làm mất các route/chức năng hiện có của web CLB.

### 2.2 Ngoài phạm vi của đợt này
- Chưa có bộ test tự động đầy đủ (unit/integration/e2e).
- Chưa tối ưu bundle splitting cho Academy (build có cảnh báo chunk lớn).
- Chưa port toàn bộ animation nâng cao từ bản standalone cũ.

## 3) Quyết định kiến trúc

### 3.1 Lựa chọn cuối cùng
Thay vì giữ Academy là app riêng rồi nhúng iframe, dự án chọn:
- Di chuyển Academy vào frontend hiện tại như một module native.
- Gắn route Academy vào router chính.
- Tái sử dụng store/auth context của DSUC web.

Lý do:
- Đồng nhất trải nghiệm đăng nhập và điều hướng.
- Dễ mở rộng dữ liệu người dùng và phân quyền trong tương lai.
- Giảm chi phí vận hành 2 app tách biệt.

### 3.2 Luồng hoạt động tổng quát
1. User vào Academy từ navbar.
2. Frontend render Academy page qua router hiện tại.
3. Progress đọc/ghi local theo identity key (member/wallet/guest).
4. Khi đủ auth, frontend đồng bộ progress với backend.
5. Backend lưu theo cặp duy nhất user_id + track + lesson_id.

## 4) Danh sách thay đổi theo mã nguồn

### 4.1 Frontend: router + navigation
- Thêm route Academy:
  - [frontend/App.tsx](frontend/App.tsx)
- Thêm menu Academy trong navbar:
  - [frontend/components/Layout.tsx](frontend/components/Layout.tsx)

### 4.2 Frontend: module Academy mới
- Pages:
  - [frontend/pages/AcademyHome.tsx](frontend/pages/AcademyHome.tsx)
  - [frontend/pages/AcademyTrack.tsx](frontend/pages/AcademyTrack.tsx)
  - [frontend/pages/AcademyLesson.tsx](frontend/pages/AcademyLesson.tsx)
- Layout/UI:
  - [frontend/components/academy/layout/AcademyLayout.tsx](frontend/components/academy/layout/AcademyLayout.tsx)
  - [frontend/components/academy/LessonAnimation.tsx](frontend/components/academy/LessonAnimation.tsx)
  - [frontend/components/academy/ui/Card.tsx](frontend/components/academy/ui/Card.tsx)
  - [frontend/components/academy/ui/Button.tsx](frontend/components/academy/ui/Button.tsx)
  - [frontend/components/academy/ui/Badge.tsx](frontend/components/academy/ui/Badge.tsx)
  - [frontend/components/academy/ui/trackStyle.ts](frontend/components/academy/ui/trackStyle.ts)
- Domain logic:
  - [frontend/lib/academy/curriculum.ts](frontend/lib/academy/curriculum.ts)
  - [frontend/lib/academy/md.tsx](frontend/lib/academy/md.tsx)
  - [frontend/lib/academy/checklist.ts](frontend/lib/academy/checklist.ts)
  - [frontend/lib/academy/progress.ts](frontend/lib/academy/progress.ts)
- CSS hỗ trợ:
  - [frontend/index.css](frontend/index.css)

### 4.3 Backend: API progress
- Mount route Academy:
  - [backend/src/index.ts](backend/src/index.ts)
- API progress:
  - [backend/src/routes/academy.ts](backend/src/routes/academy.ts)
- Mở rộng mock DB để chạy local:
  - [backend/src/mockDb.ts](backend/src/mockDb.ts)

Endpoint mới:
- `GET /api/academy/progress`
- `POST /api/academy/progress`

### 4.4 Database: schema và migration
- Cập nhật schema chính:
  - [backend/database/schema.sql](backend/database/schema.sql)
- Migration cho môi trường đã có DB:
  - [backend/database/migration_academy_progress.sql](backend/database/migration_academy_progress.sql)

Bảng mới `academy_progress` gồm:
- `user_id`
- `track` (`genin` | `chunin` | `jonin`)
- `lesson_id`
- `lesson_completed`
- `quiz_passed`
- `checklist`
- `xp_awarded`
- `created_at`, `updated_at`
- unique key: `(user_id, track, lesson_id)`

## 5) Các vấn đề kỹ thuật đã xử lý (hardening)

### 5.1 Chống cộng XP lặp
Vấn đề:
- Bấm Finish nhiều lần cùng lesson có nguy cơ cộng XP nhiều lần.

Đã xử lý:
- Chỉ cộng XP khi lesson chưa completed.
- Disable nút Finish nếu lesson đã hoàn thành.

File:
- [frontend/lib/academy/progress.ts](frontend/lib/academy/progress.ts)
- [frontend/pages/AcademyLesson.tsx](frontend/pages/AcademyLesson.tsx)

### 5.2 Merge local/remote tránh mất tiến độ
Vấn đề:
- Lấy remote state rồi ghi đè thẳng có thể làm mất tiến độ local mới hơn.

Đã xử lý:
- Thêm hàm merge progress theo hướng giữ trạng thái mạnh hơn.
- Save lại merged state vào local.

File:
- [frontend/lib/academy/progress.ts](frontend/lib/academy/progress.ts)
- [frontend/pages/AcademyLesson.tsx](frontend/pages/AcademyLesson.tsx)

### 5.3 Backfill progress local lên server
Vấn đề:
- User có progress local từ trước, sau login chỉ sync lesson hiện tại thì dữ liệu cũ vẫn nằm local.

Đã xử lý:
- Thêm luồng backfill các row local chưa có trên server.

File:
- [frontend/pages/AcademyLesson.tsx](frontend/pages/AcademyLesson.tsx)

### 5.4 Xử lý no-row an toàn trên Supabase
Vấn đề:
- `.single()` không phải lúc nào cũng trả mã `404` cho trường hợp không có row.

Đã xử lý:
- Bổ sung check nhận diện no-row theo nhiều pattern (`404`, `PGRST116`, thông điệp no rows).

File:
- [backend/src/routes/academy.ts](backend/src/routes/academy.ts)

## 6) Hướng dẫn chạy local để review

### 6.1 Điều kiện
- Node.js + npm
- Đã clone repo

### 6.2 Chạy backend (mock mode)
```powershell
Set-Location d:/DSUC-Labs/backend
$env:USE_MOCK_DB='true'
npm install
npm run dev
```

Backend mặc định: `http://localhost:3001`

Lưu ý:
- Nếu không dùng mock mode thì cần cấu hình Supabase env đầy đủ.

### 6.3 Chạy frontend
```powershell
Set-Location d:/DSUC-Labs/frontend
npm install
npm run dev
```

Frontend mặc định: `http://localhost:3000`

### 6.4 Build check trước khi review PR
```powershell
Set-Location d:/DSUC-Labs/frontend
npm run build

Set-Location d:/DSUC-Labs/backend
npm run build
```

Expected:
- Frontend build pass (có thể có warning chunk size).
- Backend TypeScript build pass.

## 7) Checklist kiểm thử thủ công

### 7.1 Regression route cũ
Kiểm tra các route:
- `/home`
- `/members`
- `/events`
- `/projects`
- `/resources`
- `/finance`
- `/work`

Expected: vào được, không lỗi render.

### 7.2 Điều hướng Academy
- Navbar có mục Academy.
- Click Academy vào được page chính.

### 7.3 Route Academy
Kiểm tra:
- `/academy`
- `/academy/track/genin`
- `/academy/learn/genin/m1-blockchain-as-a-computer`

Expected: render đầy đủ, quiz/chuyển lesson hoạt động.

### 7.4 Auth behavior của API progress
Không auth:
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/academy/progress
```
Expected: `401`

Có wallet header hợp lệ:
```powershell
$wallet='FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm'
Invoke-WebRequest -UseBasicParsing -Headers @{ 'x-wallet-address'=$wallet } http://localhost:3001/api/academy/progress
```
Expected: `200`

### 7.5 Idempotent XP
1. Hoàn thành lesson và bấm Finish.
2. Bấm Finish lại.

Expected:
- XP không tăng thêm lần 2.
- Không sinh row duplicate.

### 7.6 Merge + backfill
1. Tạo progress local trước khi login.
2. Login để bật remote sync.
3. Mở lại lesson bất kỳ để trigger sync.

Expected:
- Progress local không bị mất.
- Dữ liệu local thiếu trên server được backfill.

## 8) Kết quả kiểm tra đã ghi nhận
- Frontend build: PASS
- Backend build: PASS
- Smoke route frontend (cũ + Academy): PASS
- API backend cũ: PASS
- `GET /api/academy/progress` chưa auth: PASS (`401` đúng kỳ vọng)
- `POST/GET /api/academy/progress` có auth wallet: PASS
- Gửi lặp progress cùng lesson: row không tăng, XP không bị cộng lặp

## 9) Đánh giá mức sẵn sàng PR

### 9.1 Có thể PR ngay
- Phạm vi thay đổi rõ ràng, tập trung đúng mục tiêu Academy.
- Không thấy regression ở luồng chính qua build + smoke test.
- Có migration DB kèm theo.

### 9.2 Nội dung nên có trong PR description
- Mục tiêu: Academy native + shared user context.
- Danh sách thay đổi chính frontend/backend/database.
- Hướng dẫn reviewer chạy local (mock mode).
- Bằng chứng kiểm thử (build + smoke + auth behavior).
- Lưu ý warning bundle size.

## 10) Rủi ro còn lại và hướng cải tiến
- Chưa có test tự động đầy đủ cho Academy.
- Chưa có batch API sync progress (đang gọi nhiều POST cho backfill).
- Chưa tối ưu chia nhỏ bundle Academy.
- Chưa port toàn bộ animation nâng cao từ module gốc.

## 11) Kế hoạch rollback nhanh
Nếu cần rollback:
1. Gỡ route Academy + navbar item:
   - [frontend/App.tsx](frontend/App.tsx)
   - [frontend/components/Layout.tsx](frontend/components/Layout.tsx)
2. Gỡ mount route backend:
   - [backend/src/index.ts](backend/src/index.ts)
   - [backend/src/routes/academy.ts](backend/src/routes/academy.ts)
3. Không áp dụng migration trên production mới.
4. Nếu migration đã chạy, có thể giữ bảng nhưng tắt expose route trong code.

## 12) Phụ lục API

### 12.1 Payload POST /api/academy/progress
```json
{
  "track": "genin",
  "lesson_id": "m1-blockchain-as-a-computer",
  "lesson_completed": true,
  "quiz_passed": true,
  "checklist": [true, true, true],
  "xp_awarded": 100
}
```

### 12.2 Ví dụ response GET /api/academy/progress
```json
{
  "success": true,
  "data": {
    "user_id": "101240059",
    "xp": 100,
    "rows": [
      {
        "track": "genin",
        "lesson_id": "m1-blockchain-as-a-computer",
        "lesson_completed": true,
        "quiz_passed": true,
        "checklist": [true, true, true],
        "xp_awarded": 100
      }
    ]
  }
}
```

---
Tài liệu này dùng trực tiếp cho review kỹ thuật, QA local và chuẩn bị PR vào repo gốc.
