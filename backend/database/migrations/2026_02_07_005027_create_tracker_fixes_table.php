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
        Schema::create('tracker_fixes', function (Blueprint $table) {
            $table->id();
            $table->uuid('tracker_id');
            $table->decimal('lat', 10, 7);
            $table->decimal('lon', 10, 7);
            $table->decimal('mile', 8, 2)->nullable();
            $table->timestampTz('observed_at');
            $table->json('raw')->nullable();
            $table->timestamps();

            $table->foreign('tracker_id')->references('id')->on('community_trackers')->cascadeOnDelete();
            $table->index(['tracker_id', 'observed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tracker_fixes');
    }
};
