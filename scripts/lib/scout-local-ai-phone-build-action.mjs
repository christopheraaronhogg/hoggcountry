export function createScoutLocalAiPhoneBuildAction({ testflight, nativeSource }) {
	const targetBuild = testflight?.targetBuild ?? '<unknown>';
	const recordedDadPilotBuild = testflight?.recordedDadPilotBuild ?? '<unknown>';
	const suiteRequiredBuild = testflight?.suiteRequiredBuild ?? '<unknown>';
	if (!testflight?.targetBuildMeetsSuiteRequirement) {
		return {
			kind: 'align-suite-build',
			canRunNow: false,
			requiresNewUploadBeforeRun100: true,
			requiresNewUploadForLatestAppSourceProof: true,
			text: `Do not start Run 100 yet; the Xcode target ${targetBuild} does not meet the suite requirement ${suiteRequiredBuild}.`
		};
	}
	if (nativeSource?.latestNativeUploadHasCurrentSuite === false) {
		return {
			kind: 'upload-current-suite-build',
			canRunNow: false,
			requiresNewUploadBeforeRun100: true,
			requiresNewUploadForLatestAppSourceProof: true,
			text: `Do not ask Dad for Run 100 yet; the latest TestFlight upload contains suite ${nativeSource.latestNativeUploadSuiteVersion ?? '<unknown>'} (${nativeSource.latestNativeUploadSuiteHash ?? '<unknown>'}), but the current suite is ${testflight.currentSuiteVersion ?? '<unknown>'} (${testflight.currentSuiteHash ?? '<unknown>'}). Upload and attach ${targetBuild} to Dad Pilot first.`
		};
	}
	if (!testflight?.targetBuildAvailableForDad) {
		return {
			kind: 'publish-target-build',
			canRunNow: false,
			requiresNewUploadBeforeRun100: true,
			requiresNewUploadForLatestAppSourceProof: true,
			text: `Do not ask Dad for Run 100 yet; upload and attach ${targetBuild} to Dad Pilot because Dad Pilot currently records ${recordedDadPilotBuild}.`
		};
	}
	const buildLabel = testflight.targetBuildReadyForDad
		? `the latest Dad Pilot TestFlight build ${targetBuild}`
		: testflight.recordedDadPilotMeetsSuiteRequirement
			? `the suite-compatible Dad Pilot TestFlight build ${recordedDadPilotBuild}; newer target ${targetBuild} is pending upload`
			: `a suite-compatible TestFlight iPhone build satisfying ${suiteRequiredBuild}`;
	const source = nativeSourceAction(nativeSource);
	return {
		kind: source.kind,
		canRunNow: true,
		requiresNewUploadBeforeRun100: false,
		requiresNewUploadForLatestAppSourceProof: source.requiresNewUploadForLatestAppSourceProof,
		text: `Run 100 now on ${buildLabel}. ${source.text}`
	};
}

function nativeSourceAction(nativeSource) {
	if (nativeSource?.latestNativeUploadHasCurrentSource) {
		return {
			kind: 'run-current-native-upload',
			requiresNewUploadForLatestAppSourceProof: false,
			text: 'The latest successful native upload contains the current checkout.'
		};
	}
	if (nativeSource?.nativeAppSourceNewerThanLatestNativeUpload) {
		return {
			kind: 'upload-native-app-source-for-latest-proof',
			requiresNewUploadForLatestAppSourceProof: true,
			text: 'Native app source changed after the latest successful upload; Dad can still run a suite-compatible build for diagnosis, but latest-app-source proof needs a fresh TestFlight upload and Dad Pilot refresh.'
		};
	}
	if (nativeSource?.sourceNewerThanLatestNativeUpload) {
		return {
			kind: 'run-support-only-source-changes',
			requiresNewUploadForLatestAppSourceProof: false,
			text: 'Repo changes after the latest successful native upload are outside native app source, so no fresh TestFlight upload is needed before Dad\'s Run 100.'
		};
	}
	if (nativeSource?.sourceDiffersFromLatestNativeUpload) {
		return {
			kind: 'verify-native-upload-source',
			requiresNewUploadForLatestAppSourceProof: true,
			text: 'Current checkout differs from the latest successful native upload, and the changed app-source boundary is unclear; latest-source proof needs a fresh upload or stronger upload-source evidence.'
		};
	}
	return {
		kind: 'run-native-upload-source-unknown',
		requiresNewUploadForLatestAppSourceProof: false,
		text: 'Latest native upload source is unknown; final proof still depends on the imported TestFlight/iPhone export showing a suite-compatible app build.'
	};
}
