//@ts-nocheck
const validOpenAITypes = new Set(['dynamiczone', 'string', 'boolean', 'number', 'object', 'array']); // ✅ OpenAI JSON Schema valid types

const fixAttributeTypes = (attributes) => {
  const fixedAttributes = {};

  Object.entries(attributes).forEach(([key, value]) => {
    if (!value.type) {
      return;
    }

    let fieldType = value.type;

    // ✅ Convert unsupported types to "string"
    if (!validOpenAITypes.has(fieldType)) {
      console.warn(
        `⚠️ Warning: Type "${fieldType}" for "${key}" is not valid in OpenAI. Converting to "string".`
      );
      fieldType = 'string';
    }

    // ✅ Assign the corrected fieldType back to the attribute
    fixedAttributes[key] = { ...value, type: fieldType };
  });

  return fixedAttributes;
};

const generateComponentSchema = (componentName, components) => {
  if (!componentName) {
    console.error(`❌ Error: componentName is undefined.`);
    return { type: 'object', properties: {}, required: [] };
  }

  const component = components[componentName];

  if (!component) {
    console.error(`❌ Error: Component "${componentName}" not found in components list.`);
    return { type: 'object', properties: {}, required: [] };
  }

  console.log(`✅ Processing Component: "${componentName}"`);

  const schema = { type: 'object', properties: {}, required: [] };

  Object.entries(component).forEach(([key, value]) => {
    let fieldType = value.type;

    // ✅ If the type is not valid in OpenAI, default to "string"
    if (!validOpenAITypes.has(fieldType)) {
      console.warn(
        `⚠️ Warning: Type "${fieldType}" for "${key}" is not valid in OpenAI. Falling back to "string".`
      );
      fieldType = 'string';
    }

    if (value.type === 'component') {
      // ✅ Recursively process nested components
      schema.properties[key] = value.repeatable
        ? { type: 'array', items: generateComponentSchema(value.component, components) }
        : generateComponentSchema(value.component, components);
    } else if (value.type === 'dynamiczone') {
      // ✅ Handle Dynamic Zones
      schema.properties[key] = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            __component: { type: 'string', description: 'Component Identifier' },
          },
        },
      };

      value.components.forEach((nestedComponent) => {
        const nestedSchema = generateComponentSchema(nestedComponent, components);
        schema.properties[key].items.properties = {
          ...schema.properties[key].items.properties,
          ...nestedSchema.properties,
        };
      });
    } else if (value.type === 'media') {
      // ✅ Handle media fields
      schema.properties[key] = {
        type: value.multiple ? 'array' : 'string',
        description: 'Media file URL',
      };
    } else if (value.type === 'enumeration') {
      // ✅ Handle enumerations
      schema.properties[key] = {
        type: 'string',
        enum: value.enum,
        default: value.default,
      };
    } else {
      // ✅ Assign validated type (or fallback to "string")
      schema.properties[key] = { type: fieldType, description: `Field: ${key}` };
    }

    // ✅ Add required fields
    if (value.required) schema.required.push(key);
  });

  return schema;
};

