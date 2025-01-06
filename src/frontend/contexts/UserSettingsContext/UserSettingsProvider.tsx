import { useState, useEffect, useCallback } from 'react';
import { getSettings } from '../../utils/api';
import useWebRequest from '../../hooks/useWebRequest';
import { UserSettings } from '../../../types/userSettings';
import defaultUserSettings from '../../utils/defaultUserSettings';
import { UserSettingsContext } from './UserSettingsContext';

export default function UserSettingsProvider({ children }: React.PropsWithChildren) {
  const { data } = useWebRequest("settings", getSettings);
  const [userSettings, setSettings] = useState<UserSettings>({ ...defaultUserSettings });

  const updateField = useCallback((key: keyof UserSettings, value: unknown) => {
    setSettings(prevSettings => ({ ...prevSettings, [key]: value }));
  }, []);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  return (
    <UserSettingsContext.Provider value={{ userSettings, updateField }}>
      {children}
    </UserSettingsContext.Provider>
  );
}
