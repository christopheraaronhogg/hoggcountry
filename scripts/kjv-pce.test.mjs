import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatKjvPceCitation,
  kjvPceMetadata,
  lookupKjvPceReference,
  searchKjvPce,
} from '@hoggcountry/corpus/kjv-pce';
import { selectScoutSourceManifests } from '../packages/scout-sources/src/index.ts';

describe('KJV PCE corpus lookup', () => {
  it('loads the complete verified corpus', () => {
    assert.equal(kjvPceMetadata.id, 'kjv-pce');
    assert.equal(kjvPceMetadata.verseCount, 31_102);
  });

  it('finds an exact verse reference', () => {
    const verses = lookupKjvPceReference('Proverbs 3:5');
    assert.equal(verses.length, 1);
    assert.equal(verses[0].reference, 'Proverbs 3:5');
    assert.equal(verses[0].text, 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.');
  });

  it('finds a reference range', () => {
    const verses = lookupKjvPceReference('Proverbs 3:5-6');
    assert.deepEqual(verses.map((verse) => verse.reference), ['Proverbs 3:5', 'Proverbs 3:6']);
    assert.equal(verses[1].text, 'In all thy ways acknowledge him, and he shall direct thy paths.');
  });

  it('finds phrase search hits', () => {
    const hits = searchKjvPce('lean not unto thine own understanding', 3);
    assert.equal(hits[0].reference, 'Proverbs 3:5');
    assert.match(hits[0].snippet, /lean not unto thine own understanding/u);
  });

  it('formats KJV PCE citations', () => {
    assert.equal(formatKjvPceCitation('Proverbs 3:5'), 'KJV PCE — Proverbs 3:5');
  });

  it('passes Pure Cambridge Edition spot checks', () => {
    const checks = [
      ['Joshua 19:2', /or Sheba/u, /and Sheba/u],
      ['Acts 11:28', /by the spirit/u, /by the Spirit/u],
      ['1 John 5:8', /the spirit, and the water/u, /the Spirit, and the water/u],
      ['Ezra 2:26', /Ramah and Geba/u, /Ramah and Gaba/u],
    ];

    for (const [reference, expected, rejected] of checks) {
      const [verse] = lookupKjvPceReference(reference);
      assert.ok(verse, `${reference} should exist`);
      assert.match(verse.text, expected);
      assert.doesNotMatch(verse.text, rejected);
    }
  });
});

describe('Scout source selection', () => {
  it('selects KJV PCE for scripture queries', () => {
    const sources = selectScoutSourceManifests({
      query: 'Please quote Proverbs 3:5-6 from the KJV for trail guidance.',
      limit: 5,
    });

    assert.ok(sources.some((source) => source.id === 'kjv-pce'));
  });
});
