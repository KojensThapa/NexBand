import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/authenticate";

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads");
const AUDIO_DIR = path.join(UPLOAD_ROOT, "audio");
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const ALLOWED_AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".webm", ".ogg", ".mpeg"]);

function extensionFor(filename: string, mimetype: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (ALLOWED_AUDIO_EXTENSIONS.has(fromName)) return fromName;

  const bySubtype: Record<string, string> = {
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/x-m4a": ".m4a",
    "audio/mp4": ".m4a",
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
  };
  return bySubtype[mimetype] ?? ".webm";
}

/** Stores admin listening audio and learner speaking recordings on local disk. */
export async function registerUploadRoutes(fastify: FastifyInstance) {
  await mkdir(AUDIO_DIR, { recursive: true });

  fastify.post("/audio", { preHandler: authenticate }, async (request, reply) => {
    const file = await request.file({
      limits: { fileSize: MAX_AUDIO_BYTES },
    });

    if (!file) {
      return reply.status(400).send({ success: false, message: "No audio file was provided." });
    }

    if (!file.mimetype.startsWith("audio/")) {
      return reply.status(400).send({ success: false, message: "Only audio files are accepted." });
    }

    const extension = extensionFor(file.filename, file.mimetype);
    const storedName = `${randomUUID()}${extension}`;
    const destination = path.join(AUDIO_DIR, storedName);

    try {
      await pipeline(file.file, createWriteStream(destination));
    } catch (error) {
      await unlink(destination).catch(() => undefined);
      throw error;
    }

    if (file.file.truncated) {
      await unlink(destination).catch(() => undefined);
      return reply.status(413).send({
        success: false,
        message: `Audio must be smaller than ${Math.floor(MAX_AUDIO_BYTES / (1024 * 1024))} MB.`,
      });
    }

    return reply.status(201).send({
      success: true,
      message: "Audio uploaded successfully.",
      data: { url: `/uploads/audio/${storedName}` },
    });
  });
}
