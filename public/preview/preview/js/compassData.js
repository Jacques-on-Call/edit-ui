// js/compassData.js

const SEO_TYPES_DATA = [
    {
        id: "featured_snippet_seo",
        name: "Featured Snippet SEO",
        description: "Optimizing content to appear as the direct answer box (featured snippet) on Search Engine Results Pages (SERPs). This often involves structuring content with clear questions and concise answers, lists, or tables.",
        base_effort_hours_per_month_low: 4,
        base_effort_hours_per_month_medium: 8,
        base_effort_hours_per_month_high: 15,
        skill_required: "Intermediate", // Requires understanding of on-page SEO and content structure
        primary_benefits: ["Trust & Authority", "Brand Awareness", "Thought Leadership"],
        relevance_startup: "Medium", // Can be a quick win if content is good
        relevance_growth: "High",
        relevance_scale: "High",
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" }, // Highly valuable for informational queries
        dependencies: ["content_seo"], // Depends on having quality content
        tools_recommended: ["Google Search Console", "Ahrefs", "SEMrush", "AnswerThePublic"],
        zero_click_impact: "High" // Directly aims for zero-click visibility
    },
    {
        id: "local_seo",
        name: "Local SEO",
        description: "Optimizing your online presence to attract more business from relevant local searches. This primarily involves Google Business Profile optimization, local citations, and managing online reviews.",
        base_effort_hours_per_month_low: 5,
        base_effort_hours_per_month_medium: 10,
        base_effort_hours_per_month_high: 20,
        skill_required: "Beginner", // Basic setup is accessible
        primary_benefits: ["Attract New Clients/Leads", "Brand Awareness", "Customer Engagement"],
        relevance_startup: "High",
        relevance_growth: "High",
        relevance_scale: "Medium", // Still important but may have broader reach too
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" }, // Essential for local practices
        dependencies: [],
        tools_recommended: ["Google Business Profile", "BrightLocal", "Whitespark", "Moz Local"],
        zero_click_impact: "High" // GBP listings are prominent zero-click results
    },
    {
        id: "schema_markup_seo",
        name: "Schema Markup SEO (Structured Data)",
        description: "Adding specific code (schema markup) to your website to help search engines understand the context of your content better, leading to rich snippets and enhanced visibility in SERPs.",
        base_effort_hours_per_month_low: 3, // For basic implementation on key pages
        base_effort_hours_per_month_medium: 6,
        base_effort_hours_per_month_high: 12,
        skill_required: "Intermediate", // Can be technical
        primary_benefits: ["Enhanced SERP Visibility", "Trust & Authority", "Improved Click-Through Rates"],
        relevance_startup: "Medium",
        relevance_growth: "High",
        relevance_scale: "High",
        industry_priority: { "healthcare": "High", "legal": "Medium", "financial": "Medium" }, // Very useful for articles, FAQs, local business info
        dependencies: [],
        tools_recommended: ["Google Structured Data Markup Helper", "Schema.org", "RankRanger Schema Markup Generator"],
        zero_click_impact: "Medium" // Contributes to rich snippets which can be zero-click
    },
    {
        id: "content_seo",
        name: "Content SEO",
        description: "Creating and optimizing high-quality, relevant content that answers user queries and targets specific keywords. This forms the foundation for many other SEO activities.",
        base_effort_hours_per_month_low: 10, // Assuming 1-2 pieces of content
        base_effort_hours_per_month_medium: 20,
        base_effort_hours_per_month_high: 40,
        skill_required: "Beginner", // Basic optimization is learnable
        primary_benefits: ["Attract New Clients/Leads", "Trust & Authority", "Brand Awareness", "Thought Leadership"],
        relevance_startup: "High",
        relevance_growth: "High",
        relevance_scale: "High",
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" }, // Universally important
        dependencies: [], // Foundational
        tools_recommended: ["Google Keyword Planner", "SurferSEO", "MarketMuse", "Grammarly"],
        zero_click_impact: "Medium" // Good content can rank in snippets or provide direct answers
    },
    {
        id: "voice_search_seo",
        name: "Voice Search SEO",
        description: "Optimizing content and website structure to be found through voice assistants like Siri, Alexa, and Google Assistant. Often involves focusing on conversational keywords and FAQ-style content.",
        base_effort_hours_per_month_low: 2,
        base_effort_hours_per_month_medium: 5,
        base_effort_hours_per_month_high: 10,
        skill_required: "Intermediate",
        primary_benefits: ["Attract New Clients/Leads", "Brand Awareness", "Accessibility"],
        relevance_startup: "Medium",
        relevance_growth: "Medium",
        relevance_scale: "High",
        industry_priority: { "healthcare": "Medium", "legal": "Medium", "financial": "Low" }, // More relevant for quick info queries
        dependencies: ["content_seo", "local_seo", "featured_snippet_seo"],
        tools_recommended: ["AnswerThePublic", "Google Trends", "UberSuggest"],
        zero_click_impact: "High" // Voice answers are often direct and zero-click
    },
    {
        id: "semantic_seo",
        name: "Semantic SEO",
        description: "Focusing on the meaning and intent behind search queries, rather than just keywords. Involves creating comprehensive content around topics and entities, and building relationships between them.",
        base_effort_hours_per_month_low: 5,
        base_effort_hours_per_month_medium: 10,
        base_effort_hours_per_month_high: 18,
        skill_required: "Advanced", // Requires deeper SEO understanding
        primary_benefits: ["Trust & Authority", "Thought Leadership", "Improved Rankings for Broad Topics"],
        relevance_startup: "Low",
        relevance_growth: "Medium",
        relevance_scale: "High",
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" }, // Important for complex topics
        dependencies: ["content_seo"],
        tools_recommended: ["Google NLP API", "TextRazor", "WordLift", "Frase.io"],
        zero_click_impact: "Medium" // Contributes to overall content quality that can win snippets
    },
    {
        id: "user_intent_seo",
        name: "User Intent SEO",
        description: "Aligning content with the user's primary goal when they perform a search (informational, navigational, transactional, commercial). This is crucial for satisfying users and ranking well.",
        base_effort_hours_per_month_low: 3, // Analysis and tweaking existing content
        base_effort_hours_per_month_medium: 7,
        base_effort_hours_per_month_high: 14,
        skill_required: "Intermediate",
        primary_benefits: ["Attract New Clients/Leads", "Improved Conversion Rates", "Reduced Bounce Rates"],
        relevance_startup: "High",
        relevance_growth: "High",
        relevance_scale: "High",
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" }, // Fundamental to effective SEO
        dependencies: ["content_seo"],
        tools_recommended: ["Google Search Results Analysis", "Ahrefs Content Explorer", "User Surveys/Feedback"],
        zero_click_impact: "Low" // More about ranking the right content than direct zero-click features
    }
];

