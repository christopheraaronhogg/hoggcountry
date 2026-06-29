#!/usr/bin/env node
// Repeatable iOS archive/export/upload lane for Dad's TestFlight build.
//
// This script intentionally does not store Apple credentials. It uses either
// Xcode Accounts or an App Store Connect API key supplied through flags/env.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoutLocalAiSuiteIdentity } from '../../scripts/lib/scout-local-ai-suite.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(__dirname, '..');
const repoRoot = resolve(mobileDir, '..');

const args = process.argv.slice(2);
const help = hasFlag('--help') || hasFlag('-h');

if (help) {
  console.log(`Hogg Country iOS TestFlight lane

Usage:
  npm run ios:testflight
  npm run ios:testflight -- --team-id TEAMID
  npm run ios:testflight -- --provisioning-profile "Hoggcountry App Store Connect"
  npm run ios:testflight -- --upload --team-id TEAMID
  npm run ios:testflight -- --upload --asc-key-path /secure/AuthKey_XXXX.p8 --asc-key-id KEYID --asc-issuer-id ISSUER

Modes:
  default         Run mobile gates, archive, then export a local app-store IPA.
  --upload        Upload the exported archive to App Store Connect/TestFlight.
  --archive-only  Stop after creating the signed .xcarchive.
  --diagnose-only Capture signing/build settings proof without building.

Useful env:
  HC_IOS_DEVELOPMENT_TEAM or IOS_DEVELOPMENT_TEAM or DEVELOPMENT_TEAM
  HC_IOS_PROVISIONING_PROFILE
  APP_STORE_CONNECT_API_KEY_PATH
  APP_STORE_CONNECT_API_KEY_ID
  APP_STORE_CONNECT_API_ISSUER_ID
`);
  process.exit(0);
}

