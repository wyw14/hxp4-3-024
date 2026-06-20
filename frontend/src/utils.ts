import type { BackgroundStar, ScreenPoint, CurvePoint } from './types';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(p1: ScreenPoint, p2: ScreenPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateBackgroundStars(count: number, width: number, height: number): BackgroundStar[] {
  const stars: BackgroundStar[] = [];
  const colors = [
    '#ffffff', '#f8f7ff', '#e8f4ff', '#fff4e6',
    '#ffe8e8', '#e8ffe8', '#f0f0ff'
  ];

  for (let i = 0; i < count; i++) {
    const z = Math.random();
    stars.push({
      x: Math.random() * width * 2 - width * 0.5,
      y: Math.random() * height * 2 - height * 0.5,
      z,
      size: 0.3 + z * 1.8,
      baseBrightness: 0.2 + z * 0.6,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  return stars;
}

export function smoothPath(points: CurvePoint[], tension: number = 0.5): CurvePoint[] {
  if (points.length < 3) return [...points];

  const result: CurvePoint[] = [];
  const n = points.length;

  result.push({ x: points[0].x, y: points[0].y, t: 0 });

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(n - 1, i + 1)];
    const p3 = points[Math.min(n - 1, i + 2)];

    const steps = 12;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        tension * 2 * p1.x +
        (-p0.x + p2.x) * tension * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tension * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tension * t3;

      const y =
        tension * 2 * p1.y +
        (-p0.y + p2.y) * tension * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tension * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tension * t3;

      result.push({ x, y });
    }
  }

  return result;
}

export function quadraticBezier(
  p0: ScreenPoint,
  p1: ScreenPoint,
  p2: ScreenPoint,
  steps: number = 30
): CurvePoint[] {
  const result: CurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    result.push({ x, y, t });
  }
  return result;
}

export function cubicBezier(
  p0: ScreenPoint,
  p1: ScreenPoint,
  p2: ScreenPoint,
  p3: ScreenPoint,
  steps: number = 40
): CurvePoint[] {
  const result: CurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
    result.push({ x, y, t });
  }
  return result;
}

