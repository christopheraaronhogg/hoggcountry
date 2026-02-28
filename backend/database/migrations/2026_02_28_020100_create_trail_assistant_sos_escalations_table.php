<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trail_assistant_sos_escalations', function (Blueprint $table): void {
            $table->id();
            $table->string('escalation_id', 32)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('idempotency_key', 120)->nullable()->unique();
            $table->string('dedupe_fingerprint', 64)->nullable()->index();
            $table->decimal('lat', 10, 7);
            $table->decimal('lon', 10, 7);
            $table->decimal('mile_marker', 7, 2)->nullable();
            $table->string('message', 600);
            $table->string('contact_method', 24)->default('in_app');
            $table->string('status', 24)->default('pending_review')->index();
            $table->string('severity', 16)->default('emergency');
            $table->boolean('requires_manual_dispatch')->default(true);
            $table->timestamp('triggered_at')->nullable()->index();
            $table->timestamp('cooldown_until')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->json('abuse_flags')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at'], 'trail_sos_user_time_idx');
            $table->index(['status', 'created_at'], 'trail_sos_status_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_assistant_sos_escalations');
    }
};
