// Note: Node IDs are short, random-looking strings.
const blogPostTemplate = {
  name: 'Blog Post',
  json: JSON.stringify({
    "ROOT": {
      "type": { "resolvedName": "Page" },
      "isCanvas": true, "props": {}, "displayName": "Page", "custom": {}, "hidden": false,
      "nodes": ["Abc123DEF", "Ghi456JKL", "Mno789PQR"],
      "linkedNodes": {}
    },
    "Abc123DEF": {
      "type": { "resolvedName": "EditorHero" }, "isCanvas": false,
      "props": {
        "title": "Your Compelling Blog Post Title",
        "subtitle": "A brief, engaging summary of what this article is about.",
        "style": { "paddingTop": "80px", "paddingBottom": "80px", "backgroundColor": "#f7fafc" }
      },
      "displayName": "Hero", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
    },
    "Ghi456JKL": {
        "type": { "resolvedName": "EditorSection" }, "isCanvas": true,
        "props": {
            "content": "<h2>Section Heading</h2><p>This is where the main body of your blog post will go. You can add text, images, and lists here to craft your message.</p>",
            "style": { "padding": "40px" }
        },
        "displayName": "Section", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
    },
    "Mno789PQR": {
        "type": { "resolvedName": "EditorFooter" }, "isCanvas": false,
        "props": { "text": "© 2025 Your Company. All rights reserved." },
        "displayName": "Footer", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
    }
  })
};

const servicePageTemplate = {
  name: 'Service Page',
  json: JSON.stringify({
    "ROOT": {
      "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {}, "displayName": "Page", "custom": {}, "hidden": false,
      "nodes": ["StUvWxYz1", "BcDeFgHi2", "JkLmNoPq3", "RsTuVwXy4"],
      "linkedNodes": {}
    },
    "StUvWxYz1": {
      "type": { "resolvedName": "EditorHero" }, "isCanvas": false,
      "props": {
        "title": "Describe Your Amazing Service",
        "subtitle": "Explain the value you provide and why it matters to your customers.",
        "style": { "paddingTop": "80px", "paddingBottom": "80px", "backgroundColor": "#ffffff" }
      },
      "displayName": "Hero", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
    },
    "BcDeFgHi2": {
        "type": { "resolvedName": "EditorFeatureGrid" }, "isCanvas": false, "props": {},
        "displayName": "Feature Grid", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
    },
    "JkLmNoPq3": {
        "type": { "resolvedName": "EditorCTA" }, "isCanvas": false, "props": {},
        "displayName": "Call to Action", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
    },
    "RsTuVwXy4": {
        "type": { "resolvedName": "EditorFooter" }, "isCanvas": false,
        "props": { "text": "© 2025 Your Company. All rights reserved." },
        "displayName": "Footer", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
    }
  })
};

const contactPageTemplate = {
    name: 'Contact Page',
    json: JSON.stringify({
      "ROOT": {
        "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {}, "displayName": "Page", "custom": {}, "hidden": false,
        "nodes": ["Zyxwvutsr", "Qponmlkji", "Hgfedcba9"],
        "linkedNodes": {}
      },
      "Zyxwvutsr": {
        "type": { "resolvedName": "EditorHero" }, "isCanvas": false,
        "props": {
          "title": "Get In Touch",
          "subtitle": "We'd love to hear from you. Here's how you can reach us.",
          "style": { "paddingTop": "80px", "paddingBottom": "80px", "backgroundColor": "#f7fafc" }
        },
        "displayName": "Hero", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
      },
      "Qponmlkji": {
          "type": { "resolvedName": "EditorSection" }, "isCanvas": true,
          "props": {
              "content": "<h2>Contact Form</h2><p>Placeholder for your contact form integration.</p><h2>Our Location</h2><p>123 Main Street, Anytown, USA 12345</p>",
              "style": { "padding": "40px" }
          },
          "displayName": "Section", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
      },
      "Hgfedcba9": {
          "type": { "resolvedName": "EditorFooter" }, "isCanvas": false,
          "props": { "text": "© 2025 Your Company. All rights reserved." },
          "displayName": "Footer", "custom": {}, "hidden": false, "nodes": [], "parent": "ROOT"
      }
    })
};

export const starterTemplates = [
  blogPostTemplate,
  servicePageTemplate,
  contactPageTemplate,
];