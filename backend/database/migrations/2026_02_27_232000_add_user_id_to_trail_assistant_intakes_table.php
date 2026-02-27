<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trail_assistant_intakes', function (Blueprint $table): void {
            $table->foreignId('user_id')
                ->nullable()
                ->after('intake_id')
                ->constrained()
                ->nullOnDelete();

            $table->index(['user_id', 'source', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('trail_assistant_intakes', function (Blueprint $table): void {
            $table->dropIndex('trail_assistant_intakes_user_id_source_created_at_index');
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
