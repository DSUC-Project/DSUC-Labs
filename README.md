# DSUC Lab - Web3 Student Hub Documentation

Tài liệu này mô tả chi tiết chức năng Frontend và hướng dẫn sử dụng Backend API đã được xây dựng sẵn.

---

# PHẦN 1: HƯỚNG DẪN SỬ DỤNG FRONTEND ( UI/UX MANUAL )

## 1. Global Navigation (Thanh điều hướng)
- **Logo (Góc trái):** Chuyển hướng về trang chủ (`/home`).
- **Menu Links:**
  - `Dashboard`: Trang tổng quan.
  - `Members`: Danh sách thành viên.
  - `Projects`: Danh sách dự án CLB.
  - `Events`: Dòng thời gian sự kiện.
  - `Finance`: Công cụ tài chính & minh bạch quỹ.
  - `Work`: Bounties (Việc làm) & Mã nguồn mở.
  - `Resources`: Kho tài liệu.
- **Nút "CONNECT" (Góc phải - Màu vàng):**
  - *Tác dụng:* Mở popup chọn ví (Phantom/Solflare).
  - *Logic hiện tại:* Khi bấm chọn ví, hệ thống sẽ **giả lập** đăng nhập vào tài khoản đầu tiên trong danh sách Mock Data (Alex Nguyen).
- **User Pill (Sau khi đăng nhập):**
  - Hiển thị Avatar + Tên người dùng.
  - *Tác dụng:* Bấm vào để chuyển tới trang **My Profile**.

## 2. Page: Dashboard (`/home`)
- **Nút "JOIN WITH US":** Mở link Google Form tuyển thành viên (Tab mới).
- **Nút "FANPAGE":** Mở Facebook của CLB (Tab mới).
- **Stats Tickers:** Hiển thị số liệu tĩnh (15 Hackers, 10+ Projects, 5+ Interns).
- **Incoming Transmissions:** Hiển thị 3 sự kiện gần nhất (Lấy từ mảng `events` và sort theo ngày). Bấm vào card sự kiện sẽ chuyển sang trang `/events`.

## 3. Page: Members (`/members`)
- **Thẻ thành viên:**
  - Hiển thị Avatar, Tên, Role, Skill chính, Social icon.
  - *Tác dụng:* Bấm vào bất kỳ đâu trên thẻ để xem chi tiết (`/member/:id`).

## 4. Page: Member Detail (`/member/:id`)
- **Nút "Return to Directory":** Quay lại trang Members.
- **Khối thông tin:** Hiển thị chi tiết Skill Matrix, Social Links (Github/X/Tele).
- **Nút "Request Collaboration":** (Hiện tại chỉ là UI) Dùng để gửi yêu cầu hợp tác.

## 5. Page: My Profile (`/profile`)
Trang này chỉ truy cập được khi đã Connect Wallet.
- **Nút "TERMINATE" (Đỏ):** Đăng xuất khỏi hệ thống (Xóa state `currentUser`).
- **Nút "UPDATE PROTOCOL" (Vàng):** Lưu các thay đổi vào bộ nhớ tạm (State).
- **Avatar Upload:** Bấm vào hình tròn để tải ảnh từ máy tính lên (Lưu dạng base64 string tạm thời).
- **Identity Module:**
  - *Operative Name:* Sửa tên hiển thị.
  - *Assigned Role:* Chọn Role (President, Tech-Lead, v.v.).
- **Financial Protocol (Quan trọng):**
  - *Bank Institute:* Chọn ngân hàng (MB, VCB, v.v.).
  - *Account Number:* Nhập số tài khoản.
  - *Tác dụng:* Dữ liệu này sẽ được dùng để tạo mã QR ở trang Finance khi người khác muốn chuyển tiền cho bạn.
- **Skill Matrix:** Chọn tối đa 5 kỹ năng.
- **Comms Link:** Nhập full URL profile mạng xã hội.

## 6. Page: Projects (`/projects`)
- **Nút "ADD PROJECT":** Mở Popup nhập thông tin dự án mới.
  - *Fields:* Name, Description, Category, Builders, Demo Link, Repo Link.
  - *Logic:* Thêm vào mảng `projects`.
