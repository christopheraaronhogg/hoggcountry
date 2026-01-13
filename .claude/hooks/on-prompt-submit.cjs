#!/usr/bin/env node
/**
 * UserPromptSubmit Hook - Task Lifecycle Start
 *
 * When user submits a prompt:
 * 1. Parse the prompt to identify actionable tasks
 * 2. Add task to CLAUDE.md under "## Current Session Tasks"
 * 3. Output context so Claude knows about the task tracking
 *
 * Uses `once: true` in config to run only once per prompt.
 */

const fs = require('fs');
const path = require('path');

// Keywords that indicate an actionable task (not just a question)
const ACTION_KEYWORDS = [
  // Imperatives
  'add', 'create', 'make', 'build', 'implement', 'write', 'generate',
  'fix', 'repair', 'resolve', 'debug', 'patch',
  'update', 'change', 'modify', 'edit', 'refactor', 'rename',
  'remove', 'delete', 'drop', 'clean',
  'move', 'migrate', 'convert', 'transform',
  'install', 'setup', 'configure', 'deploy',
  'test', 'verify', 'check', 'validate',
  'optimize', 'improve', 'enhance', 'upgrade',
  // Common patterns
  'can you', 'could you', 'please', 'i need', 'i want', 'let\'s',
  'help me', 'go ahead', 'run', 'execute',
];

// Keywords that indicate a question (not a task)
const QUESTION_KEYWORDS = [
  'what is', 'what are', 'what\'s',
  'how does', 'how do', 'how is',
  'why is', 'why does', 'why do',
  'where is', 'where are', 'where does',
  'when is', 'when does', 'when do',
  'which', 'who', 'whose',
  'explain', 'describe', 'tell me about',
  'show me', 'list', 'find',
];

/**
 * Determine if a prompt is an actionable task
 */
function isActionableTask(prompt) {
  const promptLower = prompt.toLowerCase().trim();

  // Skip very short prompts
  if (promptLower.length < 10) return false;

  // Skip if it looks like a question
  if (promptLower.endsWith('?')) {
    // But some questions are actually requests: "can you add X?"
    const isRequest = ACTION_KEYWORDS.some(kw =>
      promptLower.includes(kw) && !QUESTION_KEYWORDS.some(qw => promptLower.startsWith(qw))
    );
    if (!isRequest) return false;
  }

  // Skip pure questions
  if (QUESTION_KEYWORDS.some(kw => promptLower.startsWith(kw))) {
    return false;
  }

  // Check for action keywords
  return ACTION_KEYWORDS.some(kw => promptLower.includes(kw));
}

/**
 * Extract a concise task description from prompt
 */
function extractTaskDescription(prompt) {
  // Clean up the prompt
  let task = prompt.trim();

  // Remove common prefixes
  const prefixes = [
    /^(can you|could you|please|i need you to|i want you to|help me|go ahead and)\s+/i,
    /^(let's|lets)\s+/i,
  ];

  for (const prefix of prefixes) {
    task = task.replace(prefix, '');
  }

  // Capitalize first letter
  task = task.charAt(0).toUpperCase() + task.slice(1);

  // Truncate if too long (keep first sentence or 100 chars)
  const firstSentence = task.match(/^[^.!?\n]+[.!?]?/);
  if (firstSentence && firstSentence[0].length < 150) {
    task = firstSentence[0];
  } else if (task.length > 100) {
    task = task.substring(0, 100).trim() + '...';
  }

  // Remove trailing punctuation for consistency
  task = task.replace(/[.!]+$/, '');

  return task;
}

/**
 * Add task to CLAUDE.md
 */
function addTaskToClaudeMd(claudeMdPath, taskDescription) {
  if (!fs.existsSync(claudeMdPath)) {
    return false;
  }

  let content = fs.readFileSync(claudeMdPath, 'utf8');

  // Look for existing "Current Session Tasks" section
  const sessionTasksHeader = '## Current Session Tasks';
  const sessionTasksPattern = /^## Current Session Tasks\s*\n/m;

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const newTask = `- [ ] ${taskDescription} *(${timestamp})*`;

  if (sessionTasksPattern.test(content)) {
    // Add task after the header
    content = content.replace(sessionTasksPattern, `${sessionTasksHeader}\n${newTask}\n`);
  } else {
    // Find a good place to insert the section (before "---" divider or at end)
    const insertPoint = content.search(/^---/m);
    const newSection = `\n${sessionTasksHeader}\n${newTask}\n\n`;

    if (insertPoint > 0) {
      content = content.slice(0, insertPoint) + newSection + content.slice(insertPoint);
    } else {
      content += newSection;
    }
  }

  fs.writeFileSync(claudeMdPath, content);
  return true;
}

/**
 * Main hook entry point
 */
async function main() {
  let input = '';

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    const data = JSON.parse(input);
    const cwd = data.cwd || process.cwd();
    const prompt = data.prompt || '';

    // Skip if not an actionable task
    if (!isActionableTask(prompt)) {
      process.exit(0);
    }

    // Extract task description
    const taskDescription = extractTaskDescription(prompt);

    // Add to CLAUDE.md
    const claudeMdPath = path.join(cwd, 'CLAUDE.md');
    const added = addTaskToClaudeMd(claudeMdPath, taskDescription);

    // Silent operation - no output to avoid user-visible feedback
    // Task is tracked in CLAUDE.md

    process.exit(0);
  } catch (e) {
    // Silent failure
    process.exit(0);
  }
}

main();
