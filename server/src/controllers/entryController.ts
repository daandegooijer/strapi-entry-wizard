import openaiService from '../services/openaiService';
import mammoth from 'mammoth';
import schemaMappingService from '../services/schemaMappingService';

const cleanEntryData = (entryData, attributes) => {
  if (entryData.seo?.keywords && Array.isArray(entryData.seo.keywords)) {
    entryData.seo.keywords = entryData.seo.keywords.join(', ');
  }

  // ✅ Loop through attributes to find dynamic zones
  Object.entries(attributes).forEach(([key, value]: [string, any]) => {
    if (value.type === 'dynamiczone') {
      // Ensure the field exists and is an array
      if (entryData[key] && !Array.isArray(entryData[key])) {
        console.warn(`⚠️ Warning: Dynamic zone '${key}' is not an array. Converting.`);
        entryData[key] = [entryData[key]]; // Convert to array
      }

      // ✅ Ensure all dynamic zone entries have a `__component`
      if (Array.isArray(entryData[key])) {
        entryData[key] = entryData[key].map((item) => {
          if (!item.__component) {
            // ✅ Get first available component from schema
            const defaultComponent = value.components?.[0] || 'content.text';
            console.warn(
              `⚠️ Warning: '${key}' entry missing __component. Setting to '${defaultComponent}'.`
            );
            item.__component = defaultComponent;
          }
          return item;
        });
      }
    }
  });

  return entryData;
};

const extractTextFromDocx = async (filePath: string) => {
  const options = {
    styleMap: [
      'p[style-name="Heading 1"] => h1:fresh',
      'p[style-name="Heading 2"] => h2:fresh',
      'p[style-name="Heading 3"] => h3:fresh',
      'b => strong',
      'i => em',
      'p[style-name="Block Quote"] => blockquote:fresh',
      'p[style-name="List Paragraph"] => li:fresh',
    ],
    includeEmbeddedStyleMap: true,
    convertImage: mammoth.images.imgElement((image) => {
      return image.read('base64').then((encoded) => {
        return { src: `data:${image.contentType};base64,${encoded}` };
      });
    }),
  };

  try {
    const result = await mammoth.convertToHtml({ path: filePath }, options);
    return result.value; // Returns structured HTML content
  } catch (error) {
    console.error('Error extracting text from .docx:', error);
    throw new Error('Failed to extract text from .docx');
  }
};

export default {
  async analyzeAndCreate(ctx) {
    const { file } = ctx.request.files;
    const { uid } = ctx.request.body; // Get UID from request

    if (!file || !uid) {
      ctx.throw(400, 'No document uploaded or UID missing');
    }

    const filePath = file.filepath;
    let text = '';

    if (
      file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      ctx.throw(400, 'Unsupported file type');
    }
    // Extract text from document

    text = await extractTextFromDocx(filePath);
    const { attributes } = await schemaMappingService.getSchemaForUID(uid);

    console.log(attributes);
    return;
    try {
      // Analyze document with OpenAI
      let extractedData = await openaiService.analyzeDocument(text, uid);

      if (!extractedData) {
        ctx.throw(400, 'Failed to analyze document');
      }

      const { attributes } = await schemaMappingService.getSchemaForUID(uid);
      extractedData = cleanEntryData(extractedData, attributes); // ✅ Clean and fix data before saving

      console.dir(extractedData, { depth: null });

      const newEntry = await strapi.documents(uid).create({ data: extractedData });

      if (!newEntry) {
        ctx.throw(400, 'Failed to create entry');
      }

      ctx.send({ newEntry });
    } catch (error) {
      ctx.throw(500, 'Error analyzing document and creating entry', JSON.stringify(error));
    }
  },
};
