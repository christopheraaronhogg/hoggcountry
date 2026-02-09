<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videohogg_runs', function (Blueprint $table): void {
            $table->id();
            $table->string('run_id', 32)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('status', 24)->default('queued')->index(); // queued | processing | done | failed
            $table->string('storage_disk', 32)->default('public');
            $table->string('base_path', 255);
            $table->string('manifest_path', 255);
            $table->string('manifest_url', 1000)->nullable();
            $table->string('notes_path', 255)->nullable();

            $table->unsignedInteger('uploaded_count')->default(0);
            $table->unsignedInteger('noted_count')->default(0);
            $table->unsignedBigInteger('total_bytes')->default(0);

            $table->string('claimed_by', 120)->nullable()->index();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('claim_expires_at')->nullable()->index();
            $table->timestamp('last_heartbeat_at')->nullable();

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();

            $table->string('output_path', 255)->nullable();
            $table->string('output_url', 1000)->nullable();
            $table->string('failure_code', 80)->nullable();
            $table->text('failure_message')->nullable();

            $table->json('extra')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('videohogg_runs');
    }
};
