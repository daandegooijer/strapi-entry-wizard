//@ts-nocheck
import OpenAI from 'openai';
import schemaMappingService from '../services/schemaMappingService';

const cache = new Map();

function extractRelevantSections(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/\s+/g, ' '); // Minimize whitespace
}

const systemPrompt = `
You are a Strapi 5 document parser that extracts and structures content into valid JSON.
Strictly return a JSON object matching the provided schema.

### **Rules for Structuring Data:**
- **H1 → \`title\` + \`slug\`** (Use the H1 text as the title and generate a slug from it).
- Identify where each image belongs based on the content.
- **Hero Section (\`hero\`)**
  - **If hero has an image field in its schema, assign the first extracted image as its value as \`hero.image\`**
  - The **first H1 before this image** should be \`hero.title\`.
  - Use a **short, catchy phrase** (max **10 words**) as \`hero.subtitle\`.
  - **If the section has longer text**, move it to \`flexContent\` instead.

- **Flex Content (\`flexContent\`)**
  - **Prefix components with \`content.\`**.
  - **H2 elements should be placed inside \`layout.heading\`** (inside a \`content.text\` / \`content.image-text\` component).
  - **Paragraph text must be placed inside \`layout.paragraph\`**.
  - If a section **only contains text**, use \`content.text\`.
  - If a section **contains both text and an image**, use \`content.image-text\`.
  - Ensure \`paragraph\` is **inside** the correct component.
  - If an image is **inside or next to a paragraph**, assign it to \`content.image-text\`.
  - If an image **is alone in a paragraph**, assign it to \`content.image\`.


- **Use \`{{image:fileName}}\` placeholders in the correct components for images**.

- **SEO**
  - Always generate a **\`seo\` object** with:
    - \`metaTitle\`: **Use the title**
    - \`metaDescription\`: **Summarize the page in maximum 125 characters.**
    - \`keywords\`: **Extract relevant keywords from the document.**

### **Rules for Formatting the Output:**
- **Do not return explanations.**
- **Always return a valid JSON object.**
- **If a field is missing, return \`null\` (not \`undefined\`).**
`;

const analyzeDocument = async (htmlContent, uid) => {
  try {
    const { attributes, components } = await schemaMappingService.getSchemaForUID(uid);

    const cleanedHTML = extractRelevantSections(htmlContent);
    const settings = strapi.config.get('plugin::entry-wizard');

    if (cache.has(cleanedHTML)) {
      return cache.get(cleanedHTML);
    }

    const openai = new OpenAI({
      apiKey: settings.apiKey || process.env.OPEN_AI_SECRET_KEY,
    });

    const response = await openai.chat.completions.create({
      model: settings.model || 'gpt-4-turbo',
      temperature: settings.temperature || 0.0,
      tools: [
        {
          type: 'function',
          function: {
            name: 'validate_strapi_data',
            description:
              'Validates and structures extracted document data according to Strapi 5 schema.',
            parameters: schemaMappingService.generateFunctionSchema(attributes, components),
          },
        },
      ],
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the document content:\n\n${cleanedHTML}` },
      ],
      tool_choice: { type: 'function', function: { name: 'validate_strapi_data' } }, // ✅ Forces OpenAI to use function_call
    });

    const parsedJSON: any = parseOpenAIResponse(response);

    cache.set(cleanedHTML, parsedJSON);

    return parsedJSON;
  } catch (error) {
    console.error('❌ OpenAI Processing Error:', error);
    throw new Error('Failed to analyze document.');
  }
};

const parseOpenAIResponse = (openAIResponse) => {
  try {
    const toolCalls = openAIResponse.choices[0]?.message?.tool_calls || [];
    const functionCall = toolCalls.find((tc) => tc.function.name === 'validate_strapi_data');

    if (!functionCall) {
      throw new Error('❌ No valid function call found in OpenAI response.');
    }

    const entryData = JSON.parse(functionCall.function.arguments);

    if (!entryData.title || !entryData.slug || !entryData.flexContent) {
      throw new Error('❌ Missing required fields in OpenAI response.');
    }

    return entryData;
  } catch (error) {
    console.error('❌ Error Creating Entry from OpenAI Response:', error);
    throw new Error(`Entry creation failed: ${error.message}`);
  }
};

export default {
  analyzeDocument,
};
