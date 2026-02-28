<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trail_assistant_checkins', function (Blueprint $table): void {
            $table->string('share_scope', 16)
                ->default('private')
                ->after('source')
                ->index();

            $table->string('share_location_mode', 16)
                ->default('exact')
                ->after('share_scope');

            $table->timestamp('visible_after')
                ->nullable()
                ->after('observed_at')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('trail_assistant_checkins', function (Blueprint $table): void {
            $table->dropIndex('trail_assistant_checkins_share_scope_index');
            $table->dropIndex('trail_assistant_checkins_visible_after_index');
            $table->dropColumn(['share_scope', 'share_location_mode', 'visible_after']);
        });
    }
};
