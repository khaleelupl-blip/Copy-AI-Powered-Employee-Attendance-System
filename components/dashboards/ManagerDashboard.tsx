import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import type { LeaveRequest, LocationData, Department, User } from '../../types';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import StatCard from '../shared/StatCard';
import Button from '../shared/Button';
import CameraModal from '../camera/CameraModal';
import EmployeeModal from '../modals/EmployeeModal';
import { useLanguage } from '../../contexts/LanguageContext';

// FIX: Define a type for the user status object to avoid using 'any' and prevent type errors.
interface UserStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
}

interface DepartmentEmployee {
    username: string;
    name: string;
    position: string;
    status: 'checkedin' | 'checkedout' | 'notchecked';
    lastActivity: string;
    checkInAddress?: string;
    checkInUri?: string;
    checkOutAddress?: string;
    checkOutUri?: string;
    checkInLat?: number;
    checkInLng?: number;
    checkOutLat?: number;
    checkOutLng?: number;
}

const ManagerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [employees, setEmployees] = useState<DepartmentEmployee[]>([]);
    const [allEmployees, setAllEmployees] = useState<User[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // FIX: Use the specific UserStatus type for the state.
    const [myStatus, setMyStatus] = useState<UserStatus | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraAction, setCameraAction] = useState<'CheckIn' | 'CheckOut'>('CheckIn');
    const [currentTime, setCurrentTime] = useState(new Date());

    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [deptEmployees, managerLeaves, managerStatus, allDepts, allUsers] = await Promise.all([
                api.getDepartmentEmployees(user.username),
                api.getPendingLeaveRequestsForManager(user.username),
                api.getUserStatus(user.username),
                api.getAllDepartments(),
                api.getAllEmployees()
            ]);
            
            const presentCount = deptEmployees.filter(e => e.status === 'checkedin' || e.status === 'checkedout').length;
            const total = deptEmployees.length;

            setStats({ total, present: presentCount });
            setEmployees(deptEmployees);
            setAllEmployees(allUsers);
            setPendingLeaves(managerLeaves);
            setMyStatus(managerStatus);
            setDepartments(allDepts);
        } catch (error) {
            console.error("Failed to fetch manager data", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAttendanceAction = (action: 'CheckIn' | 'CheckOut') => {
        setCameraAction(action);
        setIsCameraOpen(true);
    };

    const handleConfirmAttendance = async (photo: string, location: LocationData) => {
        if (!user) return;
        setIsCameraOpen(false);
        setLoading(true);
        try {
            const data = { username: user.username, image: photo, ...location };
            if (cameraAction === 'CheckIn') {
                await api.checkIn(data);
            } else {
                await api.checkOut(data);
            }
            await fetchData();
        } catch (error) {
            console.error(`Failed to ${cameraAction}`, error);
            alert(`Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIndicator = () => {
        if (!myStatus) return null;
        if (myStatus.hasCheckedIn && !myStatus.hasCheckedOut) {
            return <div className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">{t('checked_in')}</div>;
        }
        if (myStatus.hasCheckedOut) {
            return <div className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-200 rounded-full">{t('checked_out')}</div>;
        }
        return <div className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">{t('not_checked_in')}</div>;
    };

    const handleApproveLeave = async (leaveId: string) => {
        if (!user) return;
        await api.approveLeaveByManager(leaveId, user.username);
        fetchData();
    };

    const handleRejectLeave = async (leaveId: string) => {
        if (!user) return;
        await api.rejectLeaveByManager(leaveId, user.username);
        fetchData();
    };

    const handleOpenAddEmployee = () => {
        setEditingEmployee(null);
        setIsEmployeeModalOpen(true);
    };

    const handleOpenEditEmployee = (employeeUsername: string) => {
        const employeeToEdit = allEmployees.find(e => e.username === employeeUsername);
        if (employeeToEdit) {
            setEditingEmployee(employeeToEdit);
            setIsEmployeeModalOpen(true);
        }
    };

    const handleSaveEmployee = async (employeeData: User) => {
        try {
            if (editingEmployee) {
                await api.updateEmployee(employeeData);
            } else {
                await api.addNewEmployee(employeeData);
            }
            setIsEmployeeModalOpen(false);
            await fetchData();
        } catch (error) {
            console.error("Failed to save employee", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };


    if (loading || !user) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    const EmployeeStatus: React.FC<{ status: 'checkedin' | 'checkedout' | 'notchecked' }> = ({ status }) => {
        const statusMap = {
            checkedin: { text: t('checked_in'), icon: 'fa-check-circle', color: 'bg-green-100 text-green-800' },
            checkedout: { text: t('checked_out'), icon: 'fa-sign-out-alt', color: 'bg-yellow-100 text-yellow-800' },
            notchecked: { text: t('not_checked_in'), icon: 'fa-clock', color: 'bg-gray-100 text-gray-800' },
        };
        const { text, icon, color } = statusMap[status];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                <i className={`fas ${icon} mr-1.5`}></i>
                {text}
            </span>
        );
    };

    const MapLink: React.FC<{ lat?: number, lng?: number }> = ({ lat, lng }) => {
        if (lat === undefined || lng === undefined) return null;
        return (
            <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-500 hover:text-indigo-700">
                <i className="fas fa-map-marked-alt"></i>
            </a>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('my_department')} value={user.department} icon={<i className="fas fa-building"></i>} color="purple" />
                <StatCard title={t('team_members')} value={stats?.total || 0} icon={<i className="fas fa-users"></i>} color="indigo" />
                <StatCard title={t('team_present')} value={stats?.present || 0} icon={<i className="fas fa-user-check"></i>} color="green" />
                <StatCard title={t('pending_approvals')} value={pendingLeaves.length} icon={<i className="fas fa-inbox"></i>} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1 space-y-6">
                    <Card title={t('my_attendance')}>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{currentTime.toLocaleTimeString()}</div>
                            <div className="text-gray-500 dark:text-gray-400 mb-4">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            {getStatusIndicator()}
                            <div className="mt-6 space-y-3">
                                {!myStatus?.hasCheckedIn && <Button variant="success" className="w-full" onClick={() => handleAttendanceAction('CheckIn')} icon={<i className="fas fa-camera mr-2"></i>}>{t('check_in_with_selfie')}</Button>}
                                {myStatus?.hasCheckedIn && !myStatus.hasCheckedOut && <Button variant="danger" className="w-full" onClick={() => handleAttendanceAction('CheckOut')} icon={<i className="fas fa-camera mr-2"></i>}>{t('check_out_with_selfie')}</Button>}
                                {myStatus?.hasCheckedOut && <p className="text-gray-500">{t('attendance_complete_today')}</p>}
                            </div>
                        </div>
                    </Card>
                     <Card title={t('pending_leave_requests')}>
                         <div className="space-y-4 max-h-96 overflow-y-auto">
                            {pendingLeaves.length > 0 ? pendingLeaves.map(leave => (
                                <div key={leave.leaveId} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{leave.username}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">{t(`${leave.leaveType}_leave`)}: {leave.fromDate} to {leave.toDate}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-2">{leave.reason}</p>
                                    <div className="flex justify-end space-x-2 mt-3">
                                        <Button size="sm" variant="success" onClick={() => handleApproveLeave(leave.leaveId)}>{t('approve')}</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleRejectLeave(leave.leaveId)}>{t('reject')}</Button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('no_pending_leave_requests')}</p>}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card 
                        title={t('department_employees_status')}
                        actions={
                            <div className="flex space-x-2">
                                <Button variant="primary" size="sm" onClick={handleOpenAddEmployee} icon={<i className="fas fa-plus mr-1" />}>{t('add_employee')}</Button>
                                <Button variant="secondary" size="sm" onClick={fetchData}><i className="fas fa-sync-alt"></i></Button>
                            </div>
                        }
                    >
                        <div className="max-h-[800px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('last_activity')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('location')}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {employees.map((emp, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{emp.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><EmployeeStatus status={emp.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{emp.lastActivity}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs">
                                                {emp.checkInAddress && (
                                                    <div className="truncate flex items-center" title={emp.checkInAddress}>
                                                        <strong>{t('in_location')}</strong>
                                                        <span className="ml-1 truncate">{emp.checkInAddress}</span>
                                                        <MapLink lat={emp.checkInLat} lng={emp.checkInLng} />
                                                    </div>
                                                )}
                                                {emp.checkOutAddress && (
                                                    <div className="truncate mt-1 flex items-center" title={emp.checkOutAddress}>
                                                        <strong>{t('out_location')}</strong>
                                                        <span className="ml-1 truncate">{emp.checkOutAddress}</span>
                                                        <MapLink lat={emp.checkOutLat} lng={emp.checkOutLng} />
                                                    </div>
                                                )}
                                                {!emp.checkInAddress && !emp.checkOutAddress && 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <Button size="sm" variant="secondary" onClick={() => handleOpenEditEmployee(emp.username)}>{t('edit')}</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onConfirm={handleConfirmAttendance} action={cameraAction} />
            <EmployeeModal
                isOpen={isEmployeeModalOpen}
                onClose={() => setIsEmployeeModalOpen(false)}
                onSave={handleSaveEmployee}
                employee={editingEmployee}
                departments={departments}
                restrictedDepartment={user.department}
                allowedRoles={['employee']}
            />
        </div>
    );
};

export default ManagerDashboard;
