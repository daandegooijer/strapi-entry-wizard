import openaiService from '../services/openaiService';
import schemaMappingService from '../services/schemaMappingService';
import extractTextFromDocx from '../services/extractTextFromDocx';
import imageService from '../services/imageService';

const cleanEntryData = (entryData, attributes) => {
  if (entryData.seo?.keywords && Array.isArray(entryData.seo.keywords)) {
    entryData.seo.keywords = entryData.seo.keywords.join(', ');
  }

  Object.entries(attributes).forEach(([key, value]: [string, any]) => {
    if (value.type === 'dynamiczone') {
      if (entryData[key] && !Array.isArray(entryData[key])) {
        console.warn(`⚠️ Warning: Dynamic zone '${key}' is not an array. Converting.`);
        entryData[key] = [entryData[key]];
      }

      if (Array.isArray(entryData[key])) {
        entryData[key] = entryData[key].map((item) => {
          if (!item.__component) {
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

const sanitizeDataForEntry = (data) => {
  const clonedData = JSON.parse(JSON.stringify(data)); // ✅ Deep clone

  const traverse = (obj) => {
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('{{image:')) {
          obj[key] = null; // ✅ Set image fields to null before entry creation
        } else {
          traverse(value);
        }
      });
    }
  };

  traverse(clonedData);
  return clonedData;
};

export default {
  async analyzeAndCreate(ctx) {
    const { file } = ctx.request.files;
    const { uid } = ctx.request.body;

    if (!file || !uid) {
      ctx.throw(400, 'No document uploaded or UID missing');
    }

    const filePath = file.filepath;

    if (
      file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      ctx.throw(400, 'Unsupported file type');
    }
    const settings: any = strapi.config.get('plugin::entry-wizard');
    const { text, images } = await extractTextFromDocx.extractTextFromDocx(filePath);

    try {
      let extractedData = await openaiService.analyzeDocument(text, uid);

      if (!extractedData) {
        ctx.throw(400, 'Failed to analyze document');
      }

      const { attributes } = await schemaMappingService.getSchemaForUID(uid);

      extractedData = cleanEntryData(extractedData, attributes);
      const sanitizedData = sanitizeDataForEntry(extractedData);
      const uploadedImages = imageService.mapImagesToComponents(extractedData, images);
      const newEntry = await strapi.documents(uid).create({ data: sanitizedData });

      const populatedEntry = await strapi
        .documents(uid)
        .findOne({ documentId: newEntry.documentId, populate: '*' });

      if (!newEntry) {
        ctx.throw(400, 'Failed to create entry');
      }

      await imageService.processImagesAndReplace(
        populatedEntry,
        uploadedImages,
        settings.strapiToken
      );

      ctx.send({ message: 'Entry created successfully!', populatedEntry });
    } catch (error) {
      ctx.throw(500, 'Error analyzing document and creating entry', JSON.stringify(error));
    }
  },
};
