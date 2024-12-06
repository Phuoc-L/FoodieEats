const express = require("express");
const multer = require("multer");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config({ path: "secrets.ini" }); // Load environment variables from secrets.ini

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure OPENAI_API_KEY is defined in secrets.ini
});

router.post("/speech-to-text", upload.single("audio"), async (req, res) => {
  try {
    const file = req.file;

    // Check if a file is uploaded
    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const originalPath = path.resolve(file.path);
    const convertedPath = `${originalPath}.wav`;

    // Convert audio to WAV format using FFmpeg
    ffmpeg(originalPath)
      .toFormat("wav")
      .save(convertedPath)
      .on("end", async () => {
        try {
          // Send the converted file to the Whisper API
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(convertedPath),
            model: "whisper-1",
          });

          // Clean up temporary files
          fs.unlinkSync(originalPath); // Delete the original uploaded file
          fs.unlinkSync(convertedPath); // Delete the converted file

          // Respond with the transcribed text
          res.status(200).json({ transcript: transcription.text });
        } catch (error) {
          console.error("Error during transcription:", error.message || error);
          res.status(500).json({
            error: "An error occurred while processing the audio file.",
            details: error.message,
          });
        }
      })
      .on("error", (error) => {
        console.error("Error during audio conversion:", error.message || error);
        res.status(500).json({
          error: "An error occurred while converting the audio file.",
          details: error.message,
        });
      });
  } catch (error) {
    console.error("Error in speech-to-text route:", error.message || error);
    res.status(500).json({
      error: "An error occurred while processing the request.",
      details: error.message,
    });
  }
});

module.exports = router;
