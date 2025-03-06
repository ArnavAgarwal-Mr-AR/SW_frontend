import React, { useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import './VideoProcessor.css';

interface VideoProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onProcessedFace: (faceData: string) => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({ videoRef, onProcessedFace }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const processingRef = useRef<boolean>(false);
  const frameRequestRef = useRef<number>();

  useEffect(() => {
    const initializeModel = async () => {
      await tf.setBackend('webgl');
      modelRef.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );
      processingRef.current = true;
      processFrame();
    };

    initializeModel();

    return () => {
      processingRef.current = false;
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      modelRef.current = null;
    };
  }, []);

  const processFrame = async () => {
    if (!processingRef.current) return;
  
    const video = videoRef.current;
    const model = modelRef.current;
  
    if (!video || !model || video.readyState !== 4) {
      frameRequestRef.current = requestAnimationFrame(processFrame);
      return;
    }
  
    try {
      // Detect face
      const predictions = await model.estimateFaces(video);
  
      if (predictions.length > 0) {
        onProcessedFace('active'); // Face detected -> active speaker
      } else {
        onProcessedFace('inactive'); // No face detected
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  
    frameRequestRef.current = requestAnimationFrame(processFrame);
  };  

  return <canvas ref={canvasRef} className="hidden-canvas" />;
};
