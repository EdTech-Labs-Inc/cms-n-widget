/**
 * Article Formatting Utilities
 *
 * These utilities help improve readability by breaking up long paragraphs
 * and enhancing the visual presentation of article content.
 */

/**
 * Main function - detects if content is plain text or HTML and formats accordingly
 */
export function formatArticleContent(content: string): string {
  // Check if content has paragraph tags
  const hasParagraphTags = /<p[^>]*>/i.test(content)

  if (!hasParagraphTags) {
    // Content is plain text, convert to formatted HTML
    return formatPlainTextContent(content)
  } else {
    // Content already has HTML, enhance existing paragraphs
    return formatHtmlContent(content)
  }
}

/**
 * Format plain text content into proper HTML paragraphs
 * Breaks up long blocks of text into readable 2-3 sentence paragraphs
 */
function formatPlainTextContent(text: string): string {
  // Split by double line breaks (existing paragraph breaks)
  const blocks = text.split(/\n\n+/).filter(block => block.trim())

  const formattedBlocks = blocks.map(block => {
    // Clean up: replace single line breaks with spaces
    const cleanBlock = block.replace(/\n/g, ' ').trim()

    // Skip very short blocks (likely headings or metadata)
    if (cleanBlock.length < 50) {
      return `<p>${cleanBlock}</p>`
    }

    // Split into sentences
    const sentences = splitTextIntoSentences(cleanBlock)

    // If block has 4+ sentences, break it up into smaller paragraphs
    if (sentences.length >= 4) {
      const paragraphs: string[] = []
      let currentParagraph: string[] = []

      sentences.forEach((sentence, index) => {
        currentParagraph.push(sentence)

        // Determine if we should create a paragraph break
        const isLastSentence = index === sentences.length - 1
        const hasEnoughSentences = currentParagraph.length >= 2
        const hasMaxSentences = currentParagraph.length === 3
        const hasMoreSentences = sentences.length - index > 1

        const shouldBreak = hasEnoughSentences && (
          isLastSentence ||
          hasMaxSentences ||
          (currentParagraph.length === 2 && hasMoreSentences)
        )

        if (shouldBreak) {
          paragraphs.push(`<p>${currentParagraph.join(' ').trim()}</p>`)
          currentParagraph = []
        }
      })

      // Add any remaining sentences
      if (currentParagraph.length > 0) {
        paragraphs.push(`<p>${currentParagraph.join(' ').trim()}</p>`)
      }

      return paragraphs.join('\n')
    } else {
      // Short block (1-3 sentences), keep as single paragraph
      return `<p>${cleanBlock}</p>`
    }
  })

  return formattedBlocks.join('\n')
}

/**
 * Split plain text into sentences
 * Handles common sentence endings: . ! ?
 */
function splitTextIntoSentences(text: string): string[] {
  const sentences: string[] = []
  let currentSentence = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    currentSentence += char

    // Check for sentence-ending punctuation
    if (char === '.' || char === '!' || char === '?') {
      const nextChar = text[i + 1]
      const charAfterNext = text[i + 2]

      // Determine if this is a true sentence ending
      const isEndOfText = !nextChar
      const isFollowedByCapital = nextChar === ' ' && charAfterNext && /[A-Z]/.test(charAfterNext)
      const isLastChar = i === text.length - 1

      if (isEndOfText || isFollowedByCapital || isLastChar) {
        const trimmed = currentSentence.trim()
        if (trimmed.length > 0) {
          sentences.push(trimmed)
        }
        currentSentence = ''
      }
    }
  }

  // Add any remaining content as the last sentence
  const trimmed = currentSentence.trim()
  if (trimmed.length > 0) {
    sentences.push(trimmed)
  }

  return sentences
}

/**
 * Format HTML content by breaking up long paragraphs
 * Preserves existing HTML structure and tags
 */
