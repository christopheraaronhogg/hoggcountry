import { InMemoryContextPackStore } from './context-pack-store.ts';
import { DefaultModelRouter } from './model-router.ts';
import { CloudScoutProvider, type CloudScoutBridge } from './providers/cloud-scout.ts';
import { OnDeviceGemmaProvider, type OnDeviceGemmaBridge, type GemmaTier } from './providers/on-device-gemma.ts';
import { DefaultScoutRuntime } from './scout-runtime.ts';
import { recordScoutDiagnostic } from './scout-diagnostics.ts';
import { defaultToolRegistry } from './tool-registry.ts';
import type { ContextPack, ContextPackStore, ScoutDiagnosticsSink, ScoutRuntime, ToolRegistry } from './types.ts';

export * from './types.ts';
export { InMemoryContextPackStore, createCapacitorPreferencesAdapter } from './context-pack-store.ts';
export { InMemoryToolRegistry, defaultToolRegistry, runToolsFor } from './tool-registry.ts';
export { OnDeviceGemmaProvider, OnDeviceModelUnavailableError } from './providers/on-device-gemma.ts';
export type { OnDeviceGemmaBridge, GemmaTier, GemmaModelDescriptor } from './providers/on-device-gemma.ts';
export { CloudScoutProvider } from './providers/cloud-scout.ts';
export type { CloudScoutBridge } from './providers/cloud-scout.ts';
export { DefaultModelRouter, NoScoutModelAvailableError } from './model-router.ts';
export { DefaultScoutRuntime } from './scout-runtime.ts';
export { cloneDefaultContextPack, DEFAULT_CONTEXT_PACK } from './default-pack.ts';

export interface CreateScoutRuntimeOptions {
	store?: ContextPackStore;
	registry?: ToolRegistry;
	initialPack?: ContextPack;
	onDeviceBridge?: OnDeviceGemmaBridge;
	onDeviceTier?: GemmaTier;
	cloudBridge?: CloudScoutBridge;
	diagnostics?: ScoutDiagnosticsSink;
}

export function createScoutRuntime(options: CreateScoutRuntimeOptions = {}): {
	runtime: ScoutRuntime;
	store: ContextPackStore;
	registry: ToolRegistry;
	onDeviceProvider: OnDeviceGemmaProvider | undefined;
} {
	const store = options.store ?? new InMemoryContextPackStore({ initial: options.initialPack });
	const registry = options.registry ?? defaultToolRegistry();
	const onDevice = options.onDeviceBridge
		? new OnDeviceGemmaProvider({ bridge: options.onDeviceBridge, tier: options.onDeviceTier })
		: undefined;
	const cloud = options.cloudBridge ? new CloudScoutProvider({ bridge: options.cloudBridge }) : undefined;

	const router = new DefaultModelRouter({ onDevice, cloud });
	const runtime = new DefaultScoutRuntime({
		store,
		registry,
		router,
		diagnostics: options.diagnostics ?? recordScoutDiagnostic
	});

	return { runtime, store, registry, onDeviceProvider: onDevice };
}
