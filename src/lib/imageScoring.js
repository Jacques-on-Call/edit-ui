/**
 * Image Description (ID) Score Utility Module
 * 
 * This module provides comprehensive SEO scoring for images, analyzing:
 * - Topic word usage in filename and alt text
 * - Front-loading of keywords
 * - SEO-friendly filename structure
 * - Alt text quality and length
 * - Additional metadata (title, description)
 * - Performance optimization (lazy loading)
 * 
 * The ID Score contributes to the overall Page Score (PS) as defined in
 * the Scoring for Growth Strategy documentation.
 * 
 * @see easy-seo/docs/Scoring for Growth Strategy
 */

/**
 * SEO Weight Configuration
 * 
 * Total: 100 points
 * Based on the Scoring for Growth Strategy document's Image Optimization section:
 * - File Name: 15 points (has target keyword, descriptive)
 * - Alt Text: 20 points (descriptive + keyword)
 * - Image Description: 15 points (full sentence with context)
 * - File Size: 5 points (performance)
 * - Format: 5 points (WebP preferred)
 * - Lazy Loading: 10 points (performance)
 * - Topic Words in Filename: 10 points (front-loaded keywords)
 * - Topic Words in Alt Text: 10 points (natural keyword usage)
 * - Title: 10 points (tooltip, additional context)
 */
export const ID_SCORE_WEIGHTS = {
  // Core SEO elements (matching Strategy doc)
  FILENAME_SEO: 15,           // SEO-friendly filename structure (no spaces, hyphens, descriptive)
  ALT_TEXT_QUALITY: 20,       // Alt text exists with optimal length (10-125 chars)
  DESCRIPTION: 15,            // Image description present (for captions, additional context)
  
  // Topic word integration
  TOPIC_WORDS_FILENAME: 10,   // Topic words used in filename (front-loaded)
  TOPIC_WORDS_ALT: 10,        // Topic words used in alt text naturally
  
  // Additional metadata
  TITLE: 10,                  // Title attribute present (tooltip, additional context)
  
  // Performance optimization
  LAZY_LOADING: 10,           // Lazy loading enabled for performance
  FILE_SIZE: 5,               // Reasonable file size (<200KB optimal)
  FORMAT: 5,                  // Optimized format (webp/avif preferred)
};

/**
 * Checks if a filename is SEO-friendly
 * - No spaces
 * - Uses hyphens for word separation
 * - Lowercase preferred
 * - No special characters except hyphens
 * 
 * @param {string} filename - The filename to check
 * @returns {boolean} True if the filename is SEO-friendly
 */
export function isFilenameSeOFriendly(filename) {
  if (!filename || filename.length === 0) return false;
  
  // Check for spaces (major SEO issue)
  if (filename.includes(' ')) return false;
  
  // Check for double hyphens (common mistake)
  if (filename.includes('--')) return false;
  
  // Check for special characters (except hyphens and periods for extension)
  const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  if (/[^a-z0-9-]/i.test(filenameWithoutExt)) return false;
  
  return true;
}

/**
 * Extracts topic words from the page's title (H1) and headings (H2, H3)
 * Topic words are the main keywords that should be used throughout the page
 * 
 * @param {Object} pageData - The page data containing sections
 * @returns {string[]} Array of topic words (lowercase, normalized)
 */
export function extractTopicWords(pageData) {
  if (!pageData || !pageData.sections) return [];
  
  const topicWords = new Set();
  
  for (const section of pageData.sections) {
    // Extract from H1 (hero title)
    if (section.type === 'hero' && section.props?.title) {
      const words = extractWordsFromText(section.props.title);
      words.forEach(word => topicWords.add(word));
    }
    
    // Extract from H2/H3 (section titles)
    if ((section.type === 'textSection' || section.type === 'bodySection') && section.props?.title) {
      const words = extractWordsFromText(section.props.title);
      words.forEach(word => topicWords.add(word));
    }
  }
  
  return Array.from(topicWords);
}

/**
 * Extracts meaningful words from text, filtering out common stop words
 * 
 * @param {string} text - The text to extract words from
 * @returns {string[]} Array of meaningful words (lowercase)
 */
export function extractWordsFromText(text) {
  if (!text) return [];
  
  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
    'it', 'its', 'this', 'that', 'these', 'those', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'your', 'our', 'their', 'we',
    'you', 'he', 'she', 'they', 'what', 'which', 'who', 'how', 'when',
    'where', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than',
    'too', 'very', 'just', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'any', 'also'
  ]);
  
  // Remove HTML tags using a loop to handle nested/malformed tags
  // This is for text extraction only, not for HTML sanitization
  let cleanText = text;
  let previousLength;
  do {
    previousLength = cleanText.length;
    cleanText = cleanText.replace(/<[^>]*>/g, ' ');
  } while (cleanText.length !== previousLength);
  
  const words = cleanText.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  return words;
}

