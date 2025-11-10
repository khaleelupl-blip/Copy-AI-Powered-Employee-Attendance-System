import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LocationData } from '../../types';
import Button from '../shared/Button';
import Spinner from '../shared/Spinner';
import { useLanguage } from '../../contexts/LanguageContext';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photo: string, location: LocationData) => void;
  action: 'CheckIn' | 'CheckOut';
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onConfirm, action }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  
  const startCamera = useCallback(async () => {
    try {
        setCapturedPhoto(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        setStream(mediaStream);
        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please grant permission and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      startCamera();
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationError(null);
          setLoading(false);
        },
        (error) => {
          setLocationError(error.message);
          setLocationData(null);
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      stopCamera();
    }

    return () => {
        if(stream) stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      }
      const photo = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photo);
      stopCamera();
    }
  };
  
  const handleConfirm = () => {
      if (capturedPhoto && locationData) {
          onConfirm(capturedPhoto, locationData);
      }
  };

  const handleRetake = () => {
      startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {action === 'CheckIn' ? t('selfie_check_in') : t('selfie_check_out')}
          </h2>
        </div>
        <div className="p-6 text-center">
            {loading ? <Spinner /> : 
             <>
             <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                {capturedPhoto ? (
                    <img src={capturedPhoto} alt="Captured selfie" className="w-full h-full object-cover" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
                )}
             </div>
             
             <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                {locationError ? <p className="text-red-500"><i className="fas fa-exclamation-triangle mr-2"></i>{locationError}</p> : 
                locationData ? <p className="text-green-600 dark:text-green-400"><i className="fas fa-map-marker-alt mr-2"></i>{t('location_captured', { accuracy: locationData.accuracy.toFixed(0) })}</p> : 
                <p>{t('getting_location')}</p>}
             </div>
             </>
            }
             <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-4 rounded-b-lg">
            <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
            {!capturedPhoto ? 
                <Button onClick={handleCapture} disabled={loading} icon={<i className="fas fa-camera mr-2"></i>}>{t('capture')}</Button> :
                <>
                <Button variant="secondary" onClick={handleRetake} icon={<i className="fas fa-redo mr-2"></i>}>{t('retake')}</Button>
                <Button variant="success" onClick={handleConfirm} disabled={!locationData} icon={<i className="fas fa-check mr-2"></i>}>
                    {action === 'CheckIn' ? t('confirm_check_in') : t('confirm_check_out')}
                </Button>
                </>
            }
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
