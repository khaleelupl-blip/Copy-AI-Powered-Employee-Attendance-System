import React, { useState, useEffect } from 'react';
import type { User, Department, UserRole } from '../../types';
import Button from '../shared/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: User) => void;
  employee: User | null;
  departments: Department[];
  restrictedDepartment?: string;
  allowedRoles?: UserRole[];
}

const ALL_ROLES: UserRole[] = ['employee', 'manager', 'admin'];

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
};


const EmployeeModal: React.FC<EmployeeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  employee, 
  departments, 
  restrictedDepartment, 
  allowedRoles = ALL_ROLES 
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<User>({
    username: '', fullName: '', department: '', position: '', role: 'employee', status: 'active', password: '', employeeCode: ''
  });

  useEffect(() => {
    if (employee) {
      setFormData({ ...employee, password: '' });
    } else {
      setFormData({ 
        username: '', 
        fullName: '', 
        department: restrictedDepartment || departments[0]?.deptName || '', 
        position: '', 
        role: allowedRoles.includes('employee') ? 'employee' : allowedRoles[0], 
        status: 'active', 
        password: '',
        profilePhoto: '',
        employeeCode: '',
      });
    }
  }, [employee, departments, isOpen, restrictedDepartment, allowedRoles]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
        const files = (e.target as HTMLInputElement).files;
        if (files && files[0]) {
            const base64 = await fileToBase64(files[0]);
            setFormData(prev => ({ ...prev, profilePhoto: base64 }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {employee ? t('edit_employee') : t('add_new_employee')}
          </h2>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center space-x-4">
             <div className="flex-shrink-0 h-16 w-16">
                {formData.profilePhoto ? (
                    <img className="h-16 w-16 rounded-full object-cover" src={formData.profilePhoto} alt="Profile" />
                ) : (
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-500">
                        <span className="text-xl font-medium leading-none text-white">{getInitials(formData.fullName)}</span>
                    </span>
                )}
            </div>
            <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile_photo')}</label>
                <input type="file" name="profilePhoto" onChange={handleChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('full_name')}</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('username')}</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required disabled={!!employee} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('employee_code')}</label>
              <input type="text" name="employeeCode" value={formData.employeeCode || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
            </div>
          </div>
          
          {!employee ? (
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('initial_password')}</label>
                <input type="password" name="password" value={formData.password || ''} onChange={handleChange} required={!employee} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
             </div>
          ) : (
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('change_password')}</label>
                <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" placeholder={t('password_placeholder')} />
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('department')}</label>
              <select 
                name="department" 
                value={formData.department} 
                onChange={handleChange} 
                required 
                disabled={!!restrictedDepartment}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-600"
              >
                {departments.map(d => <option key={d.deptId} value={d.deptName}>{d.deptName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('position')}</label>
              <input type="text" name="position" value={formData.position} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('role')}</label>
              <select name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                {allowedRoles.map(role => (
                    <option key={role} value={role} className="capitalize">{t(`role_${role}`)}</option>
                ))}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('status')}</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-4 rounded-b-lg">
          <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit">{t('save_employee')}</Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeModal;