/**
 * Checks if topic words are present in the given text
 * 
 * @param {string} text - The text to check
 * @param {string[]} topicWords - Array of topic words to look for
 * @returns {Object} Object with count of matches and which words matched
 */
export function checkTopicWordUsage(text, topicWords) {
  if (!text || !topicWords || topicWords.length === 0) {
    return { count: 0, matches: [], score: 0 };
  }
  
  const textLower = text.toLowerCase();
  const textWords = extractWordsFromText(text);
  const matches = [];
  
  for (const topicWord of topicWords) {
    // Check for exact word match or partial match (for compound words)
    if (textLower.includes(topicWord) || textWords.includes(topicWord)) {
      matches.push(topicWord);
    }
  }
  
  // Score based on how many topic words are used (max 2-3 uses as per strategy doc)
  const optimalCount = Math.min(3, topicWords.length);
  const score = Math.min(matches.length / optimalCount, 1);
  
  return {
    count: matches.length,
    matches,
    score
  };
}

/**
 * Checks if keywords are front-loaded in the text
 * Front-loading means the most important keywords appear at the beginning
 * 
 * @param {string} text - The text to check
 * @param {string[]} topicWords - Array of topic words
 * @returns {Object} Object with front-loading analysis
 */
export function checkFrontLoading(text, topicWords) {
  if (!text || !topicWords || topicWords.length === 0) {
    return { isFrontLoaded: false, position: -1, score: 0 };
  }
  
  const textLower = text.toLowerCase();
  const textLength = textLower.length;
  
  // Find the position of the first topic word
  let earliestPosition = textLength;
  let matchedWord = null;
  
  for (const word of topicWords) {
    const position = textLower.indexOf(word);
    if (position !== -1 && position < earliestPosition) {
      earliestPosition = position;
      matchedWord = word;
    }
  }
  
  if (earliestPosition === textLength) {
    return { isFrontLoaded: false, position: -1, score: 0, word: null };
  }
  
  // Calculate score based on position
  // Position in first 30% = full points
  // Position in first 50% = partial points
  // Position after 50% = minimal points
  const positionRatio = earliestPosition / textLength;
  let score = 0;
  if (positionRatio <= 0.3) {
    score = 1;
  } else if (positionRatio <= 0.5) {
    score = 0.7;
  } else {
    score = 0.3;
  }
  
  return {
    isFrontLoaded: positionRatio <= 0.5,
    position: earliestPosition,
    score,
    word: matchedWord
  };
}

/**
 * Calculates the comprehensive ID (Image Description) Score
 * 
 * @param {Object} imageData - Object containing image metadata
 * @param {string} imageData.filename - The image filename
 * @param {string} imageData.alt - Alt text
 * @param {string} imageData.title - Title attribute
 * @param {string} imageData.description - Image description
 * @param {string} imageData.loading - Loading strategy ('lazy' or 'eager')
 * @param {number} imageData.fileSize - File size in bytes (optional)
 * @param {string} imageData.format - File format/extension (optional)
 * @param {string[]} topicWords - Array of topic words from the page (optional)
 * @returns {Object} Detailed score breakdown and total score
 */
