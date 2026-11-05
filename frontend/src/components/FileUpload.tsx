import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadCsv } from '../services/api';
import type { UploadCsvSuccess } from '../types';

interface FileUploadProps {
  onUploadComplete?: (res: UploadCsvSuccess) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setSuccessMessage(null);
    
    // Strict extension check for .csv
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please select a valid .csv file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(30);
    
    try {
      const timer = setTimeout(() => setProgress(70), 200);

      const response = await uploadCsv(file);
      console.log('response', response);
      clearTimeout(timer);
      setProgress(100);
      setUploading(false);
      setSuccessMessage(response.message || 'CSV uploaded successfully!');
      
      if (onUploadComplete) {
        onUploadComplete(response);
      }

      // Reset file selection UI after a brief moment
      setTimeout(() => {
        setSelectedFile(null);
        setProgress(0);
      }, 4000);
    } catch (err: unknown) {
      console.log('catch (err: unknown)', err);
      setUploading(false);
      setProgress(0);
      const msg = err instanceof Error ? err.message : 'Failed to upload CSV file.';
      setError(msg);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-800">Upload CSV Data</h3>
        <p className="text-xs text-gray-500">Drag and drop your CSV file below or click to browse.</p>
      </div>

      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-white rounded-full shadow-xs border border-gray-100 text-blue-600">
            <UploadCloud className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div className="flex items-center space-x-2 text-sm text-gray-700 font-medium">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{selectedFile.name}</span>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Click to upload <span className="text-gray-500 font-normal">or drag and drop</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Accepts .csv files</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar / Loading State */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span className="flex items-center space-x-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Transmitting CSV data...</span>
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}