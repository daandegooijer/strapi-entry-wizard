import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

function collectFontSizes(doc) {
  const fontSizes = [];

  function traverse(element) {
    if (element.children) {
      element.children.forEach(traverse);
    }
    if (element.type === 'run' && element.fontSize) {
      fontSizes.push(element.fontSize);
    }
  }

  traverse(doc);

  return fontSizes.length ? fontSizes : [12]; // Default fallback to 12pt if no fonts are found
}

function adjustImagePlacement(html) {
  console.log('🔍 Original HTML:\n', html); // Debugging: Log the entire input

  const regex = /<h2>\s*<img\s+([^>]*?)src="([^"]+)"([^>]*?)>\s*<\/h2>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    console.log('\n✅ Match found:', match[0]); // Logs the full match
    console.log('   🖼️ Image src:', match[2]); // Extracted src
    console.log('   ✍️ Alt text:', match[1].match(/alt="(.*?)"/) || match[3].match(/alt="(.*?)"/));
  }

  const updatedHtml = html.replace(regex, (match, beforeSrc, src, afterSrc) => {
    // Extract alt attribute if available
    const altMatch = beforeSrc.match(/alt="(.*?)"/) || afterSrc.match(/alt="(.*?)"/);
    const altText = altMatch ? altMatch[1] : '';

    return `<p><img src="${src}" alt="${altText}" /></p>`;
  });

  return updatedHtml;
}

function transformParagraph(element, minFontSize) {
  if (!element.children) return element;

  const fontSizes = element.children
    .filter((child) => child.type === 'run' && child.fontSize)
    .map((child) => child.fontSize);

  const maxFontSize = fontSizes.length ? Math.max(...fontSizes) : null;

  // Define heading threshold (e.g., 1.5x the min font size)
  const isHeading = maxFontSize && maxFontSize > minFontSize;

  if (isHeading) {
    element.styleId = 'Heading2';
  }

  return element;
}

function transformDocument(doc) {
  console.log('📊 Extracting font sizes...');
  const fontSizes = collectFontSizes(doc);
  const minFontSize = Math.min(...fontSizes); // Smallest font = normal text

  console.log('Largest font:', Math.max(...fontSizes), 'pt');
  console.log(`✅ Smallest font detected: ${minFontSize}pt`);

  // Apply transformation
  function traverseAndTransform(element) {
    if (element.type === 'paragraph') {
      transformParagraph(element, minFontSize);
    }
    if (element.children) {
      element.children.forEach(traverseAndTransform);
    }
  }

  traverseAndTransform(doc);
  return doc;
}

export default {
  async extractTextFromDocx(filePath: string) {
    try {
      console.log(`📂 Processing file: ${filePath}`);
      let imageIndex = 1; // Counter for image filenames
      const extractedImages = []; // Store extracted image info

      const options = {
        transformDocument: transformDocument,
        convertImage: mammoth.images.imgElement(async (image) => {
          const fileName = `image${imageIndex++}.${image.contentType.split('/')[1]}`;
          const imagePath = path.join('/tmp', fileName);
          const imageBuffer = Buffer.from(await image.read('base64'), 'base64');

          await fs.promises.writeFile(imagePath, imageBuffer);
          extractedImages.push({ filePath: imagePath, fileName });

          return { src: `{{image:${fileName}}}` }; // Placeholder for AI
        }),
      };

      const { value: extractedText } = await mammoth.convertToHtml({ path: filePath }, options);
      const cleanedHtml = adjustImagePlacement(extractedText);

      return { text: cleanedHtml, images: extractedImages };
    } catch (error) {
      console.error('❌ Error extracting text & images:', error);
      throw new Error('Failed to extract text & images from DOCX');
    }
  },
};
