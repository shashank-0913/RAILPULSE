import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Sparkles, X, Activity, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface SIHDemoModalProps {
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const SIHDemoModal: React.FC<SIHDemoModalProps> = ({ onClose, onNavigateTab }) => {
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSteps = async () => {
      const res = await api.getDemoSteps();
      if (res.success && res.steps) {
        setSteps(res.steps);
      }
    };
    fetchSteps();
  }, []);

  const executeStep = async (stepNum: number) => {
    setLoading(true);
    try {
      const res = await api.setDemoStep(stepNum);
      if (res.success && res.step) {
        setCurrentStepIndex(stepNum);
        if (res.step.highlightTab) {
          onNavigateTab(res.step.highlightTab);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= (steps.length || 14)) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          executeStep(next);
          return next;
        });
      }, 5500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const currentStep = steps.find(s => s.step === currentStepIndex) || steps[0] || {
    step: 1,
    title: 'Baseline State: Train 12864 Operating on Schedule',
    phase: 'TRACK',
    description: 'Train 12864 is cruising at 85 km/h on the Howrah-Chennai trunk line.',
    actionTaken: 'Baseline telemetry ingested.'
  };

  const handleReset = async () => {
    setIsPlaying(false);
    await api.resetDemo();
    setCurrentStepIndex(1);
    executeStep(1);
  };

  return (
    <div className="demo-banner">
      {/* Left: Step Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: '#4f46e5',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            fontFamily: 'JetBrains Mono'
          }}>
            SIH STEP {currentStepIndex}/{steps.length || 14}
          </div>
          <span style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            fontWeight: 700,
            fontSize: '0.7rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            textTransform: 'uppercase'
          }}>
            {currentStep.phase}
          </span>
        </div>

        <div style={{ borderLeft: '1px solid #312e81', paddingLeft: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{currentStep.title}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            {currentStep.description}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          onClick={() => {
            if (currentStepIndex > 1) {
              const prev = currentStepIndex - 1;
              executeStep(prev);
            }
          }}
          disabled={currentStepIndex <= 1 || loading}
          className="btn-secondary"
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
        >
          <ChevronLeft size={16} /> Prev
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={isPlaying ? 'btn-secondary' : 'btn-primary'}
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
        >
          {isPlaying ? <><Pause size={14} /> Pause Auto</> : <><Play size={14} /> Auto Play</>}
        </button>

        <button
          onClick={() => {
            if (currentStepIndex < (steps.length || 14)) {
              const next = currentStepIndex + 1;
              executeStep(next);
            }
          }}
          disabled={currentStepIndex >= (steps.length || 14) || loading}
          className="btn-primary"
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}
        >
          <span>Next Step</span> <ChevronRight size={16} />
        </button>

        <button
          onClick={handleReset}
          className="btn-secondary"
          title="Reset Demo Scenario"
          style={{ padding: '0.35rem 0.5rem' }}
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: '0.5rem'
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
