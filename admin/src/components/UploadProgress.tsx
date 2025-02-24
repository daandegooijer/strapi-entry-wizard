import React, { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Typography, Flex, Box } from '@strapi/design-system';

type ProgressCondition = (progress: number) => boolean; // Type for condition function
type ProgressMessage = string | ((progress: number) => string); // Type for message

//@ts-ignore
const progressMessages: Map<ProgressCondition, ProgressMessage> = new Map([
  [(p) => p === 5, 'Uploading document...'],
  [(p) => p > 5 && p < 80, 'Analyzing and generating'],
  [(p) => p >= 80 && p < 90, (p) => `${p}%`],
  [(p) => p >= 90 && p < 100, 'Finalizing...'],
  [(p) => p >= 100, 'Complete!'],
]);

const getProgressMessage = (progress: number): string => {
  for (const [condition, message] of progressMessages) {
    if (condition(progress)) {
      return typeof message === 'function' ? message(progress) : message;
    }
  }
  return '';
};

const UploadProgressCircular = ({
  isUploading,
  uploadComplete,
}: {
  isUploading: boolean;
  uploadComplete: boolean;
}) => {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    if (isUploading && !uploadComplete) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev)); // Stop at 90%
      }, 2500);

      return () => clearInterval(interval);
    } else if (uploadComplete) {
      setProgress(100); // Jump to 100% when done
    }
  }, [isUploading, uploadComplete]);

  return (
    <Flex direction="column" alignItems="center" padding={4} position="relative" gap={4}>
      <Box position="relative" width="100px" height="100px">
        {/* Background Circle */}
        <CircularProgress
          variant="determinate"
          value={100} // Always full
          size={100}
          thickness={6}
          sx={{ color: '#e0e0e0', position: 'absolute', top: 0, left: 0 }} // Light gray background
        />

        {/* Foreground Progress Circle */}
        <CircularProgress
          variant="determinate"
          value={progress}
          size={100}
          thickness={6}
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
        {/* Centered Percentage Text */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
        >
          <Typography variant="beta" fontWeight="bold" style={{ margin: '0 auto' }}>
            {progress}%
          </Typography>
        </Box>
      </Box>

      {/* Progress Message Below the Circle */}
      <Typography variant="sigma">{getProgressMessage(progress)}</Typography>
    </Flex>
  );
};

export default UploadProgressCircular;
