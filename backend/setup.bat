@echo off
REM Create storage link
php artisan storage:link

REM Run migrations
php artisan migrate:fresh --seed

REM Start server
php artisan serve
