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
        // Check if the activities table exists
        if (Schema::hasTable('activities')) {
            // Check if the timestamp column exists and remove it
            if (Schema::hasColumn('activities', 'timestamp')) {
                Schema::table('activities', function (Blueprint $table) {
                    $table->dropColumn('timestamp');
                });
            }

            // Check and add missing columns
            Schema::table('activities', function (Blueprint $table) {
                if (!Schema::hasColumn('activities', 'type')) {
                    $table->enum('type', ['create', 'update', 'delete']);
                }

                if (!Schema::hasColumn('activities', 'entity_type')) {
                    $table->string('entity_type');
                }

                if (!Schema::hasColumn('activities', 'entity_id')) {
                    $table->unsignedBigInteger('entity_id');
                }

                if (!Schema::hasColumn('activities', 'entity_name')) {
                    $table->string('entity_name');
                }

                if (!Schema::hasColumn('activities', 'user_id')) {
                    $table->unsignedBigInteger('user_id');
                    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse as we're just ensuring the correct structure
    }
};
