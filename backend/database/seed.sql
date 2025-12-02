-- DSUC Lab - Seed Data
-- 15 tài khoản cố định với Student ID và Solana wallet addresses
-- LƯU Ý:
-- - ID là mã số sinh viên (Student ID) - Thay bằng mã thật của từng thành viên
-- - Các địa chỉ ví dưới đây là ví dụ, cần thay thế bằng địa chỉ ví thật của các thành viên

-- ============================================
-- DANH SÁCH MÃ NGÂN HÀNG VIỆT NAM (BANK ID)
-- ============================================
-- Dùng cho trường bank_info.bankId để tạo VietQR
--
-- NGÂN HÀNG PHỔ BIẾN:
-- 970422 - MB Bank (Military Bank)
-- 970436 - Vietcombank (VCB)
-- 970415 - Vietinbank (VTB)
-- 970418 - BIDV
-- 970405 - Agribank
-- 970407 - Techcombank
-- 970416 - ACB (Á Châu)
-- 970432 - VPBank
-- 970423 - TPBank
-- 970403 - Sacombank
-- 970448 - OCB (Phương Đông)
-- 970437 - HDBank
-- 970426 - MSB (Maritime Bank)
-- 970433 - VIB (Quốc Tế)
-- 970440 - SeABank
-- 970428 - Nam A Bank
-- 970438 - BaoViet Bank
-- 970429 - SCB (Sài Gòn Thương Tín)
-- 970441 - VietCapitalBank
-- 970443 - SHB (Sài Gòn - Hà Nội)
-- 970406 - DongA Bank
-- 970434 - IndovinaBank
-- 970424 - Shinhan Bank
-- 970439 - Public Bank
-- 970442 - Hong Leong Bank
-- 970419 - NCB (Quốc Dân)
-- 970427 - VietA Bank
-- 970431 - Eximbank
-- 970430 - PGBank (Xăng Dầu Petrolimex)
-- 970414 - Oceanbank
-- 970421 - VRB (Liên Việt Post Bank)
-- 970425 - ABBank (An Bình)
-- 970409 - BacA Bank (Bắc Á)
-- 970412 - PVcomBank (Đại Chúng)
-- 970408 - GPBank (Dầu Khí Toàn Cầu)
-- 970410 - StandardChartered
-- 970411 - Woori Bank
-- 970413 - KienLongBank
-- 970420 - CIMB Bank
-- 970444 - CBBank (Xây Dựng)
-- 970446 - Co-opBank (Hợp Tác)
--
-- Cách dùng trong seed:
-- '{"bankId": "970422", "accountNo": "0123456789", "accountName": "NGUYEN VAN A"}'
--                ↑ Chọn mã ngân hàng phù hợp từ danh sách trên
-- ============================================