const generateFunctionSchema = (attributes, components) => {
  const functionSchema = {
    type: 'object',
    properties: {},
    required: [],
  };

  Object.entries(attributes).forEach(([key, value]) => {
    let fieldType = value.type;

    // ✅ Convert unsupported types to "string"
    if (!validOpenAITypes.has(fieldType)) {
      console.warn(
        `⚠️ Warning: Type "${fieldType}" for "${key}" is not valid in OpenAI. Converting to "string".`
      );
      fieldType = 'string';
    }

    if (key === 'seo') {
      functionSchema.properties[key] = {
        type: 'object',
        properties: {
          metaTitle: { type: 'string', description: 'SEO title' },
          metaDescription: { type: 'string', description: 'SEO description' },
          keywords: { type: 'array', items: { type: 'string' }, description: 'SEO keywords' },
        },
        required: ['metaTitle', 'metaDescription'],
      };
    } else if (key === 'hero') {
      functionSchema.properties[key] = {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Hero title (from first H1 before hero image)' },
          subtitle: { type: 'string', description: 'Hero subtitle (short phrase, max 10 words)' },
          image: { type: ['string', 'null'], description: 'Hero image URL or null' },
          text: { type: 'string', description: 'A short, catchy phrase summarizing the page' },
        },
        required: ['title', 'subtitle', 'text'],
      };
    } else if (key === 'flexContent') {
      functionSchema.properties[key] = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            __component: {
              type: 'string',
              description:
                "Component type. Use 'content.text' for text-only sections, and 'content.image-text' for paragraph sections that include images. use 'content.image' for only images inside a paragraph",
            },
            image: { type: ['string', 'null'], description: 'image URL or null' },
            paragraph: {
              type: 'object',
              properties: {
                heading: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'H2 heading inside content.text' },
                    type: {
                      type: 'string',
                      enum: ['h1', 'h2', 'h3', 'h4'],
                      description: 'Heading type',
                    },
                  },
                  required: ['title', 'type'],
                },
                text: { type: 'string', description: 'Paragraph text inside content.text' },
                buttons: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string', description: 'Button label' },
                      url: { type: 'string', description: 'Button URL' },
                    },
                    required: ['label', 'url'],
                  },
                },
              },
              required: ['heading', 'text'],
            },
            hasBackground: { type: 'boolean', description: 'Background flag', default: false },
            isColumnView: { type: 'boolean', description: 'Column layout flag', default: false },
          },
          required: ['__component', 'paragraph'],
        },
      };
    } else {
      functionSchema.properties[key] = { type: 'string', description: `Field: ${key}` };
    }
    functionSchema.required.push(key);
  });

  return functionSchema;
};

const getSchemaForUID = async (uid) => {
  const schema = strapi.contentTypes[uid];

  if (!schema) {
    throw new Error(`❌ Schema for UID ${uid} not found`);
  }

  // ✅ Extract only relevant attributes (to avoid unnecessary fields)
  const allowedFields = ['title', 'slug', 'seo', 'hero', 'flexContent'];
  const filteredAttributes = {};

  for (const [key, value] of Object.entries(schema.attributes)) {
    if (allowedFields.includes(key)) {
      if (value.type === 'dynamiczone') {
        filteredAttributes[key] = {
          type: 'dynamiczone',
          repeatable: value.repeatable || false,
          components: value.components || [],
        };
      } else {
        filteredAttributes[key] = value; // Keep other attributes unchanged
      }
    }
  }

  // ✅ Get all components from Dynamic Zones
  const allComponentUids = new Set();

  const extractComponents = (attributes) => {
    for (const [key, value] of Object.entries(attributes)) {
      if (value.type === 'dynamiczone' && value.components) {
        value.components.forEach((component) => allComponentUids.add(component));
      } else if (value.type === 'component') {
        allComponentUids.add(value.component);
      }
    }
  };

  extractComponents(filteredAttributes); // Extract from main schema

  // ✅ Fetch all component schemas dynamically
  const componentSchemas = {};
  const processedComponents = new Set(); // Avoid processing the same component multiple times

  const fetchComponentSchema = (uid) => {
    if (!uid || processedComponents.has(uid)) return;
    processedComponents.add(uid);

    const component = strapi.components[uid];
    if (component) {
      componentSchemas[uid] = component.attributes;
      extractComponents(component.attributes); // Recursively fetch nested components
    } else {
      console.warn(`⚠️ Warning: Component "${uid}" not found in Strapi.components.`);
    }
  };

  allComponentUids.forEach(fetchComponentSchema);

  return { attributes: fixAttributeTypes(filteredAttributes), components: componentSchemas };
};

export default {
  getSchemaForUID,
  generateFunctionSchema,
};
