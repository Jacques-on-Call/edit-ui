/**
 * Provides default JSON-LD schema templates for various types.
 * Each template includes the basic required or commonly used properties.
 */

const templates = {
  Article: {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Article Headline",
    "author": { "@type": "Person", "name": "Author Name" },
    "publisher": { "@type": "Organization", "name": "Publisher Name" },
    "datePublished": new Date().toISOString().split('T')[0],
  },
  FAQPage: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": "Sample Question?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sample Answer." }
    }]
  },
  HowTo: {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Title",
    "step": [{ "@type": "HowToStep", "text": "First step..." }]
  },
  BreadcrumbList: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Homepage",
      "item": "https://example.com"
    }]
  },
  Product: {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Product Name",
    "image": "https://example.com/product.jpg",
    "description": "Product description.",
    "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "USD" }
  },
  Review: {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": { "@type": "Thing", "name": "Thing Reviewed" },
    "author": { "@type": "Person", "name": "Reviewer Name" },
    "reviewRating": { "@type": "Rating", "ratingValue": "5" },
    "publisher": { "@type": "Organization", "name": "Publisher Name" }
  },
  LocalBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Business Name",
    "address": { "@type": "PostalAddress", "streetAddress": "123 Main St" },
    "telephone": "+1234567890"
  },
  Event: {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "Event Name",
    "startDate": new Date().toISOString(),
    "location": { "@type": "Place", "name": "Event Location" }
  },
  Person: {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Person's Name",
    "url": "https://example.com/profile"
  },
  Organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Organization Name",
    "url": "https://example.com",
    "logo": "https://example.com/logo.png"
  },
  VideoObject: {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Video Title",
    "description": "Video description.",
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "uploadDate": new Date().toISOString(),
    "contentUrl": "https://example.com/video.mp4"
  },
  Service: {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Service Name",
    "serviceType": "Type of Service",
    "provider": { "@type": "Organization", "name": "Provider Name" }
  },
  JobPosting: {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Job Title",
    "hiringOrganization": { "@type": "Organization", "name": "Hiring Organization" },
    "datePosted": new Date().toISOString().split('T')[0]
  },
  Recipe: {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Recipe Name",
    "recipeIngredient": ["1 cup flour"],
    "recipeInstructions": [{"@type": "HowToStep", "text": "Mix ingredients."}]
  },
  QAPage: {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": "Sample Question?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sample Answer." }
    }
  },
  Speakable: {
    "@context": "https://schema.org",
    "@type": "SpeakableSpecification",
    "cssSelector": [".speakable-content"]
  },
  Dataset: {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Dataset Name",
    "description": "Description of the dataset."
  },
  GeoCoordinates: {
    "@context": "https://schema.org",
    "@type": "GeoCoordinates",
    "latitude": "0.0",
    "longitude": "0.0"
  },
  ServiceArea: {
    "@context": "https://schema.org",
    "@type": "ServiceArea",
    "areaServed": { "@type": "City", "name": "City Name" }
  },
  PriceRange: {
    "@context": "https://schema.org",
    "@type": "PriceRange",
    "priceRange": "$$"
  },
  OpeningHoursSpecification: {
    "@context": "https://schema.org",
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday"],
    "opens": "09:00",
    "closes": "17:00"
  },
  Offer: {
    "@context": "https://schema.org",
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  },
  CallToAction: {
    "@context": "https://schema.org",
    "@type": "CallToAction",
    "name": "Action Name (e.g., Sign Up)",
    "target": "https://example.com/action"
  },
  ImageObject: {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": "https://example.com/image.jpg",
    "name": "Image Title"
  },
  Logo: {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "url": "https://example.com/logo.png",
    "caption": "Organization Logo"
  }
};

export function getSchemaTemplate(type) {
  return templates[type] || { "@context": "https://schema.org", "@type": type };
}