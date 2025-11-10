import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import * as api from '../../services/api';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { useLanguage } from '../../contexts/LanguageContext';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};


const SettingsTab: React.FC = () => {
    const { appName, appLogo, setAppName, setAppLogo } = useApp();
    const { t } = useLanguage();
    const [name, setName] = useState(appName);
    const [logo, setLogo] = useState<string | null>(appLogo);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setName(appName);
        setLogo(appLogo);
    }, [appName, appLogo]);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64Logo = await fileToBase64(e.target.files[0]);
                setLogo(base64Logo);
            } catch (error) {
                console.error("Error converting logo to base64", error);
                alert("Could not process image file. Please try another one.");
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.saveAppSettings({ appName: name, appLogo: logo || '' });
            setAppName(name);
            setAppLogo(logo);
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card title={t('application_settings')}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="appName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('application_name')}
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="appName"
                            id="appName"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('application_logo')}
                    </label>
                    <div className="mt-1 flex items-center space-x-4">
                        <span className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                           {logo ? <img src={logo} alt="Logo preview" className="h-full w-full object-contain" /> : <i className="fas fa-image text-2xl text-gray-400"></i>}
                        </span>
                        <input type="file" id="logo-upload" className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                        <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {t('change')}
                        </label>
                        {logo && <Button size="sm" variant="secondary" onClick={() => setLogo(null)}>{t('remove')}</Button>}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end">
                        <Button onClick={handleSave} isLoading={isSaving}>{t('save_settings')}</Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SettingsTab;
