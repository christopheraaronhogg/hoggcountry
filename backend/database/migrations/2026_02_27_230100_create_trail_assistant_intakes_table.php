<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trail_assistant_intakes', function (Blueprint $table): void {
            $table->id();
            $table->string('intake_id', 32)->unique();
            $table->string('route_label', 24)->index();
            $table->string('source', 24)->default('web_form');
            $table->string('name', 120)->nullable();
            $table->string('email', 190)->nullable()->index();
            $table->string('subject', 160);
            $table->text('message');
            $table->json('metadata')->nullable();
            $table->string('status', 24)->default('new')->index();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();

            $table->index(['route_label', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_assistant_intakes');
    }
};
