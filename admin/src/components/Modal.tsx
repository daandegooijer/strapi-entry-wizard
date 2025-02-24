import React, { useState } from 'react';
import { Modal, Button, Box, LinkButton, Flex, Typography } from '@strapi/design-system';
import { Magic } from '@strapi/icons';
import {
  unstable_useContentManagerContext as useContentManagerContext,
  useAuth,
  useNotification,
} from '@strapi/strapi/admin';

import CustomDropzone from './Dropzone';
import UploadProgressLinear from './UploadProgress';

const DropzoneModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [completedUploads, setCompletedUploads] = useState<number>(0);

  const { model } = useContentManagerContext();
  const token = useAuth('Admin', (state) => state.token);
  const { toggleNotification } = useNotification();

  const handleUpload = async () => {
    setIsUploading(true);
    let completed: number = 0;

    for (const file of files) {
      try {
        await uploadFile(file);
        completed += 1;
        setCompletedUploads(completed);
      } catch (error) {
        console.error(`❌ Upload failed for ${file.name}:`, error);
        toggleNotification({
          type: 'warning',
          message: `Upload failed for ${file.name}`,
        });
      }
    }

    setIsUploading(false);

    if (completed > 0) {
      toggleNotification({
        type: 'success',
        message: `Successfully uploaded ${completed} file${completed > 1 ? 's' : ''}! \n\n Refreshing page in 2 seconds...`,
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const uploadFile = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uid', model);

      setUploadProgress((prev) => ({ ...prev, [file.name]: 5 }));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/entry-wizard/analyze-document', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let progress = 5; // Track progress per file

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          return {
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 5, 90),
          };
        });
        progress = Math.min(progress + 5, 90);
        setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
      }, 2000);

      xhr.onload = async () => {
        clearInterval(progressInterval);
        if (xhr.status === 200) {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

          resolve();
        } else {
          reject(new Error(`Error uploading ${file.name}`));
        }
      };

      xhr.onerror = () => {
        clearInterval(progressInterval);
        reject(new Error(`Upload failed for ${file.name}`));
      };

      xhr.send(formData);
    });
  };

  const closeModal = () => {
    setIsVisible(false);
  };

  return (
    <Modal.Root open={isVisible} onOpenChange={closeModal}>
      <LinkButton onClick={() => setIsVisible(true)}>
        <Flex gap="2">
          <Magic />
          <Typography>Generate entry</Typography>
        </Flex>
      </LinkButton>
      <Modal.Content>
        <Modal.Header>
          <Typography variant="alpha">Upload Documents</Typography>
        </Modal.Header>
        <Modal.Body>
          <Box padding={4}>
            {!isUploading ? (
              <CustomDropzone onUpload={setFiles} disabled={isUploading} />
            ) : (
              <Box>
                {files.map((file) => (
                  <>
                    <UploadProgressLinear
                      key={file.name}
                      fileName={file.name}
                      progress={uploadProgress[file.name] || 0}
                    />
                  </>
                ))}
              </Box>
            )}
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button disabled={isUploading}>Cancel</Button>
          </Modal.Close>
          <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
            Upload & Generate ({completedUploads}/{files.length})
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default DropzoneModal;
