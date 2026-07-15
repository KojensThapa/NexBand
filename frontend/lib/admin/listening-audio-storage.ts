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

export async function saveListeningAudio(file: File): Promise<string> {
  const audioKey = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const database = await openListeningAudioDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(LISTENING_AUDIO_STORE, "readwrite");
    transaction.objectStore(LISTENING_AUDIO_STORE).put(file, audioKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Unable to save the audio file locally."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Saving the audio file was cancelled."));
  });

  database.close();
  return audioKey;
}

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

export async function deleteListeningAudio(audioKey: string): Promise<void> {
  const database = await openListeningAudioDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(LISTENING_AUDIO_STORE, "readwrite");
    transaction.objectStore(LISTENING_AUDIO_STORE).delete(audioKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Unable to remove the locally stored audio file."));
  });

  database.close();
}
