import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export default {
  async extractTextFromDocx(filePath: string) {
    const extractedImages = [];
    let imageIndex = 1;
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
      convertImage: mammoth.images.imgElement(async (image: any) => {
        const fileExtension = image.contentType.split('/')[1]; // Extract 'png' or 'jpg'
        const fileName = `image${imageIndex++}.${fileExtension}`;
        const imagePath = path.join('/tmp', fileName);

        const imageBuffer = await image.read('base64'); // Read as Base64 string
        const buffer = Buffer.from(imageBuffer, 'base64'); // Convert to Buffer

        await fs.promises.writeFile(imagePath, buffer); // Save file to disk
        extractedImages.push({ filePath: imagePath, fileName });

        return { src: `{{image:${fileName}}}` };
      }),
    };

    try {
      const result = await mammoth.convertToHtml({ path: filePath }, options);
      return { text: result.value, images: extractedImages };
    } catch (error) {
      console.error('Error extracting text from .docx:', error);
      throw new Error('Failed to extract text from .docx');
    }
  },
};
