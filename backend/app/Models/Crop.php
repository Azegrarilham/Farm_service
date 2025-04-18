<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Crop extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'quantity',
        'unit',
        'price',
        'farm_id',
        'available_from',
        'available_until',
        'is_organic',
        'images',
    ];

    protected $casts = [
        'quantity' => 'float',
        'price' => 'float',
        'is_organic' => 'boolean',
        'images' => 'array',
        'available_from' => 'date',
        'available_until' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the farm that owns the crop.
     */
    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }
}
