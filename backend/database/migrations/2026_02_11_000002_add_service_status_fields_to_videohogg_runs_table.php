<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videohogg_runs', function (Blueprint $table): void {
            $table->string('service_status', 32)->default('submitted')->after('status')->index();
            $table->timestamp('service_status_changed_at')->nullable()->after('service_status');
            $table->text('service_status_note')->nullable()->after('service_status_changed_at');

            $table->timestamp('in_hands_at')->nullable()->after('failed_at');
            $table->timestamp('in_progress_at')->nullable()->after('in_hands_at');
            $table->timestamp('packaging_at')->nullable()->after('in_progress_at');
            $table->timestamp('delivered_at')->nullable()->after('packaging_at');
            $table->timestamp('revision_requested_at')->nullable()->after('delivered_at');
            $table->timestamp('service_completed_at')->nullable()->after('revision_requested_at');
            $table->timestamp('blocked_at')->nullable()->after('service_completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('videohogg_runs', function (Blueprint $table): void {
            $table->dropColumn([
                'service_status',
                'service_status_changed_at',
                'service_status_note',
                'in_hands_at',
                'in_progress_at',
                'packaging_at',
                'delivered_at',
                'revision_requested_at',
                'service_completed_at',
                'blocked_at',
            ]);
        });
    }
};
