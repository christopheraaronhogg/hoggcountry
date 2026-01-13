#!/usr/bin/env node
/**
 * Stop Hook - Task Lifecycle End
 *
 * When Claude finishes responding:
 * 1. Read the transcript to understand what happened
 * 2. Analyze outcomes (success, failure, blocked)
 * 3. Update task status in CLAUDE.md
 *
 * This hook observes but doesn't block (exit 0).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Read and parse the transcript file
 */
async function readTranscript(transcriptPath) {
  if (!fs.existsSync(transcriptPath)) {
    return [];
  }

  const entries = [];
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      if (line.trim()) {
        entries.push(JSON.parse(line));
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  return entries;
}

/**
 * Analyze transcript to determine session outcome
 */
function analyzeOutcome(entries) {
  const outcome = {
    hasToolCalls: false,
    hasEdits: false,
    hasWrites: false,
    hasErrors: false,
    errorMessages: [],
    filesModified: new Set(),
    lastAssistantMessage: '',
  };

  for (const entry of entries) {
    // Check for tool use
    if (entry.type === 'tool_use' || entry.tool_name) {
      outcome.hasToolCalls = true;

      const toolName = entry.tool_name || entry.name;
      if (toolName === 'Edit') {
        outcome.hasEdits = true;
        if (entry.tool_input?.file_path) {
          outcome.filesModified.add(path.basename(entry.tool_input.file_path));
        }
      }
      if (toolName === 'Write') {
        outcome.hasWrites = true;
        if (entry.tool_input?.file_path) {
          outcome.filesModified.add(path.basename(entry.tool_input.file_path));
        }
      }
    }

    // Check for errors
    if (entry.type === 'tool_result' && entry.is_error) {
      outcome.hasErrors = true;
      if (entry.content) {
        outcome.errorMessages.push(entry.content.substring(0, 100));
      }
    }

    // Track assistant messages
    if (entry.role === 'assistant' && entry.message?.content) {
      const textContent = entry.message.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');
      if (textContent) {
        outcome.lastAssistantMessage = textContent;
      }
    }
  }

  return outcome;
}

/**
 * Determine task status based on outcome
 */
function determineStatus(outcome) {
  // If there were unrecovered errors, mark as blocked
  if (outcome.hasErrors && !outcome.hasEdits && !outcome.hasWrites) {
    return { status: 'blocked', reason: 'Encountered errors' };
  }

  // If code was modified, likely completed
  if (outcome.hasEdits || outcome.hasWrites) {
    return { status: 'completed', reason: null };
  }

  // If there were tool calls but no modifications, might be research/review
  if (outcome.hasToolCalls) {
    return { status: 'completed', reason: 'Review/research completed' };
  }

  // Default: completed (Claude responded)
  return { status: 'completed', reason: null };
}

/**
 * Update CLAUDE.md session tasks
 */
function updateClaudeMd(claudeMdPath, status, outcome) {
  if (!fs.existsSync(claudeMdPath)) {
    return false;
  }

  let content = fs.readFileSync(claudeMdPath, 'utf8');

  // Find the Current Session Tasks section
  const sessionPattern = /^## Current Session Tasks\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/m;
  const match = content.match(sessionPattern);

  if (!match) {
    return false;
  }

  const sessionSection = match[1];
  const lines = sessionSection.split('\n');
  let updated = false;

  // Find the most recent unchecked task and update it
  const updatedLines = [];
  let foundPending = false;

  for (const line of lines) {
    if (!foundPending && line.match(/^- \[ \]/)) {
      // Found a pending task - update based on status
      foundPending = true;
      updated = true;

      if (status.status === 'completed') {
        // Mark as completed
        updatedLines.push(line.replace('- [ ]', '- [x]'));
      } else if (status.status === 'blocked') {
        // Mark with block indicator and reason
        const blockedLine = line.replace('- [ ]', '- [!]') +
          (status.reason ? ` - *${status.reason}*` : '');
        updatedLines.push(blockedLine);
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  }

  if (updated) {
    const newSessionSection = updatedLines.join('\n');
    content = content.replace(sessionPattern, `## Current Session Tasks\n${newSessionSection}`);
    fs.writeFileSync(claudeMdPath, content);
  }

  return updated;
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
    const transcriptPath = data.transcript_path;

    if (!transcriptPath) {
      process.exit(0);
    }

    // Read and analyze transcript
    const entries = await readTranscript(transcriptPath);
    const outcome = analyzeOutcome(entries);
    const status = determineStatus(outcome);

    // Update CLAUDE.md
    const claudeMdPath = path.join(cwd, 'CLAUDE.md');
    updateClaudeMd(claudeMdPath, status, outcome);

    // Log for debugging (only visible in verbose mode)
    if (process.env.DEBUG_HOOK === '1') {
      console.error(`[Task Tracking] Session ended: ${status.status}`);
      if (outcome.filesModified.size > 0) {
        console.error(`[Task Tracking] Files modified: ${[...outcome.filesModified].join(', ')}`);
      }
    }

    process.exit(0);
  } catch (e) {
    // Silent failure - don't disrupt the session end
    if (process.env.DEBUG_HOOK === '1') {
      console.error(`[Task Tracking] Error: ${e.message}`);
    }
    process.exit(0);
  }
}

main();
