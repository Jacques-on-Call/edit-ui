import { getSchemaTemplate } from './schemaTemplates';

/**
 * A mock AI service to suggest schemas based on page content.
 * In a real implementation, this would involve a call to a machine learning model.
 *
 * @param {string} content The text content of the page to analyze.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of suggested schemas.
 */
export const getAiSchemaSuggestions = async (content) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const suggestions = [];
  const lowerCaseContent = content.toLowerCase();

  // --- Mock Schema Detection Logic ---

  // Suggest 'FAQPage' if Q&A format is detected
  if (lowerCaseContent.includes('q:') && lowerCaseContent.includes('a:')) {
    suggestions.push({
      type: 'FAQPage',
      confidence: 0.9,
      reason: 'The content appears to contain a Question & Answer format.',
      schema: getSchemaTemplate('FAQPage')
    });
  }

  // Suggest 'HowTo' if it finds step-by-step instructions
  if (lowerCaseContent.includes('step 1') || lowerCaseContent.includes('instructions:')) {
    suggestions.push({
      type: 'HowTo',
      confidence: 0.85,
      reason: 'The content seems to describe a process with steps.',
      schema: getSchemaTemplate('HowTo')
    });
  }

  // Suggest 'Recipe' if it finds ingredients and instructions
  if (lowerCaseContent.includes('ingredients') && lowerCaseContent.includes('directions')) {
    suggestions.push({
      type: 'Recipe',
      confidence: 0.95,
      reason: 'Keywords like "ingredients" and "directions" suggest this is a recipe.',
      schema: getSchemaTemplate('Recipe')
    });
  }

  // Suggest 'LocalBusiness' if it finds address-like keywords
  if (lowerCaseContent.includes('address:') || lowerCaseContent.includes('phone:') || lowerCaseContent.includes(' main st')) {
    suggestions.push({
      type: 'LocalBusiness',
      confidence: 0.8,
      reason: 'The content mentions a business address or phone number.',
      schema: getSchemaTemplate('LocalBusiness')
    });
  }

  // Suggest 'Event' if it finds event-like keywords
  if (lowerCaseContent.includes('date:') && (lowerCaseContent.includes('time:') || lowerCaseContent.includes('location:'))) {
    suggestions.push({
      type: 'Event',
      confidence: 0.88,
      reason: 'The content includes a date, time, or location, suggesting an event.',
      schema: getSchemaTemplate('Event')
    });
  }

  // Suggest 'Product' if it finds pricing or e-commerce keywords
  if (lowerCaseContent.includes('price:') || lowerCaseContent.includes('$') || lowerCaseContent.includes('add to cart')) {
    suggestions.push({
      type: 'Product',
      confidence: 0.75,
      reason: 'The content includes pricing or e-commerce terms.',
      schema: getSchemaTemplate('Product')
    });
  }

  // Suggest 'Article' as a default for most text-heavy content
  if (lowerCaseContent.length > 200 && suggestions.length === 0) {
      suggestions.push({
          type: 'Article',
          confidence: 0.7,
          reason: 'The content is substantial and may be an article.',
          schema: getSchemaTemplate('Article')
      });
  }

  return suggestions;
};