/**
 * Creates a custom menu in Google Slides when the presentation opens.
 */
function onOpen() {
  const ui = SlidesApp.getUi();
  ui.createMenu('Slidemaker')
    .addItem('Create Slides from Google Doc', 'showDocUrlDialog')
    .addItem('Create Slides from Text', 'showTextInputDialog')
    .addToUi();
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** @constant {Object} Layout constants for slide dimensions and positioning */
const LAYOUT = {
  // Title Slide
  TITLE: {
    X: 50,
    Y: 100,
    WIDTH: 622,
    HEIGHT: 100,
    FONT_SIZE: 44
  },
  TITLE_SUBTITLE: {
    X: 50,
    Y: 200,
    WIDTH: 622,
    HEIGHT: 100,
    FONT_SIZE: 28
  },

  // Content Slide
  HEADLINE: {
    X: 50,
    Y: 30,
    WIDTH: 450,
    HEIGHT: 70,           // Increased from 50 to accommodate text wrapping
    FONT_SIZE: 32
  },
  SUBTITLE: {
    X: 50,
    Y: 110,              // Increased from 85 for better spacing after headline
    WIDTH: 450,
    HEIGHT: 40,          // Increased from 35 for better spacing
    FONT_SIZE: 24
  },
  BULLETS: {
    X: 50,
    START_Y_WITH_SUBTITLE: 160,    // Adjusted from 125 to account for new spacing
    START_Y_NO_SUBTITLE: 110,      // Adjusted from 95 to account for taller headline
    WIDTH_WITH_MEDIA: 380,
    WIDTH_NO_MEDIA: 450,
    HEIGHT: 300,
    FONT_SIZE_WITH_MEDIA: 18,
    FONT_SIZE_NO_MEDIA: 20
  },

  // Media Elements
  MEDIA: {
    START_Y: 100,
    LEFT: 450,
    WIDTH: 250,
    HEIGHT: 200,
    VERTICAL_SPACING: 10,
    ERROR_HEIGHT: 60,
    ERROR_FONT_SIZE: 9
  },

  // Two-Column Layout
  TWO_COLUMN: {
    HEADLINE_X: 50,
    HEADLINE_Y: 30,
    HEADLINE_WIDTH: 622,
    HEADLINE_HEIGHT: 50,
    HEADLINE_FONT_SIZE: 32,

    COLUMN_WIDTH: 286,
    LEFT_COLUMN_X: 50,
    RIGHT_COLUMN_X: 386,
    CONTENT_START_Y_WITH_HEADLINE: 100,
    CONTENT_START_Y_NO_HEADLINE: 50,
    CONTENT_HEIGHT: 150,
    CONTENT_FONT_SIZE: 16,

    MEDIA_HEIGHT: 90,
    MEDIA_SPACING: 100,
    MEDIA_OFFSET: 160,
    ERROR_HEIGHT: 30,
    ERROR_FONT_SIZE: 10
  }
};

/** @constant {Object} Regular expressions for parsing markdown and content */
const REGEX = {
  GOOGLE_DOC_ID: /document\/d\/([a-zA-Z0-9_-]+)/,
  GOOGLE_DRIVE_FILE_ID: /\/file\/d\/([a-zA-Z0-9_-]+)/,
  GOOGLE_DRIVE_OPEN_ID: /[?&]id=([a-zA-Z0-9_-]+)/,
  YOUTUBE_URL: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i,
  IMAGE_URL: /^https?:\/\//i,
  GDRIVE_PREFIX: /^GDRIVE:/i,

  MARKDOWN_H1: /^#\s+(.+)$/,
  MARKDOWN_H2: /^#{2}\s+(.+)$/,
  MARKDOWN_H3: /^#{3}\s+(.+)$/,
  MARKDOWN_BULLET: /^[\*\-•]\s+(.+)$/,
  MARKDOWN_IMAGE: /^!\[([^\]]*)\]\(([^)]+)\)$/,

  TWO_COLUMN_MARKER: /^two[\s-]?column/i,
  TWO_COLUMN_HEADLINE: /^two[\s-]?column[\s:]+(.+)$/i,
  LEFT_COLUMN: /^left[\s:]?/i,
  LEFT_COLUMN_CONTENT: /^left[\s:]+(.+)$/i,
  RIGHT_COLUMN: /^right[\s:]?/i,
  RIGHT_COLUMN_CONTENT: /^right[\s:]+(.+)$/i,

  VIDEO_SIMPLE: /^video[\s:]+(.+)$/i,
  IMAGE_SIMPLE: /^image[\s:]+(.+)$/i,

  // Speaker Notes
  SPEAKER_NOTES_START: /^\*\*(?:Speaker Notes|Teaching Notes|Notes):\*\*\s*(.*)$/i
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * @typedef {Object} TitleSlideData
 * @property {boolean} isTitle - Always true for title slides
 * @property {string} title - The main title text
 * @property {string} subtitle - Optional subtitle text
 * @property {string} notes - Speaker notes for the slide
 */

/**
 * @typedef {Object} ContentSlideData
 * @property {boolean} isTitle - Always false for content slides
 * @property {string} headline - The slide headline
 * @property {string} subtitle - Optional subtitle
 * @property {string[]} bullets - Array of bullet point text
 * @property {string[]} images - Array of image URLs (http/https or GDRIVE:fileId)
 * @property {string[]} videos - Array of YouTube video URLs
 * @property {string} notes - Speaker notes for the slide
 */

/**
 * @typedef {Object} TwoColumnSlideData
 * @property {boolean} isTitle - Always false for two-column slides
 * @property {string} layout - Always 'two-column'
 * @property {string} headline - The slide headline
 * @property {string[]} leftContent - Left column content lines
 * @property {string[]} rightContent - Right column content lines
 * @property {string[]} leftImages - Left column image URLs
 * @property {string[]} rightImages - Right column image URLs
 * @property {string[]} leftVideos - Left column video URLs
 * @property {string[]} rightVideos - Right column video URLs
 * @property {string} notes - Speaker notes for the slide
 */

