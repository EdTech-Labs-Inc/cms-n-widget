import mammoth from 'mammoth';
import { readFile } from 'fs/promises';
import { logger } from '@repo/logging';
import { contentRegenerationService } from '../external/content-regeneration.service';
// pdf-parse is a CommonJS module, import dynamically to avoid ESM issues
// @ts-expect-error - pdf-parse types are not available
import pdfParse from 'pdf-parse';

/**
 * File Extraction Service
 * Extracts text content from various file formats
 * Supports: DOCX, DOC, TXT, PDF
 * Uses OpenAI to clean content and extract proper titles
 */
export class FileExtractionService {
  /**
   * Extract text from uploaded file based on mime type
   * Uses OpenAI to clean content and extract proper title
   */
  async extractText(filePath: string, mimeType: string): Promise<{ title: string; content: string }> {
    try {
      // First, extract raw content based on file type
      let rawContent: string;

      switch (mimeType) {
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          rawContent = await this.extractRawFromWord(filePath);
          break;

        case 'text/plain':
          rawContent = await this.extractRawFromText(filePath);
          break;

        case 'application/pdf':
          rawContent = await this.extractRawFromPdf(filePath);
          break;

        default:
          throw new Error(`Unsupported file type: ${mimeType}. Currently supported: DOCX (.docx), DOC (.doc), TXT (.txt), PDF (.pdf)`);
      }

      // Use OpenAI to clean the content and extract proper title
      logger.info('Using OpenAI to clean article and extract title', {
        filePath,
        mimeType,
        contentLength: rawContent.length,
      });
      const { title, cleanedContent } = await contentRegenerationService.cleanArticleContent({
        rawContent: rawContent,
      });
      logger.info('Article cleaned successfully', {
        title,
        cleanedContentLength: cleanedContent.length,
      });

      return { title, content: cleanedContent };
    } catch (error) {
      logger.error('File extraction failed', {
        filePath,
        mimeType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Failed to extract content from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract raw text from Word document
   */
  private async extractRawFromWord(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  }

  /**
   * Extract raw text from plain text file
   */
  private async extractRawFromText(filePath: string): Promise<string> {
    const content = await readFile(filePath, 'utf-8');
    return content.trim();
  }

  /**
   * Extract raw text from PDF file
   * Uses pdf-parse which is a pure JavaScript implementation (Docker-compatible)
   */
  private async extractRawFromPdf(filePath: string): Promise<string> {
    const dataBuffer = await readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  }

  /**
   * Extract raw text from file without cleaning (for script uploads)
   * Returns the raw text without AI processing
   */
  async extractRawText(filePath: string, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await this.extractRawFromWord(filePath);

      case 'text/plain':
        return await this.extractRawFromText(filePath);

      case 'application/pdf':
        return await this.extractRawFromPdf(filePath);

      default:
        throw new Error(`Unsupported file type: ${mimeType}. Currently supported: DOCX (.docx), DOC (.doc), TXT (.txt), PDF (.pdf)`);
    }
  }
}

export const fileExtractionService = new FileExtractionService();
