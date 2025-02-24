import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { Typography, Flex, Box } from '@strapi/design-system';

const progressMessages: { [key: number]: string } = {
  0: 'Pending',
  5: 'Uploading document...',
  50: 'Processing...',
  90: 'Finalizing...',
  100: 'Complete!',
};

const getProgressMessage = (progress: number): string => {
  return progressMessages[
    Number(
      Object.keys(progressMessages)
        .reverse()
        .find((key) => progress >= Number(key)) || 5
    )
  ];
};

const UploadProgressLinear = ({ fileName, progress }: { fileName: string; progress: number }) => {
  return (
    <Box padding={2} width="100%">
      <Typography variant="epsilon">{fileName}</Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 6, borderRadius: 3, marginTop: 1 }}
      />
      <Typography variant="sigma" style={{ marginTop: 4 }}>
        {getProgressMessage(progress)}
      </Typography>
    </Box>
  );
};

export default UploadProgressLinear;
