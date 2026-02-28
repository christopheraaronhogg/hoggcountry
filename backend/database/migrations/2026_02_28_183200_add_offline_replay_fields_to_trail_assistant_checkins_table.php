<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trail_assistant_checkins', function (Blueprint $table): void {
            $table->string('idempotency_key', 120)->nullable()->after('checkin_id');
            $table->string('client_event_id', 80)->nullable()->after('idempotency_key');
            $table->boolean('replayed_from_offline')->default(false)->after('source');
            $table->json('sync_metadata')->nullable()->after('replayed_from_offline');

            $table->unique(['user_id', 'idempotency_key'], 'trail_checkins_user_idempotency_unique');
            $table->unique(['user_id', 'client_event_id'], 'trail_checkins_user_client_event_unique');
        });
    }

    public function down(): void
    {
        Schema::table('trail_assistant_checkins', function (Blueprint $table): void {
            $table->dropUnique('trail_checkins_user_idempotency_unique');
            $table->dropUnique('trail_checkins_user_client_event_unique');
            $table->dropColumn(['idempotency_key', 'client_event_id', 'replayed_from_offline', 'sync_metadata']);
        });
    }
};