-- ============================================
-- DANH SÁCH SKILLS PHỔ BIẾN (Tối đa 5 skills/person)
-- ============================================
-- Dùng cho trường skills: ARRAY['Skill1', 'Skill2', 'Skill3']
--
-- 🔗 WEB3 & BLOCKCHAIN:
-- Solana, Ethereum, Rust, Anchor, Web3.js, ethers.js
-- Smart Contracts, DeFi, NFT, DAO, Token Economics
-- Wallet Integration, On-chain Development, Solidity
-- Blockchain Architecture, Consensus Mechanisms
--
-- 💻 PROGRAMMING LANGUAGES:
-- JavaScript, TypeScript, Python, Rust, Go, Java, C++, C#
-- Solidity, Move, Cairo, Clarity, Vyper
--
-- 🎨 FRONTEND DEVELOPMENT:
-- React, Next.js, Vue.js, Angular, Svelte, Remix
-- HTML/CSS, Tailwind CSS, Sass, Material-UI, Chakra UI
-- Redux, Zustand, Recoil, React Query, SWR
-- Framer Motion, GSAP, Three.js, WebGL
--
-- ⚙️ BACKEND DEVELOPMENT:
-- Node.js, Express, NestJS, Fastify, Koa
-- Python (Django/Flask/FastAPI), Go (Gin/Echo)
-- REST API, GraphQL, gRPC, WebSocket, Socket.io
-- PostgreSQL, MongoDB, Redis, Supabase, Firebase
--
-- 📱 MOBILE DEVELOPMENT:
-- React Native, Flutter, Swift, Kotlin, Expo
-- iOS Development, Android Development
--
-- 🎮 GAME DEVELOPMENT:
-- Unity, Unreal Engine, Godot, C#, C++
-- Game Design, 2D/3D Graphics, Physics Engine
--
-- 🎨 DESIGN & CREATIVE:
-- UI/UX Design, Figma, Adobe XD, Sketch, Photoshop
-- Illustrator, After Effects, Blender, 3D Modeling
-- Graphic Design, Video Editing, Motion Graphics
-- User Research, Wireframing, Prototyping
--
-- 🔧 DEVOPS & INFRASTRUCTURE:
-- Docker, Kubernetes, CI/CD, GitHub Actions, Jenkins
-- AWS, Google Cloud, Azure, Vercel, Netlify
-- Nginx, Apache, Linux, Shell Scripting, Terraform
--
-- 🤖 AI/ML & DATA:
-- Machine Learning, Deep Learning, TensorFlow, PyTorch
-- Data Science, Data Analysis, NumPy, Pandas
-- Natural Language Processing, Computer Vision
-- Data Visualization, Power BI, Tableau
--
-- 🔒 SECURITY & TESTING:
-- Smart Contract Audit, Penetration Testing, Security
-- Testing (Jest/Vitest/Cypress), Test Automation
-- Web Security, Cryptography, Zero-Knowledge Proofs
--
-- 📊 PROJECT MANAGEMENT & SOFT SKILLS:
-- Project Management, Agile, Scrum, Kanban
-- Leadership, Team Management, Communication
-- Public Speaking, Content Writing, Technical Writing
-- Marketing, Community Management, Social Media
-- Event Planning, Business Development, Strategy
-- Research, Documentation, Problem Solving
--
-- 🌐 OTHER SKILLS:
-- Git, GitHub, Version Control, Open Source
-- API Integration, Microservices, System Design
-- Performance Optimization, SEO, Analytics
-- WordPress, Shopify, E-commerce, CMS
--
-- Cách dùng trong seed:
-- ARRAY['React', 'Solana', 'TypeScript', 'UI/UX Design', 'Web3.js']
--         ↑ Chọn tối đa 5 skills phù hợp từ danh sách trên
-- ============================================

-- Xóa dữ liệu cũ (nếu có)
TRUNCATE TABLE finance_requests, bounties, repos, resources, projects, events, members CASCADE;

-- Insert 15 Members với vai trò cố định
-- 1. PRESIDENT (1 người)
INSERT INTO members (id, wallet_address, name, role, avatar, skills, socials, bank_info) VALUES
('101240059', 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm', 'Zah', 'President',
 'https://ibb.co/0RGgzXXg',
 ARRAY['Web3', 'Rust', 'Design'],
 '{"github": "https://github.com/lilzahs", "twitter": "https://x.com/doandanh_zah", "telegram": "https://t.me/doandanh_zah"}',
 '{"bankId": "970422", "accountNo": "06271099999", "accountName": "DOAN DO THANH DANH"}');

-- 2. VICE-PRESIDENT (2 người)
INSERT INTO members (id, wallet_address, name, role, avatar, skills, socials, bank_info) VALUES
('102240396', '9aieBQHrhou4GqRyNGgieXN8nZxK9uxWKHnvoyNL7NNB', 'Jerry', 'Vice-President',
 'https://ibb.co/h1JL46Rq',
 ARRAY['Marketing', 'Operations'],
 '{"github": "https://github.com/jerry-ici", "twitter": "https://x.com/jerryiciii", "telegram": "https://t.me/jerryiciii"}',
 '{"bankId": "970436", "accountNo": "1028328959", "accountName": "LE THI THANH THAI"}'),

