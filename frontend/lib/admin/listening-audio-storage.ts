const LISTENING_AUDIO_DATABASE = "nexband-listening-audio";
const LISTENING_AUDIO_STORE = "audio-files";

function openListeningAudioDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Local audio storage is unavailable in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LISTENING_AUDIO_DATABASE, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LISTENING_AUDIO_STORE)) {
        database.createObjectStore(LISTENING_AUDIO_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open local audio storage."));
  });
}

/**
 * Reads audio previously stored in this browser's IndexedDB. Retained for
 * playback of parts authored before server-side audio upload existed.
 */
export async function getListeningAudioUrl(audioKey: string): Promise<string | undefined> {
  const database = await openListeningAudioDatabase();

  const audio = await new Promise<Blob | undefined>((resolve, reject) => {
    const transaction = database.transaction(LISTENING_AUDIO_STORE, "readonly");
    const request = transaction.objectStore(LISTENING_AUDIO_STORE).get(audioKey);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to load the locally stored audio file."));
  });

  database.close();
  return audio ? URL.createObjectURL(audio) : undefined;
}
