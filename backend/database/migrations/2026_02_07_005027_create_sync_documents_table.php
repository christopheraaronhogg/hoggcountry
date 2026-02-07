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
        Schema::create('sync_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('doc_type');
            $table->string('doc_id');
            $table->unsignedInteger('schema_version')->default(1);
            $table->json('content')->nullable();
            $table->string('etag', 64);
            $table->timestampTz('client_updated_at');
            $table->timestampTz('server_updated_at');
            $table->uuid('last_device_id')->nullable();
            $table->timestampTz('deleted_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'doc_type', 'doc_id']);
            $table->index(['user_id', 'server_updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_documents');
    }
};
