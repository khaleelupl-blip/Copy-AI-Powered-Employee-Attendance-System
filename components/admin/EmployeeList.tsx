import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface EmployeeListProps {
    employees: User[];
    onEdit: (employee: User) => void;
    onDelete: (username: string) => void;
    onResetPassword: (employee: User) => void;
}

const EmployeeActions: React.FC<{ employee: User; onEdit: (e: User) => void; onDelete: (u: string) => void; onResetPassword: (e: User) => void; }> = ({ employee, onEdit, onDelete, onResetPassword }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
                    id="menu-button"
                    aria-expanded="true"
                    aria-haspopup="true"
                >
                    {t('actions')}
                    <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        <button onClick={() => { onEdit(employee); setIsOpen(false); }} className="text-gray-700 dark:text-gray-200 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">
                           <i className="fas fa-edit w-5 mr-2"></i> {t('edit')}
                        </button>
                        <button onClick={() => { onResetPassword(employee); setIsOpen(false); }} className="text-gray-700 dark:text-gray-200 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">
                           <i className="fas fa-key w-5 mr-2"></i> {t('reset_password')}
                        </button>
                        {employee.status === 'active' && (
                            <button onClick={() => { onDelete(employee.username); setIsOpen(false); }} className="text-red-700 dark:text-red-400 block w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/50" role="menuitem">
                               <i className="fas fa-user-slash w-5 mr-2"></i> {t('deactivate')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onEdit, onDelete, onResetPassword }) => {
    const { t } = useLanguage();
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('department')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('role')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('live_location')}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.map(employee => (
                        <tr key={employee.username}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        {employee.profilePhoto ? (
                                            <img className="h-10 w-10 rounded-full object-cover" src={employee.profilePhoto} alt="" />
                                        ) : (
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 dark:bg-gray-700">
                                                <span className="font-medium leading-none text-white">{getInitials(employee.fullName)}</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.fullName}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{employee.username}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">{t('employee_code_short')}{employee.employeeCode || 'N/A'}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{employee.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">{t(`role_${employee.role}`)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {t(employee.status)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {employee.liveLocation ? (
                                    <div>
                                        <a href={`https://www.google.com/maps?q=${employee.liveLocation.lat},${employee.liveLocation.lng}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {employee.liveLocation.lat.toFixed(4)}, {employee.liveLocation.lng.toFixed(4)}
                                        </a>
                                        <div className="text-xs text-gray-400">
                                            {new Date(employee.liveLocation.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <EmployeeActions employee={employee} onEdit={onEdit} onDelete={onDelete} onResetPassword={onResetPassword} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmployeeList;
