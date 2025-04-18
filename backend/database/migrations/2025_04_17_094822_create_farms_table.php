<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('farms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location');
            $table->decimal('size', 10, 2)->nullable();
            $table->string('size_unit')->default('acres')->nullable();
            $table->text('description')->nullable();
            $table->json('primary_crops')->nullable();
            $table->text('farming_methods')->nullable();
            $table->json('photos')->nullable();
            $table->json('coordinates')->nullable();
            $table->date('established_date')->nullable();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('farms');
    }
};
