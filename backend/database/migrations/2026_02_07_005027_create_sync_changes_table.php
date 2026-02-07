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
        Schema::create('sync_changes', function (Blueprint $table) {
            $table->bigIncrements('seq');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('doc_type');
            $table->string('doc_id');
            $table->string('op', 16);
            $table->unsignedInteger('schema_version')->default(1);
            $table->timestampTz('server_updated_at');
            $table->json('payload')->nullable();
            $table->string('etag', 64);
            $table->timestamps();

            $table->index(['user_id', 'seq']);
            $table->index(['user_id', 'server_updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_changes');
    }
};
