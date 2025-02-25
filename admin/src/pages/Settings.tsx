import React, { useEffect, useState } from 'react';
import {
  Flex,
  Typography,
  Box,
  Button,
  MultiSelect,
  MultiSelectOption,
  LinkButton,
} from '@strapi/design-system';
import { useNotification, useFetchClient, Layouts, Page } from '@strapi/strapi/admin';

const Settings = () => {
  const [contentTypes, setContentTypes] = useState([]);
  const [settings, setSettings] = useState({ allowedFields: '', modelUIDs: '' });
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [{ data: settingsData }, { data: contentTypesData }] = await Promise.all([
          get('/entry-wizard/settings'),
          get('/content-type-builder/content-types'),
        ]);

        setSettings(settingsData);
        setContentTypes(
          contentTypesData.data
            .filter((type: any) => type.uid.startsWith('api::')) // ✅ Only fetch API content types
            .map((type: any) => ({ label: type.schema.displayName, value: type.uid }))
        );
      } catch (error) {
        console.error('Error fetching settings', JSON.stringify(error, null, 2));
        toggleNotification({ type: 'warning', message: 'Error fetching settings' });
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await post('/entry-wizard/settings', settings);
      toggleNotification({ type: 'success', message: 'Settings saved!' });
    } catch {
      toggleNotification({ type: 'warning', message: 'Error saving settings' });
    }
  };

  return (
    <Layouts.Root>
      <Page.Title>Entry Wizard settings</Page.Title>
      {/* @ts-ignore */}
      <Page.Main style={{ position: 'relative' }}>
        <Layouts.Header
          title="Entry Wizard settings"
          subtitle="Select the content types where the button for upload documents should appear"
          primaryAction={<Button onClick={handleSave}>Save</Button>}
        />

        <Layouts.Content>
          <Box padding={6} background="neutral0">
            {contentTypes && (
              <MultiSelect
                withTags
                label="Model UIDs"
                placeholder="Select content types..."
                hint="Select the content types where the button should appear"
                value={settings.modelUIDs}
                onChange={(values: any) => setSettings({ ...settings, modelUIDs: values })}
              >
                {contentTypes.map((type: any) => (
                  <MultiSelectOption value={type.value}>{type.label}</MultiSelectOption>
                ))}
              </MultiSelect>
            )}
            <Box paddingTop={6}>
              <Button onClick={handleSave}>Save</Button>
            </Box>
          </Box>
        </Layouts.Content>
      </Page.Main>
    </Layouts.Root>
  );
};

export default Settings;