- **Project Card:** Bấm vào để xem chi tiết (`/project/:id`).

## 7. Page: Project Detail (`/project/:id`)
- **Nút Share (Icon góc phải ảnh):** Copy link hiện tại vào clipboard.
- **Nút "INITIALIZE DEMO":** Mở link Demo dự án.
- **Nút "ACCESS SOURCE":** Mở link GitHub Repo (Nếu có).

## 8. Page: Events (`/events`)
- **Nút "INITIATE EVENT":** Mở Popup tạo sự kiện mới.
  - *Fields:* Title, Date, Time, Location.
  - *Logic:* Thêm vào mảng `events`.
- **Nút "REGISTER" (Trên card):** Nút UI (Chưa có logic backend).

## 9. Page: Finance (`/finance`)
Gồm 4 Tabs chức năng:
1.  **Tab Submit (Mặc định):** Form gửi yêu cầu hoàn tiền/thanh toán.
    - *Input:* Số tiền, Ngày, Lý do.
    - *Nút "ENCRYPT & SUBMIT":* Gửi yêu cầu vào danh sách Pending.
2.  **Tab Direct (Quick Transfer):** Chuyển tiền nhanh cho thành viên.
    - *Chọn thành viên:* List hiển thị những ai đã cập nhật Bank Info ở trang Profile.
    - *Input:* Số tiền, Lời nhắn, Upload ảnh bill.
    - *Nút "GENERATE QR CODE":* Tạo mã VietQR cá nhân của thành viên đó để bạn quét và trả tiền.
3.  **Tab Pending:** Danh sách các yêu cầu chờ duyệt (Admin view).
    - *Nút Mũi tên:* Xem chi tiết yêu cầu.
    - *Trong chi tiết:*
      - *Nút REJECT:* Từ chối yêu cầu.
      - *Nút TRANSFER (GEN QR):* Chấp nhận. Hệ thống sẽ lấy Bank Info của **Người yêu cầu** để tạo mã QR. Admin quét mã này để chuyển khoản trả lại tiền cho thành viên. Sau khi quét xong bấm "Confirm Transfer" để hoàn tất.
4.  **Tab History:** Lịch sử các giao dịch đã Approve hoặc Reject.

## 10. Page: Work (`/work`)
- **Tabs:** Active Bounties (Việc làm) / Open Source Repos.
- **Nút "ADD BOUNTY" / "ADD REPO":** Thêm mới tương ứng.
- **Bounty Card:** Hiển thị Reward, Difficulty, Tags.

## 11. Page: Resources (`/resources`)
- **Filter Tabs:** Lọc theo category (Learning, Media, v.v.).
- **Nút "ADD":** Thêm tài liệu mới (Link Drive, Docs).

---

# PHẦN 2: HƯỚNG DẪN BUILD BACKEND (NODE.JS + SUPABASE)

Backend đã được xây dựng sẵn với mock data để phát triển local. Khi deploy production cần kết nối Supabase.

**Xem hướng dẫn setup chi tiết:**
- **Backend Setup & API:** [backend/README.md](./backend/README.md)
- **Frontend Setup:** [frontend/README.md](./frontend/README.md)

## BƯỚC 1: SUPABASE DATABASE SCHEMA

Vào Supabase > SQL Editor và chạy đoạn script sau để tạo bảng:

```sql
-- 1. Bảng Members (Thông tin thành viên)
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  avatar TEXT, -- Lưu URL ảnh
  skills TEXT[], -- Mảng chuỗi: ['React', 'Rust']
  socials JSONB, -- { "github": "...", "twitter": "..." }
  bank_info JSONB, -- { "bankId": "970422", "accountNo": "000..." }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  type TEXT,
  location TEXT,
  attendees INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  builders TEXT[], -- Mảng tên người làm
  link TEXT,
  repo_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Finance Requests
CREATE TABLE finance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES members(id), -- Link tới bảng members
  requester_name TEXT, -- Cache tên để đỡ query lại
  amount TEXT NOT NULL,
  reason TEXT,
  date DATE,
  bill_image TEXT, -- URL ảnh minh chứng
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng Bounties
CREATE TABLE bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  reward TEXT,
  difficulty TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng Repos
CREATE TABLE repos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng Resources
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  url TEXT,
  size TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## BƯỚC 2: NODE.JS API ENDPOINTS MAPPING

Backend đã có sẵn các API endpoints. Dưới đây là mapping giữa các nút trên Frontend và API cần gọi:

### 1. Members & Auth
- **GET** `/api/members` -> Trả về danh sách cho trang `/members`.
- **GET** `/api/members/:id` -> Trả về chi tiết cho trang `/member/:id`.
- **PUT** `/api/members/:id` -> Dùng cho nút **"UPDATE PROTOCOL"** ở trang `/profile`.
  - *Body:* `{ name, role, skills, socials, bank_info, avatar }`
  - *Lưu ý:* Xử lý upload ảnh Avatar lên Supabase Storage trước, sau đó lưu URL vào DB.

### 2. Projects
- **GET** `/api/projects` -> Load trang `/projects`.
- **POST** `/api/projects` -> Dùng cho nút **"ADD PROJECT"**.
- **GET** `/api/projects/:id` -> Load trang `/project/:id`.

### 3. Events
- **GET** `/api/events` -> Load trang `/events` và Dashboard ticker.
- **POST** `/api/events` -> Dùng cho nút **"INITIATE EVENT"**.

### 4. Finance (Phức tạp nhất)
- **POST** `/api/finance/request` -> Dùng cho nút **"ENCRYPT & SUBMIT"** (Tab Submit).
  - *Body:* `{ requester_id, amount, reason, date }`
- **GET** `/api/finance/pending` -> Load dữ liệu cho **Tab Pending**.
  - *Query:* `SELECT * FROM finance_requests WHERE status = 'pending'`
- **POST** `/api/finance/approve/:id` -> Dùng cho nút **"Confirm Transfer"** trong modal (Tab Pending).
  - *Action:* Update status = 'completed'.
- **POST** `/api/finance/reject/:id` -> Dùng cho nút **"REJECT"** trong modal.
  - *Action:* Update status = 'rejected'.
- **GET** `/api/finance/history` -> Load dữ liệu cho **Tab History**.

### 5. Work & Resources
- **GET/POST** `/api/bounties` -> Trang Work (Bounties).
- **GET/POST** `/api/repos` -> Trang Work (Repos).
- **GET/POST** `/api/resources` -> Trang Resources.

## BƯỚC 3: KẾT NỐI FRONTEND VỚI BACKEND

Frontend kết nối với backend thông qua biến môi trường `VITE_API_BASE_URL` trong file `.env`:

```env
# Local development
VITE_API_BASE_URL=http://localhost:3001

# Production
VITE_API_BASE_URL=https://your-backend-url.com
```

**Ví dụ sửa Action `addProject`:**

*Code hiện tại (Mock):*
```typescript
addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
```

*Code mới (Real Backend):*
```typescript
fetchProjects: async () => {
  const res = await fetch('YOUR_API_URL/api/projects');
  const data = await res.json();
  set({ projects: data });
},

addProject: async (projectData) => {
  // 1. Gọi API tạo mới
  const res = await fetch('YOUR_API_URL/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData)
  });
  const newProject = await res.json();
  
  // 2. Cập nhật Store
  set((state) => ({ projects: [...state.projects, newProject] }));
}
```

**Lưu ý quan trọng:**
1.  **Authentication:** Hiện tại Frontend đang giả lập đăng nhập (`currentUser = MEMBERS[0]`). Khi làm thật, bạn cần dùng `supabase.auth.signInWithPassword` hoặc Wallet Adapter thật sự để lấy User ID, sau đó query bảng `members` để lấy thông tin profile.
2.  **Image Upload:** Các nút Upload ảnh (Profile, Bill Proof) hiện đang dùng `FileReader` để tạo base64. Khi làm thật, hãy upload file lên server (hoặc Supabase Storage bucket), lấy URL trả về, rồi mới gửi URL đó vào API tạo/sửa dữ liệu.
