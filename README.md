# Farm ERP Application

A comprehensive web application that enables farmers to manage their farm products through a simple interface for tracking and managing farm operations.

## Features

- **Authentication System**
  - User login with secure password storage
  - Password reset capabilities
  - Remember me option

- **User Profile Management**
  - View and edit personal information
  - Change password functionality
  - Profile picture upload

- **Farm Management**
  - Dashboard with farm statistics and recent activities
  - Farm list with sorting and filtering
  - Add, edit, and delete farms
  - Detailed farm view

- **Product Management**
  - Add, edit, and delete products for each farm
  - Track product quantities and values

## Tech Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication

### Backend
- Laravel PHP Framework
- MySQL Database
- Laravel Sanctum for authentication

## Getting Started

### Prerequisites
- Node.js (v14+)
- PHP (v8.2+)
- Composer
- MySQL

### Installation

#### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install PHP dependencies:
   ```
   composer install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   ```

4. Generate application key:
   ```
   php artisan key:generate
   ```

5. Run database migrations:
   ```
   php artisan migrate
   ```

6. Start the backend server:
   ```
   php artisan serve
   ```

#### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Register a new account
2. Log in with your credentials
3. Add farms and products through the user interface
4. Track farm statistics on the dashboard

## Security Features

- Secure authentication with encrypted password storage
- CSRF protection
- XSS prevention
- SQL injection protection
- Input validation

## License

This project is licensed under the MIT License.

## Acknowledgements

- This project uses Tailwind CSS with custom farm-themed colors
- Icons provided by Heroicons

# Farm Management Service

This is a full-stack application for managing farms and their products.

## Project Structure

- `frontend`: Vue.js frontend
- `backend`: Laravel API backend

## Prerequisites

- PHP >= 8.1
- Composer
- Node.js and npm
- MySQL (XAMPP)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   composer install
   ```

3. Create a copy of the .env file:
   ```
   cp .env.example .env
   ```

4. Configure the `.env` file with your database settings (make sure your XAMPP MySQL service is running):
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=farm_service
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. Generate the application key:
   ```
   php artisan key:generate
   ```

6. Run migrations:
   ```
   php artisan migrate:fresh --seed
   ```

7. Create a symbolic link for storage:
   ```
   php artisan storage:link
   ```

8. Start the backend server:
   ```
   php artisan serve
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Testing the Application

1. Make sure both the backend (http://localhost:8000) and frontend (http://localhost:5173) servers are running.

2. Open a web browser and navigate to http://localhost:5173

3. You can login with the default admin account:
   - Email: admin@example.com
   - Password: password

4. Test Endpoints:
   - GET http://localhost:8000/test - Test if API is working
   - POST http://localhost:8000/test-login - Test login functionality
   - GET http://localhost:8000/test-farms - Test retrieving farms

## Troubleshooting

If you encounter a "not found" error when accessing API routes, try:

1. Clear Laravel's caches:
   ```
   php artisan optimize:clear
   ```

2. Restart the Laravel server:
   ```
   php artisan serve
   ```

3. Verify CORS configuration in `backend/config/cors.php` is correctly set up for your frontend URL.

## Authentication

The application now uses a fully implemented authentication system:

1. **Backend**: Laravel Sanctum for API token authentication
2. **Frontend**: React components for login, registration, and password reset

### Default User

A default admin user is created during seeding:
- Email: `admin@example.com`
- Password: `password`

### Protected Routes

All farm and product management features are behind protected routes that require authentication.

### Authentication Flow

1. User logs in or registers
2. Backend validates credentials and returns a token
3. Frontend stores the token in localStorage
4. Token is included in all subsequent API requests
5. Protected routes check for authentication before rendering
6. User can log out, which removes the token

See the [AUTH.md](AUTH.md) file for more detailed documentation.