('101240060', 'GEeWZoVZq9JQ9RgWy9zzkhvTAnYBKSvS2gzjXetqutFe', 'Thodium', 'Vice-President',
 'https://ibb.co/XxVBkK4b',
 ARRAY['HR Management', 'Event Planning', 'Community', 'Partnership'],
 '{"github": "https://github.com/Th0dium", "twitter": "https://x.com/Th0rdium", "telegram": "https://t.me/Thodium04"}',
 '{"bankId": "970422", "accountNo": "0347373213", "accountName": "NGO VAN NHAT DUY"}');

-- 3. TECH-LEAD (1 người)
INSERT INTO members (id, wallet_address, name, role, avatar, skills, socials, bank_info) VALUES
('102240386', 'CYcvdzKjh8B699tbe3UnYM21Vzcp14JQqy5hXs9iUYBT', 'NekoNora', 'Tech-Lead',
 'https://ibb.co/vSsMY3F',
 ARRAY['Solana', 'Rust', 'React', 'TypeScript', 'System Design'],
 '{"github": "https://github.com/thanhnhat23", "twitter": "https://x.com/ThanhNhat06", "telegram": "https://t.me/ThanhNhat23"}',
 '{"bankId": "970422", "accountNo": "0905700494", "accountName": "LUONG THANH NHAT"}');

-- 4. MEDIA-LEAD (1 người)
INSERT INTO members (id, wallet_address, name, role, avatar, skills, socials, bank_info) VALUES
('101240071', '9YYY8EWz4to5SH7N9K4qAuBNNLLxvVDeJw9TCpvhgDzw', 'Garoz', 'Media-Lead',
 'https://ibb.co/h1TtgxH0',
 ARRAY['Content Creation', 'Social Media', 'Copywriting'],
 '{"github": "https://github.com/Kunsosad", "twitter": "https://x.com/darksans10", "telegram": "https://t.me/Phanconghuy"}',
 '{"bankId": "970422", "accountNo": "0987520146", "accountName": "PHAN CONG HUY"}');

-- 5. MEMBERS (10 người)
INSERT INTO members (id, wallet_address, name, role, avatar, skills, socials, bank_info) VALUES
('123250164', 'FjTD1nP1PTR7cUu13tEBPciNe82sCiQ9qRvpkBeKxwxE', 'dainghia17', 'Member',
 'https://ibb.co/WvTny5wy',
 ARRAY['Editor', 'Media'],
 '{"github": "https://github.com/dainghiax17-hub", "twitter": "https://x.com/dainghiaaa17", "telegram": "https://t.me/dainghiaaa17"}',
 '{"bankId": "970422", "accountNo": "0356041438", "accountName": "HUYNH DAI NGHIA"}'),

('123250208', 'C3mD3SDFjZrRrswBvDTf1p2R8UGhrvpbeqPqBWFg7rMi', 'TruongPhu1003', 'Member',
 'https://ibb.co/ktNTDf9',
 ARRAY['Python', 'AI/ML', 'Data Science'],
 '{"github": "https://github.com/truongphu103", "telegram": "https://t.me/TruongPhu103"}',
 '{"bankId": "970422", "accountNo": "9100320079", "accountName": "NGUYEN NGOC TRUONG PHU"}'),

('106250128', 'CDWSdzuLQ8nzKjc1UCNr8MbedAfEHZiqRFvvToWtnNiW', 'dhiern', 'Member',
 'https://ibb.co/BV7S2tYb',
 ARRAY['Solana', 'Anchor', 'Rust'],
 '{"github": "https://github.com/d-hiern", "twitter": "https://x.com/D_Hiern", "telegram": "https://t.me/D_Hiern"}',
 '{"bankId": "970422", "accountNo": "0812017500", "accountName": "PHAN DUY HIEN"}'),

('102230313', 'BvCFiu95AfJBtXd4z2LyoLTrMahBKUCZJQcnCXSb6z3o', 'dhtphu05', 'Member',
 'https://ibb.co/8L9S1dX1',
 ARRAY['C++', 'Node.js', 'Next.js'],
 '{"github": "https://github.com/dhtphu05", "twitter": "https://x.com/dhtphu05", "telegram": "https://t.me/dhtphu05"}',
 '{"bankId": "970436", "accountNo": "1041537741", "accountName": "DOAN HOANG THIEN PHU"}'),

