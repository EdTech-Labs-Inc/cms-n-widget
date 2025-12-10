import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { storageService } from '../core/storage.service';
import { logger } from '@repo/logging';

/**
 * Video Post-Processing Service - Add bumpers and background music to videos
 *
 * Uses FFmpeg for:
 * - Converting image bumpers to video segments
 * - Concatenating start bumper + main video + end bumper
 * - Overlaying background music at specified volume
 */
export class VideoPostProcessingService {
  /**
   * Process a video by adding bumpers and/or background music
   *
   * @param params.videoUrl - URL of the main video (from Submagic or HeyGen)
   * @param params.startBumper - Optional start bumper configuration
   * @param params.endBumper - Optional end bumper configuration
   * @param params.music - Optional background music configuration
   * @param params.standaloneVideoId - StandaloneVideo ID for file organization
   * @param params.organizationId - Organization ID for S3 path
   * @returns CloudFront URL of the processed video
   */
  async processVideo(params: {
    videoUrl: string;
    startBumper?: {
      mediaUrl: string;
      type: 'image' | 'video';
      duration?: number; // Required for images, optional for videos
    };
    endBumper?: {
      mediaUrl: string;
      type: 'image' | 'video';
      duration?: number;
    };
    music?: {
      audioUrl: string;
      volume: number; // 0-1 (e.g., 0.15 = 15%)
    };
    standaloneVideoId: string;
    organizationId: string;
  }): Promise<{ cloudfrontUrl: string; duration: number }> {
    const { videoUrl, startBumper, endBumper, music, standaloneVideoId, organizationId } = params;

    logger.info('Starting video post-processing', {
      standaloneVideoId,
      hasStartBumper: !!startBumper,
      hasEndBumper: !!endBumper,
      hasMusic: !!music,
    });

    const tempDir = os.tmpdir();
    const tempFiles: string[] = [];

    try {
      // Step 1: Download main video
      const mainVideoPath = path.join(tempDir, `main_${standaloneVideoId}.mp4`);
      await this.downloadFile(videoUrl, mainVideoPath);
      tempFiles.push(mainVideoPath);

      // Get main video metadata (dimensions and duration)
      const mainVideoInfo = await this.getVideoInfo(mainVideoPath);
      logger.info('Main video info', {
        width: mainVideoInfo.width,
        height: mainVideoInfo.height,
        duration: mainVideoInfo.duration,
        frameRate: mainVideoInfo.frameRate,
      });

      // Step 2: Prepare bumpers if provided
      const videosToConcat: string[] = [];

      // Start bumper
      if (startBumper) {
        logger.info('Processing start bumper', { type: startBumper.type, duration: startBumper.duration });
        const startBumperPath = await this.prepareBumper(
          startBumper,
          'start',
          standaloneVideoId,
          mainVideoInfo.width,
          mainVideoInfo.height,
          mainVideoInfo.frameRate,
          tempFiles
        );
        videosToConcat.push(startBumperPath);
      }

      // Main video
      videosToConcat.push(mainVideoPath);

      // End bumper
      if (endBumper) {
        logger.info('Processing end bumper', { type: endBumper.type, duration: endBumper.duration });
        const endBumperPath = await this.prepareBumper(
          endBumper,
          'end',
          standaloneVideoId,
          mainVideoInfo.width,
          mainVideoInfo.height,
          mainVideoInfo.frameRate,
          tempFiles
        );
        videosToConcat.push(endBumperPath);
      }

      // Step 3: Concatenate videos if we have bumpers
      let processedVideoPath = mainVideoPath;

      if (videosToConcat.length > 1) {
        logger.info('Concatenating videos', { count: videosToConcat.length });
        processedVideoPath = path.join(tempDir, `concat_${standaloneVideoId}.mp4`);
        await this.concatenateVideos(videosToConcat, processedVideoPath);
        tempFiles.push(processedVideoPath);
      }

      // Step 4: Overlay background music if provided
      if (music) {
        logger.info('Overlaying background music', { volume: music.volume });
        const musicPath = path.join(tempDir, `music_${standaloneVideoId}.mp3`);
        await this.downloadFile(music.audioUrl, musicPath);
        tempFiles.push(musicPath);

        const finalVideoPath = path.join(tempDir, `final_${standaloneVideoId}.mp4`);
        await this.overlayAudio(processedVideoPath, musicPath, music.volume, finalVideoPath);
        tempFiles.push(finalVideoPath);
        processedVideoPath = finalVideoPath;
      }

      // Step 5: Get final video duration
      const finalInfo = await this.getVideoInfo(processedVideoPath);

      // Step 6: Upload to S3
      logger.info('Uploading processed video to S3');
      const videoBuffer = await fs.readFile(processedVideoPath);
      const filePath = `organizations/${organizationId}/videos/${standaloneVideoId}/final-video.mp4`;
      const uploadResult = await storageService.uploadFile(videoBuffer, filePath, 'video/mp4');

      logger.info('Video post-processing complete', {
        standaloneVideoId,
        duration: finalInfo.duration,
        cloudfrontUrl: uploadResult.cloudfrontUrl,
      });

      return {
        cloudfrontUrl: uploadResult.cloudfrontUrl,
        duration: Math.ceil(finalInfo.duration),
      };
    } finally {
      // Cleanup temp files
      await Promise.all(
        tempFiles.map((file) =>
          fs.unlink(file).catch((err) => {
            logger.warn('Failed to cleanup temp file', { file, error: err.message });
          })
        )
      );
    }
  }