const allowedFlags = new Set([
  '--archive-only',
  '--upload',
  '--internal-only',
  '--diagnose-only',
  '--skip-gates',
  '--team-id',
  '--provisioning-profile',
  '--out',
  '--asc-key-path',
  '--asc-key-id',
  '--asc-issuer-id',
  '--help',
  '-h'
]);
const unknown = unknownFlags(args, allowedFlags);
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(', ')}`);
  process.exit(2);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve(repoRoot, readFlag('--out') || `.scout-artifacts/ios-testflight/${timestamp}`);
const archivePath = join(outDir, 'HoggCountry.xcarchive');
const exportPath = join(outDir, 'export');
const exportOptionsPath = join(outDir, 'ExportOptions.plist');
const proofPath = join(repoRoot, 'docs', 'launch', 'proof', `ios-testflight-attempt-${timestamp}.md`);
const mobileSuitePath = join(mobileDir, 'static', 'scout', 'dad-local-ai-100.json');
const teamId = readFlag('--team-id') || process.env.HC_IOS_DEVELOPMENT_TEAM || process.env.IOS_DEVELOPMENT_TEAM || process.env.DEVELOPMENT_TEAM || '';
const provisioningProfile = readFlag('--provisioning-profile') || process.env.HC_IOS_PROVISIONING_PROFILE || 'Hoggcountry App Store Connect';
const archiveOnly = hasFlag('--archive-only');
const upload = hasFlag('--upload');
const internalOnly = hasFlag('--internal-only');
const diagnoseOnly = hasFlag('--diagnose-only');
const skipGates = hasFlag('--skip-gates');
const ascAuth = appStoreConnectAuthArgs();
const mobileSuiteIdentity = readMobileSuiteIdentity();

mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(proofPath), { recursive: true });

const steps = [];
let exitCode = 0;

console.log('Hogg Country iOS TestFlight lane');
console.log(`Output: ${relative(repoRoot, outDir)}`);
console.log(`Proof: ${relative(repoRoot, proofPath)}`);
if (teamId) console.log(`Team: ${teamId}`);
if (provisioningProfile) console.log(`Provisioning profile: ${provisioningProfile}`);
if (diagnoseOnly) console.log('Mode: diagnose only');
else if (upload) console.log('Mode: archive and upload to App Store Connect');
else if (archiveOnly) console.log('Mode: archive only');
else console.log('Mode: archive and export local IPA');
console.log('');

try {
  run('repo-sha', 'git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
  run('xcode-version', 'xcodebuild', ['-version'], { cwd: repoRoot });
  run('codesigning-identities', 'security', ['find-identity', '-v', '-p', 'codesigning'], { cwd: repoRoot, allowFailure: true });
  run('provisioning-profiles', 'bash', ['-lc', 'ls -la "$HOME/Library/MobileDevice/Provisioning Profiles"'], { cwd: repoRoot, allowFailure: true });
  run('release-build-settings', 'bash', [
    '-lc',
    'xcodebuild -showBuildSettings -workspace mobile/ios/App/App.xcworkspace -scheme App -configuration Release | rg -n "(PRODUCT_BUNDLE_IDENTIFIER|DEVELOPMENT_TEAM|CODE_SIGN_STYLE|PROVISIONING_PROFILE_SPECIFIER|MARKETING_VERSION|CURRENT_PROJECT_VERSION|CODE_SIGN_IDENTITY|TARGETED_DEVICE_FAMILY)"'
  ], { cwd: repoRoot, allowFailure: true });
  run('ios-signing-readiness', 'bash', [
    '-lc',
    teamId
      ? 'echo "Team override provided; archive will ask Xcode/App Store Connect to provision with that team."'
      : `xcodebuild -showBuildSettings -workspace mobile/ios/App/App.xcworkspace -scheme App -configuration Release | rg -q "DEVELOPMENT_TEAM = [A-Z0-9]+" && echo "DEVELOPMENT_TEAM is configured." || { echo "Missing DEVELOPMENT_TEAM. Select Chris's Apple Developer Team in Xcode or pass --team-id TEAMID."; exit 1; }`
  ], { cwd: repoRoot, allowFailure: true });

  if (diagnoseOnly) {
    console.log('Diagnose-only mode complete.');
  } else {
    if (!skipGates) {
      run('mobile-check', 'npm', ['run', 'check'], { cwd: mobileDir });
      run('mobile-test', 'npm', ['test'], { cwd: mobileDir });
      run('capacitor-sync-ios', 'npm', ['run', 'cap:sync:ios'], { cwd: mobileDir });
    }

    const archiveArgs = [
      '-workspace', 'mobile/ios/App/App.xcworkspace',
      '-scheme', 'App',
      '-configuration', 'Release',
      '-destination', 'generic/platform=iOS',
      '-archivePath', archivePath,
      'archive',
      '-allowProvisioningUpdates',
      ...ascAuth,
      ...teamBuildSettings()
    ];
    run('ios-archive', 'xcodebuild', archiveArgs, { cwd: repoRoot });

    if (!archiveOnly) {
      writeFileSync(exportOptionsPath, exportOptionsPlist(), 'utf8');
      const exportArgs = [
        '-exportArchive',
        '-archivePath', archivePath,
        '-exportPath', exportPath,
        '-exportOptionsPlist', exportOptionsPath,
        '-allowProvisioningUpdates',
        ...ascAuth
      ];
      run(upload ? 'upload-to-app-store-connect' : 'export-app-store-ipa', 'xcodebuild', exportArgs, { cwd: repoRoot });
    }
  }
} catch (error) {
  exitCode = typeof error.exitCode === 'number' ? error.exitCode : 1;
  console.error('');
  console.error(error.message || String(error));
} finally {
  writeProof();
}

if (exitCode === 0) {
  console.log('');
  console.log('TestFlight lane completed.');
  if (upload) {
    console.log('Next: wait for App Store Connect processing, then add Dad to TestFlight and copy the invite/public link.');
  } else if (!archiveOnly && !diagnoseOnly) {
    console.log(`Exported artifacts: ${relative(repoRoot, exportPath)}`);
    console.log('Next: rerun with --upload when App Store Connect credentials/signing are ready.');
  }
}

process.exit(exitCode);

function run(label, command, commandArgs, options = {}) {
  const logPath = join(outDir, `${String(steps.length + 1).padStart(2, '0')}-${label}.log`);
  const printable = formatCommand(command, commandArgs);
  console.log(`$ ${printable}`);
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 80
  });
  const output = [
    `$ ${printable}`,
    `cwd=${options.cwd || repoRoot}`,
    `exit=${result.status ?? 'null'}`,
    '',
    '--- stdout ---',
    result.stdout || '',
    '',
    '--- stderr ---',
    result.stderr || ''
  ].join('\n');
  writeFileSync(logPath, output, 'utf8');
  const status = result.status === 0 ? 'pass' : options.allowFailure ? 'blocked' : 'fail';
  steps.push({ label, command: printable, status, exitCode: result.status, logPath });

  if (result.status === 0) {
    console.log(`  ok -> ${relative(repoRoot, logPath)}`);
    return result;
  }

  console.log(`  ${options.allowFailure ? 'blocked' : 'FAIL'} -> ${relative(repoRoot, logPath)}`);
  if (!options.allowFailure) {
    const tail = tailText(`${result.stdout || ''}\n${result.stderr || ''}`, 80);
    const error = new Error(`${label} failed with exit ${result.status}.\n${tail}`);
    error.exitCode = result.status || 1;
    throw error;
  }
  return result;
}

function teamBuildSettings() {
  return teamId ? [`DEVELOPMENT_TEAM=${teamId}`] : [];
}

function appStoreConnectAuthArgs() {
  const keyPath = readFlag('--asc-key-path') || process.env.APP_STORE_CONNECT_API_KEY_PATH || '';
  const keyId = readFlag('--asc-key-id') || process.env.APP_STORE_CONNECT_API_KEY_ID || '';
  const issuerId = readFlag('--asc-issuer-id') || process.env.APP_STORE_CONNECT_API_ISSUER_ID || '';
  const provided = [keyPath, keyId, issuerId].filter(Boolean);

  if (provided.length > 0 && provided.length < 3) {
    console.error('App Store Connect API auth requires all three: key path, key id, and issuer id.');
    process.exit(2);
  }

  if (provided.length === 0) return [];
  if (!existsSync(keyPath)) {
    console.error(`App Store Connect API key file not found: ${keyPath}`);
    process.exit(2);
  }

  return [
    '-authenticationKeyPath', keyPath,
    '-authenticationKeyID', keyId,
    '-authenticationKeyIssuerID', issuerId
  ];
}

function exportOptionsPlist() {
  const values = [
    ['method', 'app-store-connect'],
    ['destination', upload ? 'upload' : 'export'],
    ['signingStyle', provisioningProfile ? 'manual' : 'automatic'],
    ['stripSwiftSymbols', true],
    ['uploadSymbols', true],
    ['manageAppVersionAndBuildNumber', false]
  ];

  if (teamId) values.push(['teamID', teamId]);
  if (provisioningProfile) {
    values.push(['provisioningProfiles', { 'com.hoggcountry.trailassistant': provisioningProfile }]);
  }
  if (internalOnly) values.push(['testFlightInternalTestingOnly', true]);

  const body = values
    .map(([key, value]) => {
      if (typeof value === 'boolean') return `\t<key>${key}</key>\n\t<${value ? 'true' : 'false'}/>`;
      if (value && typeof value === 'object') {
        const entries = Object.entries(value)
          .map(([nestedKey, nestedValue]) => `\t\t<key>${escapeXml(nestedKey)}</key>\n\t\t<string>${escapeXml(nestedValue)}</string>`)
          .join('\n');
        return `\t<key>${key}</key>\n\t<dict>\n${entries}\n\t</dict>`;
      }
      return `\t<key>${key}</key>\n\t<string>${escapeXml(value)}</string>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${body}
