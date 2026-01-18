"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wand2, Swords, Clock, FlaskConical,
  Loader2, Sparkles, Gamepad2,
  Headphones, Palette, Wind, Music, Calendar,
  MessageCircle, Dna, Radar, History, RotateCcw
} from 'lucide-react';
import {
  Radar as RechartsRadar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import clsx from 'clsx';
import { flavorService, Reference } from "../../services/api";
import FlavorGalaxy from '../../components/FlavorGalaxy';
import InlineNotice from '../../components/InlineNotice';
import OnboardingGuide, { TourStep } from '../../components/OnboardingGuide';

const TOUR_STEPS: TourStep[] = [
  { targetId: "vibe-lab-tab", title: "감각 연구소 시작하기", content: "AI 기반의 감각 큐레이션을 경험할 수 있는 '감각 연구소' 탭입니다.", position: "bottom" },
  { targetId: "vibe-target-atmosphere", title: "분위기 선택", content: "원하는 공간의 분위기(Chill, Energetic 등)를 선택하세요.", position: "top" },
  { targetId: "vibe-recommend-btn", title: "AI 추천 받기", content: "선택한 분위기에 맞춰 AI가 초기 설정을 제안해줍니다.", position: "top" },
  { targetId: "vibe-analyze-btn", title: "심층 분석", content: "추천받은 설정을 바탕으로 색채, 음악, 향기를 포함한 심층 분석을 실행합니다.", position: "top" },
  { targetId: "vibe-export-btn", title: "Lab으로 내보내기", content: "분석된 결과를 연구소(Lab)로 보내 상세 레시피를 설계할 수 있습니다.", position: "top" },
];

const AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminPage() {
  const [namingLoading, setNamingLoading] = useState(false);
  const [battleLoading, setBattleLoading] = useState(false);
  const [vibeRecLoading, setVibeRecLoading] = useState(false);
  const [vibeAnalysisLoading, setVibeAnalysisLoading] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [activeTab, setActiveTab] = useState("naming");
  const router = useRouter();

  // Naming
  const [namingResult, setNamingResult] = useState<any>(null);
  const [namingVector, setNamingVector] = useState([0.7, 0.4, 0.6, 0.3, 0.5]);
  const [namingStyle, setNamingStyle] = useState("premium");
  const [namingRecommendation, setNamingRecommendation] = useState<string | null>(null);
  const [namingHistory, setNamingHistory] = useState<any[]>([]);

  // Battle
  const [battleResult, setBattleResult] = useState<any>(null);
  const [battleRef1, setBattleRef1] = useState("");
  const [battleRef2, setBattleRef2] = useState("");
  const [mixRatio, setMixRatio] = useState(0.5);
  const [battleRecommendation, setBattleRecommendation] = useState<string | null>(null);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: "info" | "success" | "warning" | "error"; message: string } | null>(null);

  // Time Machine (Integrated into Vibe Lab)
  const [targetEra, setTargetEra] = useState("Modern");

  useEffect(() => {
    fetchData();
    try {
      const storedNaming = localStorage.getItem("playground:naming_recs");
      const storedBattle = localStorage.getItem("playground:battle_recs");
      const storedVibe = localStorage.getItem("playground:vibe_recs");
      setNamingHistory(storedNaming ? JSON.parse(storedNaming) : []);
      setBattleHistory(storedBattle ? JSON.parse(storedBattle) : []);
      setVibeHistory(storedVibe ? JSON.parse(storedVibe) : []);
    } catch (error) {
      console.error("Failed to load recommendation history", error);
    }
  }, []);



  const fetchData = async () => {
    try {
      const refs = await flavorService.getReferences();
      setReferences(refs);
    } catch (err) {
      console.error(err);
    }
  };

  const runNaming = async () => {
    try {
      setNamingLoading(true);
      const result = await flavorService.generateNaming(namingVector, "Chicken", namingStyle);
      setNamingResult(result);
      setNamingRecommendation(null);
    } catch (err) {
      setNotice({ tone: "error", message: "이름 생성에 실패했어요. 다시 시도해주세요." });
    } finally {
      setNamingLoading(false);
    }
  };

  const runBattle = async () => {
    if (!battleRef1 || !battleRef2) {
      setNotice({ tone: "warning", message: "두 레퍼런스를 선택해주세요." });
      return;
    }
    try {
      setBattleLoading(true);
      const result = await flavorService.mixBattle(battleRef1, battleRef2, mixRatio);
      setBattleResult(result);
      setBattleRecommendation(null);
    } catch (err) {
      setNotice({ tone: "error", message: "배틀 생성에 실패했어요. 다시 시도해주세요." });
    } finally {
      setBattleLoading(false);
    }
  };

  const recommendNaming = async () => {
    try {
      setNamingLoading(true);
      const response = await fetch(`${API_BASE}/v1/recommend/naming`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: namingStyle }),
      });
      if (!response.ok) {
        throw new Error("recommendation failed");
      }
      const data = await response.json();
      setNamingVector(data.vector);
      setNamingRecommendation(data.message || "추천 결과를 불러왔어요.");
      const nextHistory = [
        {
          vector: data.vector,
          style: namingStyle,
          message: data.message || "추천 결과를 불러왔어요.",
          createdAt: new Date().toISOString(),
        },
        ...namingHistory.filter(
          (item) =>
            item.style !== namingStyle ||
            JSON.stringify(item.vector) !== JSON.stringify(data.vector)
        ),
      ].slice(0, 5);
      setNamingHistory(nextHistory);
      localStorage.setItem("playground:naming_recs", JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Naming recommendation error:", error);
      setNamingRecommendation("추천을 불러오지 못했어요. 다시 시도해주세요.");
      setNotice({ tone: "error", message: "추천 생성에 실패했어요. 잠시 후 다시 시도해주세요." });
    } finally {
      setNamingLoading(false);
    }
  };

  const recommendBattle = async () => {
    try {
      setBattleLoading(true);
      const response = await fetch(`${API_BASE}/v1/recommend/battle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("recommendation failed");
      }
      const data = await response.json();
      if (data.reference_1_id && data.reference_2_id) {
        setBattleRef1(data.reference_1_id);
        setBattleRef2(data.reference_2_id);
        setMixRatio(data.mix_ratio ?? 0.5);
      }
      setBattleRecommendation(data.message || "추천 결과를 불러왔어요.");

      const nextHistory = [
        {
          reference_1_id: data.reference_1_id || "",
          reference_2_id: data.reference_2_id || "",
          mix_ratio: data.mix_ratio ?? 0.5,
          message: data.message || "추천 결과를 불러왔어요.",
          createdAt: new Date().toISOString(),
        },
        ...battleHistory.filter(
          (item) =>
            item.reference_1_id !== (data.reference_1_id || "") ||
            item.reference_2_id !== (data.reference_2_id || "") ||
            item.mix_ratio !== (data.mix_ratio ?? 0.5)
        ),
      ].slice(0, 5);
      setBattleHistory(nextHistory);
      localStorage.setItem("playground:battle_recs", JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Battle recommendation error:", error);
      setBattleRecommendation("추천을 불러오지 못했어요. 다시 시도해주세요.");
      setNotice({ tone: "error", message: "배틀 추천을 불러오지 못했어요." });
    } finally {
      setBattleLoading(false);
    }
  };

  const recommendVibe = async () => {
    try {
      setVibeRecLoading(true);
      const response = await fetch(`${API_BASE}/v1/recommend/vibe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("recommendation failed");
      }
      const data = await response.json();
      setVibeResult(null);
      setPlaylist(null);
      await runVibeAnalysisWith(data.mode, data.era);
      setVibeRecommendation(data.message || "추천 결과를 불러왔어요.");
      const nextHistory = [
        {
          mode: data.mode,
          era: data.era,
          message: data.message || "추천 결과를 불러왔어요.",
          createdAt: new Date().toISOString(),
        },
        ...vibeHistory.filter((item) => item.mode !== data.mode || item.era !== data.era),
      ].slice(0, 5);
      setVibeHistory(nextHistory);
      localStorage.setItem("playground:vibe_recs", JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Vibe recommendation error:", error);
      setVibeRecommendation("추천을 불러오지 못했어요. 다시 시도해주세요.");
      setNotice({ tone: "error", message: "감각 추천에 실패했어요. 다시 시도해주세요." });
    } finally {
      setVibeRecLoading(false);
    }
  };



  const tabs = [
    { id: "naming", label: "이름 생성", icon: Wand2 },
    { id: "battle", label: "믹스 배틀", icon: Swords },
    { id: "vibe", label: "감각 연구소", icon: Headphones, elementId: "vibe-lab-tab" },
  ];

  // Vibe Lab State
  const [vibeMode, setVibeMode] = useState("Chill");
  const [vibeResult, setVibeResult] = useState<any>(null);
  const [playlist, setPlaylist] = useState<any[] | null>(null);
  const [vibeRecommendation, setVibeRecommendation] = useState<string | null>(null);
  const [vibeHistory, setVibeHistory] = useState<any[]>([]);
  const [spaceImage, setSpaceImage] = useState<File | null>(null);
  const [spacePreviewUrl, setSpacePreviewUrl] = useState<string | null>(null);
  const [spaceType, setSpaceType] = useState("cafe");
  const [spaceCurationLoading, setSpaceCurationLoading] = useState(false);

  useEffect(() => {
    if (!spaceImage) {
      setSpacePreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(spaceImage);
    setSpacePreviewUrl(nextUrl);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [spaceImage]);

  /* 
   * [BACKEND CONNECTED] - Real AI Service Integration
   * Previously used 'generateVibeData' mock is now replaced by actual API calls.
   */

  // Derived state to replace missing vibeBusy
  const vibeBusy = vibeRecLoading || vibeAnalysisLoading || playlistLoading || spaceCurationLoading;

  // Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

  const startTour = () => setIsTourOpen(true);

  const runVibeAnalysisWith = async (mode: string, era: string) => {
    setVibeAnalysisLoading(true);
    setPlaylist(null);
    setVibeRecommendation(null);

    try {
      const response = await fetch(`${API_BASE}/v1/vibe/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, era })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setVibeMode(mode);
      setTargetEra(era);
      setVibeResult(data);
    } catch (error) {
      console.error("Vibe Analysis Error:", error);
      setNotice({ tone: "error", message: "감각 분석 연결에 실패했어요. 백엔드를 확인해주세요." });
    } finally {
      setVibeAnalysisLoading(false);
    }
  };

  const runVibeAnalysis = async () => {
    await runVibeAnalysisWith(vibeMode, targetEra);
  };

  const runPlaylistGeneration = async () => {
    setPlaylistLoading(true);
    setVibeResult(null); // Clear single result
    setVibeRecommendation(null);

    try {
      const response = await fetch(`${API_BASE}/v1/vibe/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Playlist generation failed');
      }

      const data = await response.json();
      setPlaylist(data.playlist);
    } catch (error) {
      console.error("Playlist Error:", error);
      setNotice({ tone: "error", message: "스케줄 생성에 실패했어요. 백엔드를 확인해주세요." });
    } finally {
      setPlaylistLoading(false);
    }
  };

  const runSpaceCuration = async () => {
    if (!spaceImage) {
      setNotice({ tone: "warning", message: "공간 사진을 업로드해주세요." });
      return;
    }

    try {
      setSpaceCurationLoading(true);
      setVibeResult(null);
      setPlaylist(null);
      setVibeRecommendation(null);

      const formData = new FormData();
      formData.append("image", spaceImage);
      formData.append("space_type", spaceType);
      formData.append("era", targetEra);

      const response = await fetch(`${API_BASE}/v1/vibe/curate-image`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("curation failed");
      }

      const data = await response.json();
      setVibeMode(data.mode);
      setTargetEra(data.era);
      setVibeResult(data);
      setVibeRecommendation("공간 사진 기반 큐레이션 결과입니다.");
    } catch (error) {
      console.error("Space curation error:", error);
      setVibeRecommendation("사진 기반 큐레이션에 실패했어요. 다시 시도해주세요.");
      setNotice({ tone: "error", message: "사진 기반 큐레이션에 실패했어요." });
    } finally {
      setSpaceCurationLoading(false);
    }
  };




  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-50/50 blur-[100px] pointer-events-none" />
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Gamepad2 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vibe Lab</h1>
          <p className="text-sm text-slate-500">감각 큐레이션 및 공간 설계</p>
        </div>
      </div>

      {notice && (
        <InlineNotice
          tone={notice.tone}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      {/* Flavor Galaxy Visualization */}
      <div className="mb-8">
        <FlavorGalaxy references={references} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-50 rounded-lg inline-flex border border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={tab.elementId}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-indigo-600" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        {/* Demo Tip */}
        <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-xs text-indigo-700">
          <span className="font-bold text-indigo-600">Pro Tip:</span>{" "}
          공간 사진을 업로드하면 감각 프로필을 자동으로 큐레이션합니다.
        </div>
        {/* Naming Tab */}
        {activeTab === "naming" && (
          <div className="space-y-6">

            <h2 className="text-lg font-medium tracking-tight text-slate-900 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              네이밍 & 컨셉 생성기
            </h2>

            <div className="grid grid-cols-5 gap-3">
              {AXES.map((axis, i) => (
                <div key={axis}>
                  <label className="text-xs text-slate-500 block mb-1">{axis}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={namingVector[i]}
                    onChange={(e) => {
                      const newVec = [...namingVector];
                      newVec[i] = parseFloat(e.target.value);
                      setNamingVector(newVec);
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-center text-slate-500">{namingVector[i].toFixed(1)}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 items-end">
              <div>
                <label className="text-xs text-slate-500 block mb-1">스타일</label>
                <select
                  value={namingStyle}
                  onChange={(e) => setNamingStyle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="premium">프리미엄</option>
                  <option value="fun">재미있는</option>
                  <option value="elegant">우아한</option>
                </select>
              </div>
              <button
                onClick={recommendNaming}
                disabled={namingLoading}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full font-semibold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
              >
                {namingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                AI 추천
              </button>
              <button
                onClick={runNaming}
                disabled={namingLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {namingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                생성하기
              </button>
            </div>

            {namingRecommendation && (
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {namingRecommendation}
              </div>
            )}

            {namingHistory.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-700 mb-2">최근 추천</div>
                <div className="space-y-2">
                  {namingHistory.map((item, index) => (
                    <button
                      key={`${item.createdAt}-${index}`}
                      onClick={() => {
                        setNamingVector(item.vector);
                        setNamingStyle(item.style);
                        setNamingRecommendation(item.message);
                      }}
                      className="w-full text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-2 hover:bg-slate-100"
                    >
                      {item.style} · {item.vector.map((v: number) => v.toFixed(1)).join(", ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {namingResult && (
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                <h3 className="text-xl font-bold text-purple-900 mb-2">{namingResult.generated_name}</h3>
                <p className="text-slate-600 mb-3">{namingResult.concept_story}</p>
                <div className="flex gap-2">
                  {namingResult.keywords?.map((k: string) => (
                    <span key={k} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Battle Tab */}
        {activeTab === "battle" && (
          <div className="space-y-6">

            <h2 className="text-lg font-medium tracking-tight text-slate-900 flex items-center gap-2">
              <Swords className="w-5 h-5 text-indigo-600" />
              맛 믹스 배틀
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">레퍼런스 1</label>
                <select
                  value={battleRef1}
                  onChange={(e) => setBattleRef1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">선택...</option>
                  {references.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">믹스 비율</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={mixRatio}
                  onChange={(e) => setMixRatio(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-center text-slate-500">{(mixRatio * 100).toFixed(0)}%</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">레퍼런스 2</label>
                <select
                  value={battleRef2}
                  onChange={(e) => setBattleRef2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">선택...</option>
                  {references.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={recommendBattle}
                disabled={battleLoading}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full font-semibold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
              >
                {battleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                AI 추천
              </button>
              <button
                onClick={runBattle}
                disabled={battleLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {battleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                배틀 시작
              </button>
            </div>

            {battleRecommendation && (
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {battleRecommendation}
              </div>
            )}

            {battleHistory.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-700 mb-2">최근 추천</div>
                <div className="space-y-2">
                  {battleHistory.map((item, index) => {
                    const ref1Name = references.find((ref) => ref.id === item.reference_1_id)?.name || "레퍼런스 1";
                    const ref2Name = references.find((ref) => ref.id === item.reference_2_id)?.name || "레퍼런스 2";
                    return (
                      <button
                        key={`${item.createdAt}-${index}`}
                        onClick={() => {
                          setBattleRef1(item.reference_1_id);
                          setBattleRef2(item.reference_2_id);
                          setMixRatio(item.mix_ratio);
                          setBattleRecommendation(item.message);
                        }}
                        className="w-full text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-2 hover:bg-slate-100"
                      >
                        {ref1Name} + {ref2Name} · {(item.mix_ratio * 100).toFixed(0)}%
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {battleResult && (
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div className="font-bold text-slate-900">{battleResult.ref1?.name}</div>
                  <div className="text-2xl font-bold text-red-500">VS</div>
                  <div className="font-bold text-slate-900">{battleResult.ref2?.name}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-500">{battleResult.scores?.total?.toFixed(1)}</div>
                  <div className="text-sm text-slate-500">믹스 점수</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vibe Tab */}
        {activeTab === "vibe" && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium tracking-tight text-slate-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-indigo-600" />
              감각 연구소 (Beta)
              <button
                onClick={startTour}
                className="ml-auto text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                가이드
              </button>
            </h2>
            <p className="text-sm text-slate-500">
              공간의 목적과 분위기를 선택하면, 시각(Color), 청각(Music), 후각(Scent) 솔루션을 통합 설계합니다.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <div className="text-sm font-display font-semibold text-slate-900">공간 사진 기반 큐레이션</div>
                  <div className="text-xs text-slate-500">공간 사진을 업로드하면 향/음악/레시피를 맞춤 큐레이션합니다.</div>
                </div>
                <div className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-500">
                  최종 산출물: 레시피
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-full cursor-pointer hover:bg-slate-200 text-slate-700">
                      사진 업로드
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSpaceImage(file);
                        }}
                      />
                    </label>
                    {spaceImage && (
                      <button
                        type="button"
                        onClick={() => setSpaceImage(null)}
                        className="text-xs text-slate-500 hover:text-red-500"
                      >
                        제거
                      </button>
                    )}
                  </div>
                  <div className="h-40 rounded-2xl border border-dashed border-white/15 bg-black/30 flex items-center justify-center text-xs text-[#b7aba0] overflow-hidden">
                    {spacePreviewUrl ? (
                      <img src={spacePreviewUrl} alt="공간 사진 미리보기" className="h-full w-full object-cover" />
                    ) : (
                      <span>공간 사진을 업로드하면 미리보기가 표시됩니다.</span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#b7aba0] block mb-1">공간 유형</label>
                    <select
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 text-[#f7f1ea] rounded-full py-2 px-3 text-sm font-semibold"
                    >
                      <option value="cafe">카페</option>
                      <option value="restaurant">레스토랑</option>
                      <option value="hotel">호텔/라운지</option>
                      <option value="retail">리테일</option>
                      <option value="office">오피스</option>
                      <option value="gallery">갤러리</option>
                      <option value="popup">팝업</option>
                    </select>
                  </div>
                  <button
                    onClick={runSpaceCuration}
                    disabled={spaceCurationLoading || !spaceImage}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 shadow-sm"
                  >
                    {spaceCurationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Run Visual Curation
                  </button>
                </div>
              </div>
            </div>

            {/* Vibe Lab Content */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">Target Atmosphere</label>
                <div className="grid grid-cols-4 gap-2" id="vibe-target-atmosphere">
                  {["Chill", "Energetic", "Focus", "Romantic"].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setVibeMode(mode)}
                      className={clsx(
                        "py-3 rounded-xl text-sm font-medium border transition-all",
                        vibeMode === mode
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-1/3">
                <label className="text-xs text-slate-500 block mb-1">Time Era (Time Machine)</label>
                <select
                  value={targetEra}
                  onChange={(e) => setTargetEra(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-3 px-4 text-sm font-medium appearance-none cursor-pointer hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Modern">Modern (Current)</option>
                  <option value="1990s">1990s Retro</option>
                  <option value="2000s">2000s Millennium</option>
                  <option value="2020s">2020s Future</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                id="vibe-recommend-btn"
                onClick={recommendVibe}
                disabled={vibeBusy}
                className="flex-1 py-4 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {vibeRecLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                AI Recommend
              </button>
              <button
                id="vibe-analyze-btn"
                onClick={runVibeAnalysis}
                disabled={vibeBusy}
                className={clsx(
                  "flex-1 py-4 rounded-xl font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-50 border",
                  vibeAnalysisLoading ? "bg-indigo-600/50 border-indigo-500" :
                    vibeResult && !playlist && !vibeAnalysisLoading
                      ? "bg-indigo-600 text-white shadow-md border-indigo-500"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                )}
              >
                {vibeAnalysisLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Deep Analysis
              </button>
              <button
                onClick={runPlaylistGeneration}
                disabled={vibeBusy}
                className={clsx(
                  "flex-1 py-4 rounded-xl font-medium flex justify-center items-center gap-2 transition-colors disabled:opacity-50 border",
                  playlistLoading ? "bg-indigo-600/50 border-indigo-500" :
                    playlist && !playlistLoading
                      ? "bg-slate-200 text-slate-800 border-slate-300"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                )}
              >
                {playlistLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                Create Schedule
              </button>
              <button
                id="vibe-export-btn"
                onClick={() => {
                  if (!vibeResult) {
                    setNotice({
                      tone: "warning",
                      message: "Analysis required first.",
                    });
                    return;
                  }

                  const params = new URLSearchParams();
                  params.set("mode", "SIGNATURE");
                  params.set("vibe_mode", vibeMode);
                  params.set("vibe_era", targetEra);
                  if (vibeResult.scent && vibeResult.scent.top) {
                    params.set("vibe_scent", vibeResult.scent.top);
                  }

                  console.log("Exporting to Lab with params:", params.toString());
                  router.push(`/lab?${params.toString()}`);
                }}
                disabled={!vibeResult || vibeBusy}
                className={clsx(
                  "flex-1 py-4 rounded-xl font-medium flex justify-center items-center gap-2 transition-colors border",
                  vibeResult && !vibeBusy
                    ? "bg-emerald-600 text-white shadow-sm border-emerald-500 hover:bg-emerald-500"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                )}
              >
                <FlaskConical className="w-5 h-5" />
                Export to Lab
              </button>
            </div>

            {vibeRecommendation && (
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {vibeRecommendation}
              </div>
            )}

            {vibeHistory.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <History className="w-4 h-4" />
                    <span>최근 추천 기록</span>
                  </div>
                  <span className="text-[10px] text-slate-500">클릭하여 큐레이션 실행</span>
                </div>
                <div className="space-y-2">
                  {vibeHistory.map((item, index) => (
                    <button
                      key={`${item.createdAt}-${index}`}
                      onClick={async () => {
                        await runVibeAnalysisWith(item.mode, item.era);
                        setVibeRecommendation(item.message);
                      }}
                      className="group w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-indigo-500 hover:shadow-lg transition-all text-left"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                            {item.mode}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {item.era}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {vibeResult && (
              <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 1. Executive Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DNA & Synergy */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                          <Dna className="w-4 h-4 text-purple-500" />
                          Sensory DNA
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{vibeResult.dna}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={clsx(
                          "text-xs font-bold px-2 py-1 rounded border",
                          vibeResult.synergy.score >= 90 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200"
                        )}>
                          {vibeResult.synergy.status}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 mt-1">{vibeResult.synergy.score}%</span>
                      </div>
                    </div>

                    {/* DNA Visual */}
                    <div className="h-12 flex items-center gap-1 rounded-lg overflow-hidden relative">
                      {/* Animated Gradient Bar */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full h-full animate-[shimmer_2s_infinite]" />
                      {vibeResult.colors.map((c: string, i: number) => (
                        <div key={i} className="h-full flex-1 transition-all hover:flex-[1.5]" style={{ background: c }} />
                      ))}
                    </div>
                  </div>

                  {/* Recharts - Risk Radar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                      <Radar className="w-4 h-4 text-pink-500" />
                      Risk Radar
                    </h3>
                    <div className="flex-1 min-h-[160px] text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={vibeResult.risk}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <RechartsRadar
                            name="Risk"
                            dataKey="A"
                            stroke="#ec4899"
                            fill="#ec4899"
                            fillOpacity={0.2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 2. Sensory Specs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Visual */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-slate-700">
                      <Palette className="w-4 h-4" />
                      <span className="font-bold text-sm">Visual Palette</span>
                    </div>
                    <div className="flex gap-3 justify-center py-6">
                      {vibeResult.colors.map((c: string, i: number) => (
                        <div key={i} className="group relative">
                          <div className="w-14 h-14 rounded-full shadow-lg transform group-hover:scale-110 transition-transform ring-2 ring-slate-200 group-hover:ring-indigo-500" style={{ backgroundColor: c }} />
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Auditory */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-4 text-slate-700">
                      <Music className="w-4 h-4" />
                      <span className="font-bold text-sm">Auditory Landscape</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2 z-10 relative">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center mb-4 shadow-xl group-hover:animate-[spin_4s_linear_infinite]">
                          <div className="absolute inset-0 rounded-full border border-slate-300" />
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-cyan-100 text-cyan-700 text-[10px] px-1.5 py-0.5 rounded-full border border-cyan-200 font-mono">
                          {vibeResult.music.bpm} BPM
                        </div>
                      </div>

                      <div className="font-bold text-sm text-slate-800">{vibeResult.music.track}</div>
                      <div className="text-xs text-slate-500">{vibeResult.music.genre}</div>
                    </div>

                    {/* Equalizer Viz */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 flex gap-1 items-end justify-center opacity-20 group-hover:opacity-40 transition-opacity px-6">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex-1 bg-slate-400 rounded-t-sm animate-pulse" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>

                  {/* Olfactory */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-slate-700">
                      <Wind className="w-4 h-4" />
                      <span className="font-bold text-sm">Olfactory Pyramid</span>
                    </div>
                    <div className="space-y-4 relative">
                      <div className="flex flex-col gap-1">
                        <div className="text-center p-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 w-1/3 mx-auto">
                          <span className="block text-[9px] text-emerald-500 uppercase tracking-wider">Top</span>
                          {vibeResult.scent.top}
                        </div>
                        <div className="text-center p-1.5 bg-emerald-100 border border-emerald-200 rounded text-xs text-emerald-700 w-2/3 mx-auto">
                          <span className="block text-[9px] text-emerald-500 uppercase tracking-wider">Middle</span>
                          {vibeResult.scent.middle}
                        </div>
                        <div className="text-center p-2 bg-emerald-200 border border-emerald-300 rounded text-sm font-medium text-emerald-800 w-full mx-auto">
                          <span className="block text-[9px] text-emerald-600 uppercase tracking-wider">Base</span>
                          {vibeResult.scent.base}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. AI Persona Simulation */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600 mb-6">
                    <MessageCircle className="w-4 h-4" />
                    Real-time Customer Simulation
                  </h3>
                  <div className="space-y-4">
                    {vibeResult.personas.map((p: any, i: number) => (
                      <div key={i} className={clsx(
                        "flex gap-4 items-start animate-in slide-in-from-left-4 fade-in duration-500",
                        { "delay-0": i === 0, "delay-150": i === 1, "delay-300": i === 2 }
                      )}>
                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-indigo-100">
                            {p.initial}
                          </div>
                        </div>
                        <div className="relative bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex-1">
                          <div className="absolute -top-2 left-0 text-[10px] text-slate-500 bg-white px-2 rounded-full border border-slate-200">
                            {p.name}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            "{p.comment}"
                          </p>
                          <div className="mt-2 flex gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 bg-white rounded text-slate-500 border border-slate-200">
                              ❤️ {p.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
            {playlist && (
              <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-8">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Daily Sensory Schedule
                </h3>
                <div className="relative border-l-2 border-slate-200 ml-4 pl-8 pb-4 space-y-8">
                  {playlist.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[39px] top-0 w-5 h-5 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-500 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-indigo-600 font-mono text-sm font-bold">{item.time}</span>
                            <h4 className="text-lg font-bold text-slate-800">{item.label}</h4>
                          </div>
                          <div className="gap-2 hidden md:flex">
                            {item.colors.map((c: string) => (
                              <div key={c} className="w-6 h-6 rounded-full ring-1 ring-slate-200" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Headphones className="w-3 h-3 text-cyan-500" />
                            <span>{item.music.track}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Wind className="w-3 h-3 text-emerald-500" />
                            <span>{item.scent.top} + {item.scent.base}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <OnboardingGuide
        steps={TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={() => setIsTourOpen(false)}
      />
    </div>
  );
}
