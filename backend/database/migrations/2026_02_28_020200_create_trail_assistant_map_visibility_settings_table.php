<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trail_assistant_map_visibility_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('share_scope', 16)->default('private')->index();
            $table->string('location_mode', 16)->default('coarse');
            $table->unsignedSmallInteger('visibility_delay_minutes')->default(90);
            $table->timestamps();

            $table->index(['share_scope', 'location_mode'], 'trail_map_visibility_scope_mode_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_assistant_map_visibility_settings');
    }
};