function formatHtmlContent(htmlContent: string): string {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent

  // Process all paragraph elements
  const paragraphs = tempDiv.querySelectorAll('p')

  paragraphs.forEach(paragraph => {
    const text = paragraph.textContent || ''

    // Only process paragraphs with more than 400 characters or 4+ sentences
    const sentenceCount = (text.match(/[.!?]+\s+[A-Z]/g) || []).length + 1

    if (text.length > 400 || sentenceCount >= 4) {
      // Split into sentences
      const sentences = splitHtmlIntoSentences(paragraph.innerHTML)

      if (sentences.length >= 4) {
        // Break into smaller paragraphs (2-3 sentences each)
        const newParagraphs: string[] = []
        let currentParagraph: string[] = []

        sentences.forEach((sentence, index) => {
          currentParagraph.push(sentence)

          // Create a new paragraph every 2-3 sentences
          const shouldBreak = currentParagraph.length >= 2 && (
            index === sentences.length - 1 || // Last sentence
            currentParagraph.length === 3 ||   // Max 3 sentences per paragraph
            (currentParagraph.length === 2 && sentences.length - index > 1) // 2 sentences with more to come
          )

          if (shouldBreak) {
            newParagraphs.push(currentParagraph.join(' ').trim())
            currentParagraph = []
          }
        })

        // Add any remaining sentences
        if (currentParagraph.length > 0) {
          newParagraphs.push(currentParagraph.join(' ').trim())
        }

        // Replace the original paragraph with multiple paragraphs
        if (newParagraphs.length > 1) {
          const newElements = newParagraphs.map(content => {
            const p = document.createElement('p')
            p.innerHTML = content
            // Copy classes from original paragraph
            paragraph.classList.forEach(cls => p.classList.add(cls))
            return p
          })

          // Replace original paragraph with new ones
          const parent = paragraph.parentNode
          if (parent) {
            newElements.forEach((newP, index) => {
              if (index === 0) {
                parent.replaceChild(newP, paragraph)
              } else {
                // Insert after the previous element
                const prevElement = newElements[index - 1]
                parent.insertBefore(newP, prevElement.nextSibling)
              }
            })
          }
        }
      }
    }
  })

  return tempDiv.innerHTML
}

/**
 * Split HTML content into sentences while preserving HTML tags
 */
function splitHtmlIntoSentences(html: string): string[] {
  const sentences: string[] = []
  let currentSentence = ''
  let inTag = false

  for (let i = 0; i < html.length; i++) {
    const char = html[i]
    currentSentence += char

    // Track if we're inside an HTML tag
    if (char === '<') {
      inTag = true
    } else if (char === '>') {
      inTag = false
    }

    // Look for sentence endings (not inside tags)
    if (!inTag && (char === '.' || char === '!' || char === '?')) {
      const nextChar = html[i + 1]
      const charAfterNext = html[i + 2]

      if (
        !nextChar || // End of string
        (nextChar === ' ' && charAfterNext && /[A-Z]/.test(charAfterNext)) ||
        (nextChar === '<') // HTML tag after sentence
      ) {
        sentences.push(currentSentence.trim())
        currentSentence = ''
      }
    }
  }

  // Add any remaining content as the last sentence
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim())
  }

  return sentences.filter(s => s.length > 0)
}

/**
 * Add better spacing and visual breaks to article content
 * Adds CSS classes for enhanced styling
 */
export function enhanceArticleReadability(content: string): string {
  // If content is plain text, convert to HTML first
  const hasHtmlTags = /<[^>]+>/.test(content)

  const tempDiv = document.createElement('div')

  if (hasHtmlTags) {
    tempDiv.innerHTML = content
  } else {
    // Wrap plain text in a temporary paragraph for processing
    tempDiv.innerHTML = content
  }

  // Add spacing classes to headings
  const headings = tempDiv.querySelectorAll('h2, h3, h4')
  headings.forEach(heading => {
    heading.classList.add('article-heading-enhanced')
  })

  // Add first-paragraph class for special styling
  const firstParagraph = tempDiv.querySelector('p')
  if (firstParagraph) {
    firstParagraph.classList.add('article-first-paragraph')
  }

  // Add proper spacing to lists
  const lists = tempDiv.querySelectorAll('ul, ol')
  lists.forEach(list => {
    list.classList.add('article-list-enhanced')
  })

  return tempDiv.innerHTML
}
