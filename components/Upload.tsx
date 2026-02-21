import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

const Upload = ({onComplete}: { onComplete?: (dataUrl: string) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressTimerRef = useRef<number | null>(null);
    const readerRef = useRef<FileReader | null>(null);
    const isMountedRef = useRef(true);

    const {isSignedIn} = useOutletContext<AuthContext>();

    const clearProgressTimer = () => {
        if (progressTimerRef.current !== null) {
            window.clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearProgressTimer();
            if (readerRef.current && readerRef.current.readyState === FileReader.LOADING) {
                readerRef.current.abort();
            }
        };
    }, []);

    const processFile = useCallback((nextFile: File) => {
        if (!isSignedIn || !isMountedRef.current) {
            return;
        }

        clearProgressTimer();
        if (readerRef.current && readerRef.current.readyState === FileReader.LOADING) {
            readerRef.current.abort();
        }

        setFile(nextFile);
        setProgress(0);

        const reader = new FileReader();
        readerRef.current = reader;
        reader.onload = () => {
            if (!isMountedRef.current) {
                return;
            }
            const result = typeof reader.result === "string" ? reader.result : "";
            progressTimerRef.current = window.setInterval(() => {
                if (!isMountedRef.current) {
                    clearProgressTimer();
                    return;
                }
                setProgress((prev) => {
                    const next = Math.min(prev + PROGRESS_STEP, 100);
                    if (next === 100) {
                        clearProgressTimer();
                        window.setTimeout(() => {
                            if (isMountedRef.current) {
                                onComplete?.(result);
                            }
                        }, REDIRECT_DELAY_MS);
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(nextFile);
    }, [isSignedIn, onComplete]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) {
            return;
        }
        const nextFile = event.target.files?.[0];
        if (nextFile) {
            processFile(nextFile);
        }
    };

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isSignedIn) {
            return;
        }
        setIsDragging(true);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isSignedIn) {
            return;
        }
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isSignedIn) {
            return;
        }
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isSignedIn) {
            return;
        }
        setIsDragging(false);
        const nextFile = event.dataTransfer.files?.[0];
        if (nextFile) {
            processFile(nextFile);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png,.webp"
                        disabled={!isSignedIn}
                        onChange={handleChange}
                    />
                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20}/>
                        </div>
                        <p>{isSignedIn ? (
                            "Click to Upload or Drag & Drop"
                        ) : (
                            "Sign In or Sign Up to Upload"
                        )}</p>
                        <p className="help">Maximum file size 50MB.</p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image"/>
                            )}
                        </div>

                        <h3>{file.name}</h3>
                        <div className="progress">
                            <div className="bar" style={{width: `${progress}%`}} />
                            <p className="status-text">
                                {progress < 100 ? 'Analyzing Floor Plan ...' : 'Redirecting ...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;
