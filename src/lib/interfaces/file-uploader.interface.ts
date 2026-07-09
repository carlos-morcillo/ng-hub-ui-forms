import { Observable } from 'rxjs';

/**
 * An event emitted while a single file is being uploaded.
 *
 * `progress` carries the raw `loaded`/`total` byte counts rather than a percentage, so a transport
 * that does not know the total (`HttpClient` emits `total: undefined` when the request body is
 * streamed) can say so with `total: null` instead of pretending the upload sits at 0%.
 */
export type HubFileUploadEvent =
	| { status: 'progress'; loaded: number; total: number | null }
	| { status: 'done'; response?: unknown }
	| { status: 'error'; error: unknown };

/**
 * Contract every uploader must satisfy to plug into `<hub-file-input>`.
 *
 * The library ships the **mechanism**, never a transport: endpoints, field names, headers and retry
 * policies belong to the application. Register an implementation with {@link provideHubFileUploader}.
 *
 * The returned observable **must be cold**: one subscription equals one request. `<hub-file-input>`
 * cancels an upload by unsubscribing (which aborts the underlying `XMLHttpRequest` when the
 * implementation is built on `HttpClient`) and retries it by re-subscribing. An uploader that
 * returns a hot or shared observable silently breaks cancellation.
 *
 * @example
 * ```ts
 * @Injectable({ providedIn: 'root' })
 * export class ApiFileUploader implements HubFileUploader {
 *   readonly #http = inject(HttpClient);
 *
 *   upload(file: File): Observable<HubFileUploadEvent> {
 *     const body = new FormData();
 *     body.append('file', file);
 *
 *     return this.#http.post('/api/files', body, { reportProgress: true, observe: 'events' }).pipe(
 *       map((event) => {
 *         if (event.type === HttpEventType.UploadProgress) {
 *           return { status: 'progress', loaded: event.loaded, total: event.total ?? null } as const;
 *         }
 *         if (event.type === HttpEventType.Response) {
 *           return { status: 'done', response: event.body } as const;
 *         }
 *         return null;
 *       }),
 *       filter((event) => event !== null),
 *       catchError((error) => of({ status: 'error', error } as const))
 *     );
 *   }
 * }
 * ```
 */
export interface HubFileUploader {
	/**
	 * Uploads a single file.
	 *
	 * @param file - The file to upload.
	 * @param context - The id of the {@link HubFileItem} the file belongs to, for correlation.
	 * @returns A cold observable emitting progress, then either `done` or `error`.
	 */
	upload(file: File, context: { id: string }): Observable<HubFileUploadEvent>;
}
