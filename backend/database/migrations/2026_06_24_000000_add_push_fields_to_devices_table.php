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
        Schema::table('devices', function (Blueprint $table): void {
            $table->string('push_provider')->nullable()->after('last_seen_at');
            $table->text('push_token')->nullable()->after('push_provider');
            $table->json('push_subscription')->nullable()->after('push_token');
            $table->timestampTz('push_updated_at')->nullable()->after('push_subscription');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table): void {
            $table->dropColumn([
                'push_provider',
                'push_token',
                'push_subscription',
                'push_updated_at',
            ]);
        });
    }
};