// ============================================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a string is a valid YouTube URL.
 * Supports both youtube.com and youtu.be URLs.
 *
 * @param {string} url - The URL to validate
 * @return {boolean} True if valid YouTube URL, false otherwise
 *
 * @example
 * isValidYouTubeUrl('https://www.youtube.com/watch?v=abc123') // returns true
 * isValidYouTubeUrl('https://youtu.be/abc123') // returns true
 * isValidYouTubeUrl('https://vimeo.com/123456') // returns false
 */
function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return REGEX.YOUTUBE_URL.test(url.trim());
}

/**
 * Validates if a string is a valid image URL.
 * Accepts both standard HTTP/HTTPS URLs and Google Drive file references.
 *
 * @param {string} url - The URL to validate
 * @return {boolean} True if valid image URL, false otherwise
 *
 * @example
 * isValidImageUrl('https://example.com/image.jpg') // returns true
 * isValidImageUrl('GDRIVE:abc123xyz') // returns true
 * isValidImageUrl('https://drive.google.com/file/d/abc123/view') // returns true
 * isValidImageUrl('ftp://example.com/image.jpg') // returns false
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmedUrl = url.trim();

  // Check if it's a standard HTTP/HTTPS URL
  if (REGEX.IMAGE_URL.test(trimmedUrl)) {
    return true;
  }

  // Check if it's a GDRIVE: reference or can extract a Drive file ID
  if (REGEX.GDRIVE_PREFIX.test(trimmedUrl) || extractDriveFileId(trimmedUrl)) {
    return true;
  }

  return false;
}

/**
 * Extracts the Google Doc ID from a URL.
 * @param {string} url - The Google Docs URL
 * @return {string|null} The document ID if found, null otherwise
 */
function extractDocIdFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  try {
    const match = url.match(REGEX.GOOGLE_DOC_ID);
    return match ? match[1] : null;
  } catch (e) {
    Logger.log('Error extracting doc ID from URL: ' + e.message);
    return null;
  }
}

/**
 * Extracts the Google Drive file ID from a URL or GDRIVE: reference.
 * Supports multiple Google Drive URL formats.
 *
 * @param {string} urlOrRef - The Google Drive URL or GDRIVE:fileId reference
 * @return {string|null} The file ID if found, null otherwise
 *
 * @example
 * extractDriveFileId('GDRIVE:abc123') // returns 'abc123'
 * extractDriveFileId('https://drive.google.com/file/d/abc123/view') // returns 'abc123'
 * extractDriveFileId('https://drive.google.com/open?id=abc123') // returns 'abc123'
 */
function extractDriveFileId(urlOrRef) {
  if (!urlOrRef || typeof urlOrRef !== 'string') {
    return null;
  }

  try {
    const trimmed = urlOrRef.trim();

    // Check for GDRIVE:fileId format
    if (trimmed.startsWith('GDRIVE:')) {
      return trimmed.replace('GDRIVE:', '').trim();
    }

    // Check for /file/d/fileId/ format
    let match = trimmed.match(REGEX.GOOGLE_DRIVE_FILE_ID);
    if (match) {
      return match[1];
    }

    // Check for ?id=fileId or &id=fileId format
    match = trimmed.match(REGEX.GOOGLE_DRIVE_OPEN_ID);
    if (match) {
      return match[1];
    }

    return null;
  } catch (e) {
    Logger.log('Error extracting Drive file ID from URL: ' + e.message);
    return null;
  }
}

/**
 * Creates an initialized slide data object with default values.
 * @param {string} type - Type of slide: 'title', 'content', or 'two-column'
 * @param {Object} initialData - Initial data to merge with defaults
 * @return {Object} Initialized slide data object
 */
function createSlideDataObject(type, initialData = {}) {
  const defaults = {
    title: { isTitle: true, title: '', subtitle: '', notes: '' },
    content: { isTitle: false, headline: '', subtitle: '', bullets: [], images: [], videos: [], notes: '' },
    'two-column': {
      isTitle: false,
      layout: 'two-column',
      headline: '',
      leftContent: [],
      rightContent: [],
      leftImages: [],
      rightImages: [],
      leftVideos: [],
      rightVideos: [],
      notes: ''
    }
  };

  return Object.assign({}, defaults[type] || defaults.content, initialData);
}

/**
 * Inserts an image into a slide with error handling.
 * Supports standard URLs and Google Drive files (via URL or GDRIVE: reference).
 *
 * @param {Slide} slide - The slide to insert the image into
 * @param {string} imageUrl - The image URL (http/https, full Drive URL, or GDRIVE:fileId)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} errorFontSize - Font size for error messages
 * @return {number} The vertical offset used (height + spacing or error box height)
 */
function insertImageWithErrorHandling(slide, imageUrl, x, y, width, height, errorFontSize = 9) {
  try {
    // Try to extract Google Drive file ID
    const driveFileId = extractDriveFileId(imageUrl);

    if (driveFileId) {
      // It's a Google Drive file - fetch and insert as blob
      const file = DriveApp.getFileById(driveFileId);
      const blob = file.getBlob();
      slide.insertImage(blob, x, y, width, height);
    } else {
      // It's a standard URL
      slide.insertImage(imageUrl, x, y, width, height);
    }
    return height + LAYOUT.MEDIA.VERTICAL_SPACING;
  } catch (e) {
    Logger.log('Error inserting image ' + imageUrl + ': ' + e.message);
    const errorHeight = height > 60 ? 60 : 30;
    const errorBox = slide.insertTextBox('[Image Error: ' + e.message + ']', x, y, width, errorHeight);
    errorBox.getText().getTextStyle().setFontSize(errorFontSize).setItalic(true);
    return errorHeight + 10;
  }
}

/**
 * Inserts a video into a slide with error handling.
 * @param {Slide} slide - The slide to insert the video into
 * @param {string} videoUrl - The YouTube video URL
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Video width
 * @param {number} height - Video height
 * @param {number} errorFontSize - Font size for error messages
 * @return {number} The vertical offset used (height + spacing or error box height)
 */
