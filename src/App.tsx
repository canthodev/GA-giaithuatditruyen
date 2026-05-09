import { useState } from 'react';
import { BookOpen, Dna, Play, Trophy, ChevronRight, Clapperboard, LayoutDashboard } from 'lucide-react';
import OverviewTab from './components/OverviewTab';
import ProblemTab from './components/ProblemTab';
import AlgorithmTab from './components/AlgorithmTab';
import RunTab from './components/RunTab';
import ResultsTab from './components/ResultsTab';
import AnimationTab from './components/AnimationTab';

type Tab = 'overview' | 'problem' | 'algorithm' | 'animation' | 'run' | 'results';

const TABS: { id: Tab; label: string; sublabel: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Tổng Quan',       sublabel: 'Tổng Quan',  icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'problem',   label: 'Mô Tả Bài Toán',  sublabel: 'Bài Toán',  icon: <BookOpen className="w-4 h-4" /> },
  { id: 'algorithm', label: 'Giải Thuật GA',    sublabel: 'Thuật Toán', icon: <Dna className="w-4 h-4" /> },
  { id: 'animation', label: 'Hoạt Họa GA',      sublabel: 'Hoạt Họa',  icon: <Clapperboard className="w-4 h-4" /> },
  { id: 'run',       label: 'Chạy GA',           sublabel: 'Chạy',      icon: <Play className="w-4 h-4" /> },
  { id: 'results',   label: 'Kết Quả',           sublabel: 'Kết Quả',   icon: <Trophy className="w-4 h-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [latestRunId, setLatestRunId] = useState<string | null>(null);

  function handleRunComplete(runId: string) {
    setLatestRunId(runId);
    setActiveTab('results');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center h-16 gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow">
                <Dna className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-slate-800 leading-tight">GA Meeting Scheduler</div>
                <div className="text-xs text-slate-400 leading-tight">Giải thuật di truyền</div>
              </div>
            </div>

            {/* Tabs */}
            <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:block">{tab.label}</span>
                  <span className="md:hidden">{tab.sublabel}</span>
                  {i < TABS.length - 1 && (
                    <ChevronRight className={`w-3 h-3 ml-1 ${activeTab === tab.id ? 'text-blue-200' : 'text-slate-300'} hidden lg:block`} />
                  )}
                </button>
              ))}
            </nav>

            {/* Badge */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <span className="px-2 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
                Bài tập GA
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'overview'  && <OverviewTab />}
        {activeTab === 'problem'   && <ProblemTab />}
        {activeTab === 'algorithm' && <AlgorithmTab />}
        {activeTab === 'animation' && <AnimationTab />}
        {activeTab === 'run'       && <RunTab onRunComplete={handleRunComplete} />}
        {activeTab === 'results'   && <ResultsTab latestRunId={latestRunId} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          Ứng dụng minh họa Giải Thuật Di Truyền (GA) cho bài toán Tối Ưu Hóa Lịch Họp &bull; React + TypeScript + Supabase
        </div>
      </footer>
    </div>
  );
}
