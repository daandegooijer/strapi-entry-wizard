// import React, { useEffect, useState } from 'react';
// import {
//   Modal,
//   Button,
//   Box,
//   LinkButton,
//   Flex,
//   Typography,
//   ProgressBar,
// } from '@strapi/design-system';
// import {
//   useNotification,
//   unstable_useContentManagerContext as useContentManagerContext,
//   useAuth,
// } from '@strapi/strapi/admin';
// import { Magic } from '@strapi/icons';
// import CustomDropzone from './Dropzone';
//
// const DropzoneModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: Function }) => {
//   const [file, setFile] = useState(null);
//   const { model } = useContentManagerContext(); // Get the current UID
//   const token = useAuth('Admin', (state) => state.token);
//   const [isLoading, setIsLoading] = useState(false);
//   const [progress, setProgress] = useState(0); // Track progress percentage
//
//   useEffect(() => {
//     if (!file) {
//       return;
//     }
//
//     handleUpload();
//   }, [file]);
//
//   const handleUpload = async () => {
//     if (!file || !model) {
//       console.error('No file or UID provided');
//       return;
//     }
//
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('uid', model);
//
//     setIsLoading(true);
//     setProgress(10);
//
//     try {
//       const xhr = new XMLHttpRequest();
//
//       xhr.upload.onprogress = (event) => {
//         if (event.lengthComputable) {
//           const percent = Math.round((event.loaded / event.total) * 50); // Cap at 50%
//           setProgress(percent);
//         }
//       };
//
//       xhr.onload = async () => {
//         if (xhr.status === 200) {
//           setProgress(75); // Midway after file upload
//           const result = JSON.parse(xhr.responseText);
//           console.log('New Entry Created:', result.newEntry);
//           setProgress(100);
//           setTimeout(() => {
//             setIsLoading(false);
//             setProgress(0);
//             onClose();
//           }, 1000);
//         } else {
//           throw new Error(`Upload failed: ${xhr.statusText}`);
//         }
//       };
//
//       xhr.onerror = () => {
//         console.error('Error uploading file');
//         setIsLoading(false);
//         setProgress(0);
//       };
//
//       xhr.open('POST', '/entry-wizard/analyze-document', true);
//       xhr.setRequestHeader('Authorization', `Bearer ${token}`);
//       xhr.send(formData);
//     } catch (error) {
//       console.error('Error uploading file:', error);
//       setIsLoading(false);
//       setProgress(0);
//     }
//   };
//
//   return (
//     <Modal.Root>
//       <Modal.Trigger>
//         <LinkButton>
//           <Flex gap="2">
//             <Magic />
//             <Typography>Generate entry</Typography>
//           </Flex>
//         </LinkButton>
//       </Modal.Trigger>
//       <Modal.Content>
//         <Modal.Header>
//           <h2 id="title">Upload Document</h2>
//         </Modal.Header>
//         <Modal.Body>
//           <Box padding={4}>
//             <CustomDropzone onUpload={setFile} disabled={isLoading} />
//           </Box>
//           {isLoading && (
//             <Box padding={4}>
//               <Typography variant="epsilon">Processing...</Typography>
//               <ProgressBar value={progress} max={100} />
//             </Box>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Modal.Close>
//             <Button onClick={onClose} disabled={isLoading}>
//               Cancel
//             </Button>
//           </Modal.Close>
//           <Button onClick={handleUpload} disabled={isLoading}>
//             Upload & Analyze
//           </Button>
//         </Modal.Footer>
//       </Modal.Content>
//     </Modal.Root>
//   );
// };
//
// export default DropzoneModal;

import React, { useState } from 'react';
import { Modal, Button, Box, LinkButton, Flex, Typography } from '@strapi/design-system';
import { Magic } from '@strapi/icons';
import {
  unstable_useContentManagerContext as useContentManagerContext,
  useAuth,
} from '@strapi/strapi/admin';

import CustomDropzone from './Dropzone';
import UploadProgressCircular from './UploadProgress';

const DropzoneModal = ({ isOpen, onClose }: { isOpen: any; onClose: any }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const { model } = useContentManagerContext(); // Get the current UID
  const token = useAuth('Admin', (state) => state.token);

  const handleUpload = async (file: any) => {
    setFile(file);
    setIsUploading(true);
    setUploadComplete(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uid', model);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/entry-wizard/analyze-document', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      setTimeout(() => {
        setUploadComplete(true);
        setTimeout(() => {
          setIsUploading(false);
          setFile(null);
        }, 1000);
      }, 2000);
    };

    xhr.onerror = () => {
      console.error('Upload failed.');
      setIsUploading(false);
    };

    xhr.send(formData);
  };

  return (
    <Modal.Root>
      <Modal.Trigger>
        <LinkButton>
          <Flex gap="2">
            <Magic />
            <Typography>Generate entry</Typography>
          </Flex>
        </LinkButton>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Typography>Upload Document</Typography>
        </Modal.Header>
        <Modal.Body>
          <Box padding={4}>
            {!isUploading ? (
              <CustomDropzone onUpload={handleUpload} disabled={isUploading} />
            ) : (
              <UploadProgressCircular isUploading={isUploading} uploadComplete={uploadComplete} />
            )}
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
          </Modal.Close>
          <Button onClick={() => handleUpload(file)} disabled={isUploading || !file}>
            Upload & Generate
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default DropzoneModal;
