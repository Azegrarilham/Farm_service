<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'size',
        'size_unit',
        'description',
        'primary_crops',
        'farming_methods',
        'photos',
        'coordinates',
        'established_date',
        'user_id',
    ];

    protected $casts = [
        'size' => 'decimal:2',
        'established_date' => 'date',
        'coordinates' => 'array',
        'primary_crops' => 'array',
        'photos' => 'array',
    ];

    /**
     * Get the user that owns the farm.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the products for the farm.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the crops for the farm.
     */
    public function crops(): HasMany
    {
        return $this->hasMany(Crop::class);
    }
}
