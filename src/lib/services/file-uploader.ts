import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Type } from '@angular/core';
import { HubFileUploader } from '../interfaces/file-uploader.interface';

/**
 * Injection token holding the {@link HubFileUploader} that `<hub-file-input>` delegates uploads to.
 *
 * It has **no default**: when nothing is registered, the component resolves it as `null` and behaves
 * as a pure picker — no automatic upload, no progress bar, no cancel or retry. Register one with
 * {@link provideHubFileUploader}.
 */
export const HUB_FILE_UPLOADER = new InjectionToken<HubFileUploader>('HUB_FILE_UPLOADER');

/**
 * Registers the uploader that `<hub-file-input>` uses to send files.
 *
 * The library defines the contract, not the transport: an uploader that knows your endpoint, field
 * name, headers and retry policy is application code. Implement {@link HubFileUploader} there and
 * hand it over here.
 *
 * Passing a class provides it in the same injector and aliases the token to that single instance, so
 * the uploader can inject `HttpClient` and hold its own state.
 *
 * @param uploader - The uploader class (dependency-injected) or a ready-made instance.
 * @returns Environment providers to add to `bootstrapApplication` (or a route's `providers`).
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideHttpClient(), provideHubFileUploader(ApiFileUploader)]
 * });
 * ```
 */
export function provideHubFileUploader(uploader: HubFileUploader | Type<HubFileUploader>): EnvironmentProviders {
	if (typeof uploader === 'function') {
		const uploaderType = uploader as Type<HubFileUploader>;

		return makeEnvironmentProviders([uploaderType, { provide: HUB_FILE_UPLOADER, useExisting: uploaderType }]);
	}

	return makeEnvironmentProviders([{ provide: HUB_FILE_UPLOADER, useValue: uploader }]);
}
