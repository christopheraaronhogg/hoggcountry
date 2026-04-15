<?php

namespace App\Http\Controllers;

use App\Models\PrLadderEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrLadderController extends Controller
{
    private const ATHLETES = ['Chris', 'Terran', 'Austin'];
    private const LIFTS = ['Bench Press', 'Back Squat', 'Deadlift'];

    public function index(): Response
    {
        $entries = PrLadderEntry::query()
            ->orderByDesc('weight')
            ->orderByDesc('achieved_at')
            ->orderByDesc('created_at')
            ->get();

        $latestByLift = collect(self::ATHLETES)
            ->mapWithKeys(fn (string $athlete) => [
                $athlete => collect(self::LIFTS)
                    ->mapWithKeys(fn (string $lift) => [
                        $lift => optional(
                            $entries->first(fn (PrLadderEntry $entry) => $entry->athlete === $athlete && $entry->lift === $lift)
                        )?->only(['id', 'weight', 'achieved_at']),
                    ]),
            ]);

        return Inertia::render('PrLadder', [
            'athletes' => self::ATHLETES,
            'lifts' => self::LIFTS,
            'leaderboard' => $latestByLift,
            'recentUpdates' => $entries
                ->sortByDesc(fn (PrLadderEntry $entry) => $entry->achieved_at ?? $entry->created_at)
                ->take(12)
                ->values()
                ->map(fn (PrLadderEntry $entry) => [
                    'id' => $entry->id,
                    'athlete' => $entry->athlete,
                    'lift' => $entry->lift,
                    'weight' => $entry->weight,
                    'achieved_at' => optional($entry->achieved_at ?? $entry->created_at)?->toIso8601String(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'athlete' => ['required', 'in:' . implode(',', self::ATHLETES)],
            'lift' => ['required', 'in:' . implode(',', self::LIFTS)],
            'weight' => ['required', 'integer', 'min:1', 'max:2000'],
            'achieved_at' => ['nullable', 'date'],
        ]);

        PrLadderEntry::create($validated);

        return redirect()
            ->route('pr-ladder.index')
            ->with('success', 'PR saved.');
    }
}
