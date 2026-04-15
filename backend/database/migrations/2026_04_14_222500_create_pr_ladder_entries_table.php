<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pr_ladder_entries', function (Blueprint $table) {
            $table->id();
            $table->string('athlete');
            $table->string('lift');
            $table->unsignedInteger('weight');
            $table->timestamp('achieved_at')->nullable();
            $table->timestamps();

            $table->index(['athlete', 'lift']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pr_ladder_entries');
    }
};
