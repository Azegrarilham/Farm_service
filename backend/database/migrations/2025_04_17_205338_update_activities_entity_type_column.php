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
        // First check if the entity_type column is an enum
        $connection = Schema::getConnection();
        $prefix = $connection->getTablePrefix();
        $tableWithPrefix = $prefix . 'activities';

        $columnType = $connection->select(
            "SHOW COLUMNS FROM {$tableWithPrefix} WHERE Field = 'entity_type'"
        );

        // If it's an enum, modify it to include 'crop'
        if (!empty($columnType) && strpos($columnType[0]->Type, 'enum') === 0) {
            // Convert entity_type from enum to string to support all entity types
            Schema::table('activities', function (Blueprint $table) {
                $table->string('entity_type', 50)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse since we're just expanding the supported entity types
    }
};