</dict>
</plist>
`;
}

function writeProof() {
  const status = exitCode === 0 && steps.every((step) => step.status === 'pass') ? 'passed' : 'blocked';
  const failedUploadStep = steps.find((step) => step.label === 'upload-to-app-store-connect' && step.status === 'fail');
  const failedUploadLog = failedUploadStep ? safeReadFile(failedUploadStep.logPath) : '';
  const failedUseAccounts = /Failed to Use Accounts|DVTDeveloperAccountManager|Invalid credentials/iu.test(failedUploadLog);
  const lines = [
    `# iOS TestFlight lane attempt`,
    '',
    `Checked at: ${new Date().toISOString()}`,
    `Repo SHA: ${steps.find((step) => step.label === 'repo-sha')?.status === 'pass' ? 'see repo-sha log' : 'unknown'}`,
    `Status: ${status}`,
    `Output directory: ${relative(repoRoot, outDir)}`,
    '',
    '## Mode',
    '',
    `- Upload: ${upload ? 'yes' : 'no'}`,
    `- Archive only: ${archiveOnly ? 'yes' : 'no'}`,
    `- Internal TestFlight only: ${internalOnly ? 'yes' : 'no'}`,
    `- Team override provided: ${teamId ? 'yes' : 'no'}`,
    `- Provisioning profile: ${provisioningProfile || 'automatic'}`,
    `- App Store Connect API key provided: ${ascAuth.length ? 'yes' : 'no'}`,
    `- Eval suite: ${mobileSuiteIdentity ? `\`${mobileSuiteIdentity.suiteId}\` version \`${mobileSuiteIdentity.suiteVersion}\`, hash \`${mobileSuiteIdentity.suiteHash}\`` : 'unavailable'}`,
    '',
    '## Steps',
    ''
  ];

  for (const step of steps) {
    lines.push(`- ${step.status} ${step.label} (exit ${step.exitCode ?? 'null'}): ${relative(repoRoot, step.logPath)}`);
  }

  lines.push('', '## Next action', '');
  if (status === 'passed' && upload) {
    lines.push('Wait for App Store Connect processing, then add Dad to a TestFlight group and copy the invite/public link.');
  } else if (status === 'passed') {
    lines.push('Upload the exported archive to App Store Connect/TestFlight, then add Dad to a TestFlight group and copy the invite/public link.');
  } else if (failedUseAccounts) {
    lines.push('Xcode signed and archived the app, but App Store Connect upload auth failed with `Failed to Use Accounts`. Re-auth Xcode Settings > Accounts for Chris\'s Apple ID, or rerun with App Store Connect API key flags/env: `--asc-key-path`, `--asc-key-id`, and `--asc-issuer-id`.');
  } else {
    lines.push('Resolve the first blocked or failing step above. If the blocked step is `ios-signing-readiness` or `ios-archive` with `requires a development team`, select Chris\'s Apple Developer Team for the App target or rerun with `--team-id TEAMID` after Xcode has a valid Apple account/signing identity.');
  }

  writeFileSync(proofPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Proof written: ${relative(repoRoot, proofPath)}`);
}

