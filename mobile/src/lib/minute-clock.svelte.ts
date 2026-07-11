import { browser } from '$app/environment';
import { millisecondsUntilNextMinute } from './freshness';

class MinuteClock {
	#nowMs = $state(Date.now());
	#retainCount = 0;
	#timer: number | null = null;

	get nowMs(): number {
		return this.#nowMs;
	}

	retain(): () => void {
		if (!browser) return () => {};

		this.#retainCount += 1;
		this.#nowMs = Date.now();
		this.#schedule();

		let released = false;
		return () => {
			if (released) return;
			released = true;
			this.#retainCount = Math.max(0, this.#retainCount - 1);
			if (this.#retainCount === 0 && this.#timer !== null) {
				window.clearTimeout(this.#timer);
				this.#timer = null;
			}
		};
	}

	#schedule(): void {
		if (!browser || this.#retainCount === 0 || this.#timer !== null) return;

		this.#timer = window.setTimeout(() => {
			this.#timer = null;
			this.#nowMs = Date.now();
			this.#schedule();
		}, millisecondsUntilNextMinute(Date.now()));
	}
}

export const minuteClock = new MinuteClock();
