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
        Schema::create('supplies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('category'); // seeds, fertilizer, tools, etc.
            $table->decimal('price', 10, 2);
            $table->integer('stock_quantity');
            $table->string('unit')->default('item');
            $table->json('images')->nullable();
            $table->string('sku')->unique(); // Stock Keeping Unit
            $table->boolean('featured')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplies');
    }
};
