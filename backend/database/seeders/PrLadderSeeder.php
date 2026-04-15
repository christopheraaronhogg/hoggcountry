<?php

namespace Database\Seeders;

use App\Models\PrLadderEntry;
use Illuminate\Database\Seeder;

class PrLadderSeeder extends Seeder
{
    public function run(): void
    {
        $entries = [
            ['athlete' => 'Chris', 'lift' => 'Bench Press', 'weight' => 155],
            ['athlete' => 'Chris', 'lift' => 'Back Squat', 'weight' => 205],
            ['athlete' => 'Chris', 'lift' => 'Deadlift', 'weight' => 245],
            ['athlete' => 'Terran', 'lift' => 'Bench Press', 'weight' => 295],
            ['athlete' => 'Terran', 'lift' => 'Back Squat', 'weight' => 365],
            ['athlete' => 'Terran', 'lift' => 'Deadlift', 'weight' => 405],
        ];

        foreach ($entries as $entry) {
            PrLadderEntry::firstOrCreate($entry, $entry);
        }
    }
}