function insertVideoWithErrorHandling(slide, videoUrl, x, y, width, height, errorFontSize = 9) {
  try {
    slide.insertVideo(videoUrl, x, y, width, height);
    return height + LAYOUT.MEDIA.VERTICAL_SPACING;
  } catch (e) {
    Logger.log('Error inserting video ' + videoUrl + ': ' + e.message);
    const errorHeight = height > 60 ? 60 : 30;
    const errorBox = slide.insertTextBox('[Video Error: ' + e.message + ']', x, y, width, errorHeight);
    errorBox.getText().getTextStyle().setFontSize(errorFontSize).setItalic(true);
    return errorHeight + 10;
  }
}

/**
 * Sets speaker notes for a slide.
 * @param {Slide} slide - The slide to add speaker notes to
 * @param {string} notesText - The speaker notes text
 *
 * @example
 * setSpeakerNotes(slide, 'Remember to emphasize this point during presentation');
 */
function setSpeakerNotes(slide, notesText) {
  if (!notesText || notesText.trim().length === 0) {
    Logger.log('setSpeakerNotes: No notes to add (empty or null)');
    return; // No notes to add
  }

  Logger.log('setSpeakerNotes: Adding notes: ' + notesText.substring(0, 50) + '...');

  try {
    const notesPage = slide.getNotesPage();
    const notesShape = notesPage.getSpeakerNotesShape();
    notesShape.getText().setText(notesText.trim());
    Logger.log('setSpeakerNotes: Successfully set speaker notes');
  } catch (e) {
    Logger.log('Error setting speaker notes: ' + e.message);
  }
}

/**
 * Parses markdown text and returns plain text with formatting instructions.
 * Supports **bold** syntax.
 *
 * @param {string} text - The markdown text to parse
 * @return {Object} Object with {text: string, boldRanges: Array<{start: number, end: number}>}
 *
 * @example
 * parseMarkdownFormatting('This is **bold** text')
 * // returns { text: 'This is bold text', boldRanges: [{start: 8, end: 12}] }
 */
function parseMarkdownFormatting(text) {
  if (!text) {
    return { text: '', boldRanges: [] };
  }

  const boldRanges = [];
  let plainText = text;
  let offset = 0;

  // Find all **bold** patterns
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    const matchStart = match.index - offset;
    const matchLength = match[1].length;

    // Record the range (after removing the ** markers)
    boldRanges.push({
      start: matchStart,
      end: matchStart + matchLength
    });

    // Remove the ** markers from the text
    plainText = plainText.replace('**' + match[1] + '**', match[1]);
    offset += 4; // We removed 4 characters (two ** pairs)
  }

  return {
    text: plainText,
    boldRanges: boldRanges
  };
}

/**
 * Applies markdown formatting to a text range in Google Slides.
 * @param {TextRange} textRange - The Google Slides text range to format
 * @param {string} markdownText - The text with markdown formatting
 *
 * @example
 * applyMarkdownFormatting(textBox.getText(), 'This is **bold** text')
 */