export function calculateImageScore(imageData, topicWords = []) {
  const breakdown = {
    filenameScore: 0,
    altTextScore: 0,
    descriptionScore: 0,
    titleScore: 0,
    lazyLoadingScore: 0,
    fileSizeScore: 0,
    formatScore: 0,
    topicWordsFilenameScore: 0,
    topicWordsAltScore: 0,
    total: 0,
    details: {}
  };
  
  const { filename, alt, title, description, loading, fileSize, format } = imageData;
  
  // 1. Filename SEO (15 points)
  if (filename && filename.length > 0) {
    if (isFilenameSeOFriendly(filename)) {
      breakdown.filenameScore = ID_SCORE_WEIGHTS.FILENAME_SEO;
      breakdown.details.filename = { status: 'optimal', message: 'SEO-friendly filename' };
    } else if (!filename.includes(' ')) {
      breakdown.filenameScore = ID_SCORE_WEIGHTS.FILENAME_SEO * 0.5;
      breakdown.details.filename = { status: 'partial', message: 'Filename could be improved' };
    } else {
      breakdown.filenameScore = ID_SCORE_WEIGHTS.FILENAME_SEO * 0.2;
      breakdown.details.filename = { status: 'poor', message: 'Use hyphens instead of spaces' };
    }
  } else {
    breakdown.details.filename = { status: 'missing', message: 'No filename provided' };
  }
  
  // 2. Alt Text Quality (20 points)
  if (alt && alt.length > 0) {
    if (alt.length >= 10 && alt.length <= 125) {
      breakdown.altTextScore = ID_SCORE_WEIGHTS.ALT_TEXT_QUALITY;
      breakdown.details.altText = { status: 'optimal', message: 'Good alt text length (10-125 chars)' };
    } else if (alt.length < 10) {
      breakdown.altTextScore = ID_SCORE_WEIGHTS.ALT_TEXT_QUALITY * 0.3;
      breakdown.details.altText = { status: 'poor', message: 'Alt text too short (less than 10 chars)' };
    } else {
      breakdown.altTextScore = ID_SCORE_WEIGHTS.ALT_TEXT_QUALITY * 0.6;
      breakdown.details.altText = { status: 'partial', message: 'Alt text too long (over 125 chars)' };
    }
  } else {
    breakdown.details.altText = { status: 'missing', message: 'Alt text is required for accessibility' };
  }
  
  // 3. Description (15 points)
  if (description && description.length > 0) {
    if (description.length >= 20) {
      breakdown.descriptionScore = ID_SCORE_WEIGHTS.DESCRIPTION;
      breakdown.details.description = { status: 'optimal', message: 'Good descriptive text' };
    } else {
      breakdown.descriptionScore = ID_SCORE_WEIGHTS.DESCRIPTION * 0.5;
      breakdown.details.description = { status: 'partial', message: 'Consider adding more detail' };
    }
  } else {
    breakdown.details.description = { status: 'missing', message: 'Add a description for captions' };
  }
  
  // 4. Title (10 points)
  if (title && title.length > 0) {
    breakdown.titleScore = ID_SCORE_WEIGHTS.TITLE;
    breakdown.details.title = { status: 'optimal', message: 'Title attribute present' };
  } else {
    breakdown.details.title = { status: 'missing', message: 'Add a title for hover tooltip' };
  }
  
  // 5. Lazy Loading (10 points)
  if (loading === 'lazy') {
    breakdown.lazyLoadingScore = ID_SCORE_WEIGHTS.LAZY_LOADING;
    breakdown.details.loading = { status: 'optimal', message: 'Lazy loading enabled' };
  } else if (loading === 'eager') {
    // Eager is acceptable for hero images
    breakdown.lazyLoadingScore = ID_SCORE_WEIGHTS.LAZY_LOADING * 0.5;
    breakdown.details.loading = { status: 'partial', message: 'Eager loading (OK for hero images)' };
  } else {
    breakdown.details.loading = { status: 'missing', message: 'Set loading strategy' };
  }
  
  // 6. File Size (5 points) - if provided
  if (typeof fileSize === 'number') {
    if (fileSize < 100 * 1024) { // < 100KB
      breakdown.fileSizeScore = ID_SCORE_WEIGHTS.FILE_SIZE;
      breakdown.details.fileSize = { status: 'optimal', message: 'Excellent file size' };
    } else if (fileSize < 200 * 1024) { // < 200KB
      breakdown.fileSizeScore = ID_SCORE_WEIGHTS.FILE_SIZE * 0.7;
      breakdown.details.fileSize = { status: 'good', message: 'Good file size' };
    } else {
      breakdown.fileSizeScore = ID_SCORE_WEIGHTS.FILE_SIZE * 0.3;
      breakdown.details.fileSize = { status: 'poor', message: 'Consider reducing file size' };
    }
  } else {
    breakdown.fileSizeScore = ID_SCORE_WEIGHTS.FILE_SIZE * 0.5; // Default partial score
    breakdown.details.fileSize = { status: 'unknown', message: 'File size not available' };
  }
  
  // 7. Format (5 points) - if provided
  const fileExtension = format || (filename ? filename.split('.').pop()?.toLowerCase() : null);
  if (fileExtension) {
    if (fileExtension === 'webp' || fileExtension === 'avif') {
      breakdown.formatScore = ID_SCORE_WEIGHTS.FORMAT;
      breakdown.details.format = { status: 'optimal', message: 'Modern optimized format' };
    } else if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
      breakdown.formatScore = ID_SCORE_WEIGHTS.FORMAT * 0.7;
      breakdown.details.format = { status: 'good', message: 'Standard format (Astro will optimize)' };
    } else {
      breakdown.formatScore = ID_SCORE_WEIGHTS.FORMAT * 0.3;
      breakdown.details.format = { status: 'poor', message: 'Consider using WebP format' };
    }
  } else {
    breakdown.details.format = { status: 'unknown', message: 'Format not detected' };
  }
  
  // 8. Topic Words in Filename (10 points)
  if (topicWords.length > 0 && filename) {
    const filenameAnalysis = checkTopicWordUsage(filename, topicWords);
    
    if (filenameAnalysis.count > 0) {
      // Only calculate front-loading when topic words are found
      const frontLoadAnalysis = checkFrontLoading(filename, topicWords);
      // Base score for having topic words
      let score = filenameAnalysis.score * ID_SCORE_WEIGHTS.TOPIC_WORDS_FILENAME * 0.6;
      // Bonus for front-loading
      score += frontLoadAnalysis.score * ID_SCORE_WEIGHTS.TOPIC_WORDS_FILENAME * 0.4;
      breakdown.topicWordsFilenameScore = Math.round(score);
      breakdown.details.topicWordsFilename = { 
        status: frontLoadAnalysis.isFrontLoaded ? 'optimal' : 'good',
        message: `Topic words found: ${filenameAnalysis.matches.join(', ')}`,
        matches: filenameAnalysis.matches,
        isFrontLoaded: frontLoadAnalysis.isFrontLoaded
      };
    } else {
      breakdown.details.topicWordsFilename = { 
        status: 'missing',
        message: 'Include topic words in filename'
      };
    }
  } else {
    breakdown.details.topicWordsFilename = { 
      status: 'na',
      message: topicWords.length === 0 ? 'No topic words defined on page' : 'No filename'
    };
  }
  
  // 9. Topic Words in Alt Text (10 points)
  if (topicWords.length > 0 && alt) {
    const altAnalysis = checkTopicWordUsage(alt, topicWords);
    
    if (altAnalysis.count > 0) {
      breakdown.topicWordsAltScore = Math.round(altAnalysis.score * ID_SCORE_WEIGHTS.TOPIC_WORDS_ALT);
      breakdown.details.topicWordsAlt = { 
        status: altAnalysis.count >= 2 ? 'optimal' : 'good',
        message: `Topic words used naturally: ${altAnalysis.matches.join(', ')}`,
        matches: altAnalysis.matches
      };
    } else {
      breakdown.details.topicWordsAlt = { 
        status: 'missing',
        message: 'Include topic words in alt text naturally'
      };
    }
  } else {
    breakdown.details.topicWordsAlt = { 
      status: 'na',
      message: topicWords.length === 0 ? 'No topic words defined on page' : 'No alt text'
    };
  }
  
  // Calculate total
  breakdown.total = Math.round(
    breakdown.filenameScore +
    breakdown.altTextScore +
    breakdown.descriptionScore +
    breakdown.titleScore +
    breakdown.lazyLoadingScore +
    breakdown.fileSizeScore +
    breakdown.formatScore +
    breakdown.topicWordsFilenameScore +
    breakdown.topicWordsAltScore
  );
  
  // Cap at 100
  breakdown.total = Math.min(100, breakdown.total);
  
  return breakdown;
}

