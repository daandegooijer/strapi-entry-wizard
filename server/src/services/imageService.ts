import fs from 'fs';
import sharp from 'sharp';
import { FormData } from 'formdata-node';
import { Blob } from 'buffer';
import path from 'path';

const processAndSaveImage = async (filePath, fileName) => {
  try {
    const fileType = await import('file-type');
    const type = await fileType.fileTypeFromFile(filePath);
    if (!type || !type.mime.startsWith('image/')) {
      console.warn(`⚠️ Skipping: ${fileName} is not a valid image (${type?.mime || 'unknown'})`);
      return null; // Return null for invalid images
    }

    const webpFileName = fileName.replace(/\.[^.]+$/, '.webp'); // Replace extension with .webp
    const webpFilePath = path.join(path.dirname(filePath), webpFileName);

    await sharp(filePath).webp({ quality: 75 }).toFile(webpFilePath);

    // ✅ Get file size after conversion
    const stats = await fs.promises.stat(webpFilePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`📏 Converted file size: ${fileSizeInMB.toFixed(2)} MB`);

    return webpFilePath;
  } catch (error) {
    console.error('❌ Error processing image:', error);
    throw new Error('Image processing failed');
  }
};

export default {
  async processImagesAndReplace(newEntry: any, uploadedImages: any, token: string) {
    for (const { fileName, field, component, index } of uploadedImages) {
      const componentInstance =
        Array.isArray(newEntry[field]) && typeof index === 'number'
          ? newEntry[field][index]
          : newEntry[field];

      if (!componentInstance) {
        console.warn(`⚠️ No matching component for ${fileName} in ${field}`);
        continue;
      }

      const filePath = `/tmp/${fileName}`;

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const processedFilePath = await processAndSaveImage(filePath, fileName);
      const fileBuffer = await fs.promises.readFile(processedFilePath); // Read file as a Buffer
      const fileBlob = new Blob([fileBuffer], { type: 'image/webp' });
      const form = new FormData();
      form.append('files', fileBlob, fileName);
      form.append('ref', componentInstance.__component); // Component name (e.g., "hero.image")
      form.append('refId', componentInstance.id); // Component instance ID
      form.append('field', 'image'); // Field inside the component

      await this.uploadToStrapi(form, token);
    }
  },

  async uploadToStrapi(form: any, token: string) {
    return await fetch(`${strapi.config.server.url}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      //@ts-ignore
      body: form,
    });
  },

  mapImagesToComponents(extractedData: any, images: any) {
    const uploadedImages = [];
    try {
      let imageIndex = 0;

      if (extractedData.hero[0]?.image) {
        uploadedImages.push({
          fileName: images[imageIndex].fileName,
          field: 'hero',
          component: 'hero.image',
          index: 0,
        });
        imageIndex++;
      }

      if (imageIndex >= images.length) {
        return uploadedImages;
      }

      extractedData.flexContent.forEach((item, flexIndex) => {
        if (imageIndex >= images.length) return; // Stop if no images left

        if (item.image && item.image.includes('{{image:')) {
          uploadedImages.push({
            fileName: images[imageIndex].fileName,
            field: 'flexContent',
            component: item.__component,
            index: flexIndex,
          });
          imageIndex++;
        }
      });

      return uploadedImages;
    } catch (error) {
      throw new Error(`Failed to map images to components ${JSON.stringify(error)}`);
    }
  },
};
