import { Game } from './game';
import type { LevelData, HarmonicClassroomState, HarmonicAnalysisResult } from './types';
import { healthCheck } from './api';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

const levelNumEl = document.getElementById('level-num')!;
const creatureNameEl = document.getElementById('creature-name')!;
const connectedCountEl = document.getElementById('connected-count')!;
const totalCountEl = document.getElementById('total-count')!;
const progressFillEl = document.getElementById('progress-fill')!;
const hintTitleEl = document.getElementById('hint-title')!;
const hintTextEl = document.getElementById('hint-text')!;
const completeModal = document.getElementById('complete-modal')!;
const modalTitleEl = document.getElementById('modal-title')!;
const modalDescEl = document.getElementById('modal-desc')!;

const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const btnHint = document.getElementById('btn-hint') as HTMLButtonElement;
const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
const btnClassroom = document.getElementById('btn-classroom') as HTMLButtonElement;
const btnClassroomClear = document.getElementById('btn-classroom-clear') as HTMLButtonElement;
const btnPanelClose = document.getElementById('btn-panel-close') as HTMLButtonElement;

const harmonicPanel = document.getElementById('harmonic-panel')!;
const slot1 = document.getElementById('slot-1')!;
const slot2 = document.getElementById('slot-2')!;
const slot1Name = document.getElementById('slot1-name')!;
const slot1Freq = document.getElementById('slot1-freq')!;
const slot2Name = document.getElementById('slot2-name')!;
const slot2Freq = document.getElementById('slot2-freq')!;
const ratioTitle = document.getElementById('ratio-title')!;
const ratioNumbers = document.getElementById('ratio-numbers')!;
const ratioStatus = document.getElementById('ratio-status')!;
const explainSection = document.getElementById('explain-section')!;
const cardResult = document.getElementById('card-result')!;
const cardMath = document.getElementById('card-math')!;
const cardFact = document.getElementById('card-fact')!;
const cardVisual = document.getElementById('card-visual')!;
const panelTip = document.getElementById('panel-tip')!;

const MAX_LEVELS = 3;

game.setCallbacks({
  onLevelChange: (level: LevelData) => {
    levelNumEl.textContent = String(level.id);
    creatureNameEl.textContent = level.creatureName;
    totalCountEl.textContent = String(level.edges.length);
    connectedCountEl.textContent = '0';
    progressFillEl.style.width = '0%';
    completeModal.classList.remove('show');

    hintTitleEl.textContent = `关卡 ${level.id}: ${level.name}`;
    hintTextEl.textContent = '寻找闪烁频率成倍数关系的恒星，从一颗星拖动到另一颗星连接它们';

    clearHarmonicPanel(level.anchorPoints);
  },
  onProgressChange: (current: number, total: number) => {
    connectedCountEl.textContent = String(current);
    const pct = total > 0 ? (current / total) * 100 : 0;
    progressFillEl.style.width = `${pct}%`;

    if (current < total) {
      if (current === 0) {
        hintTitleEl.textContent = '观察星空';
        hintTextEl.textContent = '仔细观察星星的闪烁节奏，找到频率相同或成倍数的恒星';
      } else if (current < total * 0.3) {
        hintTitleEl.textContent = '初见端倪';
        hintTextEl.textContent = '做得好！继续寻找，你会发现恒星间的谐波共振关系';
      } else if (current < total * 0.6) {
        hintTitleEl.textContent = '星脉初现';
        hintTextEl.textContent = '神话生物的轮廓正在浮现，耐心连接剩余的星脉';
      } else if (current < total) {
        hintTitleEl.textContent = '即将完成';
        hintTextEl.textContent = '只剩最后几颗星了！神话生物即将显现';
      }
    }
  },
  onComplete: (desc: string) => {
    hintTitleEl.textContent = '✨ 星座完成 ✨';
    hintTextEl.textContent = '星界神话生物已显现！仔细欣赏它的光辉吧';

    modalTitleEl.textContent = `✨ ${creatureNameEl.textContent} 降临 ✨`;
    modalDescEl.textContent = desc;
    completeModal.classList.add('show');

    if (game.getCurrentLevel() >= MAX_LEVELS) {
      btnNext.textContent = '重新开始';
    } else {
      btnNext.textContent = '下一关';
    }
  },
  onHarmonicClassroomChange: (state: HarmonicClassroomState, analysis: HarmonicAnalysisResult | null) => {
    updateHarmonicPanel(state, analysis);
  }
});

btnUndo.addEventListener('click', () => {
  game.undoLastConnection();
});

btnReset.addEventListener('click', () => {
  if (confirm('确定要重置本关吗？所有连线将被清除。')) {
    game.resetLevel();
  }
});

btnHint.addEventListener('click', () => {
  const showing = game.toggleFrequencies();
  btnHint.textContent = showing ? '隐藏频率' : '显示频率';
});

btnClassroom.addEventListener('click', () => {
  const active = game.toggleHarmonicClassroom();
  if (active) {
    btnClassroom.classList.add('classroom-active');
    btnClassroom.textContent = '🎓 退出课堂';
    harmonicPanel.classList.add('show');
    btnHint.textContent = '显示频率';
  } else {
    btnClassroom.classList.remove('classroom-active');
    btnClassroom.textContent = '🎓 谐波课堂';
    harmonicPanel.classList.remove('show');
    btnClassroomClear.style.display = 'none';
  }
});

btnClassroomClear.addEventListener('click', () => {
  game.harmonicClassroomClearSelection();
});

btnPanelClose.addEventListener('click', () => {
  if (game.toggleHarmonicClassroom()) {
    game.toggleHarmonicClassroom();
  }
  btnClassroom.classList.remove('classroom-active');
  btnClassroom.textContent = '🎓 谐波课堂';
  harmonicPanel.classList.remove('show');
  btnClassroomClear.style.display = 'none';
});

