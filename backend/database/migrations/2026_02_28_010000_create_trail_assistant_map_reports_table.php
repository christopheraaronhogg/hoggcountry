<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trail_assistant_map_reports', function (Blueprint $table): void {
            $table->id();
            $table->string('report_id', 32)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('idempotency_key', 120)->nullable()->unique();
            $table->string('dedupe_fingerprint', 64)->nullable()->index();
            $table->decimal('lat', 10, 7);
            $table->decimal('lon', 10, 7);
            $table->decimal('mile_marker', 7, 2)->nullable();
            $table->string('kind', 32)->index();
            $table->string('severity', 16)->index();
            $table->string('message', 280)->nullable();
            $table->string('source', 24)->default('mobile_app');
            $table->string('verification', 24)->default('unverified')->index();
            $table->string('status', 16)->default('active')->index();
            $table->timestamp('occurred_at')->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'verification', 'created_at'], 'trail_map_reports_feed_idx');
            $table->index(['user_id', 'created_at'], 'trail_map_reports_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_assistant_map_reports');
    }
};