function applyMarkdownFormatting(textRange, markdownText) {
  if (!textRange || !markdownText) {
    return;
  }

  const parsed = parseMarkdownFormatting(markdownText);

  // Set the plain text
  textRange.setText(parsed.text);

  // Apply bold formatting to specified ranges
  parsed.boldRanges.forEach(range => {
    try {
      textRange.getRange(range.start, range.end).getTextStyle().setBold(true);
    } catch (e) {
      Logger.log('Error applying bold formatting: ' + e.message);
    }
  });
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

/**
 * Shows a dialog prompting the user to input a Google Doc URL.
 * When the user confirms, processes the document and creates slides.
 * Automatically clears existing slides before creating new ones.
 *
 * @example
 * // Called from the Slidemaker menu: Slidemaker > Create Slides from Google Doc
 */
function showDocUrlDialog() {
  const ui = SlidesApp.getUi();
  const result = ui.prompt(
    'Create Slides from Google Doc',
    'Enter the Google Doc URL:',
    ui.ButtonSet.OK_CANCEL
  );

  const button = result.getSelectedButton();
  const docUrl = result.getResponseText();

  if (button === ui.Button.OK && docUrl) {
    processGoogleDoc(docUrl, true);
  }
}

/**
 * Shows a dialog to input or paste text content.
 * Displays a modal dialog with a text area for markdown input.
 *
 * @example
 * // Called from the Slidemaker menu: Slidemaker > Create Slides from Text
 */
function showTextInputDialog() {
  try {
    const htmlOutput = HtmlService.createHtmlOutput(
      '<textarea id="content" style="width:100%;height:400px;font-family:monospace;"></textarea>' +
      '<br><br>' +
      '<label><input type="checkbox" id="clearSlides" checked> Clear existing slides</label>' +
      '<br><br>' +
      '<button onclick="google.script.host.close()">Cancel</button> ' +
      '<button onclick="submitText()">Create Slides</button>' +
      '<script>' +
      'function submitText() {' +
      '  const content = document.getElementById("content").value;' +
      '  const clearSlides = document.getElementById("clearSlides").checked;' +
      '  google.script.run' +
      '    .withSuccessHandler(google.script.host.close)' +
      '    .withFailureHandler(function(error) { alert("Error: " + error.message); })' +
      '    .processTextContent(content, clearSlides);' +
      '}' +
      '</script>'
    )
      .setWidth(600)
      .setHeight(550);

    SlidesApp.getUi().showModalDialog(htmlOutput, 'Create Slides from Text');
  } catch (e) {
    Logger.log('Error showing text input dialog: ' + e.message);
    SlidesApp.getUi().alert('Error', 'Failed to show input dialog: ' + e.message, SlidesApp.getUi().ButtonSet.OK);
  }
}

/**
 * Processes a Google Doc URL and creates slides from its content.
 * Validates the URL, checks access permissions, and extracts text content.
 *
 * @param {string} docUrl - The Google Docs URL to process
 * @param {boolean} clearExisting - Whether to clear existing slides before creating new ones
 *
 * @throws {Error} Shows alert if URL is invalid or document cannot be accessed
 *
 * @example
 * processGoogleDoc('https://docs.google.com/document/d/abc123/edit', true)
 */
function processGoogleDoc(docUrl, clearExisting) {
  const ui = SlidesApp.getUi();
  
  const docId = extractDocIdFromUrl(docUrl);
  
  if (!docId) {
    ui.alert('Invalid URL', 'Please provide a valid Google Docs URL.', ui.ButtonSet.OK);
    return;
  }
  
  let doc;
  try {
    doc = DocumentApp.openById(docId);
  } catch (e) {
    ui.alert('Access Error', 'Could not access the document. Please make sure you have permission to view it.', ui.ButtonSet.OK);
    return;
  }
  
  const body = doc.getBody();
  const outlineText = body.getText();
  
  if (!outlineText || outlineText.trim().length === 0) {
    ui.alert('Empty Document', 'The Google Doc appears to be empty.', ui.ButtonSet.OK);
    return;
  }
  
  processTextContent(outlineText, clearExisting);
}

/**
 * Processes markdown-formatted text content and creates slides.
 * Parses the text for slide structure and creates slides accordingly.
 *
 * @param {string} outlineText - Markdown-formatted text containing slide content
 * @param {boolean} clearExisting - Whether to clear existing slides first
 *
 * @throws {Error} Shows alert if content is empty or no valid slides found
 *
 * Supported markdown format:
 * - # Title (creates title slide if first, otherwise content slide)
 * - ## Heading (creates new content slide)
 * - ### Subtitle (adds subtitle to previous ## heading)
 * - * Bullet point
 * - Image: URL or GDRIVE:fileId
 * - Video: YouTube URL
 * - Two-Column: Headline (creates two-column layout)
 * - Left: / Right: (column markers in two-column layout)
 *
 * @example
 * const markdown = `
 * # My Presentation
 * ## First Slide
 * * Bullet point 1
 * * Bullet point 2
 * `;
 * processTextContent(markdown, true);
 */
function processTextContent(outlineText, clearExisting) {
  Logger.log('=== START processTextContent ===');
  Logger.log('Content length: ' + (outlineText ? outlineText.length : 'null'));
  Logger.log('Clear existing: ' + clearExisting);

  const ui = SlidesApp.getUi();

  if (!outlineText || outlineText.trim().length === 0) {
    Logger.log('ERROR: Empty content');
    ui.alert('Empty Content', 'The content appears to be empty. Please add content and try again.', ui.ButtonSet.OK);
    return;
  }

  Logger.log('Getting active presentation...');
  const presentation = SlidesApp.getActivePresentation();
  Logger.log('Presentation ID: ' + presentation.getId());

  if (clearExisting) {
    Logger.log('Clearing existing slides...');
    try {
      const slides = presentation.getSlides();
      Logger.log('Found ' + slides.length + ' slides to clear');
      slides.forEach(slide => slide.remove());
      Logger.log('Slides cleared successfully');
    } catch (e) {
      Logger.log('ERROR clearing slides: ' + e.message);
      ui.alert('Error', 'Could not clear existing slides: ' + e.message, ui.ButtonSet.OK);
      return;
    }
  }

  Logger.log('Parsing document...');
  const parsedSlides = parseDocument(outlineText);
  Logger.log('Parsed ' + parsedSlides.length + ' slides');

  if (parsedSlides.length === 0) {
    Logger.log('ERROR: No slides parsed');
    ui.alert('No Content Found',
      'Could not find any slide content in the document.\n\n' +
      'Required format (Markdown):\n' +
      '• # Title (for title slide)\n' +
      '• ## Slide Heading\n' +
      '• ### Subtitle (optional)\n' +
      '• * bullet point\n' +
      '• Image: [URL or GDRIVE:fileId]\n' +
      '• Video: [YouTube URL]',
      ui.ButtonSet.OK);
    return;
  }

  Logger.log('Creating slides...');
  try {
    parsedSlides.forEach((slideData, index) => {
      Logger.log('Processing slide ' + (index + 1) + '/' + parsedSlides.length);
      if (slideData.isTitle) {
        processTitleSlide(presentation, slideData);
      } else if (slideData.layout === 'two-column') {
        processTwoColumnSlide(presentation, slideData);
      } else {
        processContentSlide(presentation, slideData);
      }
    });

    Logger.log('SUCCESS: All slides created');
    ui.alert('Success!', `Created ${parsedSlides.length} slide(s) in your presentation.`, ui.ButtonSet.OK);
  } catch (e) {
    Logger.log('ERROR creating slides: ' + e.message);
    Logger.log('Stack trace: ' + e.stack);
    ui.alert('Error Creating Slides', 'An error occurred while creating slides: ' + e.message, ui.ButtonSet.OK);
  }

  Logger.log('=== END processTextContent ===');
}

/**
 * Parses markdown-formatted document text and returns an array of slide data objects.
 * Supports multiple slide types, layouts, and media elements.
 *
 * @param {string} text - The markdown-formatted text to parse
 * @return {Array<TitleSlideData|ContentSlideData|TwoColumnSlideData>} Array of slide data objects
 *
 * Parsing rules:
 * 1. First # heading or plain text becomes title slide
 * 2. ## creates new content slide with heading
 * 3. ### after ## becomes subtitle; otherwise creates new slide
 * 4. * or - creates bullet points
 * 5. Image: URL or ![alt](URL) inserts images
 * 6. Video: URL inserts YouTube videos
 * 7. Two-Column: Headline creates two-column layout
 * 8. Left: / Right: marks column content in two-column layout
 *
 * @example
 * const slides = parseDocument('# Title\n## Slide 1\n* Bullet\n* Another');
 * // Returns: [
 * //   { isTitle: true, title: 'Title', subtitle: '' },
 * //   { isTitle: false, headline: 'Slide 1', bullets: ['Bullet', 'Another'], ... }
 * // ]
 */
function parseDocument(text) {
  const lines = text.split('\n');
  const slides = [];
  let currentSlide = null;

  // State tracking variables
  let isFirstSlide = true;          // True until we create the first slide
  let inLeftColumn = false;          // Track if we're in left column of two-column layout
  let inRightColumn = false;         // Track if we're in right column of two-column layout
  let lastHeadingCanHaveSubtitle = false;  // Track if previous heading was H1/H2 (affects H3 interpretation)
  let inSpeakerNotes = false;        // Track if we're currently capturing speaker notes

  // Process each line of the document
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines (unless we're in speaker notes, where we preserve them)
    if (trimmedLine.length === 0) {
      if (inSpeakerNotes && currentSlide) {
        currentSlide.notes += '\n';
      }
      continue;
    }

    // ========================================================================
    // SPEAKER NOTES DETECTION
    // ========================================================================
    // Check for speaker notes start marker
    const speakerNotesMatch = trimmedLine.match(REGEX.SPEAKER_NOTES_START);
    if (speakerNotesMatch) {
      if (currentSlide) {
        // Start capturing speaker notes
        inSpeakerNotes = true;
        const initialNotes = speakerNotesMatch[1]; // Text after the marker on same line
        currentSlide.notes = initialNotes ? initialNotes + '\n' : '';
        Logger.log('parseDocument: Started capturing speaker notes for slide. Initial: ' + initialNotes);
      }
      continue;
    }

    // If we're in speaker notes, check if we should stop
    if (inSpeakerNotes) {
      // Stop speaker notes if we hit a heading or two-column marker
      if (trimmedLine.match(REGEX.MARKDOWN_H1) ||
          trimmedLine.match(REGEX.MARKDOWN_H2) ||
          trimmedLine.match(REGEX.MARKDOWN_H3) ||
          trimmedLine.match(REGEX.TWO_COLUMN_MARKER) ||
          trimmedLine === '---') {
        // Exit speaker notes mode, process this line normally
        Logger.log('parseDocument: Stopped capturing speaker notes (hit new section)');
        inSpeakerNotes = false;
      } else {
        // Continue capturing speaker notes
        if (currentSlide) {
          currentSlide.notes += trimmedLine + '\n';
        }
        continue;
      }
    }

    // ========================================================================
    // TWO-COLUMN LAYOUT DETECTION
    // ========================================================================
    // Check for two-column layout marker (e.g., "Two-Column: My Heading")
    if (trimmedLine.match(REGEX.TWO_COLUMN_MARKER)) {
      // Save current slide before starting new two-column slide
      if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);

      // Extract optional headline from marker line
      const headlineMatch = trimmedLine.match(REGEX.TWO_COLUMN_HEADLINE);
      const headline = headlineMatch ? headlineMatch[1].trim() : '';

      // Create new two-column slide with separate content arrays for each column
      currentSlide = {
        isTitle: false,
        layout: 'two-column',
        headline: headline,
        leftContent: [],
        rightContent: [],
        leftImages: [],
        rightImages: [],
        leftVideos: [],
        rightVideos: [],
        notes: ''
      };

      // Reset state flags
      isFirstSlide = false;
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingCanHaveSubtitle = false;
      continue;
    }
    
    // Column marker handling within two-column layouts
    if (currentSlide && currentSlide.layout === 'two-column') {
      // Left column marker (e.g., "Left:" or "Left: content")
      if (trimmedLine.match(REGEX.LEFT_COLUMN)) {
        inLeftColumn = true;
        inRightColumn = false;
        const match = trimmedLine.match(REGEX.LEFT_COLUMN_CONTENT);
        if (match && match[1].trim()) {
          currentSlide.leftContent.push(match[1].trim());
        }
        continue;
      }
      // Right column marker (e.g., "Right:" or "Right: content")
      if (trimmedLine.match(REGEX.RIGHT_COLUMN)) {
        inLeftColumn = false;
        inRightColumn = true;
        const match = trimmedLine.match(REGEX.RIGHT_COLUMN_CONTENT);
        if (match && match[1].trim()) {
          currentSlide.rightContent.push(match[1].trim());
        }
        continue;
      }
    }

    // ========================================================================
    // MEDIA ELEMENTS (VIDEOS AND IMAGES)
    // ========================================================================

    // Video detection (format: "Video: https://youtube.com/...")
    const simpleVideoMatch = trimmedLine.match(REGEX.VIDEO_SIMPLE);
    if (simpleVideoMatch) {
      const videoUrl = simpleVideoMatch[1].trim();

      // Only YouTube videos are supported
      if (!isValidYouTubeUrl(videoUrl)) {
        Logger.log('Invalid video URL (must be YouTube): ' + videoUrl);
        continue;
      }

      // Add video to appropriate slide/column
      if (!currentSlide) {
        // Create new slide if none exists
        currentSlide = createSlideDataObject('content', { headline: 'Untitled Slide', videos: [videoUrl] });
        isFirstSlide = false;
      } else if (currentSlide.layout === 'two-column') {
        // Add to active column in two-column layout
        if (inRightColumn) {
          currentSlide.rightVideos.push(videoUrl);
        } else {
          currentSlide.leftVideos.push(videoUrl);
        }
      } else {
        // Add to regular content slide
        if (!currentSlide.videos) currentSlide.videos = [];
        currentSlide.videos.push(videoUrl);
      }
      continue;
    }

    // Image detection (formats: "Image: URL" or markdown "![alt](URL)")
    const markdownImageMatch = trimmedLine.match(REGEX.MARKDOWN_IMAGE);
    const simpleImageMatch = trimmedLine.match(REGEX.IMAGE_SIMPLE);
    if (markdownImageMatch || simpleImageMatch) {
      const imageUrl = markdownImageMatch ? markdownImageMatch[2] : simpleImageMatch[1];
      const imageAlt = markdownImageMatch ? markdownImageMatch[1] : '';

      // Validate URL format (http/https or GDRIVE:fileId)
      if (!isValidImageUrl(imageUrl)) {
        Logger.log('Invalid image URL: ' + imageUrl);
        continue;
      }

      // Add image to appropriate slide/column
      if (!currentSlide) {
        // Create new slide if none exists, use alt text as headline
        currentSlide = createSlideDataObject('content', { headline: imageAlt || 'Untitled Slide', images: [imageUrl] });
        isFirstSlide = false;
      } else if (currentSlide.layout === 'two-column') {
        // Add to active column in two-column layout
        if (inRightColumn) {
          currentSlide.rightImages.push(imageUrl);
        } else {
          currentSlide.leftImages.push(imageUrl);
        }
      } else {
        // Add to regular content slide
        if (!currentSlide.images) currentSlide.images = [];
        currentSlide.images.push(imageUrl);
      }
      continue;
    }
    
    // ========================================================================
    // MARKDOWN HEADINGS AND TEXT CONTENT
    // ========================================================================

    // H1 heading (# Title) - Creates title slide if first, otherwise content slide
    // H1 ALWAYS exits two-column mode (it's a major section break)
    const h1Match = trimmedLine.match(REGEX.MARKDOWN_H1);
    if (h1Match) {
      const title = h1Match[1];
      if (isFirstSlide) {
        // First H1 creates a title slide
        currentSlide = createSlideDataObject('title', { title: title });
        slides.push(currentSlide);
        isFirstSlide = false;
      } else {
        // Subsequent H1s create content slides
        if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);
        currentSlide = createSlideDataObject('content', { headline: title });
      }
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingCanHaveSubtitle = true;  // H1 can have H3 subtitle
      continue;
    }

    // H2 heading (## Heading)
    // H2 ALWAYS creates a new content slide and exits two-column mode
    // It's a major section break
    const h2Match = trimmedLine.match(REGEX.MARKDOWN_H2);
    if (h2Match) {
      const heading = h2Match[1];

      // H2 always creates new slide, even in two-column mode
      if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);
      currentSlide = createSlideDataObject('content', { headline: heading });
      isFirstSlide = false;
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingCanHaveSubtitle = true;  // H2 can have H3 subtitle
      continue;
    }

    // H3 heading (### Subtitle)
    // In active column: treat as column content
    // After H1/H2: becomes subtitle
    // Otherwise: creates new slide
    const h3Match = trimmedLine.match(REGEX.MARKDOWN_H3);
    if (h3Match) {
      const subtitleText = h3Match[1];

      // If actively in a left/right column, add as content to that column
      if (currentSlide && currentSlide.layout === 'two-column' && (inLeftColumn || inRightColumn)) {
        if (inRightColumn) {
          currentSlide.rightContent.push('### ' + subtitleText);
        } else {
          currentSlide.leftContent.push('### ' + subtitleText);
        }
        lastHeadingCanHaveSubtitle = false;
        continue;
      }

      // Not in active column: check if it should be a subtitle or new slide
      // H3 becomes subtitle if it follows H1 or H2 and slide doesn't have subtitle yet
      if (currentSlide && lastHeadingCanHaveSubtitle && !currentSlide.subtitle) {
        currentSlide.subtitle = subtitleText;
      } else {
        // Otherwise create a new content slide (exits two-column mode if needed)
        if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);
        currentSlide = createSlideDataObject('content', { headline: subtitleText });
        isFirstSlide = false;
      }
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingCanHaveSubtitle = false;  // H3 itself cannot have subtitle
      continue;
    }

    // Bullet points (* or - or •)
    const bulletMatch = trimmedLine.match(REGEX.MARKDOWN_BULLET);
    if (bulletMatch) {
      const bulletText = bulletMatch[1];
      if (!currentSlide) {
        // Create slide if none exists
        currentSlide = createSlideDataObject('content', { headline: 'Untitled Slide', bullets: [bulletText] });
        isFirstSlide = false;
      } else if (currentSlide.layout === 'two-column') {
        if (inRightColumn) {
          currentSlide.rightContent.push(trimmedLine);
        } else {
          currentSlide.leftContent.push(trimmedLine);
        }
      } else if (currentSlide.bullets) {
        currentSlide.bullets.push(bulletText);
      }
      lastHeadingCanHaveSubtitle = false;  // Bullets end heading context
      continue;
    }
    
    // Two-column text handling
    if (currentSlide && currentSlide.layout === 'two-column') {
      if (inRightColumn) {
        currentSlide.rightContent.push(trimmedLine);
      } else if (inLeftColumn) {
        currentSlide.leftContent.push(trimmedLine);
      } else if (!currentSlide.headline) {
        currentSlide.headline = trimmedLine;
      }
      lastHeadingCanHaveSubtitle = false;
      continue;
    }

    // First line becomes title
    if (isFirstSlide && !currentSlide) {
      currentSlide = createSlideDataObject('title', { title: trimmedLine });
      slides.push(currentSlide);
      isFirstSlide = false;
      lastHeadingCanHaveSubtitle = false;
      continue;
    }
  }
  
  if (currentSlide && !slides.includes(currentSlide)) {
    slides.push(currentSlide);
  }
  
  return slides;
}

