# DSUC Lab Frontend

Frontend cho DSUC Lab - Web3 Student Hub với Solana wallet integration.

## 📋 Yêu cầu hệ thống

- Node.js >= 18.x
- npm hoặc yarn

## 🚀 Quick Start - Local Development

Chỉ cần 3 bước để bắt đầu phát triển local:

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Tạo file .env

```bash
cp .env.example.local .env
```

File `.env` đã được cấu hình sẵn để kết nối với backend local tại `http://localhost:3001`

### 3. Chạy development server

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

### 🎯 Test với Mock Data

Đảm bảo backend đã chạy trước (xem [backend/README.md](../backend/README.md))

Frontend sẽ kết nối với backend local và sử dụng mock data. Bạn có thể test với các wallet address sau:

**Mock Wallet Addresses:**
- **Thodium (Vice-President):** `GEeWZoVZq9JQ9RgWy9zzkhvTAnYBKSvS2gzjXetqutFe`
- **NekoNora (Tech-Lead):** `CYcvdzKjh8B699tbe3UnYM21Vzcp14JQqy5hXs9iUYBT`

## 🔧 Production Deployment

Khi deploy lên production (Vercel, Netlify, etc.):

### 1. Cấu hình Environment Variables

Sử dụng file `.env.example.deployment` làm reference:

```env
VITE_API_BASE_URL=https://dsuc-labs-xmxl.onrender.com
VITE_FRONTEND_URL=https://dsuc.fun
```

### 2. Build

```bash
npm run build
```

Build output sẽ ở trong thư mục `dist/`

## 📁 Cấu trúc Project

```
frontend/
├── src/
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom hooks
│   ├── store/        # Zustand stores
│   ├── utils/        # Utility functions
│   └── App.tsx       # Main App component
├── public/           # Static assets
├── .env.example.local         # Local dev template
├── .env.example.deployment    # Production template
├── package.json
└── vite.config.ts
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library

## 🔧 Available Scripts

### `npm run dev`
Chạy development server với hot reload

### `npm run build`
Build production bundle

### `npm run preview`
Preview production build locally

## 📝 Notes

- Frontend sử dụng Vite, tất cả environment variables phải có prefix `VITE_`
- Khi thay đổi `.env`, cần restart dev server
- Frontend kết nối với backend qua REST API
- Authentication sử dụng Solana wallet (Phantom, Solflare, etc.)

## 📞 Support

Nếu gặp vấn đề, vui lòng liên hệ Tech-Lead hoặc tạo issue trong repository.
