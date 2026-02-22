# D-international Backend API

Backend API for D-international furniture e-commerce platform with multi-currency support.

## Installation

```bash
cd dinternational-backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

## API Endpoints

### Products
- GET /api/products - Get all products
- POST /api/products - Create product (Protected)
- PUT /api/products/:id - Update product (Protected)
- POST /api/products/:id/images - Add images to product (Protected)
- DELETE /api/products/:id - Delete product (Protected)

Image uploads:
- Send `multipart/form-data` with file fields named `image` or `images`.
- Uploaded files are served from `/uploads/products/<filename>`.
- `POST /api/products` and `PUT /api/products/:id` can include uploaded images and/or a JSON `images` field.
- For `PUT`, set `replaceImages=true` to replace all existing images instead of appending.

### Categories
- GET /api/categories - Get all categories
- POST /api/categories - Create category (Protected)
- PUT /api/categories/:id - Update category (Protected)
- DELETE /api/categories/:id - Delete category (Protected)

### Auth
- POST /api/auth/login - Admin login
- GET /api/auth/me - Get current user

Login: admin / admin123