('102240127', 'DBW3yKvtF5k61PdGYi1VzksGaukUvGT6bN9uwdvD4z5m', 'Kuwongg', 'Member',
 'https://ibb.co/N6n5jcxR',
 ARRAY['C++'],
 '{"github": "https://github.com/Cuongkudo", "twitter": "https://x.com/Cuongkudo123", "telegram": "https://t.me/KuWongg"}',
 '{"bankId": "970415", "accountNo": "100882221015", "accountName": "NGUYEN MANH CUONG"}'),

('102240286', '7JzxzcgN6F1k2r4rPaZEBWmRb5HuCLJX3xVWdoJGGaKi', 'lacachua', 'Member',
 'https://ibb.co/Rp19FZDX',
 ARRAY['Smart Contracts', 'Backend', 'C++'],
 '{"github": "https://github.com/lacachua", "twitter": "https://x.com/sh_jessica", "telegram": "https://t.me/cachuane"}',
 '{"bankId": "970436", "accountNo": "1024557336", "accountName": "NGUYEN THI CAM TUYEN"}'),

('102230323', 'GAc9UQCBQpxkL2eGKFa8xBKKMTjDagA7MjHhGT51xxNc', 'Twii', 'Member',
 'https://ibb.co/990tm2JV',
 ARRAY['Backend', 'PostgreSQL', 'Express'],
 '{"github": "https://github.com/ntthuy29", "twitter": "https://x.com/Thuy292005", "telegram": "https://t.me/thuy2905"}',
 '{"bankId": "970415", "accountNo": "0334105228", "accountName": "NGUYEN THI THUY"}'),

('102240170', '46x1fCbdiooeqjDMsXsap3JEKFxHMCj1QUVwupeMXSP7', 'mtris', 'Member',
 'https://ibb.co/GvVWMJJM',
 ARRAY['Next.js', 'C++'],
 '{"github": "https://github.com/mtris134", "twitter": "https://x.com/mtris134", "telegram": "https://t.me/mtris134"}',
 '{"bankId": "970436", "accountNo": "9365603556", "accountName": "LE MINH TRI"}'),

('102250190', 'DZwUcn3ssXZYdxmnMW3JDwDCjKTx66x7ztLDxvv49B6L', 'fuong', 'Member',
 'https://ibb.co/4ZCD2yvr',
 ARRAY['Rust', 'VibeCode', 'C++'],
 '{"github": "https://github.com/PHUOBG", "twitter": "https://x.com/Phuongloppi", "telegram": "https://t.me/Loppygirll"}',
 '{"bankId": "970422", "accountNo": "0326616401", "accountName": "HOANG THI NGOC PHUONG"}'),

('102240261', 'fHdTXZmGfNmtN5fwErNHzX4RtKyjiWC8sahg7QkQT6K', 'Lilithium', 'Member',
 'https://ibb.co/hJ281n96',
 ARRAY['Design', 'Next.js', 'TypeScript'],
 '{"github": "https://github.com/Liinh-Git", "twitter": "https://x.com/NguynLinh298772", "telegram": "https://t.me/Kaslynna"}',
 '{"bankId": "970422", "accountNo": "0865371670", "accountName": "NGUYEN DO KHANH LINH"}');

-- Verify counts
SELECT 'Members' as table_name, COUNT(*) as count FROM members
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'Bounties', COUNT(*) FROM bounties
UNION ALL
SELECT 'Repos', COUNT(*) FROM repos
UNION ALL
SELECT 'Resources', COUNT(*) FROM resources;

-- Verify member IDs (should show student IDs)
SELECT id, name, role FROM members ORDER BY
  CASE role
    WHEN 'President' THEN 1
    WHEN 'Vice-President' THEN 2
    WHEN 'Tech-Lead' THEN 3
    WHEN 'Media-Lead' THEN 4
    ELSE 5
  END,
  id;