btnNext.addEventListener('click', async () => {
  const nextLevel = game.getCurrentLevel() >= MAX_LEVELS
    ? 1
    : game.getCurrentLevel() + 1;

  completeModal.classList.remove('show');
  btnHint.textContent = '显示频率';
  await game.loadLevel(nextLevel);
});

async function init(): Promise<void> {
  hintTitleEl.textContent = '加载中...';
  hintTextEl.textContent = '正在连接星界数据库...';

  try {
    const backendOk = await healthCheck();
    if (!backendOk) {
      console.warn('后端未启动，尝试使用嵌入数据...');
    }
  } catch {
    console.warn('后端健康检查失败');
  }

  const loaded = await game.loadLevel(1);
  if (!loaded) {
    hintTitleEl.textContent = '⚠️ 加载失败';
    hintTextEl.textContent = '无法加载关卡数据，请确保后端服务器已启动 (npm run dev:backend)';
    return;
  }

  game.start();
}

init().catch(err => {
  console.error('初始化失败:', err);
  hintTitleEl.textContent = '错误';
  hintTextEl.textContent = String(err);
});

function clearHarmonicPanel(_anchorPoints: Array<{ id: string; name?: string; frequency: number }> = []): void {
  slot1.classList.remove('filled-1');
  slot2.classList.remove('filled-2');
  slot1Name.textContent = '点击星点选择...';
  slot1Freq.textContent = '';
  slot2Name.textContent = '点击星点选择...';
  slot2Freq.textContent = '';
  ratioTitle.textContent = '等待选择两颗星';
  ratioNumbers.textContent = '? : ?';
  ratioNumbers.classList.remove('harmonic', 'disharmonic');
  ratioStatus.style.display = 'none';
  explainSection.style.display = 'none';
  panelTip.textContent = '💡 在星空中点击两颗主星，分析它们的频率关系';
  btnClassroomClear.style.display = 'none';
}

function updateHarmonicPanel(
  state: HarmonicClassroomState,
  analysis: HarmonicAnalysisResult | null
): void {
  const levelData = (game as any).state?.levelData;
  const anchors = levelData?.anchorPoints || [];

  const getAnchor = (id: string) => anchors.find((a: any) => a.id === id);

  const star1 = state.selectedStarIds[0] ? getAnchor(state.selectedStarIds[0]) : null;
  const star2 = state.selectedStarIds[1] ? getAnchor(state.selectedStarIds[1]) : null;

  if (star1) {
    slot1.classList.add('filled-1');
    slot1Name.textContent = star1.name || star1.id;
    slot1Freq.textContent = `频率: ${Number(star1.frequency).toFixed(1)} Hz`;
  } else {
    slot1.classList.remove('filled-1');
    slot1Name.textContent = '点击星点选择...';
    slot1Freq.textContent = '';
  }

  if (star2) {
    slot2.classList.add('filled-2');
    slot2Name.textContent = star2.name || star2.id;
    slot2Freq.textContent = `频率: ${Number(star2.frequency).toFixed(1)} Hz`;
  } else {
    slot2.classList.remove('filled-2');
    slot2Name.textContent = '点击星点选择...';
    slot2Freq.textContent = '';
  }

  btnClassroomClear.style.display = state.selectedStarIds.length > 0 ? 'inline-block' : 'none';

  if (!state.isActive) {
    return;
  }

  if (!analysis) {
    if (state.selectedStarIds.length === 0) {
      ratioTitle.textContent = '等待选择两颗星';
      ratioNumbers.textContent = '? : ?';
    } else if (state.selectedStarIds.length === 1) {
      ratioTitle.textContent = '再选一颗星继续分析';
      ratioNumbers.textContent = '? : ?';
    }
    ratioNumbers.classList.remove('harmonic', 'disharmonic');
    ratioStatus.style.display = 'none';
    explainSection.style.display = 'none';
    panelTip.textContent = state.selectedStarIds.length === 1
      ? '💡 再点击另一颗主星进行对比分析'
      : '💡 在星空中点击两颗主星，分析它们的频率关系';
    return;
  }

  ratioTitle.textContent = analysis.explanation.title;
  ratioNumbers.classList.remove('harmonic', 'disharmonic');

  const [num, den] = analysis.simplifiedRatio;
  const g = gcdUi(num, den);
  const reducedNum = num / g;
  const reducedDen = den / g;

  if (analysis.isHarmonic) {
    ratioNumbers.classList.add('harmonic');
    ratioNumbers.textContent = `${reducedNum} : ${reducedDen}`;
    ratioStatus.className = 'ratio-status yes';
    ratioStatus.textContent = '✨ 整数倍谐波 · 可以连接';
  } else {
    ratioNumbers.classList.add('disharmonic');
    ratioNumbers.textContent = `${num} : ${den}`;
    ratioStatus.className = 'ratio-status no';
    ratioStatus.textContent = '❌ 非简单整数比 · 无法连接';
  }
  ratioStatus.style.display = 'inline-block';

  explainSection.style.display = 'block';

  cardResult.textContent = analysis.explanation.canConnect;
  cardResult.classList.toggle('fail', !analysis.isHarmonic);

  cardMath.textContent = analysis.explanation.mathDetail;
  cardFact.textContent = analysis.explanation.funFact;
  cardVisual.textContent = analysis.explanation.visualHint;

  panelTip.textContent = analysis.isHarmonic
    ? '🎯 发现谐波共振！可以从一颗星拖动到另一颗星尝试连线'
    : '💡 试试其他星星组合，寻找成简单整数比的频率';
}

function gcdUi(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}