export function simplifyPath(points: ScreenPoint[], tolerance: number = 3): ScreenPoint[] {
  if (points.length < 3) return [...points];

  const result: ScreenPoint[] = [points[0]];
  let lastAdded = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    const d = distance(points[i], lastAdded);
    if (d >= tolerance) {
      result.push(points[i]);
      lastAdded = points[i];
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

export function rotatePoint(
  point: ScreenPoint,
  center: ScreenPoint,
  angle: number
): ScreenPoint {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

export function colorToRgb(color: string): { r: number; g: number; b: number } {
  const hex = color.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export type ConnectStatus = 'connectable' | 'harmonic-only' | 'disharmonic';

export interface HarmonicAnalysis {
  freq1: number;
  freq2: number;
  name1: string;
  name2: string;
  simplifiedRatio: [number, number];
  rawRatio: number;
  isHarmonic: boolean;
  isDefinedEdge: boolean;
  canConnectInLevel: boolean;
  connectStatus: ConnectStatus;
  tolerance: number;
  beatsPerCycle?: number;
  explanation: {
    title: string;
    canConnect: string;
    mathDetail: string;
    funFact: string;
    visualHint: string;
  };
}

export function analyzeHarmonicPair(
  freq1: number,
  freq2: number,
  name1: string = '星1',
  name2: string = '星2',
  definedEdges: Array<{ from: string; to: string; frequencyRatio?: [number, number] }> = [],
  id1: string = '',
  id2: string = ''
): HarmonicAnalysis {
  const EPSILON = 0.03;
  const MAX_SIMPLE_RATIO = 8;

  const rawRatio = freq2 / freq1;
  const [num, den] = findSimpleRatio(rawRatio, MAX_SIMPLE_RATIO, EPSILON);
  const simplifiedRatio: [number, number] = [num, den];

  const g = gcd(num, den);
  const reducedNum = num / g;
  const reducedDen = den / g;

  const diffRatio = Math.abs(rawRatio - (num / den)) / (num / den);
  const isHarmonic = diffRatio <= EPSILON && reducedNum <= MAX_SIMPLE_RATIO && reducedDen <= MAX_SIMPLE_RATIO;

  const isDefinedEdge = definedEdges.some(e =>
    (e.from === id1 && e.to === id2) || (e.from === id2 && e.to === id1)
  );

  const canConnectInLevel = isHarmonic && isDefinedEdge;
  let connectStatus: ConnectStatus;
  if (canConnectInLevel) {
    connectStatus = 'connectable';
  } else if (isHarmonic) {
    connectStatus = 'harmonic-only';
  } else {
    connectStatus = 'disharmonic';
  }

  const beatsPerCycle = isHarmonic ? Math.abs(num - den) : undefined;

  const explanation = generateExplanation(
    freq1, freq2, name1, name2,
    reducedNum, reducedDen, rawRatio,
    isHarmonic, isDefinedEdge, connectStatus, beatsPerCycle
  );

  return {
    freq1, freq2, name1, name2,
    simplifiedRatio,
    rawRatio,
    isHarmonic,
    isDefinedEdge,
    canConnectInLevel,
    connectStatus,
    tolerance: EPSILON,
    beatsPerCycle,
    explanation
  };
}

function findSimpleRatio(value: number, max: number, epsilon: number): [number, number] {
  let bestNum = Math.round(value);
  let bestDen = 1;
  let bestError = Math.abs(value - bestNum);

  for (let den = 1; den <= max; den++) {
    const num = Math.round(value * den);
    if (num < 1 || num > max * den) continue;
    const error = Math.abs(value - num / den);
    if (error < bestError) {
      bestError = error;
      bestNum = num;
      bestDen = den;
    }
  }

  if (bestError > epsilon) {
    return [Math.round(value * 100), 100];
  }
  return [bestNum, bestDen];
}

function generateExplanation(
  f1: number, f2: number, n1: string, n2: string,
  num: number, den: number, raw: number,
  isHarmonic: boolean, _isDefined: boolean,
  status: ConnectStatus,
  beats: number | undefined
): HarmonicAnalysis['explanation'] {
  let title: string;
  let canConnect: string;
  let mathDetail: string;
  let funFact: string;
  let visualHint: string;

  if (status === 'disharmonic') {
    const simpleNum = Math.round(raw);
    const diff = Math.abs(raw - simpleNum);
    title = '💫 频率不合拍';
    canConnect = `❌ ${n1} 和 ${n2} 的频率不成简单整数倍，无法连接。`;
    mathDetail = `频率比 ${f2.toFixed(1)} / ${f1.toFixed(1)} = ${raw.toFixed(3)}\n它不接近任何 1:1 到 8:8 之间的简单整数比，误差超过了 3%。`;
    funFact = `这就像两个人用不同节奏拍手，永远也对不上拍。在音乐中，这样的音程听起来会很刺耳！`;
    visualHint = `观察：这两颗星的闪烁杂乱无章，找不到明显的重复规律。`;

    if (diff < 0.2) {
      mathDetail += `\n💡 提示：它们很接近 ${simpleNum}:1 的关系，但还差那么一点点！`;
    }
  } else {
    if (num === den) {
      title = '🎵 完全同频共振';
    } else if (num === 1 || den === 1) {
      const multiple = num === 1 ? den : num;
      title = `🎶 完美${multiple}倍谐波`;
    } else {
      title = `🎼 优雅的 ${num}:${den} 和声`;
    }

    mathDetail = buildMathDetail(f1, f2, num, den, raw);
    funFact = getFunFactForRatio(num, den);
    visualHint = buildVisualHint(n1, n2, num, den);

    if (status === 'connectable') {
      if (num === den) {
        canConnect = `✅ ${n1} 和 ${n2} 频率完全相同，可以连接！`;
      } else if (num === 1 || den === 1) {
        const multiple = num === 1 ? den : num;
        canConnect = `✅ ${n1} 和 ${n2} 成完美的${multiple}倍频率关系，可以连接！`;
      } else {
        canConnect = `✅ ${n1} 和 ${n2} 形成 ${num}:${den} 的和谐比例，可以连接！`;
      }
      canConnect += '\n🌟 这是本关预设的星座连线，从一颗星拖动到另一颗星即可连接';
    } else {
      if (num === den) {
        canConnect = `⚠️ ${n1} 和 ${n2} 频率完全相同`;
      } else if (num === 1 || den === 1) {
        const multiple = num === 1 ? den : num;
        canConnect = `⚠️ ${n1} 和 ${n2} 成完美的${multiple}倍频率关系`;
      } else {
        canConnect = `⚠️ ${n1} 和 ${n2} 形成 ${num}:${den} 的和谐比例`;
      }
      canConnect += '，频率完美匹配！\n📝 但这不是本关的星座连线，游戏里不能直接连接哦';
    }
  }

  if (beats !== undefined && beats > 0 && isHarmonic) {
    funFact += `\n\n🔔 有趣的"拍频现象"：每 ${Math.max(num, den)} 次闪烁中，会出现 ${beats} 次亮暗抵消，形成脉动效果！`;
  }

  return { title, canConnect, mathDetail, funFact, visualHint };
}

function buildMathDetail(f1: number, f2: number, num: number, den: number, raw: number): string {
  if (num === den) {
    return `两颗星都以 ${f1.toFixed(1)}Hz 闪烁，比例为 ${num}:${den}。\n数学上: ${f2.toFixed(1)} / ${f1.toFixed(1)} = ${raw.toFixed(3)} ≈ ${num / den}`;
  }
  if (num === 1 || den === 1) {
    const multiple = num === 1 ? den : num;
    const faster = num > den ? f2 : f1;
    const slower = num > den ? f1 : f2;
    const fasterName = num > den ? '星2' : '星1';
    const slowerName = num > den ? '星1' : '星2';
    return `${fasterName}(${Math.max(faster, slower).toFixed(1)}Hz) 的频率是 ${slowerName}(${Math.min(faster, slower).toFixed(1)}Hz) 的${multiple}倍。\n比例 ${num}:${den}，数学上: ${f2.toFixed(1)} / ${f1.toFixed(1)} = ${raw.toFixed(3)} ≈ ${num / den}`;
  }
  return `频率比例为 ${num}:${den}，这是一个音乐中常见的纯律音程。\n数学上: ${f2.toFixed(1)} / ${f1.toFixed(1)} = ${raw.toFixed(3)} ≈ ${num / den}`;
}

function buildVisualHint(n1: string, n2: string, num: number, den: number): string {
  if (num === den) {
    return `观察：这两颗星的闪烁节奏完全同步，亮暗时刻一模一样。`;
  }
  if (num === 1 || den === 1) {
    const multiple = num === 1 ? den : num;
    const faster = num > den ? n2 : n1;
    const slower = num > den ? n1 : n2;
    return `观察：${faster} 每闪 ${multiple} 次，${slower} 才闪 1 次。数数看，是不是这样？`;
  }
  return `观察：${n1} 每闪 ${num} 次时，${n2} 正好闪 ${den} 次。它们会每 ${num * den} 次闪烁"重合"一次！`;
}

function getFunFactForRatio(num: number, den: number): string {
  const g = gcd(num, den);
  const a = num / g;
  const b = den / g;
  const key = `${Math.min(a, b)}:${Math.max(a, b)}`;

  const facts: Record<string, string> = {
    '1:2': '这个比例在音乐中是"纯八度"！比如钢琴上相邻的两个do，高音do的频率正好是低音do的2倍，听起来完全和谐。',
    '1:3': '"纯十二度"！相当于一个八度加一个纯五度。古希腊毕达哥拉斯发现，3:2的弦长比会产生最美的和声。',
    '1:4': '两个八度的跨越！就像男低音和女高音在唱歌，频率相差整整四倍。',
    '1:5': '两个八度加大三度！这是自然泛音列中的第五个谐音，声音温暖而丰富。',
    '2:3': '音乐中的"纯五度"！这是所有音程中最和谐的之一，被称为"宇宙的声音"。中国古代编钟就是按五度相生律调音的。',
    '2:5': '两个八度加大三度的转位！爵士音乐中经常出现这种色彩丰富的和声。',
    '3:4': '"纯四度"！和纯五度互为转位，听起来空旷而神秘。寺庙的钟声就是这种比例的泛音结构。',
    '3:5': '大六度！温暖而宽广的音程，在小提琴和大提琴的二重奏中非常常见。',
    '3:8': '两个八度加纯四度！深邃而遥远，像是从宇宙深处传来的回响。',
    '4:5': '"大三度"！这是大调音阶的核心音程，听起来明亮欢快。生日快乐歌开头的两个音就是大三度。',
    '4:7': '这是一个很有"爵士味"的音程，小七度的转位，略带神秘色彩。',
    '5:6': '"小三度"！忧郁而深情，是小调音乐的灵魂。很多悲伤的情歌都以此为基础。',
    '5:8': '小六度！深情而富有戏剧性，在电影配乐中常用于表达感动和震撼。',
    '5:7': '这是自然音阶中的"三全音"附近，在爵士乐中被称为"最蓝的音符"。',
    '1:1': '"同度"或"纯一度"，完全相同的频率，是和声中最紧密的结合。'
  };

  return facts[key] || `比例 ${num}:${den} 是一个和谐的整数比。在音乐中，简单整数比的频率组合会产生悦耳的和声效果！`;
}
