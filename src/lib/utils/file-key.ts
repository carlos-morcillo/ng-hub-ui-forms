/**
 * Builds the identity key used to detect duplicate selections.
 *
 * Two `File` objects are never referentially equal across separate drops, so identity is derived
 * from the tuple the browser exposes: name, byte size and last-modified timestamp. Collisions are
 * possible in theory (same name, size and mtime) but describe the same file in every practical case.
 *
 * @param file - The file to key.
 * @returns A stable string key for the file.
 */
export function fileKey(file: File): string {
	return `${file.name}:${file.size}:${file.lastModified}`;
}