function hasFlag(name) {
  return args.includes(name);
}

function readFlag(name) {
  const eq = args.find((arg) => arg.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const index = args.indexOf(name);
  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return null;
}

function unknownFlags(argv, allowed) {
  const unknown = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('-')) {
      unknown.push(arg);
      continue;
    }
    const name = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
    if (!allowed.has(name)) {
      unknown.push(arg);
      continue;
    }
    if (['--team-id', '--provisioning-profile', '--out', '--asc-key-path', '--asc-key-id', '--asc-issuer-id'].includes(name) && !arg.includes('=')) {
      index += 1;
    }
  }
  return unknown;
}

function formatCommand(command, commandArgs) {
  return [command, ...redactCommandArgs(commandArgs)].map(shellQuote).join(' ');
}

function redactCommandArgs(commandArgs) {
  const sensitiveFlags = new Set([
    '-authenticationKeyPath',
    '-authenticationKeyID',
    '-authenticationKeyIssuerID'
  ]);
  const redacted = [];
  for (let index = 0; index < commandArgs.length; index += 1) {
    const value = commandArgs[index];
    redacted.push(value);
    if (sensitiveFlags.has(value) && index + 1 < commandArgs.length) {
      redacted.push('<redacted>');
      index += 1;
    }
  }
  return redacted;
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:=@,+-]+$/u.test(value)) return value;
  return `'${value.replace(/'/gu, `'\\''`)}'`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');
}

function tailText(text, maxLines) {
  const lines = text.trimEnd().split('\n');
  return lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
}

function safeReadFile(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function readMobileSuiteIdentity() {
  try {
    const suite = JSON.parse(readFileSync(mobileSuitePath, 'utf8'));
    return {
      suiteId: suite.suiteId ?? 'dad-local-ai-100',
      ...scoutLocalAiSuiteIdentity(suite)
    };
  } catch {
    return null;
  }
}