  /**
   * Download a file from URL to local path
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    logger.debug('Downloading file', { url, outputPath });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Get video information (dimensions, duration, frame rate)
   */
  private getVideoInfo(filePath: string): Promise<{ width: number; height: number; duration: number; frameRate: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        // Extract frame rate from r_frame_rate (e.g., "25/1" or "30000/1001")
        const frameRateStr = videoStream.r_frame_rate || '25/1';
        const [num, den] = frameRateStr.split('/').map(Number);
        const frameRate = den ? num / den : 25;

        resolve({
          width: videoStream.width || 720,
          height: videoStream.height || 1280,
          duration: metadata.format.duration || 0,
          frameRate: Math.round(frameRate),
        });
      });
    });
  }

  /**
   * Prepare a bumper for concatenation
   * - For video bumpers: Re-encode to match main video specs
   * - For image bumpers: Convert to video with specified duration
   */
  private async prepareBumper(
    bumper: { mediaUrl: string; type: 'image' | 'video'; duration?: number },
    position: 'start' | 'end',
    standaloneVideoId: string,
    targetWidth: number,
    targetHeight: number,
    targetFrameRate: number,
    tempFiles: string[]
  ): Promise<string> {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `bumper_${position}_input_${standaloneVideoId}${this.getExtension(bumper.mediaUrl, bumper.type)}`);
    await this.downloadFile(bumper.mediaUrl, inputPath);
    tempFiles.push(inputPath);

    const outputPath = path.join(tempDir, `bumper_${position}_${standaloneVideoId}.mp4`);

    if (bumper.type === 'image') {
      // Convert image to video
      const duration = bumper.duration || 3; // Default 3 seconds for images
      await this.imageToVideo(inputPath, outputPath, duration, targetWidth, targetHeight, targetFrameRate);
    } else {
      // Re-encode video bumper to match main video
      await this.reencodeVideo(inputPath, outputPath, targetWidth, targetHeight, targetFrameRate);
    }

    tempFiles.push(outputPath);
    return outputPath;
  }

  /**
   * Get file extension from URL or type
   */
  private getExtension(url: string, type: 'image' | 'video'): string {
    const urlPath = new URL(url).pathname;
    const ext = path.extname(urlPath);
    if (ext) return ext;
    return type === 'image' ? '.png' : '.mp4';
  }

  /**
   * Convert an image to a video with specified duration
   * Scales/pads image to match target dimensions
   * Note: Creates video without audio - concatenation handles adding silent audio
   */
  private imageToVideo(
    imagePath: string,
    outputPath: string,
    duration: number,
    targetWidth: number,
    targetHeight: number,
    targetFrameRate: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.debug('Converting image to video', { imagePath, duration, targetWidth, targetHeight, targetFrameRate });

      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop 1', `-framerate ${targetFrameRate}`])
        .videoFilters([
          `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
          `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`,
          'setsar=1:1',
          `fps=${targetFrameRate}`,
        ])
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-pix_fmt yuv420p',
          '-t', duration.toString(),
          '-an', // No audio - concatenation will handle this
        ])
        .output(outputPath)
        .on('end', () => {
          logger.debug('Image to video conversion complete', { outputPath });
          resolve();
        })
        .on('error', (err) => {
          logger.error('Image to video conversion failed', { error: err.message });
          reject(err);
        })
        .run();
    });
  }

  /**
   * Re-encode a video bumper to match main video specs
   */
  private reencodeVideo(
    inputPath: string,
    outputPath: string,
    targetWidth: number,
    targetHeight: number,
    targetFrameRate: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.debug('Re-encoding video bumper', { inputPath, targetWidth, targetHeight, targetFrameRate });

      ffmpeg(inputPath)
        .videoFilters([
          // Scale to fit within target dimensions
          `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
          // Pad to exact target dimensions
          `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`,
          'setsar=1:1',
          // Normalize frame rate to match main video
          `fps=${targetFrameRate}`,
        ])
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-pix_fmt yuv420p',
          `-r ${targetFrameRate}`,
          '-c:a aac',
          '-ar 44100',
          '-ac 2',
        ])
        .output(outputPath)
        .on('end', () => {
          logger.debug('Video re-encoding complete', { outputPath });
          resolve();
        })
        .on('error', (err) => {
          logger.error('Video re-encoding failed', { error: err.message });
          reject(err);
        })
        .run();
    });
  }

  /**
   * Generate a silent audio file (no lavfi required)
   */
  private async generateSilentAudio(outputPath: string, durationSec: number): Promise<void> {
    // Generate raw PCM silence (16-bit stereo at 44100Hz)
    const sampleRate = 44100;
    const channels = 2;
    const bytesPerSample = 2;
    const totalSamples = Math.ceil(sampleRate * durationSec * channels);
    const buffer = Buffer.alloc(totalSamples * bytesPerSample, 0);

    const rawPath = outputPath.replace('.aac', '.raw');
    await fs.writeFile(rawPath, buffer);

    // Convert raw PCM to AAC
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(rawPath)
        .inputOptions(['-f s16le', '-ar 44100', '-ac 2'])
        .outputOptions(['-c:a aac', '-b:a 128k'])
        .output(outputPath)
        .on('end', () => {
          fs.unlink(rawPath).catch(() => {});
          resolve();
        })
        .on('error', (err) => {
          fs.unlink(rawPath).catch(() => {});
          reject(err);
        })
        .run();
    });
  }

  /**
   * Add silent audio track to a video file
   */
  private async addSilentAudioToVideo(inputPath: string, outputPath: string): Promise<void> {
    // Get video duration
    const info = await this.getVideoInfo(inputPath);
    const tempDir = os.tmpdir();
    const silentAudioPath = path.join(tempDir, `silent_${Date.now()}.aac`);

    try {
      // Generate silent audio matching video duration
      await this.generateSilentAudio(silentAudioPath, info.duration + 1);

      // Merge video with silent audio
      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(inputPath)
          .input(silentAudioPath)
          .outputOptions(['-c:v copy', '-c:a aac', '-map 0:v', '-map 1:a', '-shortest'])
          .output(outputPath)
          .on('end', () => {
            fs.unlink(silentAudioPath).catch(() => {});
            resolve();
          })
          .on('error', (err) => {
            fs.unlink(silentAudioPath).catch(() => {});
            reject(err);
          })
          .run();
      });
    } catch (err) {
      await fs.unlink(silentAudioPath).catch(() => {});
      throw err;
    }
  }

  /**
   * Concatenate multiple videos into one
   * Ensures all videos have audio tracks before concatenation
   */
  private async concatenateVideos(inputPaths: string[], outputPath: string): Promise<void> {
    logger.debug('Concatenating videos', { inputCount: inputPaths.length });

    const tempDir = os.tmpdir();
    const tempFiles: string[] = [];

    // Ensure all inputs have audio tracks
    const normalizedPaths = await Promise.all(
      inputPaths.map(async (inputPath, i) => {
        const hasAudio = await new Promise<boolean>((resolve) => {
          ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) {
              resolve(false);
              return;
            }
            const hasAudioStream = metadata.streams.some((s) => s.codec_type === 'audio');
            resolve(hasAudioStream);
          });
        });

        if (hasAudio) {
          return inputPath;
        }

        // Add silent audio to videos without audio
        logger.debug('Adding silent audio to video', { inputPath });
        const withAudioPath = path.join(tempDir, `with_audio_${i}_${Date.now()}.mp4`);
        await this.addSilentAudioToVideo(inputPath, withAudioPath);
        tempFiles.push(withAudioPath);
        return withAudioPath;
      })
    );

    // Now concatenate using the fast concat demuxer (all videos have same format)
    const listFile = path.join(tempDir, `concat_list_${Date.now()}.txt`);
    const listContent = normalizedPaths.map((p) => `file '${p}'`).join('\n');

    try {
      await fs.writeFile(listFile, listContent);

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(listFile)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions(['-c copy'])
          .output(outputPath)
          .on('end', () => {
            logger.debug('Video concatenation complete', { outputPath });
            resolve();
          })
          .on('error', (err) => {
            logger.error('Video concatenation failed', { error: err.message });
            reject(err);
          })
          .run();
      });
    } finally {
      // Cleanup temp files
      await fs.unlink(listFile).catch(() => {});
      await Promise.all(tempFiles.map((f) => fs.unlink(f).catch(() => {})));
    }
  }

  /**
   * Overlay background music on video at specified volume
   * Loops music if shorter than video, fades out at end
   */
  private overlayAudio(
    videoPath: string,
    audioPath: string,
    volume: number,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.debug('Overlaying audio', { videoPath, audioPath, volume });

      // Get video duration first
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoDuration = metadata.format.duration || 60;

        ffmpeg()
          .input(videoPath)
          .input(audioPath)
          .complexFilter([
            // Loop music if needed and trim to video length
            `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${videoDuration},volume=${volume}[music]`,
            // Mix original audio with music
            `[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
          ])
          .outputOptions([
            '-map 0:v',
            '-map [aout]',
            '-c:v copy',
            '-c:a aac',
            '-ar 44100',
            '-ac 2',
          ])
          .output(outputPath)
          .on('end', () => {
            logger.debug('Audio overlay complete', { outputPath });
            resolve();
          })
          .on('error', (err) => {
            logger.error('Audio overlay failed', { error: err.message });
            reject(err);
          })
          .run();
      });
    });
  }
}

// Singleton instance
export const videoPostProcessingService = new VideoPostProcessingService();
