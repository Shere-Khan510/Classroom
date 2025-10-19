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

/**
 * Shows a dialog to input Google Doc URL.
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
 */
function showTextInputDialog() {
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
    '  google.script.run.withSuccessHandler(google.script.host.close).processTextContent(content, clearSlides);' +
    '}' +
    '</script>'
  )
    .setWidth(600)
    .setHeight(550);
  
  SlidesApp.getUi().showModalDialog(htmlOutput, 'Create Slides from Text');
}

/**
 * Processes a Google Doc URL and creates slides from its content.
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
 * Processes text content and creates slides.
 */
function processTextContent(outlineText, clearExisting) {
  const ui = SlidesApp.getUi();
  
  if (!outlineText || outlineText.trim().length === 0) {
    ui.alert('Empty Content', 'The content appears to be empty. Please add content and try again.', ui.ButtonSet.OK);
    return;
  }
  
  const presentation = SlidesApp.getActivePresentation();
  
  if (clearExisting) {
    try {
      const slides = presentation.getSlides();
      slides.forEach(slide => slide.remove());
    } catch (e) {
      ui.alert('Error', 'Could not clear existing slides: ' + e.message, ui.ButtonSet.OK);
      return;
    }
  }
  
  const parsedSlides = parseDocument(outlineText);
  
  if (parsedSlides.length === 0) {
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
  
  try {
    parsedSlides.forEach((slideData, index) => {
      if (slideData.isTitle) {
        processTitleSlide(presentation, slideData);
      } else if (slideData.layout === 'two-column') {
        processTwoColumnSlide(presentation, slideData);
      } else {
        processContentSlide(presentation, slideData);
      }
    });
    
    ui.alert('Success!', `Created ${parsedSlides.length} slide(s) in your presentation.`, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error Creating Slides', 'An error occurred while creating slides: ' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Parses document text and returns an array of slide data objects.
 */
function parseDocument(text) {
  const lines = text.split('\n');
  const slides = [];
  let currentSlide = null;
  let isFirstSlide = true;
  let inLeftColumn = false;
  let inRightColumn = false;
  let lastHeadingWasH2 = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (trimmedLine.length === 0) {
      continue;
    }
    
    // Check for two-column layout marker
    if (trimmedLine.toLowerCase().match(/^two[\s-]?column/i)) {
      if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);
      const headlineMatch = trimmedLine.match(/^two[\s-]?column[\s:]+(.+)$/i);
      const headline = headlineMatch ? headlineMatch[1].trim() : '';
      currentSlide = { 
        isTitle: false, 
        layout: 'two-column', 
        headline: headline, 
        leftContent: [], 
        rightContent: [], 
        leftImages: [], 
        rightImages: [],
        leftVideos: [],
        rightVideos: []
      };
      isFirstSlide = false;
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingWasH2 = false;
      continue;
    }
    
    // Check for Left/Right column markers
    if (currentSlide && currentSlide.layout === 'two-column') {
      if (trimmedLine.toLowerCase().match(/^left[\s:]?/i)) {
        inLeftColumn = true;
        inRightColumn = false;
        const match = trimmedLine.match(/^left[\s:]+(.+)$/i);
        if (match && match[1].trim()) {
          currentSlide.leftContent.push(match[1].trim());
        }
        continue;
      }
      if (trimmedLine.toLowerCase().match(/^right[\s:]?/i)) {
        inLeftColumn = false;
        inRightColumn = true;
        const match = trimmedLine.match(/^right[\s:]+(.+)$/i);
        if (match && match[1].trim()) {
          currentSlide.rightContent.push(match[1].trim());
        }
        continue;
      }
    }
    
    // Check for video syntax
    const simpleVideoMatch = trimmedLine.match(/^video[\s:]+(.+)$/i);
    
    if (simpleVideoMatch) {
      const videoUrl = simpleVideoMatch[1].trim();
      
      if (!videoUrl.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i)) {
        Logger.log('Invalid video URL (must be YouTube): ' + videoUrl);
        continue;
      }
      
      if (!currentSlide) {
        currentSlide = { isTitle: false, headline: 'Untitled Slide', subtitle: '', bullets: [], videos: [videoUrl], images: [] };
        isFirstSlide = false;
      } else if (currentSlide.layout === 'two-column') {
        if (inRightColumn) {
          currentSlide.rightVideos.push(videoUrl);
        } else {
          currentSlide.leftVideos.push(videoUrl);
        }
      } else {
        if (!currentSlide.videos) currentSlide.videos = [];
        currentSlide.videos.push(videoUrl);
      }
      continue;
    }
    
    // Check for image syntax
    const markdownImageMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    const simpleImageMatch = trimmedLine.match(/^image[\s:]+(.+)$/i);
    
    if (markdownImageMatch || simpleImageMatch) {
      const imageUrl = markdownImageMatch ? markdownImageMatch[2] : simpleImageMatch[1];
      const imageAlt = markdownImageMatch ? markdownImageMatch[1] : '';
      
      if (!imageUrl.match(/^https?:\/\//i) && !imageUrl.match(/^GDRIVE:/i)) {
        Logger.log('Invalid image URL: ' + imageUrl);
        continue;
      }
      
      if (!currentSlide) {
        currentSlide = { isTitle: false, headline: imageAlt || 'Untitled Slide', subtitle: '', bullets: [], images: [imageUrl], videos: [] };
        isFirstSlide = false;
      } else if (currentSlide.layout === 'two-column') {
        if (inRightColumn) {
          currentSlide.rightImages.push(imageUrl);
        } else {
          currentSlide.leftImages.push(imageUrl);
        }
      } else {
        if (!currentSlide.images) currentSlide.images = [];
        currentSlide.images.push(imageUrl);
      }
      continue;
    }
    
    // Check for markdown H1
    if (trimmedLine.match(/^#\s+(.+)$/)) {
      const title = trimmedLine.replace(/^#\s+/, '');
      if (isFirstSlide) {
        currentSlide = { isTitle: true, title: title, subtitle: '' };
        slides.push(currentSlide);
        isFirstSlide = false;
      } else {
        if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);
        currentSlide = { isTitle: false, headline: title, subtitle: '', bullets: [], images: [], videos: [] };
      }
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingWasH2 = false;
      continue;
    }
    
    // Check for markdown H2
    if (trimmedLine.match(/^#{2}\s+(.+)$/)) {
      if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);
      const heading = trimmedLine.replace(/^#{2}\s+/, '');
      currentSlide = { isTitle: false, headline: heading, subtitle: '', bullets: [], images: [], videos: [] };
      isFirstSlide = false;
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingWasH2 = true;
      continue;
    }
    
    // Check for markdown H3
    if (trimmedLine.match(/^#{3}\s+(.+)$/)) {
      const subtitleText = trimmedLine.replace(/^#{3}\s+/, '');
      if (currentSlide && lastHeadingWasH2 && !currentSlide.subtitle) {
        currentSlide.subtitle = subtitleText;
      } else {
        if (currentSlide && !slides.includes(currentSlide)) slides.push(currentSlide);
        currentSlide = { isTitle: false, headline: subtitleText, subtitle: '', bullets: [], images: [], videos: [] };
        isFirstSlide = false;
      }
      inLeftColumn = false;
      inRightColumn = false;
      lastHeadingWasH2 = false;
      continue;
    }
    
    // Check for markdown bullets
    if (trimmedLine.match(/^[\*\-•]\s+(.+)$/)) {
      const bulletText = trimmedLine.replace(/^[\*\-•]\s+/, '');
      if (!currentSlide) {
        currentSlide = { isTitle: false, headline: 'Untitled Slide', subtitle: '', bullets: [bulletText], images: [], videos: [] };
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
      lastHeadingWasH2 = false;
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
      lastHeadingWasH2 = false;
      continue;
    }
    
    // First line becomes title
    if (isFirstSlide && !currentSlide) {
      currentSlide = { isTitle: true, title: trimmedLine, subtitle: '' };
      slides.push(currentSlide);
      isFirstSlide = false;
      lastHeadingWasH2 = false;
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
 */
function processTitleSlide(presentation, slideData) {
    const title = slideData.title || "Untitled Presentation";
    const subtitle = slideData.subtitle || "";

    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);

    const titleBox = slide.insertTextBox(title, 50, 100, 622, 100);
    titleBox.getText().getTextStyle().setFontSize(44).setBold(true);
    titleBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    if (subtitle) {
      const subtitleBox = slide.insertTextBox(subtitle, 50, 200, 622, 100);
      subtitleBox.getText().getTextStyle().setFontSize(28);
      subtitleBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
}

/**
 * Processes a content slide with text, images, and videos.
 */
function processContentSlide(presentation, slideData) {
    const headline = slideData.headline || 'Untitled Slide';
    const subtitle = slideData.subtitle || '';
    const bulletPoints = slideData.bullets || [];
    const images = slideData.images || [];
    const videos = slideData.videos || [];

    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);

    const headlineBox = slide.insertTextBox(headline, 50, 30, 450, 50);
    headlineBox.getText().getTextStyle().setFontSize(32).setBold(true);

    if (subtitle) {
      const subtitleBox = slide.insertTextBox(subtitle, 50, 85, 450, 35);
      subtitleBox.getText().getTextStyle().setFontSize(24).setItalic(true);
    }

    const bulletsStartY = subtitle ? 125 : 95;
    const mediaStartY = 100;
    let mediaYOffset = 0;

    if (images.length > 0 || videos.length > 0) {
      const mediaWidth = 250;
      const mediaHeight = 200;
      const mediaLeft = 450;
      
      images.forEach((imageUrl, index) => {
        try {
          if (imageUrl.startsWith('GDRIVE:')) {
            const fileId = imageUrl.replace('GDRIVE:', '').trim();
            const file = DriveApp.getFileById(fileId);
            const blob = file.getBlob();
            slide.insertImage(blob, mediaLeft, mediaStartY + mediaYOffset, mediaWidth, mediaHeight);
          } else {
            slide.insertImage(imageUrl, mediaLeft, mediaStartY + mediaYOffset, mediaWidth, mediaHeight);
          }
          mediaYOffset += mediaHeight + 10;
        } catch (e) {
          const errorBox = slide.insertTextBox('[Image Error: ' + e.message + ']', mediaLeft, mediaStartY + mediaYOffset, mediaWidth, 60);
          errorBox.getText().getTextStyle().setFontSize(9).setItalic(true);
          mediaYOffset += 70;
        }
      });
      
      videos.forEach((videoUrl, index) => {
        try {
          slide.insertVideo(videoUrl, mediaLeft, mediaStartY + mediaYOffset, mediaWidth, mediaHeight);
          mediaYOffset += mediaHeight + 10;
        } catch (e) {
          const errorBox = slide.insertTextBox('[Video Error: ' + e.message + ']', mediaLeft, mediaStartY + mediaYOffset, mediaWidth, 60);
          errorBox.getText().getTextStyle().setFontSize(9).setItalic(true);
          mediaYOffset += 70;
        }
      });
      
      if (bulletPoints.length > 0) {
        const bodyBox = slide.insertTextBox(bulletPoints.join('\n'), 50, bulletsStartY, 380, 300);
        bodyBox.getText().getTextStyle().setFontSize(18);
        bodyBox.getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
      }
    } else {
      if (bulletPoints.length > 0) {
        const bodyBox = slide.insertTextBox(bulletPoints.join('\n'), 50, bulletsStartY, 450, 300);
        bodyBox.getText().getTextStyle().setFontSize(20);
        bodyBox.getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
      }
    }
}

/**
 * Processes a two-column layout slide.
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
    
    if (headline) {
      const headlineBox = slide.insertTextBox(headline, 50, 30, 622, 50);
      headlineBox.getText().getTextStyle().setFontSize(32).setBold(true);
    }
    
    const columnWidth = 286;
    const leftColumnX = 50;
    const rightColumnX = 386;
    const contentStartY = headline ? 100 : 50;
    
    const hasBullets = (content) => content.some(line => line.match(/^[\*\-•]\s/));
    const cleanBullets = (content) => content.map(line => line.replace(/^[\*\-•]\s+/, ''));
    
    if (leftContent.length > 0) {
      const contentToDisplay = hasBullets(leftContent) ? cleanBullets(leftContent) : leftContent;
      const leftText = contentToDisplay.join('\n');
      const leftBox = slide.insertTextBox(leftText, leftColumnX, contentStartY, columnWidth, 150);
      leftBox.getText().getTextStyle().setFontSize(16);
      if (hasBullets(leftContent)) {
        leftBox.getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
      }
    }
    
    let leftMediaY = contentStartY + (leftContent.length > 0 ? 160 : 0);
    leftImages.forEach((imageUrl, index) => {
      try {
        if (imageUrl.startsWith('GDRIVE:')) {
          const fileId = imageUrl.replace('GDRIVE:', '').trim();
          const file = DriveApp.getFileById(fileId);
          const blob = file.getBlob();
          slide.insertImage(blob, leftColumnX, leftMediaY, columnWidth, 90);
        } else {
          slide.insertImage(imageUrl, leftColumnX, leftMediaY, columnWidth, 90);
        }
        leftMediaY += 100;
      } catch (e) {
        const errorBox = slide.insertTextBox('[Image Error]', leftColumnX, leftMediaY, columnWidth, 30);
        errorBox.getText().getTextStyle().setFontSize(10).setItalic(true);
        leftMediaY += 40;
      }
    });
    
    leftVideos.forEach((videoUrl, index) => {
      try {
        slide.insertVideo(videoUrl, leftColumnX, leftMediaY, columnWidth, 90);
        leftMediaY += 100;
      } catch (e) {
        const errorBox = slide.insertTextBox('[Video Error]', leftColumnX, leftMediaY, columnWidth, 30);
        errorBox.getText().getTextStyle().setFontSize(10).setItalic(true);
        leftMediaY += 40;
      }
    });
    
    if (rightContent.length > 0) {
      const contentToDisplay = hasBullets(rightContent) ? cleanBullets(rightContent) : rightContent;
      const rightText = contentToDisplay.join('\n');
      const rightBox = slide.insertTextBox(rightText, rightColumnX, contentStartY, columnWidth, 150);
      rightBox.getText().getTextStyle().setFontSize(16);
      if (hasBullets(rightContent)) {
        rightBox.getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
      }
    }
    
    let rightMediaY = contentStartY + (rightContent.length > 0 ? 160 : 0);
    rightImages.forEach((imageUrl, index) => {
      try {
        if (imageUrl.startsWith('GDRIVE:')) {
          const fileId = imageUrl.replace('GDRIVE:', '').trim();
          const file = DriveApp.getFileById(fileId);
          const blob = file.getBlob();
          slide.insertImage(blob, rightColumnX, rightMediaY, columnWidth, 90);
        } else {
          slide.insertImage(imageUrl, rightColumnX, rightMediaY, columnWidth, 90);
        }
        rightMediaY += 100;
      } catch (e) {
        const errorBox = slide.insertTextBox('[Image Error]', rightColumnX, rightMediaY, columnWidth, 30);
        errorBox.getText().getTextStyle().setFontSize(10).setItalic(true);
        rightMediaY += 40;
      }
    });
    
    rightVideos.forEach((videoUrl, index) => {
      try {
        slide.insertVideo(videoUrl, rightColumnX, rightMediaY, columnWidth, 90);
        rightMediaY += 100;
      } catch (e) {
        const errorBox = slide.insertTextBox('[Video Error]', rightColumnX, rightMediaY, columnWidth, 30);
        errorBox.getText().getTextStyle().setFontSize(10).setItalic(true);
        rightMediaY += 40;
      }
    });
}

/**
 * Extracts the Google Doc ID from a URL.
 */
function extractDocIdFromUrl(url) {
  const match = url.match(/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}