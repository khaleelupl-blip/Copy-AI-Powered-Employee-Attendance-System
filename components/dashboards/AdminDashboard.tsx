import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../../services/api';
import * as geminiService from '../../services/geminiService';
import type { User, LeaveRequest, Department, AttendanceRecord, UserRole } from '../../types';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import StatCard from '../shared/StatCard';
import Button from '../shared/Button';
import EmployeeList from '../admin/EmployeeList';
import DepartmentList from '../admin/DepartmentList';
import LeaveList from '../admin/LeaveList';
import AnalyticsTab from '../admin/AnalyticsTab';
import SettingsTab from '../admin/SettingsTab';
import EmployeeModal from '../modals/EmployeeModal';
import DepartmentModal from '../modals/DepartmentModal';
import ConfirmModal from '../modals/ConfirmModal';
import ResetPasswordModal from '../modals/ResetPasswordModal';
import { useLanguage } from '../../contexts/LanguageContext';

const MapLink: React.FC<{ lat?: number, lng?: number }> = ({ lat, lng }) => {
    if (lat === undefined || lng === undefined) return null;
    return (
        <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-500 hover:text-indigo-700">
            <i className="fas fa-map-marked-alt"></i>
        </a>
    );
};

const AttendanceLog: React.FC<{ attendanceRecords: AttendanceRecord[]; employees: User[]; }> = ({ attendanceRecords, employees }) => {
    const { t } = useLanguage();
    const employeeMap = useMemo(() => {
        return new Map(employees.map(e => [e.username, e.fullName]));
    }, [employees]);

    return (
        <Card title={t('full_attendance_log')}>
            <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('employee')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('check_in')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('check_out')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('location')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {attendanceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.checkInTime || '').localeCompare(a.checkInTime || '')).map(record => (
                            <tr key={`${record.username}-${record.date}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {employeeMap.get(record.username) || record.username}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.checkInTime || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.checkOutTime || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs">
                                    {record.checkInAddress && (
                                        <div className="truncate flex items-center" title={record.checkInAddress}>
                                            <strong>{t('in_location')}</strong>
                                            <span className="ml-1 truncate">{record.checkInAddress}</span>
                                            <MapLink lat={record.checkInLat} lng={record.checkInLng} />
                                        </div>
                                    )}
                                    {record.checkOutAddress && (
                                        <div className="truncate mt-1 flex items-center" title={record.checkOutAddress}>
                                            <strong>{t('out_location')}</strong>
                                            <span className="ml-1 truncate">{record.checkOutAddress}</span>
                                            <MapLink lat={record.checkOutLat} lng={record.checkOutLng} />
                                        </div>
                                    )}
                                    {!record.checkInAddress && !record.checkOutAddress && 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('employees');
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action?: () => void, title?: string, message?: string }>({});
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');


  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    try {
      const [adminStats, allEmployees, pending, allDepts, allManagers, allL, allA] = await Promise.all([
        api.getAdminDashboardStats(),
        api.getAllEmployees(),
        api.getAllPendingLeaveRequests(),
        api.getAllDepartments(),
        api.getAllManagers(),
        api.getAllLeaveRequests(),
        api.getEmployeeAttendanceHistory(''),
      ]);
      setStats(adminStats);
      setEmployees(allEmployees);
      setPendingLeaves(pending);
      setDepartments(allDepts);
      setManagers(allManagers);
      setAllLeaves(allL);
      setAllAttendance(allA);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const intervalId = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
        const statusMatch = statusFilter === 'all' || employee.status === statusFilter;
        const roleMatch = roleFilter === 'all' || employee.role === roleFilter;
        return statusMatch && roleMatch;
    });
  }, [employees, statusFilter, roleFilter]);

  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (employee: User) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };
  
  const handleOpenAddDepartment = () => {
      setEditingDepartment(null);
      setIsDepartmentModalOpen(true);
  };
  
  const handleOpenEditDepartment = (department: Department) => {
      setEditingDepartment(department);
      setIsDepartmentModalOpen(true);
  };
  
  const handleOpenResetPasswordModal = (employee: User) => {
    setSelectedUserForReset(employee);
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPassword = async (username: string, newPass: string) => {
    try {
        await api.resetPassword(username, newPass);
        setIsResetPasswordModalOpen(false);
        setSelectedUserForReset(null);
        alert(`Password for ${username} has been reset successfully.`);
    } catch (error) {
        console.error("Failed to reset password", error);
        alert(`Error: ${(error as Error).message}`);
    }
  };

  const handleSaveEmployee = async (employee: User) => {
    if (editingEmployee) {
        await api.updateEmployee(employee);
    } else {
        await api.addNewEmployee(employee);
    }
    setIsEmployeeModalOpen(false);
    fetchData();
  };
  
  const handleSaveDepartment = async (department: Department) => {
      if(editingDepartment) {
          await api.updateDepartment(department);
      } else {
          await api.addDepartment(department);
      }

      if (department.manager) {
          const managerUser = employees.find(e => e.username === department.manager);
          
          if (managerUser && managerUser.role !== 'manager') {
              const updatedUser: User = { ...managerUser, role: 'manager' };
              await api.updateEmployee(updatedUser);
          }
      }

      setIsDepartmentModalOpen(false);
      fetchData();
  };

  const handleDeleteEmployee = (username: string) => {
    setConfirmAction({
        action: async () => {
            await api.deleteEmployee(username);
            setIsConfirmModalOpen(false);
            fetchData();
        },
        title: t('deactivate_employee'),
        message: t('deactivate_employee_confirm', { username })
    });
    setIsConfirmModalOpen(true);
  };

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    setAiSummary('');
     const allAttendance = await api.getEmployeeAttendanceHistory('');
     const allEmployees = await api.getAllEmployees();
    try {
        const summary = await geminiService.generateAttendanceSummary(allEmployees, allAttendance);
        setAiSummary(summary);
    } catch (error) {
        setAiSummary('Failed to generate summary.');
    } finally {
        setIsSummaryLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    await api.approveLeaveByAdmin(leaveId);
    fetchData();
  };
  
  const handleRejectLeave = async (leaveId: string) => {
    await api.rejectLeaveByAdmin(leaveId);
    fetchData();
  };

  const tabs = [
    { id: 'employees', label: t('employees'), icon: 'fa-users' },
    { id: 'departments', label: t('departments'), icon: 'fa-building' },
    { id: 'leaves', label: t('leave_requests'), icon: 'fa-calendar-alt' },
    { id: 'attendance_log', label: t('attendance_log'), icon: 'fa-history' },
    { id: 'analytics', label: t('analytics'), icon: 'fa-chart-line' },
    { id: 'ai_summary', label: t('ai_summary'), icon: 'fa-robot' },
    { id: 'settings', label: t('app_settings'), icon: 'fa-cog' },
  ];
  
  const employeeListActions = (
    <div className="flex items-center space-x-2 md:space-x-4">
        <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
            <option value="all">{t('all_statuses')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
        </select>
        <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
            <option value="all">{t('all_roles')}</option>
            <option value="employee">{t('role_employee')}</option>
            <option value="manager">{t('role_manager')}</option>
            <option value="admin">{t('role_admin')}</option>
        </select>
        <Button onClick={handleOpenAddEmployee} icon={<i className="fas fa-plus mr-2"/>} className="whitespace-nowrap">{t('add_employee')}</Button>
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
        case 'employees':
            return <Card title={t('all_employees')} actions={employeeListActions}><EmployeeList employees={filteredEmployees} onEdit={handleOpenEditEmployee} onDelete={handleDeleteEmployee} onResetPassword={handleOpenResetPasswordModal} /></Card>;
        case 'departments':
            return <Card title={t('departments')} actions={<Button onClick={handleOpenAddDepartment} icon={<i className="fas fa-plus mr-2"/>}>{t('add_department')}</Button>}><DepartmentList departments={departments} onEdit={handleOpenEditDepartment} /></Card>;
        case 'leaves':
            return <Card title={t('pending_leave_requests')}><LeaveList leaves={pendingLeaves} onApprove={handleApproveLeave} onReject={handleRejectLeave} /></Card>;
        case 'attendance_log':
            return <AttendanceLog attendanceRecords={allAttendance} employees={employees} />;
        case 'analytics':
            return <AnalyticsTab attendanceRecords={allAttendance} leaveRequests={allLeaves} />;
        case 'ai_summary':
            return (
                <Card title={t('ai_summary')} actions={<Button onClick={handleGenerateSummary} isLoading={isSummaryLoading} icon={<i className="fas fa-magic mr-2"></i>}>{t('generate')}</Button>}>
                    {isSummaryLoading && <Spinner />}
                    {aiSummary && <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />}
                    {!aiSummary && !isSummaryLoading && <p className="text-gray-500">{t('generate_summary_prompt')}</p>}
                </Card>
            );
        case 'settings':
            return <SettingsTab />;
        default: return null;
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }
  
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title={t('total_employees')} value={stats?.totalEmployees || 0} icon={<i className="fas fa-users"></i>} color="indigo" />
            <StatCard title={t('present_today')} value={stats?.presentToday || 0} icon={<i className="fas fa-user-check"></i>} color="green" />
            <StatCard title={t('absent_today')} value={stats?.absentToday || 0} icon={<i className="fas fa-user-times"></i>} color="red" />
            <StatCard title={t('on_leave_today')} value={stats?.onLeaveToday || 0} icon={<i className="fas fa-bed"></i>} color="yellow" />
        </div>

        <div>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>
                        <i className={`fas ${tab.icon} mr-2`}></i>{tab.label}
                    </button>
                ))}
                </nav>
            </div>
            {renderTabContent()}
        </div>
        
        <EmployeeModal 
            isOpen={isEmployeeModalOpen}
            onClose={() => setIsEmployeeModalOpen(false)}
            onSave={handleSaveEmployee}
            employee={editingEmployee}
            departments={departments}
        />
        <DepartmentModal 
            isOpen={isDepartmentModalOpen}
            onClose={() => setIsDepartmentModalOpen(false)}
            onSave={handleSaveDepartment}
            department={editingDepartment}
            managers={managers}
        />
        <ConfirmModal 
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmAction.action}
            title={confirmAction.title || t('confirm_action')}
            message={confirmAction.message || t('are_you_sure')}
        />
        <ResetPasswordModal
            isOpen={isResetPasswordModalOpen}
            onClose={() => setIsResetPasswordModalOpen(false)}
            onConfirm={handleResetPassword}
            user={selectedUserForReset}
        />

    </div>
  );
};

export default AdminDashboard;
