import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  X,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Tv,
  Network,
  Award,
  Users
} from 'lucide-react';
import { api } from '../services/api';

interface SIHDemoModalProps {
  onClose: () => void;
  onNavigateTab: (tab: string, trainId?: string) => void;
}

interface DemoStepConfig {
  step: number;
  title: string;
  tab: string;
  phase: string;
  icon: any;
  summary: string;
  actionText: string;
  details: string;
}

const DEMO_STEPS: DemoStepConfig[] = [
  {
    step: 1,
    title: 'Step 1: Passenger Live ETA & In-Coach Offline Tracking',
    tab: 'passenger',
    phase: 'PASSENGER ETA',
    icon: Users,
    summary: 'Search Train #12864 or PNR 4523-891245. View dynamic arrival forecasts vs static timetables, 80% confidence prediction intervals, and client-side dead-reckoning inside tunnels.',
    actionText: 'Inspecting Passenger Journey View',
    details: 'Demonstrates passenger transparency with dynamic predicted ETAs, confidence bands [18:21 – 18:27], and zero-signal offline dead-reckoning.'
  },
  {
    step: 2,
    title: 'Step 2: Why the ETA Changed — SHAP Factor Attribution',
    tab: 'eta',
    phase: 'SHAP EXPLAINABILITY',
    icon: Activity,
    summary: 'XGBoost predictions are decomposed using TreeExplainer into the top 5 contributing operational factors (initial delay, section congestion, speed deficit, and weather).',
    actionText: 'Evaluating SHAP Factor Breakdown',
    details: 'Replaces "black-box" ML with transparent attribution (+22.3m initial delay, +3.7m section congestion) for controllers and passengers.'
  },
  {
    step: 3,
    title: 'Step 3: Inject Delay Disturbance (Live Event-Driven Loop)',
    tab: 'overview',
    phase: 'EVENT INGESTION',
    icon: Zap,
    summary: 'Simulating an operational disturbance (+6 min congestion & signal holding on section VSKP–VZM). The backend re-forecasts downstream ETAs and broadcasts over WebSockets.',
    actionText: 'Injecting +6m Disturbance Event',
    details: 'Triggers the closed-loop event pipeline: telemetry disturbance → XGBoost recompute → SHAP attribution → WebSocket broadcast.'
  },
  {
    step: 4,
    title: 'Step 4: Cascade Warning & Secondary Train Ripple Graph',
    tab: 'propagation',
    phase: 'CASCADE PROPAGATION',
    icon: Network,
    summary: 'Calculates how primary train delays propagate across secondary services (Train #17240 held at Vizianagaram Outer) with live Time-to-Impact countdowns.',
    actionText: 'Analyzing Network Ripple Propagation',
    details: 'Proactively identifies downstream junction conflicts and platform locks before trains reach the bottleneck section.'
  },
  {
    step: 5,
    title: 'Step 5: What-If Multi-Scenario Decision Support Sandbox',
    tab: 'simulation',
    phase: 'WHAT-IF SANDBOX',
    icon: Sliders,
    summary: 'Compares Option A (Hold on Mainline: +29m), Option B (Speed Acceleration: +17m), and Option C (Platform 2 Turnout Divert: +5.8m) with AI Recommended Choice.',
    actionText: 'Comparing Multi-Scenario Dispatch Options',
    details: 'Enables human-in-the-loop dispatch controllers to test alternative diversion strategies and calculate passenger delay hours saved.'
  },
  {
    step: 6,
    title: 'Step 6: Live Station Display Board (Public Terminal)',
    tab: 'board',
    phase: 'STATION DISPLAY BOARD',
    icon: Tv,
    summary: 'Public station display board for Visakhapatnam Junction (VSKP) updating in real-time over WebSockets with 3-language cyclic announcements (English, Hindi, Telugu).',
    actionText: 'Streaming Live Station Board',
    details: 'Displays revised dynamic expected arrival times, platform allocations, and color-coded status badges for passengers on station concourses.'
  },
  {
    step: 7,
    title: 'Step 7: Model Performance, Residuals & Continual Retraining',
    tab: 'performance',
    phase: 'MODEL VALIDATION',
    icon: Award,
    summary: 'Real validated XGBoost evaluation metrics (MAE: 1.84m, 96.8% within ±5m, 80% CI: [-2.95m, +3.02m]) with one-click continual retraining on live recorded arrivals.',
    actionText: 'Reviewing Model Validation Metrics',
    details: 'Demonstrates continual learning loop, residual confidence intervals, and benchmark performance comparison.'
  }
];

