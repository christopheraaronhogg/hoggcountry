<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trail_assistant_checkins', function (Blueprint $table): void {
            $table->id();
            $table->string('checkin_id', 32)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('lat', 10, 7);
            $table->decimal('lon', 10, 7);
            $table->decimal('mile_marker', 7, 2)->nullable();
            $table->unsignedTinyInteger('battery_percent')->nullable();
            $table->string('status_note', 280)->nullable();
            $table->string('source', 24)->default('mobile_app');
            $table->timestamp('observed_at')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'observed_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_assistant_checkins');
    }
};