/**
 * Gets a color class based on the score
 * 
 * @param {number} score - The score (0-100)
 * @returns {string} Tailwind color class
 */
export function getScoreColorClass(score) {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-orange-400';
}

/**
 * Gets a background color class based on the score
 * 
 * @param {number} score - The score (0-100)
 * @returns {string} Tailwind background color class
 */
export function getScoreBgClass(score) {
  if (score >= 80) return 'bg-green-400';
  if (score >= 50) return 'bg-yellow-400';
  return 'bg-orange-400';
}

/**
 * Gets a status message based on the score
 * 
 * @param {number} score - The score (0-100)
 * @returns {string} Human-readable status message
 */
export function getScoreStatus(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Calculates the aggregate image score for a page (sum of all images' ID scores)
 * This contributes to the Page Score (PS)
 * 
 * @param {Object[]} images - Array of image data objects
 * @param {string[]} topicWords - Topic words from the page
 * @returns {Object} Aggregate score and breakdown per image
 */
export function calculatePageImageScore(images, topicWords = []) {
  if (!images || images.length === 0) {
    return { 
      total: 0, 
      average: 0, 
      count: 0, 
      images: [],
      contribution: 0 
    };
  }
  
  const imageScores = images.map((image, index) => ({
    index,
    ...calculateImageScore(image, topicWords)
  }));
  
  const totalScore = imageScores.reduce((sum, img) => sum + img.total, 0);
  const averageScore = Math.round(totalScore / images.length);
  
  // Max contribution to page score is 80 points (as per Scoring Strategy doc)
  // This is based on a weighted average of individual image scores
  const contribution = Math.round((averageScore / 100) * 80);
  
  return {
    total: totalScore,
    average: averageScore,
    count: images.length,
    images: imageScores,
    contribution
  };
}
