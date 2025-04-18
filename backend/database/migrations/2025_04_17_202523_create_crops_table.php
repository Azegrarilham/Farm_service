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
        Schema::create('crops', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->float('quantity');
            $table->string('unit');
            $table->decimal('price', 10, 2);
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->date('available_from')->nullable();
            $table->date('available_until')->nullable();
            $table->boolean('is_organic')->default(false);
            $table->json('images')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crops');
    }
};