const MEDIA_TYPES_DATA = [
    {
        id: "blog_posts",
        name: "Blog Posts / Articles",
        description: "In-depth written content addressing specific user questions, topics, or keywords. Excellent for demonstrating expertise and driving organic traffic.",
        base_effort_hours_per_post: 6, // Includes research, writing, basic optimization
        skill_required: "Beginner", // Basic writing and SEO skills
        primary_benefits: ["Trust & Authority", "Attract New Clients/Leads", "Thought Leadership"],
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" },
        supports_seo_types: ["content_seo", "featured_snippet_seo", "semantic_seo", "user_intent_seo"] // IDs from SEO_TYPES_DATA
    },
    {
        id: "short_videos",
        name: "Short Explainer Videos (e.g., for Social Media, FAQs)",
        description: "Concise video content (typically 1-3 minutes) explaining a concept, answering a question, or showcasing a service. Good for engagement.",
        base_effort_hours_per_post: 8, // Includes scripting, simple recording, basic editing
        skill_required: "Intermediate", // Basic video editing skills
        primary_benefits: ["Brand Awareness", "Customer Engagement", "Attract New Clients/Leads"],
        industry_priority: { "healthcare": "Medium", "legal": "Medium", "financial": "Medium" },
        supports_seo_types: ["content_seo"] // Videos can be part of content strategy
    },
    {
        id: "case_studies",
        name: "Case Studies / Success Stories",
        description: "Detailed analysis of a specific project, client success, or problem-solving scenario, demonstrating capabilities and results.",
        base_effort_hours_per_post: 12, // Includes research, interviews, writing, design
        skill_required: "Intermediate",
        primary_benefits: ["Trust & Authority", "Attract New Clients/Leads", "Social Proof"],
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" }, // Very effective for B2B or high-consideration services
        supports_seo_types: ["content_seo"]
    }
];

