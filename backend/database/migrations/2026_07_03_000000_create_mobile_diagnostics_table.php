<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mobile_diagnostics', function (Blueprint $table): void {
            $table->id();
            $table->string('event_id', 80)->nullable()->unique();
            $table->string('install_id', 80)->index();
            $table->string('session_id', 80)->nullable()->index();
            $table->string('category', 40)->index();
            $table->string('name', 80)->index();
            $table->string('severity', 16)->default('info')->index();
            $table->timestamp('occurred_at')->nullable()->index();
            $table->string('app_version', 40)->nullable();
            $table->string('app_build', 40)->nullable();
            $table->string('build_sha', 80)->nullable();
            $table->string('platform', 40)->nullable();
            $table->boolean('native')->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->json('context')->nullable();
            $table->timestamps();

            $table->index(['install_id', 'created_at'], 'mobile_diag_install_time_idx');
            $table->index(['category', 'name', 'created_at'], 'mobile_diag_event_time_idx');
            $table->index(['severity', 'created_at'], 'mobile_diag_severity_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobile_diagnostics');
    }
};