/**
 * Processes the data for the title slide.
 * @param {Presentation} presentation - The presentation to add the slide to
 * @param {Object} slideData - Slide data containing title, subtitle, and notes
 */
function processTitleSlide(presentation, slideData) {
    const title = slideData.title || "Untitled Presentation";
    const subtitle = slideData.subtitle || "";

    Logger.log('processTitleSlide: title=' + title + ', has notes=' + (!!slideData.notes));

    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);

    // Add centered title with markdown formatting
    const parsedTitle = parseMarkdownFormatting(title);
    const titleBox = slide.insertTextBox(
      parsedTitle.text,
      LAYOUT.TITLE.X,
      LAYOUT.TITLE.Y,
      LAYOUT.TITLE.WIDTH,
      LAYOUT.TITLE.HEIGHT
    );
    titleBox.getText().getTextStyle().setFontSize(LAYOUT.TITLE.FONT_SIZE).setBold(true);
    titleBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // Add centered subtitle if present with markdown formatting
    if (subtitle) {
      const parsedSubtitle = parseMarkdownFormatting(subtitle);
      const subtitleBox = slide.insertTextBox(
        parsedSubtitle.text,
        LAYOUT.TITLE_SUBTITLE.X,
        LAYOUT.TITLE_SUBTITLE.Y,
        LAYOUT.TITLE_SUBTITLE.WIDTH,
        LAYOUT.TITLE_SUBTITLE.HEIGHT
      );
      subtitleBox.getText().getTextStyle().setFontSize(LAYOUT.TITLE_SUBTITLE.FONT_SIZE);
      subtitleBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

      // Apply bold formatting to subtitle ranges
      parsedSubtitle.boldRanges.forEach(range => {
        try {
          subtitleBox.getText().getRange(range.start, range.end).getTextStyle().setBold(true);
        } catch (e) {
          Logger.log('Error applying bold to title subtitle: ' + e.message);
        }
      });
    }

    // Add speaker notes if present
    if (slideData.notes) {
      setSpeakerNotes(slide, slideData.notes);
    }
}

