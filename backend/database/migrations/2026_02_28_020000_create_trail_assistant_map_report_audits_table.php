<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trail_assistant_map_report_audits', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('map_report_id')->constrained('trail_assistant_map_reports')->cascadeOnDelete();
            $table->string('report_id', 32)->index();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 40)->index();
            $table->string('from_verification', 24)->nullable();
            $table->string('to_verification', 24)->nullable();
            $table->string('note', 280)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['map_report_id', 'created_at'], 'trail_map_report_audits_report_time_idx');
            $table->index(['action', 'created_at'], 'trail_map_report_audits_action_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_assistant_map_report_audits');
    }
};
