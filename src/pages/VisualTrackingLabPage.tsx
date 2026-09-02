// src/pages/VisualTrackingLabPage.tsx
import { useState } from 'react';
import { Eye, Sliders, Video } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Layout';
import { VisionSourceProvider } from '../lib/vision/VisionSourceContext';
import { SourceKindSwitch } from '../components/vision/SourceKindSwitch';
import { CalibratePanel } from '../components/vision/CalibratePanel';
import { TrackPanel } from '../components/vision/TrackPanel';

type TabId = 'calibrate' | 'track';

/**
 * Visual Tracking Lab — LMS Project 2 (Visual Object Tracking). Two tabs,
 * mirroring the course's own two real tools with two different lifetimes:
 * hsv_calibrator.py (interactive, live, run occasionally) and
 * color_tracker_node.py (autonomous, config-driven, restart-to-reconfigure).
 * See docs — the course's own Project Understanding Quiz asks why they're
 * separate scripts; this page is built around that real split.
 *
 * Only this file (via VisionSourceProvider) wires a concrete
 * VisionDataSource — every component below it consumes the seam through
 * useVisionSource()/useVisionFrame(), never MockVisionSource/
 * WebcamVisionSource directly.
 */
export function VisualTrackingLabPage() {
  const [activeTab, setActiveTab] = useState<TabId>('calibrate');

  return (
    <div className="min-h-screen bg-background">
      <Header showBack title="Visual Tracking Lab" icon={Eye} iconColor="text-blue-400" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Card hover={false} theme="blue" className="p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-400/10 text-blue-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text mb-1">Visual Object Tracking — the full loop, run for real</h2>
              <p className="text-xs text-textMuted leading-relaxed">
                Calibrate live HSV color thresholds against a camera feed, then watch a real, hand-rolled vision
                pipeline — mask, contour, centroid, steering — track a target and compute the exact control law
                <code className="mx-1">color_tracker_node.py</code> uses, including the STOP-not-search safety
                behavior when the target is lost. Every stage below is actually computed from the current frame, not
                pre-recorded.
              </p>
            </div>
          </div>
        </Card>

        <VisionSourceProvider>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="inline-flex rounded-xl border border-border/50 overflow-hidden">
              <button
                data-testid="tab-calibrate"
                onClick={() => setActiveTab('calibrate')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold tracking-wider transition-colors ${
                  activeTab === 'calibrate' ? 'bg-blue-400/15 text-blue-400' : 'text-textDim hover:text-textMuted'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                CALIBRATE
              </button>
              <button
                data-testid="tab-track"
                onClick={() => setActiveTab('track')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold tracking-wider transition-colors ${
                  activeTab === 'track' ? 'bg-blue-400/15 text-blue-400' : 'text-textDim hover:text-textMuted'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                TRACK
              </button>
            </div>

            <SourceKindSwitch />
          </div>

          {/* Both panels stay mounted across a tab switch — only the `active`
              prop (not DOM presence) gates each panel's own camera
              subscription. Unmounting CalibratePanel on every switch away
              would reset its trackbar state to the full-range defaults,
              silently discarding a student's in-progress calibration. */}
          <Card hover={false} theme="blue" className="p-6">
            <div className={activeTab === 'calibrate' ? '' : 'hidden'}>
              <CalibratePanel active={activeTab === 'calibrate'} />
            </div>
            <div className={activeTab === 'track' ? '' : 'hidden'}>
              <TrackPanel active={activeTab === 'track'} />
            </div>
          </Card>
        </VisionSourceProvider>
      </main>
    </div>
  );
}