/**
 * Processes a content slide with text, images, and videos.
 * @param {Presentation} presentation - The presentation to add the slide to
 * @param {Object} slideData - Slide data containing headline, subtitle, bullets, images, videos, and notes
 */
function processContentSlide(presentation, slideData) {
    const headline = slideData.headline || 'Untitled Slide';
    const subtitle = slideData.subtitle || '';
    const bulletPoints = slideData.bullets || [];
    const images = slideData.images || [];
    const videos = slideData.videos || [];

    Logger.log('processContentSlide: headline=' + headline + ', has notes=' + (!!slideData.notes));
    if (slideData.notes) {
      Logger.log('  notes content: ' + slideData.notes.substring(0, 100));
    }

    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);

    // Add headline with markdown formatting
    const parsedHeadline = parseMarkdownFormatting(headline);
    const headlineBox = slide.insertTextBox(
      parsedHeadline.text,
      LAYOUT.HEADLINE.X,
      LAYOUT.HEADLINE.Y,
      LAYOUT.HEADLINE.WIDTH,
      LAYOUT.HEADLINE.HEIGHT
    );
    headlineBox.getText().getTextStyle().setFontSize(LAYOUT.HEADLINE.FONT_SIZE).setBold(true);

    // Add subtitle if present with markdown formatting
    if (subtitle) {
      const parsedSubtitle = parseMarkdownFormatting(subtitle);
      const subtitleBox = slide.insertTextBox(
        parsedSubtitle.text,
        LAYOUT.SUBTITLE.X,
        LAYOUT.SUBTITLE.Y,
        LAYOUT.SUBTITLE.WIDTH,
        LAYOUT.SUBTITLE.HEIGHT
      );
      subtitleBox.getText().getTextStyle().setFontSize(LAYOUT.SUBTITLE.FONT_SIZE).setItalic(true);

      // Apply bold formatting to subtitle ranges
      parsedSubtitle.boldRanges.forEach(range => {
        try {
          subtitleBox.getText().getRange(range.start, range.end).getTextStyle().setBold(true);
        } catch (e) {
          Logger.log('Error applying bold to subtitle: ' + e.message);
        }
      });
    }

    const hasMedia = images.length > 0 || videos.length > 0;
    const bulletsStartY = subtitle ? LAYOUT.BULLETS.START_Y_WITH_SUBTITLE : LAYOUT.BULLETS.START_Y_NO_SUBTITLE;
    let mediaYOffset = 0;

    // Insert media elements (images and videos)
    if (hasMedia) {
      images.forEach((imageUrl) => {
        mediaYOffset += insertImageWithErrorHandling(
          slide,
          imageUrl,
          LAYOUT.MEDIA.LEFT,
          LAYOUT.MEDIA.START_Y + mediaYOffset,
          LAYOUT.MEDIA.WIDTH,
          LAYOUT.MEDIA.HEIGHT,
          LAYOUT.MEDIA.ERROR_FONT_SIZE
        );
      });

      videos.forEach((videoUrl) => {
        mediaYOffset += insertVideoWithErrorHandling(
          slide,
          videoUrl,
          LAYOUT.MEDIA.LEFT,
          LAYOUT.MEDIA.START_Y + mediaYOffset,
          LAYOUT.MEDIA.WIDTH,
          LAYOUT.MEDIA.HEIGHT,
          LAYOUT.MEDIA.ERROR_FONT_SIZE
        );
      });
    }

    // Add bullet points
    if (bulletPoints.length > 0) {
      const bulletWidth = hasMedia ? LAYOUT.BULLETS.WIDTH_WITH_MEDIA : LAYOUT.BULLETS.WIDTH_NO_MEDIA;
      const bulletFontSize = hasMedia ? LAYOUT.BULLETS.FONT_SIZE_WITH_MEDIA : LAYOUT.BULLETS.FONT_SIZE_NO_MEDIA;

      // Parse all bullet points for markdown and build combined text
      const parsedBullets = bulletPoints.map(bullet => parseMarkdownFormatting(bullet));
      const plainBullets = parsedBullets.map(parsed => parsed.text);
      const combinedText = plainBullets.join('\n');

      // Create text box with plain text
      const bodyBox = slide.insertTextBox(
        combinedText,
        LAYOUT.BULLETS.X,
        bulletsStartY,
        bulletWidth,
        LAYOUT.BULLETS.HEIGHT
      );
      bodyBox.getText().getTextStyle().setFontSize(bulletFontSize);
      bodyBox.getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);

      // Apply bold formatting to each bullet's ranges
      let currentOffset = 0;
      parsedBullets.forEach((parsed, index) => {
        parsed.boldRanges.forEach(range => {
          try {
            const globalStart = currentOffset + range.start;
            const globalEnd = currentOffset + range.end;
            bodyBox.getText().getRange(globalStart, globalEnd).getTextStyle().setBold(true);
          } catch (e) {
            Logger.log('Error applying bold to bullet ' + index + ': ' + e.message);
          }
        });
        // Move offset by the length of this bullet's text plus newline
        currentOffset += parsed.text.length + 1; // +1 for the newline character
      });
    }

    // Add speaker notes if present
    if (slideData.notes) {
      setSpeakerNotes(slide, slideData.notes);
    }
}

