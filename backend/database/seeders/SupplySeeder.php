<?php

namespace Database\Seeders;

use App\Models\Supply;
use Illuminate\Database\Seeder;

class SupplySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $supplies = [
            [
                'name' => 'Organic Tomato Seeds',
                'description' => 'High-quality organic tomato seeds for planting. These seeds produce juicy, flavorful tomatoes that are perfect for home gardening.',
                'category' => 'Seeds',
                'price' => 5.99,
                'stock_quantity' => 150,
                'unit' => 'packet',
                'images' => json_encode(['tomato-seeds.jpg']),
                'sku' => 'SEED-TOM-001',
                'featured' => true
            ],
            [
                'name' => 'All-Purpose Fertilizer',
                'description' => 'Balanced NPK formula suitable for most crops. Enhances plant growth and improves yield.',
                'category' => 'Fertilizer',
                'price' => 12.99,
                'stock_quantity' => 75,
                'unit' => 'kg',
                'images' => json_encode(['fertilizer.jpg']),
                'sku' => 'FERT-AP-001',
                'featured' => true
            ],
            [
                'name' => 'Garden Trowel Set',
                'description' => 'A set of 3 high-quality stainless steel garden trowels with ergonomic handles.',
                'category' => 'Tools',
                'price' => 24.99,
                'stock_quantity' => 40,
                'unit' => 'set',
                'images' => json_encode(['trowel-set.jpg']),
                'sku' => 'TOOL-TR-001',
                'featured' => false
            ],
            [
                'name' => 'Corn Seeds',
                'description' => 'Premium corn seeds for planting. These seeds produce sweet, delicious corn perfect for summer harvests.',
                'category' => 'Seeds',
                'price' => 4.99,
                'stock_quantity' => 120,
                'unit' => 'packet',
                'images' => json_encode(['corn-seeds.jpg']),
                'sku' => 'SEED-CRN-001',
                'featured' => false
            ],
            [
                'name' => 'Organic Compost',
                'description' => 'Nutrient-rich organic compost to improve soil health and plant growth.',
                'category' => 'Soil & Compost',
                'price' => 8.99,
                'stock_quantity' => 100,
                'unit' => 'kg',
                'images' => json_encode(['compost.jpg']),
                'sku' => 'SOIL-COM-001',
                'featured' => true
            ],
            [
                'name' => 'Garden Hose',
                'description' => '50-foot flexible garden hose with adjustable spray nozzle.',
                'category' => 'Equipment',
                'price' => 29.99,
                'stock_quantity' => 35,
                'unit' => 'item',
                'images' => json_encode(['garden-hose.jpg']),
                'sku' => 'EQUIP-HS-001',
                'featured' => false
            ]
        ];

        foreach ($supplies as $supply) {
            Supply::create($supply);
        }
    }
}
