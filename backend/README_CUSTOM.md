# Farm Management Service - Backend

This is the backend API for the Farm Management Service built with Laravel.

## Prerequisites

- PHP >= 8.1
- Composer
- MySQL (XAMPP)
- Laravel requirements

## Setup Instructions

1. Clone the repository
2. Navigate to the backend directory
3. Copy `.env.example` to `.env` and configure your database:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=farm_service
DB_USERNAME=root
DB_PASSWORD=
```

4. Install dependencies:

```
composer install
```

5. Generate application key:

```
php artisan key:generate
```

6. Create storage link:

```
php artisan storage:link
```

7. Run migrations and seed the database:

```
php artisan migrate:fresh --seed
```

8. Start the server:

```
php artisan serve
```

The API will be available at `http://localhost:8000`.

## Default User

A default admin user is created during seeding:

- Email: admin@example.com
- Password: password

## API Endpoints

### Authentication

- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user (protected)
- `POST /api/forgot-password` - Send password reset link
- `POST /api/reset-password` - Reset password
- `GET /api/user` - Get authenticated user (protected)
- `POST /api/user/profile` - Update profile (protected)
- `PUT /api/user/password` - Change password (protected)

### Farms

- `GET /api/farms` - Get all farms (protected)
- `GET /api/farms/{id}` - Get farm by ID (protected)
- `POST /api/farms` - Create a new farm (protected)
- `PUT /api/farms/{id}` - Update farm (protected)
- `DELETE /api/farms/{id}` - Delete farm (protected)

### Products

- `GET /api/products` - Get all products (protected)
- `GET /api/products/{id}` - Get product by ID (protected)
- `POST /api/products` - Create a new product (protected)
- `PUT /api/products/{id}` - Update product (protected)
- `DELETE /api/products/{id}` - Delete product (protected)
- `GET /api/farms/{farmId}/products` - Get products by farm ID (protected)

### Dashboard

- `GET /api/dashboard/statistics` - Get dashboard statistics (protected)
