<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trail_assistant_intakes', function (Blueprint $table): void {
            $table->string('idempotency_key', 120)->nullable()->after('intake_id');
            $table->string('dedupe_fingerprint', 64)->nullable()->after('idempotency_key');

            $table->unique('idempotency_key');
            $table->index(['dedupe_fingerprint', 'created_at'], 'trail_assistant_intakes_dedupe_idx');
        });
    }

    public function down(): void
    {
        Schema::table('trail_assistant_intakes', function (Blueprint $table): void {
            $table->dropIndex('trail_assistant_intakes_dedupe_idx');
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn(['idempotency_key', 'dedupe_fingerprint']);
        });
    }
};