/**
 * Processes a two-column layout slide.
 * @param {Presentation} presentation - The presentation to add the slide to
 * @param {Object} slideData - Slide data with left/right content, images, videos, and notes
 */
function processTwoColumnSlide(presentation, slideData) {
    const headline = slideData.headline || 'Untitled Slide';
    const leftContent = slideData.leftContent || [];
    const rightContent = slideData.rightContent || [];
    const leftImages = slideData.leftImages || [];
    const rightImages = slideData.rightImages || [];
    const leftVideos = slideData.leftVideos || [];
    const rightVideos = slideData.rightVideos || [];

    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);

    // Add headline if present with markdown formatting
    if (headline) {
      const parsedHeadline = parseMarkdownFormatting(headline);
      const headlineBox = slide.insertTextBox(
        parsedHeadline.text,
        LAYOUT.TWO_COLUMN.HEADLINE_X,
        LAYOUT.TWO_COLUMN.HEADLINE_Y,
        LAYOUT.TWO_COLUMN.HEADLINE_WIDTH,
        LAYOUT.TWO_COLUMN.HEADLINE_HEIGHT
      );
      headlineBox.getText().getTextStyle().setFontSize(LAYOUT.TWO_COLUMN.HEADLINE_FONT_SIZE).setBold(true);
    }

    const contentStartY = headline ?
      LAYOUT.TWO_COLUMN.CONTENT_START_Y_WITH_HEADLINE :
      LAYOUT.TWO_COLUMN.CONTENT_START_Y_NO_HEADLINE;

    // Helper functions for bullet processing
    const hasBullets = (content) => content.some(line => REGEX.MARKDOWN_BULLET.test(line));
    const cleanBullets = (content) => content.map(line => line.replace(/^[\*\-•]\s+/, ''));

    // Process left column content
    if (leftContent.length > 0) {
      const contentToDisplay = hasBullets(leftContent) ? cleanBullets(leftContent) : leftContent;

      // Parse markdown formatting for each line
      const parsedLines = contentToDisplay.map(line => parseMarkdownFormatting(line));
      const plainLines = parsedLines.map(parsed => parsed.text);
      const leftText = plainLines.join('\n');

      const leftBox = slide.insertTextBox(
        leftText,
        LAYOUT.TWO_COLUMN.LEFT_COLUMN_X,
        contentStartY,
        LAYOUT.TWO_COLUMN.COLUMN_WIDTH,
        LAYOUT.TWO_COLUMN.CONTENT_HEIGHT
      );
      leftBox.getText().getTextStyle().setFontSize(LAYOUT.TWO_COLUMN.CONTENT_FONT_SIZE);
      if (hasBullets(leftContent)) {
        leftBox.getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
      }

      // Apply bold formatting
      let currentOffset = 0;
      parsedLines.forEach((parsed, index) => {
        parsed.boldRanges.forEach(range => {
          try {
            const globalStart = currentOffset + range.start;
            const globalEnd = currentOffset + range.end;
            leftBox.getText().getRange(globalStart, globalEnd).getTextStyle().setBold(true);
          } catch (e) {
            Logger.log('Error applying bold to left column line ' + index + ': ' + e.message);
          }
        });
        currentOffset += parsed.text.length + 1;
      });
    }

    // Process left column media
    let leftMediaY = contentStartY + (leftContent.length > 0 ? LAYOUT.TWO_COLUMN.MEDIA_OFFSET : 0);
    leftImages.forEach((imageUrl) => {
      leftMediaY += insertImageWithErrorHandling(
        slide,
        imageUrl,
        LAYOUT.TWO_COLUMN.LEFT_COLUMN_X,
        leftMediaY,
        LAYOUT.TWO_COLUMN.COLUMN_WIDTH,
        LAYOUT.TWO_COLUMN.MEDIA_HEIGHT,
        LAYOUT.TWO_COLUMN.ERROR_FONT_SIZE
      );
    });

    leftVideos.forEach((videoUrl) => {
      leftMediaY += insertVideoWithErrorHandling(
        slide,
        videoUrl,
        LAYOUT.TWO_COLUMN.LEFT_COLUMN_X,
        leftMediaY,
        LAYOUT.TWO_COLUMN.COLUMN_WIDTH,
        LAYOUT.TWO_COLUMN.MEDIA_HEIGHT,
        LAYOUT.TWO_COLUMN.ERROR_FONT_SIZE
      );
    });

    // Process right column content
    if (rightContent.length > 0) {
      const contentToDisplay = hasBullets(rightContent) ? cleanBullets(rightContent) : rightContent;

      // Parse markdown formatting for each line
      const parsedLines = contentToDisplay.map(line => parseMarkdownFormatting(line));
      const plainLines = parsedLines.map(parsed => parsed.text);
      const rightText = plainLines.join('\n');

      const rightBox = slide.insertTextBox(
        rightText,
        LAYOUT.TWO_COLUMN.RIGHT_COLUMN_X,
        contentStartY,
        LAYOUT.TWO_COLUMN.COLUMN_WIDTH,
        LAYOUT.TWO_COLUMN.CONTENT_HEIGHT
      );
      rightBox.getText().getTextStyle().setFontSize(LAYOUT.TWO_COLUMN.CONTENT_FONT_SIZE);
      if (hasBullets(rightContent)) {
        rightBox.getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
      }

      // Apply bold formatting
      let currentOffset = 0;
      parsedLines.forEach((parsed, index) => {
        parsed.boldRanges.forEach(range => {
          try {
            const globalStart = currentOffset + range.start;
            const globalEnd = currentOffset + range.end;
            rightBox.getText().getRange(globalStart, globalEnd).getTextStyle().setBold(true);
          } catch (e) {
            Logger.log('Error applying bold to right column line ' + index + ': ' + e.message);
          }
        });
        currentOffset += parsed.text.length + 1;
      });
    }

    // Process right column media
    let rightMediaY = contentStartY + (rightContent.length > 0 ? LAYOUT.TWO_COLUMN.MEDIA_OFFSET : 0);
    rightImages.forEach((imageUrl) => {
      rightMediaY += insertImageWithErrorHandling(
        slide,
        imageUrl,
        LAYOUT.TWO_COLUMN.RIGHT_COLUMN_X,
        rightMediaY,
        LAYOUT.TWO_COLUMN.COLUMN_WIDTH,
        LAYOUT.TWO_COLUMN.MEDIA_HEIGHT,
        LAYOUT.TWO_COLUMN.ERROR_FONT_SIZE
      );
    });

    rightVideos.forEach((videoUrl) => {
      rightMediaY += insertVideoWithErrorHandling(
        slide,
        videoUrl,
        LAYOUT.TWO_COLUMN.RIGHT_COLUMN_X,
        rightMediaY,
        LAYOUT.TWO_COLUMN.COLUMN_WIDTH,
        LAYOUT.TWO_COLUMN.MEDIA_HEIGHT,
        LAYOUT.TWO_COLUMN.ERROR_FONT_SIZE
      );
    });

    // Add speaker notes if present
    if (slideData.notes) {
      setSpeakerNotes(slide, slideData.notes);
    }
}

