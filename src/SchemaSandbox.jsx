import React, { useState } from 'react';
import styles from './SchemaSandbox.module.css';
import { getSchemaTemplate } from '../utils/schemaTemplates';

const ALL_SCHEMAS = [
  "Article", "FAQPage", "HowTo", "BreadcrumbList", "Product", "Review",
  "LocalBusiness", "Event", "Person", "Organization", "VideoObject", "Service",
  "JobPosting", "Recipe", "QAPage", "Speakable", "Dataset", "GeoCoordinates",
  "ServiceArea", "PriceRange", "OpeningHoursSpecification", "Offer",
  "CallToAction", "ImageObject", "Logo"
];

function SchemaSandbox({ manualSchemas = [], onUpdate }) {
  const [selectedSchema, setSelectedSchema] = useState(ALL_SCHEMAS[0]);
  const [error, setError] = useState(null);

  const handleAddSchema = () => {
    const newSchema = {
      id: `manual-${Date.now()}`, // Unique ID for React key and removal
      ...getSchemaTemplate(selectedSchema)
    };
    onUpdate([...manualSchemas, newSchema]);
  };

  const handleRemoveSchema = (idToRemove) => {
    onUpdate(manualSchemas.filter(schema => schema.id !== idToRemove));
  };

  const handleSchemaChange = (id, value) => {
    try {
      const parsedValue = JSON.parse(value);
      const updatedSchemas = manualSchemas.map(schema =>
        schema.id === id ? { ...parsedValue, id: schema.id } : schema
      );
      onUpdate(updatedSchemas);
      setError(null);
    } catch (e) {
      setError(`Invalid JSON for schema ${id}.`);
      // Optionally, you could still update the string value in state to allow fixing it
    }
  };

  return (
    <div className={styles.sandboxContainer}>
      <div className={styles.controls}>
        <select
          value={selectedSchema}
          onChange={(e) => setSelectedSchema(e.target.value)}
          className={styles.schemaSelect}
        >
          {ALL_SCHEMAS.map(schema => (
            <option key={schema} value={schema}>{schema}</option>
          ))}
        </select>
        <button onClick={handleAddSchema} className={styles.addButton}>
          Add Schema
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.activeSchemasList}>
        {manualSchemas.length === 0 ? (
          <p>Manually added schemas will appear here for editing.</p>
        ) : (
          manualSchemas.map((schema) => (
            <div key={schema.id} className={styles.schemaEditor}>
              <div className={styles.schemaEditorHeader}>
                <strong>{schema['@type']}</strong>
                <button onClick={() => handleRemoveSchema(schema.id)} className={styles.removeButton}>
                  Remove
                </button>
              </div>
              <textarea
                className={styles.jsonTextarea}
                value={JSON.stringify(schema, (key, value) => key === 'id' ? undefined : value, 2)}
                onChange={(e) => handleSchemaChange(schema.id, e.target.value)}
                rows="10"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SchemaSandbox;
