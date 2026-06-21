import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputPath = join(repoRoot, 'mobile/static/scout/offline-source-docs.json');

function cleanMarkdown(markdown) {
	return markdown
		.replace(/^---\n[\s\S]*?\n---\n/u, '')
		.replace(/\r\n/g, '\n')
		.trim();
}

function titleFromMarkdown(markdown, fallback) {
	const heading = markdown.match(/^#\s+(.+)$/mu)?.[1]?.trim();
	if (heading) return heading;
	return fallback
		.replace(/[_-]+/gu, ' ')
		.replace(/\.md$/iu, '')
		.replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function guideDocuments() {
	const index = readJson(join(repoRoot, 'public/guide-search-index.json'));
	return index.map((entry) => ({
		id: `field-guide:${entry.id}`,
		title: `Field Guide: ${entry.title}`,
		body: String(entry.content ?? '').trim(),
		tags: [
			'hogg-country-field-guide',
			entry.quickRef ? 'quick-reference' : 'field-guide',
			...(entry.headers ? String(entry.headers).split('|').map((header) => header.trim().toLowerCase()) : [])
		].filter(Boolean),
		citation: 'Hogg Country Field Guide bundled offline index'
	}));
}

function atReferenceDocuments() {
	const root = join(repoRoot, 'data/at-open-reference/full_trail_rc1');
	const metadata = readJson(join(root, 'rag_docs/rag_doc_metadata.json'));
	const docs = metadata.map((entry) => {
		const absolute = join(root, entry.path);
		const markdown = cleanMarkdown(readFileSync(absolute, 'utf8'));
		const title = titleFromMarkdown(markdown, basename(entry.path));
		const start = Number.isFinite(entry.start_mile_nobo_global_est)
			? Math.round(entry.start_mile_nobo_global_est)
			: null;
		const end = Number.isFinite(entry.end_mile_nobo_global_est)
			? Math.round(entry.end_mile_nobo_global_est)
			: null;
		return {
			id: `at-open-reference:${entry.doc_id}`,
			title: start !== null && end !== null ? `AT Source: Miles ${start}-${end}` : `AT Source: ${title}`,
			body: markdown,
			tags: [
				'at-open-reference',
				'generated-mile-caveat',
				...(Array.isArray(entry.states) ? entry.states.map((state) => String(state).toLowerCase()) : []),
				...(Array.isArray(entry.region_ids) ? entry.region_ids : []),
				String(entry.confidence ?? '').toLowerCase()
			].filter(Boolean),
			citation: [
				'Scout Full Trail RC1 open-reference RAG doc',
				relative(repoRoot, absolute),
				entry.last_generated ? `generated ${entry.last_generated}` : null,
				entry.license_status ? `license ${entry.license_status}` : null
			].filter(Boolean).join(' · ')
		};
	});

	for (const path of [
		'FULL_TRAIL_RC1_STATUS.md',
		'data_quality_report_full_trail_rc1.md',
		'full_trail_license_review.md',
		'attribution.md',
		'blocked_sources.md'
	]) {
		const absolute = join(root, path);
		const markdown = cleanMarkdown(readFileSync(absolute, 'utf8'));
		docs.push({
			id: `at-open-reference:${path.replace(/[^a-z0-9]+/giu, '-').replace(/^-|-$/gu, '').toLowerCase()}`,
			title: `AT Source: ${titleFromMarkdown(markdown, path)}`,
			body: markdown,
			tags: ['at-open-reference', 'source-policy', 'data-quality'],
			citation: `Scout Full Trail RC1 source policy · ${relative(repoRoot, absolute)}`
		});
	}

	return docs;
}

const documents = [...guideDocuments(), ...atReferenceDocuments()]
	.filter((document) => document.body)
	.sort((left, right) => left.title.localeCompare(right.title));

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
	outputPath,
	`${JSON.stringify({
		generatedAt: new Date().toISOString(),
		version: 1,
		count: documents.length,
		documents
	})}\n`
);

console.log(`Wrote ${documents.length} offline source docs to ${relative(repoRoot, outputPath)}`);