const CHANNELS_DATA = [
    {
        id: "linkedin",
        name: "LinkedIn",
        description: "Professional networking platform ideal for B2B engagement, thought leadership, and connecting with industry peers.",
        base_effort_hours_per_month: 10, // For active posting, engagement, and networking
        skill_required: "Intermediate",
        primary_benefits: ["Trust & Authority", "Attract New Clients/Leads", "Networking", "Thought Leadership"],
        industry_priority: { "healthcare": "Medium", "legal": "High", "financial": "High" },
        best_for_media_types: ["blog_posts", "case_studies"] // IDs from MEDIA_TYPES_DATA
    },
    {
        id: "professional_blog",
        name: "Own Professional Blog (on website)",
        description: "A dedicated section on your website for publishing articles, insights, and updates. Central to content SEO and establishing authority.",
        base_effort_hours_per_month: 5, // Platform maintenance, strategy, promotion (effort for content creation is in MEDIA_TYPES_DATA)
        skill_required: "Beginner", // Basic CMS skills
        primary_benefits: ["Trust & Authority", "Attract New Clients/Leads", "Brand Awareness", "Thought Leadership"],
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" },
        best_for_media_types: ["blog_posts", "case_studies"]
    },
    {
        id: "google_business_profile",
        name: "Google Business Profile (GBP)",
        description: "Essential for local SEO, allowing businesses to manage their appearance on Google Search and Maps. Key for local client acquisition.",
        base_effort_hours_per_month: 4, // Regular updates, Q&A, review management
        skill_required: "Beginner",
        primary_benefits: ["Attract New Clients/Leads", "Local Visibility", "Customer Engagement"],
        industry_priority: { "healthcare": "High", "legal": "High", "financial": "High" }, // Critical for local service providers
        best_for_media_types: [] // Primarily a discovery channel, but can link to content
    }
];

// --- Define MAPPING Objects ---
const PHASE_MAPPING = {
    "startup": "relevance_startup",
    "growth": "relevance_growth",
    "scale": "relevance_scale"
};

const GOAL_MAPPING = {
    // Values from q3-goals checkboxes map to benefit strings used in the data objects
    "Trust & Authority": "Trust & Authority",
    "Brand Awareness": "Brand Awareness",
    "Attract New Clients/Leads": "Attract New Clients/Leads"
    // Add "Thought Leadership", "Customer Engagement" if they become selectable goals
};

const RESOURCE_MAPPING = {
    // User input values from q4-time and q5-budget
    // Map to effort requirement categories or score modifiers
    // This is a simplified example; can be more granular
    time: {
        "low": "low_effort_compatible",       // <10 hours
        "medium": "medium_effort_compatible",   // 10-20 hours
        "high": "high_effort_compatible",     // 20-40 hours
        "veryhigh": "very_high_effort_compatible" // 40+ hours
    },
    budget: {
        "none": "skill_beginner_preferred",  // ~$0 / DIY focus might imply preference for beginner-friendly, low-cost tools
        "low": "skill_beginner_intermediate_ok",    // <$100
        "medium": "skill_intermediate_advanced_ok", // $100-$500
        "high": "skill_advanced_ok"           // $500+
    },
    // We can also map skill_required from data to a numeric value for comparison
    skill_numeric: {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3
    }
};
