<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supply extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'category',
        'price',
        'stock_quantity',
        'unit',
        'images',
        'sku',
        'featured',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'featured' => 'boolean',
        'images' => 'array',
    ];

    /**
     * Get the order items for the supply.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the cart items for the supply.
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
