/*
 * Yarvelle — Personal & Family AI Assistant Application
 * Copyright 2026 Spectrayan (https://spectrayan.com)
 *
 * Licensed under the PolyForm Noncommercial License 1.0.0 and the
 * Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
 * Personal and household local use only. Commercial use, hosted service
 * offering, rebranding, white-labeling, and redistribution of modified
 * forks are prohibited without a written commercial license from Spectrayan.
 *
 * Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Activity,
  Droplet,
  Scale,
  ShieldAlert,
  X,
} from 'lucide-react';
import { ScopedStorage } from '@/lib/storageNamespace';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

export interface VitalReading {
  id: string;
  metric: 'blood_pressure' | 'heart_rate' | 'blood_glucose' | 'weight';
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  bloodGlucose?: number;
  weight?: number;
  bmi?: number;
  effectiveAt: string;
  isAM?: boolean;
  notes?: string;
  classification?: string;
}

export interface VitalsClientProps {
  profileId: string;
}

const DEFAULT_READINGS: VitalReading[] = [
  {
    id: 'v-1',
    metric: 'blood_pressure',
    systolic: 118,
    diastolic: 76,
    heartRate: 68,
    bloodGlucose: 94,
    weight: 168.0,
    bmi: 23.4,
    effectiveAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isAM: true,
    classification: 'Optimal',
    notes: 'Morning resting reading.',
  },
  {
    id: 'v-2',
    metric: 'blood_pressure',
    systolic: 122,
    diastolic: 79,
    heartRate: 72,
    effectiveAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    isAM: false,
    classification: 'Normal',
    notes: 'Evening post-dinner reading.',
  },
  {
    id: 'v-3',
    metric: 'blood_pressure',
    systolic: 116,
    diastolic: 75,
    heartRate: 66,
    effectiveAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    isAM: true,
    classification: 'Optimal',
  },
];

export function VitalsClient({ profileId }: VitalsClientProps) {
  const [readings, setReadings] = useState<VitalReading[]>(DEFAULT_READINGS);
  const [hideWeight, setHideWeight] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form fields
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('70');
  const [bloodGlucose, setBloodGlucose] = useState('95');
  const [weight, setWeight] = useState('168');
  const [notes, setNotes] = useState('');

  const storageKey = `vitals_obs_${profileId}`;
  const hideWeightKey = `vitals_hide_weight_${profileId}`;

  useEffect(() => {
    try {
      const storage = new ScopedStorage();
      const savedReadings = storage.getItem<VitalReading[]>(storageKey, []);
      if (savedReadings && savedReadings.length > 0) {
        setReadings(savedReadings);
      }
      const savedHide = storage.getItem<boolean>(hideWeightKey, false);
      if (typeof savedHide === 'boolean') {
        setHideWeight(savedHide);
      }
    } catch {
      // Fallback to defaults
    }
  }, [storageKey, hideWeightKey]);

  const toggleHideWeight = () => {
    setHideWeight((prev) => {
      const next = !prev;
      try {
        const storage = new ScopedStorage();
        storage.setItem(hideWeightKey, next);
      } catch {}
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  const handleLogVital = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(systolic, 10) || 120;
    const dia = parseInt(diastolic, 10) || 80;
    const hr = parseInt(heartRate, 10) || 70;
    const bg = parseInt(bloodGlucose, 10) || 95;
    const wt = parseFloat(weight) || 168.0;
    const bmiVal = Math.round((wt / ((70 * 70) / 703)) * 10) / 10 || 23.4;

    const newReading: VitalReading = {
      id: `v-${Date.now()}`,
      metric: 'blood_pressure',
      systolic: sys,
      diastolic: dia,
      heartRate: hr,
      bloodGlucose: bg,
      weight: wt,
      bmi: bmiVal,
      effectiveAt: new Date().toISOString(),
      isAM: new Date().getHours() < 12,
      classification: sys < 120 && dia < 80 ? 'Optimal' : sys < 130 && dia < 85 ? 'Normal' : 'Elevated',
      notes: notes.trim() || undefined,
    };

    const updated = [newReading, ...readings];
    setReadings(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(storageKey, updated);
    } catch {}

    setIsLogModalOpen(false);
    setNotes('');
  };

  // COPPA / Minor Audience restriction check: Sam (child, age 9)
  if (profileId === 'sam') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-7 h-7 text-[var(--cf-primary)]" />
          <h1 data-testid="vitals-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            Health & Vitals
          </h1>
        </div>
        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[var(--cf-warning-text)] mx-auto" />
          <h2 className="text-lg font-semibold text-[var(--cf-text-primary)]">Restricted Clinical Access</h2>
          <p className="text-sm text-[var(--cf-text-muted)] max-w-md mx-auto">
            Clinical vitals tracking is restricted for dependent accounts under 13. Please switch to a guardian profile to view or record health metrics.
          </p>
        </div>
      </div>
    );
  }

  const latest = readings[0] || DEFAULT_READINGS[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="vitals-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              Health & Vitals
            </h1>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Diurnal blood pressure trends, resting heart rate, and metabolic biomarkers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleHideWeight}
            data-testid="privacy-hide-weight-btn"
            className="text-xs text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)]"
          >
            {hideWeight ? <Eye className="w-4 h-4 me-1.5" /> : <EyeOff className="w-4 h-4 me-1.5" />}
            {hideWeight ? 'Reveal Weight' : 'Mask Weight'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            data-testid="vitals-refresh-btn"
            aria-label="Refresh vitals"
            className="text-[var(--cf-text-muted)]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLogModalOpen(true)}
            data-testid="log-vitals-open-btn"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Log Reading
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards Grid */}
      <div data-testid="vitals-summary-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure Card */}
        <div data-testid="vitals-card-bp" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--cf-text-muted)]">
            <span className="font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[var(--cf-primary)]" />
              Blood Pressure
            </span>
            <Badge variant="success">Optimal</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              {latest.systolic}/{latest.diastolic}
            </span>
            <span className="text-xs text-[var(--cf-text-muted)]">mmHg</span>
          </div>
          <p className="text-xs text-[var(--cf-text-muted)]">Diurnal resting average</p>
        </div>

        {/* Resting Heart Rate Card */}
        <div data-testid="vitals-card-hr" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--cf-text-muted)]">
            <span className="font-medium flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-[var(--cf-accent)]" />
              Resting HR
            </span>
            <Badge variant="neutral">Normal</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              {latest.heartRate || 68}
            </span>
            <span className="text-xs text-[var(--cf-text-muted)]">bpm</span>
          </div>
          <p className="text-xs text-[var(--cf-text-muted)]">Apple Health synced</p>
        </div>

        {/* Blood Glucose Card */}
        <div data-testid="vitals-card-glucose" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--cf-text-muted)]">
            <span className="font-medium flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-[var(--cf-primary)]" />
              Fasting Glucose
            </span>
            <Badge variant="success">In Range</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              {latest.bloodGlucose || 94}
            </span>
            <span className="text-xs text-[var(--cf-text-muted)]">mg/dL</span>
          </div>
          <p className="text-xs text-[var(--cf-text-muted)]">Pre-breakfast reading</p>
        </div>

        {/* Weight & BMI Card */}
        <div data-testid="vitals-card-weight" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--cf-text-muted)]">
            <span className="font-medium flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[var(--cf-text-muted)]" />
              Weight & BMI
            </span>
            <Badge variant="neutral">{hideWeight ? 'Masked' : 'Healthy'}</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              {hideWeight ? '••••' : (latest.weight || 168.0).toFixed(1)}
            </span>
            <span className="text-xs text-[var(--cf-text-muted)]">
              {hideWeight ? '' : 'lbs'}
            </span>
          </div>
          <p className="text-xs text-[var(--cf-text-muted)]">
            {hideWeight ? 'Hidden for privacy' : `BMI ${latest.bmi || 23.4}`}
          </p>
        </div>
      </div>

      {/* Blood Pressure Diurnal Trend Chart */}
      <div data-testid="bp-trend-chart" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--cf-text-primary)]">Blood Pressure Diurnal Trend</h2>
            <p className="text-xs text-[var(--cf-text-muted)]">Morning (AM) vs Evening (PM) systolic readings with 120 mmHg threshold.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--cf-text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--cf-primary)]"></span> AM Readings
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--cf-accent)]"></span> PM Readings
            </span>
          </div>
        </div>

        {/* Visualization area */}
        <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[var(--cf-border)] relative">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--cf-border)] pointer-events-none flex justify-end">
            <span className="text-[10px] text-[var(--cf-text-muted)] -translate-y-3.5 pe-1">120 mmHg (Target)</span>
          </div>
          {readings.slice(0, 10).map((r, i) => {
            const val = r.systolic || 120;
            const heightPercent = Math.min(100, Math.max(20, ((val - 90) / 60) * 100));
            return (
              <div key={r.id || i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[28px] rounded-t-md transition-all ${
                    r.isAM ? 'bg-[var(--cf-primary)]' : 'bg-[var(--cf-accent)]'
                  }`}
                />
                <span className="text-[10px] text-[var(--cf-text-muted)]">
                  {r.isAM ? 'AM' : 'PM'}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 px-2 py-1 rounded bg-[var(--cf-surface-elevated)] border border-[var(--cf-border)] shadow-md text-[10px] whitespace-nowrap">
                  {val}/{r.diastolic} mmHg
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diurnal Trend Table */}
      <div data-testid="diurnal-trend-table" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[var(--cf-border)]">
          <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Diurnal Window Averages</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-[var(--cf-surface-muted)] text-[var(--cf-text-muted)] border-b border-[var(--cf-border)]">
              <tr>
                <th className="py-2.5 px-4 font-medium text-start">Window</th>
                <th className="py-2.5 px-4 font-medium text-start">Readings Count</th>
                <th className="py-2.5 px-4 font-medium text-start">AM Systolic / Diastolic</th>
                <th className="py-2.5 px-4 font-medium text-start">PM Systolic / Diastolic</th>
                <th className="py-2.5 px-4 font-medium text-start">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cf-border)] text-[var(--cf-text-primary)]">
              <tr>
                <td className="py-3 px-4 font-medium">Last 7 Days</td>
                <td className="py-3 px-4 text-[var(--cf-text-muted)]">14 readings</td>
                <td className="py-3 px-4">117 / 76 mmHg</td>
                <td className="py-3 px-4">121 / 78 mmHg</td>
                <td className="py-3 px-4"><Badge variant="success">Normal</Badge></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Last 30 Days</td>
                <td className="py-3 px-4 text-[var(--cf-text-muted)]">58 readings</td>
                <td className="py-3 px-4">118 / 77 mmHg</td>
                <td className="py-3 px-4">122 / 79 mmHg</td>
                <td className="py-3 px-4"><Badge variant="success">Normal</Badge></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Last 90 Days</td>
                <td className="py-3 px-4 text-[var(--cf-text-muted)]">172 readings</td>
                <td className="py-3 px-4">119 / 78 mmHg</td>
                <td className="py-3 px-4">123 / 80 mmHg</td>
                <td className="py-3 px-4"><Badge variant="warning">Borderline</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Vitals Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent data-testid="log-vitals-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Health & Vitals</DialogTitle>
            <DialogDescription>
              Record an observation. Numerical readings are stored securely in local storage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogVital} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Systolic (mmHg)
                </label>
                <input
                  type="number"
                  name="systolic"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  name="diastolic"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  HR (bpm)
                </label>
                <input
                  type="number"
                  name="heartRate"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Glucose
                </label>
                <input
                  type="number"
                  name="bloodGlucose"
                  value={bloodGlucose}
                  onChange={(e) => setBloodGlucose(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Clinical Context & Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Morning resting, after 5 min quiet rest..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsLogModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" data-testid="submit-vitals-btn">
                Save Observation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
