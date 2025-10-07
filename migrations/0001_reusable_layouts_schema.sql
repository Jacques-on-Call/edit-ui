-- migrations/0001_reusable_layouts_schema.sql

-- Drop existing tables to start fresh with the new architecture
DROP TABLE IF EXISTS layouts;
DROP TABLE IF EXISTS pages;

-- Create a table to define the master layout templates
CREATE TABLE layout_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- e.g., "Blog Post", "Service Page"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_version_id INTEGER -- Points to the latest version in layout_versions
);

-- Create a table to store the version history for each template
CREATE TABLE layout_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    json_content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES layout_templates(id) ON DELETE CASCADE
);

-- Re-create the 'pages' table to link to a layout template instead of a specific layout
CREATE TABLE pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    layout_template_id INTEGER, -- A page can optionally have a layout template
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (layout_template_id) REFERENCES layout_templates(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_templates_name ON layout_templates(name);
CREATE INDEX idx_versions_template_id ON layout_versions(template_id);
CREATE INDEX idx_pages_slug ON pages(slug);