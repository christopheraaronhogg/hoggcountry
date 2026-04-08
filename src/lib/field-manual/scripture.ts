import { escapeHtml, summarizeText, type FieldManualEntryInput } from './types';

export interface ScriptureVerse {
  reference: string;
  text: string;
}

export interface ScriptureTopic {
  id: string;
  title: string;
  summary: string;
  aliases: string[];
  verses: ScriptureVerse[];
}

export interface ScriptureSearchResult {
  topic: ScriptureTopic;
  verse: ScriptureVerse;
  score: number;
}

export interface ScriptureManualEntryOptions {
  basePath?: string;
  savedFrom?: 'entry' | 'search';
}

const SCRIPTURE_TOPICS: readonly ScriptureTopic[] = [
  {
    id: 'fear',
    title: 'Fear',
    summary: 'For weather, uncertainty, and every moment when your mind starts running ahead of your feet.',
    aliases: ['afraid', 'anxious', 'worry', 'worried', 'panic', 'unsafe', 'scared'],
    verses: [
      { reference: 'Psalms 56:3', text: 'What time I am afraid, I will trust in thee.' },
      { reference: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.' },
      { reference: 'Joshua 1:9', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' },
      { reference: 'Psalms 27:1', text: '[A Psalm of David.] The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?' },
      { reference: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.' },
    ],
  },
  {
    id: 'endurance',
    title: 'Endurance',
    summary: 'For the long middle, when the climb is not dramatic but you still have to keep going.',
    aliases: ['patience', 'perseverance', 'keep going', 'long miles', 'slog', 'grit'],
    verses: [
      { reference: 'Hebrews 12:1-2', text: '1. Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us, 2. Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross, despising the shame, and is set down at the right hand of the throne of God.' },
      { reference: 'James 1:2-4', text: '2. My brethren, count it all joy when ye fall into divers temptations; 3. Knowing this, that the trying of your faith worketh patience. 4. But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.' },
      { reference: 'Romans 5:3-5', text: '3. And not only so, but we glory in tribulations also: knowing that tribulation worketh patience; 4. And patience, experience; and experience, hope: 5. And hope maketh not ashamed; because the love of God is shed abroad in our hearts by the Holy Ghost which is given unto us.' },
      { reference: 'Galatians 6:9', text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.' },
      { reference: 'Isaiah 40:31', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
    ],
  },
  {
    id: 'discouragement',
    title: 'Discouragement',
    summary: 'For the Virginia blues, heavy mornings, and the days when your spirit gets flatter than the terrain.',
    aliases: ['downcast', 'hopeless', 'burned out', 'quit', 'lonely', 'sad'],
    verses: [
      { reference: 'Psalms 42:11', text: 'Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.' },
      { reference: 'Deuteronomy 31:8', text: 'And the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed.' },
      { reference: 'John 16:33', text: 'These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.' },
      { reference: '2 Corinthians 4:8-9', text: '8. We are troubled on every side, yet not distressed; we are perplexed, but not in despair; 9. Persecuted, but not forsaken; cast down, but not destroyed;' },
      { reference: 'Psalms 34:17-18', text: '17. The righteous cry, and the LORD heareth, and delivereth them out of all their troubles. 18. The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.' },
    ],
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    summary: 'For remembering grace in town, on trail, and in the ordinary gifts that keep you moving.',
    aliases: ['thankful', 'thanks', 'praise', 'joy', 'contentment'],
    verses: [
      { reference: '1 Thessalonians 5:18', text: 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.' },
      { reference: 'Psalms 107:1', text: 'O give thanks unto the LORD, for he is good: for his mercy endureth for ever.' },
      { reference: 'Colossians 3:15-17', text: '15. And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful. 16. Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord. 17. And whatsoever ye do in word or deed, do all in the name of the Lord Jesus, giving thanks to God and the Father by him.' },
      { reference: 'Psalms 100:4', text: 'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.' },
      { reference: 'Philippians 4:6-7', text: '6. Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. 7. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
    ],
  },
  {
    id: 'guidance',
    title: 'Guidance',
    summary: 'For crossroads, reroutes, and all the moments when you need the next right step, not ten future ones.',
    aliases: ['direction', 'decision', 'next step', 'wisdom', 'route', 'discernment'],
    verses: [
      { reference: 'Proverbs 3:5-6', text: '5. Trust in the LORD with all thine heart; and lean not unto thine own understanding. 6. In all thy ways acknowledge him, and he shall direct thy paths.' },
      { reference: 'Psalms 119:105', text: 'NUN. Thy word is a lamp unto my feet, and a light unto my path.' },
      { reference: 'Isaiah 30:21', text: 'And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it, when ye turn to the right hand, and when ye turn to the left.' },
      { reference: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' },
      { reference: 'Psalms 32:8', text: 'I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye.' },
    ],
  },
  {
    id: 'rest',
    title: 'Rest',
    summary: 'For hard nights, poor sleep, and the difference between pushing through and actually recovering.',
    aliases: ['sleep', 'recovery', 'stillness', 'calm', 'peaceful night'],
    verses: [
      { reference: 'Matthew 11:28-30', text: '28. Come unto me, all ye that labour and are heavy laden, and I will give you rest. 29. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. 30. For my yoke is easy, and my burden is light.' },
      { reference: 'Psalms 4:8', text: 'I will both lay me down in peace, and sleep: for thou, LORD, only makest me dwell in safety.' },
      { reference: 'Psalms 23:1-3', text: '1. [A Psalm of David.] The LORD is my shepherd; I shall not want. 2. He maketh me to lie down in green pastures: he leadeth me beside the still waters. 3. He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
      { reference: 'Exodus 33:14', text: 'And he said, My presence shall go with thee, and I will give thee rest.' },
      { reference: 'Proverbs 3:24', text: 'When thou liest down, thou shalt not be afraid: yea, thou shalt lie down, and thy sleep shall be sweet.' },
    ],
  },
  {
    id: 'provision',
    title: 'Provision',
    summary: 'For money strain, resupply stress, and the quiet question of whether what you have will be enough.',
    aliases: ['money', 'need', 'supply', 'food', 'resupply', 'lack'],
    verses: [
      { reference: 'Matthew 6:31-34', text: '31. Therefore take no thought, saying, What shall we eat? or, What shall we drink? or, Wherewithal shall we be clothed? 32. (For after all these things do the Gentiles seek:) for your heavenly Father knoweth that ye have need of all these things. 33. But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you. 34. Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.' },
      { reference: 'Philippians 4:19', text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.' },
      { reference: 'Psalms 37:25', text: 'I have been young, and now am old; yet have I not seen the righteous forsaken, nor his seed begging bread.' },
      { reference: 'Lamentations 3:22-23', text: '22. It is of the LORD\'S mercies that we are not consumed, because his compassions fail not. 23. They are new every morning: great is thy faithfulness.' },
      { reference: 'Psalms 121:7-8', text: '7. The LORD shall preserve thee from all evil: he shall preserve thy soul. 8. The LORD shall preserve thy going out and thy coming in from this time forth, and even for evermore.' },
    ],
  },
  {
    id: 'wisdom',
    title: 'Wisdom',
    summary: 'For practical judgment, trail decisions, and keeping knowledge from turning into noise.',
    aliases: ['judgment', 'understanding', 'counsel', 'discernment', 'practical'],
    verses: [
      { reference: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' },
      { reference: 'Proverbs 2:6', text: 'For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.' },
      { reference: 'Proverbs 16:9', text: 'A man\'s heart deviseth his way: but the LORD directeth his steps.' },
      { reference: 'Proverbs 24:6', text: 'For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.' },
      { reference: 'Psalms 119:66', text: 'Teach me good judgment and knowledge: for I have believed thy commandments.' },
    ],
  },
  {
    id: 'strength',
    title: 'Strength',
    summary: 'For the days when the trail is not the only hard thing you are carrying.',
    aliases: ['strong', 'weakness', 'power', 'energy', 'faint'],
    verses: [
      { reference: 'Isaiah 40:29-31', text: '29. He giveth power to the faint; and to them that have no might he increaseth strength. 30. Even the youths shall faint and be weary, and the young men shall utterly fall: 31. But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
      { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
      { reference: 'Psalms 18:32-33', text: '32. It is God that girdeth me with strength, and maketh my way perfect. 33. He maketh my feet like hinds\' feet, and setteth me upon my high places.' },
      { reference: '2 Corinthians 12:9-10', text: '9. And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me. 10. Therefore I take pleasure in infirmities, in reproaches, in necessities, in persecutions, in distresses for Christ\'s sake: for when I am weak, then am I strong.' },
      { reference: 'Ephesians 6:10', text: 'Finally, my brethren, be strong in the Lord, and in the power of his might.' },
    ],
  },
  {
    id: 'peace',
    title: 'Peace',
    summary: 'For storm fronts, strained nerves, and the need for settled thoughts in unsettled conditions.',
    aliases: ['calm', 'troubled', 'steady', 'anxiety', 'comfort'],
    verses: [
      { reference: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.' },
      { reference: 'Philippians 4:6-7', text: '6. Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. 7. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
      { reference: 'Isaiah 26:3', text: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.' },
      { reference: 'Colossians 3:15', text: 'And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.' },
      { reference: 'Romans 15:13', text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.' },
    ],
  },
] as const;

function scriptureEntryId(topicId: string, reference: string): string {
  const suffix = reference.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `scripture:${topicId}:${suffix}`;
}

function renderScriptureHtml(topic: ScriptureTopic, verse: ScriptureVerse): string {
  return [
    `<blockquote class="manual-scripture"><p>${escapeHtml(verse.text)}</p></blockquote>`,
    `<p><strong>Topic:</strong> ${escapeHtml(topic.title)}</p>`,
  ].join('');
}

export function listScriptureTopics(): readonly ScriptureTopic[] {
  return SCRIPTURE_TOPICS;
}

function normalizeScriptureBasePath(basePath: string): string {
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

function buildScriptureSourceHref(topic: ScriptureTopic, basePath = '/guide/'): string {
  const query = encodeURIComponent(topic.title.toLowerCase());
  return `${normalizeScriptureBasePath(basePath)}?tab=scripture&q=${query}#scripture-topic-${topic.id}`;
}

export function buildScriptureManualEntry(
  topic: ScriptureTopic,
  verse: ScriptureVerse,
  options: ScriptureManualEntryOptions = {},
): FieldManualEntryInput {
  const savedFrom = options.savedFrom ?? 'search';
  const title = `${topic.title} - ${verse.reference}`;
  return {
    id: scriptureEntryId(topic.id, verse.reference),
    kind: 'scripture',
    title,
    summary: summarizeText(`${topic.summary} ${verse.text}`, 220),
    contentText: verse.text,
    contentHtml: renderScriptureHtml(topic, verse),
    note: '',
    source: {
      surface: 'guide',
      corpus: 'scripture',
      sourceId: verse.reference,
      href: buildScriptureSourceHref(topic, options.basePath),
      citation: `KJV - ${verse.reference}`,
    },
    meta: {
      chapterTitle: topic.title,
      savedFrom,
      tags: ['scripture', topic.id, ...topic.aliases.slice(0, 2)],
    },
  };
}

export function searchScripture(query: string, limit = 12): ScriptureSearchResult[] {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalizedQuery) {
    return [];
  }

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const results: ScriptureSearchResult[] = [];

  for (const topic of SCRIPTURE_TOPICS) {
    for (const verse of topic.verses) {
      let score = 0;

      for (const term of terms) {
        if (topic.title.toLowerCase().includes(term)) score += 100;
        if (topic.aliases.some((alias) => alias.includes(term))) score += 70;
        if (topic.summary.toLowerCase().includes(term)) score += 35;
        if (verse.reference.toLowerCase().includes(term)) score += 45;
        if (verse.text.toLowerCase().includes(term)) score += 20;
      }

      if (score > 0) {
        results.push({ topic, verse, score });
      }
    }
  }

  return results
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.verse.reference.localeCompare(right.verse.reference);
    })
    .slice(0, limit);
}

