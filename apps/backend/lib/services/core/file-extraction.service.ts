import mammoth from 'mammoth';
import { readFile } from 'fs/promises';
import { openaiService } from '../external/openai.service';

/**
 * File Extraction Service
 * Extracts text content from various file formats
 * Currently supports: DOCX, DOC, TXT
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

        default:
          throw new Error(`Unsupported file type: ${mimeType}. Currently supported: DOCX (.docx), DOC (.doc), TXT (.txt)`);
      }

      // Use OpenAI to clean the content and extract proper title
      console.log('🤖 [FileExtraction] Using OpenAI to clean article and extract title...');
      const { title, cleanedContent } = await openaiService.cleanArticleContent({
        rawContent: rawContent,
      });
      console.log('✅ [FileExtraction] Article cleaned. Title:', title, 'Content length:', cleanedContent.length);

      return { title, content: cleanedContent };
    } catch (error) {
      console.error('File extraction error:', error);
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
}

export const fileExtractionService = new FileExtractionService();
