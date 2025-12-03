/**
 * Page Score (PS) Utility Module
 * 
 * This module calculates a comprehensive Page Score (0-100) based on:
 * - Headers (H1, H2, H3 with topic words)
 * - Content quality (bullet points, short paragraphs)
 * - Images (aggregate ID Scores)
 * - Links (inner links, outbound links)
 * - Metadata (title, description, schema)
 * - URL structure
 * 
 * The Page Score is displayed in the BottomActionBar with color gradient:
 * - Red at 0 → Orange → Yellow → Green at 100
 * 
 * @see easy-seo/docs/Scoring for Growth Strategy
 */

import { extractTopicWords, calculatePageImageScore, checkTopicWordUsage } from './imageScoring.js';

/**
 * Page Score Weight Configuration
 * 
 * Total: 100 points
 * Based on the Scoring for Growth Strategy document:
 * - Header Structure: 25 points
 * - Content Quality: 25 points
 * - Images: 20 points (from image aggregate scores)
 * - Links: 15 points
 * - Metadata: 15 points
 */
export const PAGE_SCORE_WEIGHTS = {
  HEADERS: 25,        // H1, H2, H3 with topic word usage
  CONTENT: 25,        // Paragraphs, bullet points, readability
  IMAGES: 20,         // Aggregate ID scores from images
  LINKS: 15,          // Internal and external links
  METADATA: 15,       // Title, description, schema
};

/**
 * Strips HTML tags from text for content length calculation.
 * Uses a loop to handle nested/malformed tags.
 * NOTE: This is for text extraction only, not for security sanitization.
 * 
 * @param {string} text - The text to strip HTML from
 * @returns {string} Text with HTML tags removed
 */
function stripHtml(text) {
  if (!text) return '';
  let cleanText = text;
  let previousLength;
  // Loop until no more tags are found (handles nested tags)
  do {
    previousLength = cleanText.length;
    cleanText = cleanText.replace(/<[^>]*>/g, '');
  } while (cleanText.length !== previousLength);
  return cleanText;
}

/**
 * Checks if a section has an H1 (hero title)
 */
function hasH1(sections) {
  return sections.some(section => 
    section.type === 'hero' && section.props?.title && section.props.title.length > 0
  );
}

/**
 * Counts H2 sections (textSection titles)
 */
function countH2s(sections) {
  return sections.filter(section => 
    section.type === 'textSection' && section.props?.title && section.props.title.length > 0
  ).length;
}

/**
 * Calculates header structure score
 * - H1 present: 10 points
 * - 2-4 H2s with topic words: 10 points
 * - Proper hierarchy: 5 points
 */
