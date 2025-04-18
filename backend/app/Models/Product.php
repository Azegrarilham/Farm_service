<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'quantity',
        'unit',
        'price',
        'category',
        'farm_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'price' => 'decimal:2',
    ];

    /**
     * Get the farm that owns the product.
     */
    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }
}
