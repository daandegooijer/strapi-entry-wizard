import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, Icon, Flex } from '@strapi/design-system';
import { Upload } from '@strapi/icons';

const CustomDropzone = ({ onUpload, disabled }: { onUpload: any; disabled: boolean }) => {
  const [file, setFile] = useState<any>(null);

  const onDrop = useCallback(
    (acceptedFiles: any) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  return (
    <Box
      padding={4}
      borderStyle="dashed"
      borderColor={isDragActive ? 'primary600' : 'neutral300'}
      borderRadius="lg"
      textAlign="center"
      disabled={disabled}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <Flex direction="column" alignItems="center">
        <Upload />
        <Typography variant="epsilon">
          {file ? file.name : 'Drag & Drop a document or click to browse'}
        </Typography>
      </Flex>
    </Box>
  );
};

export default CustomDropzone;
