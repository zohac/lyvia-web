/**
 * Human size of an attached file (o / Ko / Mo), one formatting for the whole
 * contents feature.
 *
 * Extracted by diffusion-14: the practitioner's document field and the Keova
 * article preview both display `document.sizeBytes`, and a second copy of the
 * rounding is how two surfaces start saying « 2.0 Mo » and « 2 Mo » of the same
 * file. The thresholds and the one-decimal rounding are the ones the field has
 * always used (`tests/contents/content-document-field.test.ts` pins « 2.0 Mo »).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
