import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import type { AttendanceRecord, LeaveRequest, LocationData } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Spinner from '../shared/Spinner';
import CameraModal from '../camera/CameraModal';
import LeaveRequestModal from '../modals/LeaveRequestModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';

// FIX: Define a type for the user status object to avoid using 'any' and prevent type-related errors.
interface UserStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  location?: string;
  locationUri?: string;
  checkInCoords?: { lat: number; lng: number };
}

const EmployeeDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    // FIX: Use the specific UserStatus type for the state.
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraAction, setCameraAction] = useState<'CheckIn' | 'CheckOut'>('CheckIn');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // FIX: Wrap fetchData in useCallback to prevent it from being redefined on every render,
    // which is a best practice when it's a dependency of useEffect.
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [userStatus, userStats, userHistory, userLeaves] = await Promise.all([
                api.getUserStatus(user.username),
                api.getDashboardStats(user.username),
                api.getEmployeeAttendanceHistory(user.username),
                api.getEmployeeLeaveRequests(user.username)
            ]);
            setStatus(userStatus);
            setStats(userStats);
            setHistory(userHistory);
            setLeaves(userLeaves);
        } catch (error) {
            console.error("Failed to fetch employee data", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        // FIX: Depend on the memoized fetchData function.
    }, [fetchData]);

    // Live location tracking effect
    useEffect(() => {
        let intervalId: number | null = null;

        if (user && status?.hasCheckedIn && !status?.hasCheckedOut) {
            const updateLocation = () => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // FIX: Ensure user object exists before using it in the callback.
                        if (user) {
                            api.updateLiveLocation(user.username, position.coords.latitude, position.coords.longitude);
                        }
                    },
                    (error) => {
                        console.error("Error getting live location:", error);
                    },
                    { enableHighAccuracy: true }
                );
            };
            
            updateLocation(); // Initial update on check-in
            // FIX: Use window.setInterval for browser environments to ensure the return type is 'number'.
            intervalId = window.setInterval(updateLocation, 30000); // Update every 30 seconds
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [user, status]);


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
            await fetchData(); // Refresh data
        } catch (error) {
            console.error(`Failed to ${cameraAction}`, error);
            alert(`Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveSubmit = async (requestData: Omit<LeaveRequest, 'leaveId' | 'status' | 'appliedDate' | 'username'>) => {
        if (!user) return;
        try {
            await api.submitLeaveRequest({
                ...requestData,
                username: user.username
            });
            setIsLeaveModalOpen(false);
            await fetchData(); // Refresh leave list
        } catch (error) {
            console.error("Failed to submit leave request", error);
            // Re-throw to show error in modal
            throw error;
        }
    };

    if (loading || !user || !status || !stats) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    const attendanceChartData = [
        { name: t('present'), days: stats.present, fill: '#10B981' },
        { name: t('absent'), days: stats.absent, fill: '#EF4444' },
        { name: t('sundays'), days: stats.sundays, fill: '#3B82F6' },
    ];

    const getStatusIndicator = () => {
        if (status.hasCheckedIn && !status.hasCheckedOut) {
            return <div className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">{t('checked_in')}</div>;
        }
        if (status.hasCheckedOut) {
            return <div className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-200 rounded-full">{t('checked_out')}</div>;
        }
        return <div className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">{t('not_checked_in')}</div>;
    }
    
    const MapLink: React.FC<{ lat?: number, lng?: number, address?: string, uri?: string }> = ({ lat, lng, address, uri }) => {
        if (lat !== undefined && lng !== undefined) {
             return (
                <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    <i className="fas fa-map-marker-alt mr-2"></i>{address || `(${lat.toFixed(4)}, ${lng.toFixed(4)})`}
                </a>
            )
        }
        if (uri) {
             return (
                <a href={uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    <i className="fas fa-map-marker-alt mr-2"></i>{address}
                </a>
            )
        }
        return <span className="text-gray-500">{t('location_not_recorded')}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card title={t('attendance_action')}>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{currentTime.toLocaleTimeString()}</div>
                            <div className="text-gray-500 dark:text-gray-400 mb-4">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            {getStatusIndicator()}
                            <div className="mt-6 space-y-3">
                                {!status.hasCheckedIn && <Button variant="success" className="w-full" onClick={() => handleAttendanceAction('CheckIn')} icon={<i className="fas fa-camera mr-2"></i>}>{t('check_in_with_selfie')}</Button>}
                                {status.hasCheckedIn && !status.hasCheckedOut && <Button variant="danger" className="w-full" onClick={() => handleAttendanceAction('CheckOut')} icon={<i className="fas fa-camera mr-2"></i>}>{t('check_out_with_selfie')}</Button>}
                                {status.hasCheckedOut && <p className="text-gray-500">{t('attendance_complete_today')}</p>}
                            </div>
                        </div>
                    </Card>
                    <Card title={t('leave_management')}>
                         <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('leave_request_prompt')}</p>
                         <Button className="w-full" onClick={() => setIsLeaveModalOpen(true)}>{t('apply_for_leave')}</Button>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card title={t('monthly_attendance_summary')}>
                         <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={attendanceChartData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="days" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title={t('attendance_history')}>
                    <div className="max-h-96 overflow-y-auto">
                        {history.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {history.map(record => (
                                    <li key={record.date} className="py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{record.date}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t('check_in')}: {record.checkInTime || 'N/A'} | {t('check_out')}: {record.checkOutTime || 'N/A'}
                                                </p>
                                                <div className="text-sm mt-1">
                                                    {record.checkInAddress && <div><strong className="font-semibold">{t('in_location')}</strong><MapLink lat={record.checkInLat} lng={record.checkInLng} address={record.checkInAddress} uri={record.checkInUri} /></div>}
                                                    {record.checkOutAddress && <div><strong className="font-semibold">{t('out_location')}</strong><MapLink lat={record.checkOutLat} lng={record.checkOutLng} address={record.checkOutAddress} uri={record.checkOutUri}/></div>}
                                                </div>
                                            </div>
                                            <div>
                                                {record.isAutoCheckout && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Auto</span>}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 py-8">{t('no_attendance_history')}</p>
                        )}
                    </div>
                </Card>
                 <Card title={t('leave_request_history')}>
                    <div className="max-h-96 overflow-y-auto">
                         {leaves.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {leaves.map(leave => (
                                    <li key={leave.leaveId} className="py-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{t(`${leave.leaveType}_leave`)}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{leave.fromDate} to {leave.toDate}</p>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                                                leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                leave.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>{t(leave.status)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">"{leave.reason}"</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 py-8">{t('no_leave_requests_found')}</p>
                        )}
                    </div>
                </Card>
            </div>

            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onConfirm={handleConfirmAttendance} action={cameraAction} />
            <LeaveRequestModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} onSubmit={handleLeaveSubmit} />
        </div>
    );
};

export default EmployeeDashboard;
