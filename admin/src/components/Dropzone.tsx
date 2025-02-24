import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Flex } from '@strapi/design-system';
import { Upload } from '@strapi/icons';

const CustomDropzone = ({
  onUpload,
  disabled,
}: {
  onUpload: (files: File[]) => void;
  disabled: boolean;
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFiles(acceptedFiles);
        onUpload(acceptedFiles);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 5, // ✅ Allow multiple files
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
          {files.length > 0
            ? `${files.length} file(s) selected`
            : 'Drag & Drop files or click to browse'}
        </Typography>
      </Flex>
    </Box>
  );
};

export default CustomDropzone;
