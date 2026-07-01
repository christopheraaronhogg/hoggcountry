export type ScoutMarkdownInline = {
	kind: 'text' | 'strong';
	text: string;
};

export type ScoutMarkdownBlock =
	| {
			kind: 'heading';
			level: 1 | 2 | 3;
			segments: ScoutMarkdownInline[];
	  }
	| {
			kind: 'paragraph' | 'quote';
			segments: ScoutMarkdownInline[];
	  }
	| {
			kind: 'ordered-list' | 'unordered-list';
			items: { segments: ScoutMarkdownInline[] }[];
	  };

export function parseScoutInlineMarkdown(text: string): ScoutMarkdownInline[] {
	const segments: ScoutMarkdownInline[] = [];
	const pattern = /(\*\*|__)(.+?)\1/gu;
	let cursor = 0;
	for (const match of text.matchAll(pattern)) {
		const index = match.index ?? 0;
		if (index > cursor) {
			segments.push({ kind: 'text', text: text.slice(cursor, index) });
		}
		const strongText = match[2]?.trim() ?? '';
		if (strongText) segments.push({ kind: 'strong', text: strongText });
		cursor = index + match[0].length;
	}
	if (cursor < text.length) {
		segments.push({ kind: 'text', text: text.slice(cursor) });
	}
	return segments.length ? segments : [{ kind: 'text', text }];
}

export function parseScoutMarkdown(text: string): ScoutMarkdownBlock[] {
	const blocks: ScoutMarkdownBlock[] = [];
	const paragraphLines: string[] = [];
	let activeList: Extract<ScoutMarkdownBlock, { kind: 'ordered-list' | 'unordered-list' }> | null = null;
	let quoteLines: string[] = [];

	function pushParagraph(): void {
		if (!paragraphLines.length) return;
		blocks.push({
			kind: 'paragraph',
			segments: parseScoutInlineMarkdown(paragraphLines.join(' ').trim())
		});
		paragraphLines.length = 0;
	}

	function pushQuote(): void {
		if (!quoteLines.length) return;
		blocks.push({
			kind: 'quote',
			segments: parseScoutInlineMarkdown(quoteLines.join(' ').trim())
		});
		quoteLines = [];
	}

	function pushList(): void {
		if (!activeList) return;
		blocks.push(activeList);
		activeList = null;
	}

	function flush(): void {
		pushParagraph();
		pushQuote();
		pushList();
	}

	for (const rawLine of text.replace(/\r\n/gu, '\n').split('\n')) {
		const line = rawLine.trim();
		if (!line) {
			flush();
			continue;
		}

		const heading = /^(#{1,3})\s+(.+)$/u.exec(line);
		if (heading) {
			flush();
			blocks.push({
				kind: 'heading',
				level: heading[1].length as 1 | 2 | 3,
				segments: parseScoutInlineMarkdown(heading[2].trim())
			});
			continue;
		}

		const quote = /^>\s?(.+)$/u.exec(line);
		if (quote) {
			pushParagraph();
			pushList();
			quoteLines.push(quote[1].trim());
			continue;
		}

		const unordered = /^[-*]\s+(.+)$/u.exec(line);
		if (unordered) {
			pushParagraph();
			pushQuote();
			if (!activeList || activeList.kind !== 'unordered-list') {
				pushList();
				activeList = { kind: 'unordered-list', items: [] };
			}
			activeList.items.push({ segments: parseScoutInlineMarkdown(unordered[1].trim()) });
			continue;
		}

		const ordered = /^\d+[.)]\s+(.+)$/u.exec(line);
		if (ordered) {
			pushParagraph();
			pushQuote();
			if (!activeList || activeList.kind !== 'ordered-list') {
				pushList();
				activeList = { kind: 'ordered-list', items: [] };
			}
			activeList.items.push({ segments: parseScoutInlineMarkdown(ordered[1].trim()) });
			continue;
		}

		pushQuote();
		pushList();
		paragraphLines.push(line);
	}

	flush();

	return blocks.length
		? blocks
		: [
				{
					kind: 'paragraph',
					segments: [{ kind: 'text', text: '' }]
				}
			];
}

export function scoutMarkdownToPlainText(text: string): string {
	return parseScoutMarkdown(text)
		.map((block) => {
			switch (block.kind) {
				case 'ordered-list':
					return block.items.map((item, index) => `${index + 1}. ${segmentsToText(item.segments)}`).join('\n');
				case 'unordered-list':
					return block.items.map((item) => `- ${segmentsToText(item.segments)}`).join('\n');
				case 'heading':
				case 'paragraph':
				case 'quote':
					return segmentsToText(block.segments);
			}
		})
		.join('\n\n')
		.trim();
}

function segmentsToText(segments: ScoutMarkdownInline[]): string {
	return segments.map((segment) => segment.text).join('');
}