function calculateHeaderScore(sections, topicWords) {
  let score = 0;
  const maxScore = PAGE_SCORE_WEIGHTS.HEADERS;
  
  // H1 presence (10 points)
  if (hasH1(sections)) {
    score += 10;
    
    // Check if H1 contains topic words (bonus)
    const heroSection = sections.find(s => s.type === 'hero');
    if (heroSection?.props?.title && topicWords.length > 0) {
      const h1TopicCheck = checkTopicWordUsage(heroSection.props.title, topicWords);
      if (h1TopicCheck.count > 0) {
        score += 2; // Bonus for topic words in H1
      }
    }
  }
  
  // H2 count (10 points for 2-4 H2s)
  const h2Count = countH2s(sections);
  if (h2Count >= 2 && h2Count <= 4) {
    score += 10;
  } else if (h2Count === 1) {
    score += 5;
  } else if (h2Count > 4) {
    score += 7; // Slight penalty for too many H2s
  }
  
  // Hierarchy check (3 points) - first section should be hero
  if (sections.length > 0 && sections[0].type === 'hero') {
    score += 3;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Calculates content quality score
 * - Content length: up to 10 points
 * - Paragraph structure: up to 10 points
 * - Body content presence: up to 5 points
 */
function calculateContentScore(sections) {
  let score = 0;
  const maxScore = PAGE_SCORE_WEIGHTS.CONTENT;
  
  // Count total content length
  let totalContentLength = 0;
  let paragraphCount = 0;
  let hasBodyContent = false;
  
  for (const section of sections) {
    if (section.props?.body) {
      hasBodyContent = true;
      // Strip HTML for length calculation using our safe helper
      const textContent = stripHtml(section.props.body);
      totalContentLength += textContent.length;
      
      // Estimate paragraph count
      paragraphCount += (section.props.body.match(/<\/p>/g) || []).length || 1;
    }
    
    if (section.props?.title) {
      totalContentLength += stripHtml(section.props.title).length;
    }
  }
  
  // Content length score (up to 10 points)
  // 300-1500 words = optimal (assuming ~5 chars per word)
  if (totalContentLength >= 1500 && totalContentLength <= 7500) {
    score += 10;
  } else if (totalContentLength >= 500) {
    score += 7;
  } else if (totalContentLength >= 150) {
    score += 4;
  } else if (totalContentLength > 0) {
    score += 2;
  }
  
  // Paragraph structure (up to 10 points)
  if (paragraphCount >= 3 && paragraphCount <= 8) {
    score += 10;
  } else if (paragraphCount >= 2) {
    score += 6;
  } else if (paragraphCount >= 1) {
    score += 3;
  }
  
  // Body content presence (5 points)
  if (hasBodyContent) {
    score += 5;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Calculates image score contribution
 * Based on aggregate ID scores from all images
 */
function calculateImageContribution(sections, topicWords) {
  const maxScore = PAGE_SCORE_WEIGHTS.IMAGES;
  
  // Collect all images from sections
  const images = [];
  
  for (const section of sections) {
    // Hero feature image
    if (section.props?.featureImage || section.props?.featureImageUrl) {
      images.push({
        filename: extractFilename(section.props.featureImage || section.props.featureImageUrl),
        alt: section.props.featureImageAlt || '',
        title: section.props.featureImageTitle || '',
        description: section.props.featureImageDescription || '',
        loading: section.props.featureImageLoading || 'lazy',
      });
    }
    
    // Hero background image
    if (section.props?.backgroundImageUrl) {
      images.push({
        filename: extractFilename(section.props.backgroundImageUrl),
        alt: section.props.backgroundImageAlt || '',
        title: section.props.backgroundImageTitle || '',
        description: section.props.backgroundImageDescription || '',
        loading: section.props.backgroundImageLoading || 'lazy',
      });
    }
    
    // Text section header image
    if (section.props?.headerImageUrl) {
      images.push({
        filename: extractFilename(section.props.headerImageUrl),
        alt: section.props.headerImageAlt || '',
        title: section.props.headerImageTitle || '',
        description: section.props.headerImageDescription || '',
        loading: section.props.headerImageLoading || 'lazy',
      });
    }
  }
  
  if (images.length === 0) {
    // No images - partial score (images are optional but recommended)
    return Math.round(maxScore * 0.3);
  }
  
  // Calculate aggregate image score
  const imageScoreResult = calculatePageImageScore(images, topicWords);
  
  // Map average image score (0-100) to page score contribution (0-20)
  return Math.round((imageScoreResult.average / 100) * maxScore);
}

/**
 * Extracts filename from a path
 */
function extractFilename(path) {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
}

/**
 * Calculates link score (placeholder - links are managed externally)
 * For now, gives partial credit for having any content
 */
function calculateLinkScore(sections) {
  const maxScore = PAGE_SCORE_WEIGHTS.LINKS;
  
  // Check for links in body content (basic check for <a> tags)
  let hasInternalLinks = false;
  let hasExternalLinks = false;
  
  for (const section of sections) {
    if (section.props?.body) {
      if (section.props.body.includes('href="/') || section.props.body.includes('href="./')) {
        hasInternalLinks = true;
      }
      if (section.props.body.includes('href="http')) {
        hasExternalLinks = true;
      }
    }
  }
  
  let score = 0;
  if (hasInternalLinks) score += 7;
  if (hasExternalLinks) score += 5;
  
  // Give partial credit even without links (content matters more initially)
  if (score === 0 && sections.length > 0) {
    score = 3;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Calculates metadata score (placeholder - metadata is managed in JSON)
 * For now, checks if hero has title content
 */
function calculateMetadataScore(sections, meta) {
  const maxScore = PAGE_SCORE_WEIGHTS.METADATA;
  let score = 0;
  
  // Check for page meta title
  if (meta?.title && meta.title.length > 0) {
    score += 5;
    // Optimal length: 50-60 characters
    if (meta.title.length >= 50 && meta.title.length <= 60) {
      score += 2;
    }
  }
  
  // Check for page meta description
  if (meta?.description && meta.description.length > 0) {
    score += 5;
    // Optimal length: 120-160 characters
    if (meta.description.length >= 120 && meta.description.length <= 160) {
      score += 2;
    }
  }
  
  // Partial credit if no meta but has content
  if (score === 0 && sections.length > 0 && hasH1(sections)) {
    score = 3;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Calculates the comprehensive Page Score (0-100)
 * 
 * @param {Object} pageData - Object containing page sections and meta
 * @param {Array} pageData.sections - Array of section objects
 * @param {Object} pageData.meta - Page metadata (title, description, etc.)
 * @returns {Object} Detailed score breakdown and total score
 */
export function calculatePageScore(pageData) {
  const sections = pageData?.sections || [];
  const meta = pageData?.meta || {};
  
  // Edge case: no sections
  if (sections.length === 0) {
    return {
      total: 0,
      breakdown: {
        headers: 0,
        content: 0,
        images: 0,
        links: 0,
        metadata: 0,
      },
      details: {
        status: 'empty',
        message: 'Add sections to see your Page Score',
      }
    };
  }
  
  // Extract topic words from headings
  const topicWords = extractTopicWords(pageData);
  
  // Calculate component scores
  const headerScore = calculateHeaderScore(sections, topicWords);
  const contentScore = calculateContentScore(sections);
  const imageScore = calculateImageContribution(sections, topicWords);
  const linkScore = calculateLinkScore(sections);
  const metadataScore = calculateMetadataScore(sections, meta);
  
  // Calculate total
  const total = headerScore + contentScore + imageScore + linkScore + metadataScore;
  
  return {
    total: Math.min(100, total),
    breakdown: {
      headers: headerScore,
      content: contentScore,
      images: imageScore,
      links: linkScore,
      metadata: metadataScore,
    },
    details: {
      status: getScoreStatus(total),
      topicWords: topicWords.slice(0, 5), // Top 5 topic words
      sectionCount: sections.length,
    }
  };
}

/**
 * Gets a status message based on the score
 */
function getScoreStatus(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Improvement';
  return 'Getting Started';
}

/**
 * Gets a color class based on the score for the action bar display
 * Red at 0 → Orange → Yellow → Green at 100
 * 
 * @param {number} score - The score (0-100)
 * @returns {string} Tailwind color class
 */
export function getPageScoreColor(score) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}
