import assert from 'node:assert/strict';
import { mkdir, mkdtemp, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isNativeAppSourcePath, summarizeHistoryFreshness } from './status-scout-local-ai.mjs';

test('Scout local AI status reports current history artifacts', async () => {
	const fixture = await createHistoryFreshnessFixture();
	const history = await summarizeHistoryFreshness({
		...fixture.args,
		rebuildCommand: 'npm run history:scout-local-ai'
	});

	assert.equal(history.ok, true);
	assert.equal(history.stale, false);
	assert.equal(history.outputsExist, true);
	assert.match(history.reason, /history outputs are newer/u);
	assert.equal(history.sourceCount, 5);
	assert.equal(history.latestSource.path, 'data/scout-local-ai/reviews/device-local-ai-review.review.json');
	assert.equal(history.rebuildCommand, 'npm run history:scout-local-ai');
});

test('Scout local AI status reports stale history after a newer run review arrives', async () => {
	const fixture = await createHistoryFreshnessFixture();
	await touchAt(fixture.reviewPath, '2026-06-29T08:55:00.000Z');

	const history = await summarizeHistoryFreshness(fixture.args);

	assert.equal(history.ok, false);
	assert.equal(history.stale, true);
	assert.equal(history.outputsExist, true);
	assert.match(history.reason, /changed after the older history output/u);
	assert.equal(history.latestSource.path, 'data/scout-local-ai/reviews/device-local-ai-review.review.json');
	assert.equal(history.json.exists, true);
	assert.equal(history.html.exists, true);
});

test('Scout local AI status reports stale history after a newer git intervention', async () => {
	const fixture = await createHistoryFreshnessFixture();

	const history = await summarizeHistoryFreshness({
		...fixture.args,
		sourceEvents: [{
			path: 'git:abcd1234 Tighten Scout source routing',
			modifiedAt: '2026-06-29T08:55:00.000Z'
		}]
	});

	assert.equal(history.ok, false);
	assert.equal(history.stale, true);
	assert.match(history.reason, /git:abcd1234 Tighten Scout source routing/u);
	assert.equal(history.latestSource.path, 'git:abcd1234 Tighten Scout source routing');
});

test('Scout local AI status reports missing history artifacts', async () => {
	const fixture = await createHistoryFreshnessFixture({ writeHistory: false });

	const history = await summarizeHistoryFreshness(fixture.args);

	assert.equal(history.ok, false);
	assert.equal(history.stale, false);
	assert.equal(history.outputsExist, false);
	assert.match(history.reason, /missing generated history artifact/u);
	assert.equal(history.json.exists, false);
	assert.equal(history.html.exists, false);
	assert.equal(history.latestOutputModifiedAt, null);
});

test('Scout local AI status keeps root package test metadata outside native app source', () => {
	assert.equal(isNativeAppSourcePath('package.json'), false);
	assert.equal(isNativeAppSourcePath('package-lock.json'), false);
	assert.equal(isNativeAppSourcePath('scripts/status-scout-local-ai.mjs'), false);
	assert.equal(isNativeAppSourcePath('mobile/package.json'), true);
	assert.equal(isNativeAppSourcePath('mobile/src/lib/scout/local-ai-eval.ts'), true);
});

async function createHistoryFreshnessFixture({ writeHistory = true } = {}) {
	const root = await mkdtemp(join(tmpdir(), 'scout-status-history-'));
	const runDir = join(root, 'data/scout-local-ai/device-runs');
	const reviewDir = join(root, 'data/scout-local-ai/reviews');
	const scanDir = join(root, 'data/scout-local-ai/answer-quality-scans');
	const historyDir = join(root, 'data/scout-local-ai/history');
	const scriptsDir = join(root, 'scripts');
	await mkdir(runDir, { recursive: true });
	await mkdir(reviewDir, { recursive: true });
	await mkdir(scanDir, { recursive: true });
	await mkdir(historyDir, { recursive: true });
	await mkdir(scriptsDir, { recursive: true });

	const suitePath = join(root, 'data/scout-local-ai/dad-local-ai-100.json');
	const runPath = join(runDir, 'device-local-ai-run.json');
	const reviewPath = join(reviewDir, 'device-local-ai-review.review.json');
	const scanPath = join(scanDir, 'device-local-ai.scan.json');
	const historyJsonPath = join(historyDir, 'scout-local-ai-history.json');
	const historyHtmlPath = join(historyDir, 'scout-local-ai-history.html');
	const historyScriptPath = join(scriptsDir, 'build-scout-local-ai-history.mjs');

	await writeFile(suitePath, '{"suiteId":"dad-local-ai-100"}\n');
	await writeFile(runPath, '{"runId":"device-local-ai-run"}\n');
	await writeFile(reviewPath, '{"runId":"device-local-ai-review"}\n');
	await writeFile(scanPath, '{"runId":"device-local-ai-run","flagged":[]}\n');
	await writeFile(historyScriptPath, 'export const historyBuilder = true;\n');
	if (writeHistory) {
		await writeFile(historyJsonPath, '{"schemaVersion":1}\n');
		await writeFile(historyHtmlPath, '<!doctype html><title>Scout Local AI History</title>\n');
	}

	await touchAt(suitePath, '2026-06-29T08:40:00.000Z');
	await touchAt(runPath, '2026-06-29T08:45:00.000Z');
	await touchAt(reviewPath, '2026-06-29T08:46:00.000Z');
	await touchAt(scanPath, '2026-06-29T08:44:00.000Z');
	await touchAt(historyScriptPath, '2026-06-29T08:30:00.000Z');
	if (writeHistory) {
		await touchAt(historyJsonPath, '2026-06-29T08:50:00.000Z');
		await touchAt(historyHtmlPath, '2026-06-29T08:50:01.000Z');
	}

	return {
		reviewPath,
		args: {
			repoRoot: root,
			historyJsonPath,
			historyHtmlPath,
			sourceFiles: [suitePath, historyScriptPath],
			sourceDirs: [runDir, reviewDir, scanDir]
		}
	};
}

async function touchAt(path, isoTimestamp) {
	const date = new Date(isoTimestamp);
	await utimes(path, date, date);
}
