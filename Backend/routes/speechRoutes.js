const express = require("express");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg"); // Require ffmpeg again
// Attempt to set ffmpeg path automatically (might need adjustment based on actual installation)
try {
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log("ffmpeg path set automatically.");
} catch (e) {
    console.warn("Could not automatically set ffmpeg path. Ensure ffmpeg is in system PATH or set manually if errors occur.");
    // Attempt to install @ffmpeg-installer/ffmpeg if not present? Or just warn.
}

require("dotenv").config({ path: path.join(__dirname, '..', 'secrets.ini') });

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.error("ERROR: OPENAI_API_KEY not found. Speech-to-text will not work.");
}

// POST /api/speech/speech-to-text
router.post("/speech-to-text", upload.single("audio"), async (req, res) => {
  if (!openai) {
    return res.status(500).json({ error: "OpenAI API key not configured on the server." });
  }

  const file = req.file;
  if (!file) {
    console.error("No audio file uploaded in request.");
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  const originalPath = path.resolve(file.path);
  // Define path for converted file (e.g., MP3)
  const convertedPath = `${originalPath}.mp3`;
  console.log(`Received audio file: ${file.originalname}, temp path: ${originalPath}`);

  // Use a Promise to handle ffmpeg conversion asynchronously
  const convertAudio = () => new Promise((resolve, reject) => {
    console.log(`Attempting to convert ${originalPath} to ${convertedPath}`);
    ffmpeg(originalPath)
      .toFormat('mp3')
      // .audioCodec('libmp3lame') // Optional: specify codec
      // .audioBitrate('128k')   // Optional: specify bitrate
      .on('end', () => {
        console.log('Audio conversion finished.');
        resolve(convertedPath);
      })
      .on('error', (err) => {
        console.error('Error during audio conversion:', err.message || err);
        reject(new Error(`ffmpeg conversion failed: ${err.message}`));
      })
      .save(convertedPath);
  });

  try {
    // Convert the audio file first
    const finalAudioPath = await convertAudio();

    console.log(`Sending converted audio (${finalAudioPath}) to OpenAI Whisper API...`);
    // Send the *converted* file to the Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(finalAudioPath),
      model: "whisper-1",
    });
    console.log("Transcription successful:", transcription);

    res.status(200).json({ transcript: transcription.text || "" });

  } catch (error) {
    // Catch errors from conversion or OpenAI
    console.error("Error during speech-to-text processing:", error.message || error);
    res.status(500).json({
      error: "An error occurred while processing the audio file.",
      details: error.message,
    });
  } finally {
    // Clean up both temporary files
    fs.unlink(originalPath, (err) => {
      if (err) console.error(`Error deleting original temp file ${originalPath}:`, err);
      else console.log(`Deleted original temp file: ${originalPath}`);
    });
    // Check if converted file exists before trying to delete
    if (fs.existsSync(convertedPath)) {
        fs.unlink(convertedPath, (err) => {
          if (err) console.error(`Error deleting converted temp file ${convertedPath}:`, err);
          else console.log(`Deleted converted temp file: ${convertedPath}`);
        });
    } else {
        // This might happen if conversion failed before file was created
        console.log(`Converted file ${convertedPath} not found, likely conversion error occurred.`);
    }
  }
});

module.exports = router;