export const SIHDemoModal: React.FC<SIHDemoModalProps> = ({ onClose, onNavigateTab }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentStep = DEMO_STEPS.find(s => s.step === currentStepIndex) || DEMO_STEPS[0];
  const StepIcon = currentStep.icon;

  const executeStep = async (stepNum: number) => {
    setLoading(true);
    try {
      const stepConfig = DEMO_STEPS.find(s => s.step === stepNum);
      if (stepConfig) {
        setCurrentStepIndex(stepNum);
        onNavigateTab(stepConfig.tab, '12864');

        // If step 3 (Inject delay), trigger simulate tick
        if (stepNum === 3) {
          api.triggerTelemetryTick().catch(() => {});
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial jump to Step 1 tab
    executeStep(1);
  }, []);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= DEMO_STEPS.length) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          executeStep(next);
          return next;
        });
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    executeStep(1);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 17, 31, 0.96) 0%, rgba(11, 25, 44, 0.98) 100%)',
      borderBottom: '2px solid var(--accent-cyan)',
      boxShadow: '0 8px 30px rgba(0, 217, 255, 0.25)',
      padding: '0.85rem 1.5rem',
      position: 'sticky',
      top: '57px',
      zIndex: 49,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Left: Step Info & Narrative */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '320px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #00D9FF 100%)',
            color: '#06111F',
            fontWeight: 900,
            fontSize: '0.75rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '8px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 0 10px rgba(0, 217, 255, 0.5)'
          }}>
            <Sparkles size={13} />
            <span>STEP {currentStepIndex}/7</span>
          </div>

          <span className="badge-status badge-ai-intel" style={{ fontSize: '0.675rem', textTransform: 'uppercase' }}>
            {currentStep.phase}
          </span>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
          <div style={{
            fontWeight: 800,
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            lineHeight: 1.2
          }}>
            <StepIcon size={16} color="var(--accent-cyan)" />
            <span>{currentStep.title}</span>
          </div>
          <div style={{
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            marginTop: '2px',
            maxWidth: '750px',
            lineHeight: 1.35
          }}>
            {currentStep.summary}
          </div>
        </div>
      </div>

      {/* Right: Step Indicator Dots & Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Step Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {DEMO_STEPS.map(s => (
            <button
              key={s.step}
              onClick={() => executeStep(s.step)}
              title={s.title}
              style={{
                width: s.step === currentStepIndex ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: s.step === currentStepIndex ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0
              }}
            />
          ))}
        </div>

        {/* Prev Step */}
        <button
          onClick={() => {
            if (currentStepIndex > 1) {
              executeStep(currentStepIndex - 1);
            }
          }}
          disabled={currentStepIndex <= 1 || loading}
          className="btn-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
        >
          <ChevronLeft size={15} />
          <span>Prev</span>
        </button>

        {/* Auto Play Toggle */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={isPlaying ? 'btn-secondary' : 'btn-secondary'}
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            borderColor: isPlaying ? 'var(--color-green)' : undefined,
            color: isPlaying ? 'var(--color-green)' : undefined
          }}
        >
          {isPlaying ? (
            <>
              <Pause size={13} />
              <span>Pause Auto</span>
            </>
          ) : (
            <>
              <Play size={13} />
              <span>Auto Tour</span>
            </>
          )}
        </button>

        {/* Next Step */}
        <button
          onClick={() => {
            if (currentStepIndex < DEMO_STEPS.length) {
              executeStep(currentStepIndex + 1);
            } else {
              executeStep(1);
            }
          }}
          disabled={loading}
          className="btn-primary"
          style={{
            padding: '0.35rem 0.85rem',
            fontSize: '0.75rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #00D9FF 100%)',
            color: '#06111F',
            fontWeight: 800
          }}
        >
          <span>{currentStepIndex === DEMO_STEPS.length ? 'Restart Tour' : 'Next Step'}</span>
          <ChevronRight size={15} />
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="btn-secondary"
          title="Reset Tour to Step 1"
          style={{ padding: '0.35rem 0.5rem' }}
        >
          <RotateCcw size={14} />
        </button>

        {/* Close Banner */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Exit Guided Demo"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
