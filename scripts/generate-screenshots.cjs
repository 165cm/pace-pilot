const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const LANGUAGES = {
  en: {
    dir: 'en',
    timer: {
      tlStartLabel: 'Start',
      tlStartTime: '09:00',
      tlNowLabel: 'Now',
      tlNowTime: '09:12',
      tlEndLabel: 'End',
      tlEndTime: '10:00',
      phaseBadge: 'WORK · R1',
      timeMain: '21:45',
      totalLabel: 'Total 51:45',
      skipText: 'Skip phase ›',
      stopBtn: '■ Hold Stop',
      pauseBtn: '⏸ Pause'
    },
    home: {
      appName: 'PACE PILOT',
      subTitle: 'Choose your pace',
      presetTitle: '25 / 5',
      workLabel: 'Work',
      workVal: '25 min',
      breakLabel: 'Break',
      breakVal: '5 min',
      roundsLabel: 'Rounds',
      roundsVal: '4',
      totalLabel: 'Total',
      totalVal: '120 min',
      customBtn: 'Custom',
      historyBtn: 'History',
      startBtn: '▶  Start'
    },
    custom: {
      title: 'CUSTOM PACE',
      workLabel: 'Work',
      workVal: '25 min',
      breakLabel: 'Break',
      breakVal: '5 min',
      roundsLabel: 'Rounds',
      roundsVal: '4',
      cancelBtn: 'Cancel',
      saveBtn: 'Save & Use'
    }
  },
  ja: {
    dir: 'ja',
    timer: {
      tlStartLabel: '開始',
      tlStartTime: '09:00',
      tlNowLabel: '現在',
      tlNowTime: '09:12',
      tlEndLabel: '終了予定',
      tlEndTime: '10:00',
      phaseBadge: '作業 · R1',
      timeMain: '21:45',
      totalLabel: '合計 51:45',
      skipText: 'スキップ ›',
      stopBtn: '■ 長押し終了',
      pauseBtn: '⏸ 一時停止'
    },
    home: {
      appName: 'PACE PILOT',
      subTitle: 'ペースを選択',
      presetTitle: '25 / 5',
      workLabel: '作業',
      workVal: '25分',
      breakLabel: '休憩',
      breakVal: '5分',
      roundsLabel: 'ラウンド',
      roundsVal: '4',
      totalLabel: '合計',
      totalVal: '120分',
      customBtn: 'カスタム',
      historyBtn: '履歴',
      startBtn: '▶  開始'
    },
    custom: {
      title: 'カスタム設定',
      workLabel: '作業',
      workVal: '25分',
      breakLabel: '休憩',
      breakVal: '5分',
      roundsLabel: 'ラウンド',
      roundsVal: '4',
      cancelBtn: '戻る',
      saveBtn: '保存して開始'
    }
  },
  zh: {
    dir: 'zh',
    timer: {
      tlStartLabel: '开始',
      tlStartTime: '09:00',
      tlNowLabel: '当前',
      tlNowTime: '09:12',
      tlEndLabel: '预计结束',
      tlEndTime: '10:00',
      phaseBadge: '专注 · R1',
      timeMain: '21:45',
      totalLabel: '总计 51:45',
      skipText: '跳过阶段 ›',
      stopBtn: '■ 长按结束',
      pauseBtn: '⏸ 暂停'
    },
    home: {
      appName: 'PACE PILOT',
      subTitle: '选择专注节奏',
      presetTitle: '25 / 5',
      workLabel: '专注',
      workVal: '25分钟',
      breakLabel: '休息',
      breakVal: '5分钟',
      roundsLabel: '轮次',
      roundsVal: '4',
      totalLabel: '总计',
      totalVal: '120分钟',
      customBtn: '自定义',
      historyBtn: '历史',
      startBtn: '▶  开始'
    },
    custom: {
      title: '自定义节奏',
      workLabel: '专注',
      workVal: '25分钟',
      breakLabel: '休息',
      breakVal: '5分钟',
      roundsLabel: '轮次',
      roundsVal: '4',
      cancelBtn: '返回',
      saveBtn: '保存并使用'
    }
  }
};

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans', 'Microsoft YaHei', sans-serif";

/* =========================================================================
   ROUND SCREEN SVG RENDERERS (360x360 Circular)
   ========================================================================= */

function renderRoundTimerSvg(raw) {
  const data = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, escapeXml(v)])
  );

  const cx = 180;
  const cy = 158;
  const r = 70;
  const strokeW = 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - 0.65);

  return `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle-clip-t">
      <circle cx="180" cy="180" r="180" />
    </clipPath>
    <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4fa0ff" />
      <stop offset="100%" stop-color="#2f80ed" />
    </linearGradient>
    <style>
      .txt { font-family: ${FONT_STACK}; }
      .bold { font-weight: 700; }
      .bolder { font-weight: 800; }
      .medium { font-weight: 500; }
    </style>
  </defs>

  <g clip-path="url(#circle-clip-t)">
    <rect width="360" height="360" fill="#05070a" />

    <!-- Top Timeline: Centered & safe inside circular screen -->
    <g class="txt" text-anchor="middle">
      <text x="106" y="36" font-size="10" fill="#667085">${data.tlStartLabel}</text>
      <text x="106" y="52" font-size="12" class="bold" fill="#98a2b3">${data.tlStartTime}</text>

      <text x="180" y="32" font-size="10" fill="#98a2b3">${data.tlNowLabel}</text>
      <text x="180" y="50" font-size="14" class="bolder" fill="#ffffff">${data.tlNowTime}</text>

      <text x="254" y="36" font-size="10" fill="#667085">${data.tlEndLabel}</text>
      <text x="254" y="52" font-size="12" class="bold" fill="#98a2b3">${data.tlEndTime}</text>
    </g>

    <!-- Progress Ring -->
    <g transform="rotate(-90 ${cx} ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#161f2e" stroke-width="${strokeW}" />
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#primary-grad)" stroke-width="${strokeW}"
        stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" stroke-linecap="round" />
    </g>

    <!-- Ring Center Content -->
    <g class="txt" text-anchor="middle">
      <rect x="126" y="106" width="108" height="20" rx="10" fill="#152438" />
      <text x="180" y="120" font-size="11" class="bold" fill="#4fa0ff" letter-spacing="0.5">${data.phaseBadge}</text>

      <text x="180" y="168" font-size="36" class="bolder" fill="#ffffff" letter-spacing="-1">${data.timeMain}</text>
      <text x="180" y="192" font-size="12" class="medium" fill="#98a2b3">${data.totalLabel}</text>
    </g>

    <text x="180" y="250" class="txt bold" text-anchor="middle" font-size="13" fill="#7d899b">${data.skipText}</text>

    <!-- Bottom Controls -->
    <rect x="64" y="274" width="110" height="42" rx="14" fill="#ff4d5e" />
    <text x="119" y="300" class="txt bold" text-anchor="middle" font-size="12" fill="#ffffff">${data.stopBtn}</text>

    <rect x="186" y="274" width="110" height="42" rx="14" fill="#2f80ed" />
    <text x="241" y="300" class="txt bold" text-anchor="middle" font-size="12" fill="#ffffff">${data.pauseBtn}</text>

    <circle cx="180" cy="180" r="179" fill="none" stroke="#222b38" stroke-width="1" opacity="0.6" />
  </g>
</svg>`;
}

function renderRoundHomeSvg(raw) {
  const data = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, escapeXml(v)])
  );

  return `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle-clip-h">
      <circle cx="180" cy="180" r="180" />
    </clipPath>
    <linearGradient id="card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181e28" />
      <stop offset="100%" stop-color="#10151d" />
    </linearGradient>
    <style>
      .txt { font-family: ${FONT_STACK}; }
      .bold { font-weight: 700; }
      .bolder { font-weight: 800; }
      .semibold { font-weight: 600; }
    </style>
  </defs>

  <g clip-path="url(#circle-clip-h)">
    <rect width="360" height="360" fill="#05070a" />

    <g class="txt" text-anchor="middle">
      <text x="180" y="40" font-size="11" class="bolder" fill="#667085" letter-spacing="2">${data.appName}</text>
      <text x="180" y="60" font-size="14" class="bold" fill="#ffffff">${data.subTitle}</text>
    </g>

    <!-- Preset Carousel Card -->
    <rect x="46" y="76" width="268" height="134" rx="18" fill="url(#card-grad)" stroke="#222c3d" stroke-width="1" />

    <g class="txt">
      <text x="70" y="114" font-size="20" class="bold" fill="#2f80ed" text-anchor="middle">&#8249;</text>
      <text x="180" y="116" font-size="26" class="bolder" fill="#ffffff" text-anchor="middle" letter-spacing="1">${data.presetTitle}</text>
      <text x="290" y="114" font-size="20" class="bold" fill="#2f80ed" text-anchor="middle">&#8250;</text>

      <line x1="62" y1="134" x2="298" y2="134" stroke="#1f2837" stroke-width="1" />

      <text x="68" y="156" font-size="11" fill="#7d899b">${data.workLabel}: <tspan class="bold" fill="#ffffff">${data.workVal}</tspan></text>
      <text x="196" y="156" font-size="11" fill="#7d899b">${data.breakLabel}: <tspan class="bold" fill="#ffa726">${data.breakVal}</tspan></text>

      <text x="68" y="184" font-size="11" fill="#7d899b">${data.roundsLabel}: <tspan class="bold" fill="#ffffff">${data.roundsVal}</tspan></text>
      <text x="196" y="184" font-size="11" fill="#7d899b">${data.totalLabel}: <tspan class="bold" fill="#31c48d">${data.totalVal}</tspan></text>
    </g>

    <!-- Mid Buttons: Custom & History -->
    <g class="txt" text-anchor="middle">
      <rect x="58" y="224" width="116" height="36" rx="12" fill="#151b24" stroke="#263143" stroke-width="1" />
      <text x="116" y="247" font-size="12" class="semibold" fill="#d0d5dd">${data.customBtn}</text>

      <rect x="186" y="224" width="116" height="36" rx="12" fill="#151b24" stroke="#263143" stroke-width="1" />
      <text x="244" y="247" font-size="12" class="semibold" fill="#d0d5dd">${data.historyBtn}</text>
    </g>

    <!-- Bottom Start Button -->
    <rect x="68" y="272" width="224" height="44" rx="16" fill="#2f80ed" />
    <text x="180" y="300" class="txt bold" text-anchor="middle" font-size="15" fill="#ffffff" letter-spacing="0.5">${data.startBtn}</text>

    <circle cx="180" cy="180" r="179" fill="none" stroke="#222b38" stroke-width="1" opacity="0.6" />
  </g>
</svg>`;
}

function renderRoundCustomSvg(raw) {
  const data = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, escapeXml(v)])
  );

  return `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle-clip-c">
      <circle cx="180" cy="180" r="180" />
    </clipPath>
    <linearGradient id="card-grad-c" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181e28" />
      <stop offset="100%" stop-color="#10151d" />
    </linearGradient>
    <style>
      .txt { font-family: ${FONT_STACK}; }
      .bold { font-weight: 700; }
      .semibold { font-weight: 600; }
    </style>
  </defs>

  <g clip-path="url(#circle-clip-c)">
    <rect width="360" height="360" fill="#05070a" />

    <g class="txt" text-anchor="middle">
      <text x="180" y="44" font-size="14" class="bold" fill="#ffffff" letter-spacing="1">${data.title}</text>
    </g>

    <!-- Config Card (3 Rows) -->
    <rect x="46" y="64" width="268" height="186" rx="18" fill="url(#card-grad-c)" stroke="#222c3d" stroke-width="1" />

    <g class="txt">
      <!-- Row 1: Work -->
      <text x="64" y="99" font-size="12" class="semibold" fill="#d0d5dd">${data.workLabel}</text>
      <rect x="172" y="80" width="28" height="28" rx="8" fill="#1e2736" />
      <text x="186" y="99" font-size="16" class="bold" fill="#2f80ed" text-anchor="middle">−</text>
      <text x="238" y="100" font-size="13" class="bold" fill="#ffffff" text-anchor="middle">${data.workVal}</text>
      <rect x="270" y="80" width="28" height="28" rx="8" fill="#1e2736" />
      <text x="284" y="99" font-size="16" class="bold" fill="#2f80ed" text-anchor="middle">+</text>

      <line x1="60" y1="124" x2="300" y2="124" stroke="#1f2837" stroke-width="1" />

      <!-- Row 2: Break -->
      <text x="64" y="161" font-size="12" class="semibold" fill="#d0d5dd">${data.breakLabel}</text>
      <rect x="172" y="142" width="28" height="28" rx="8" fill="#1e2736" />
      <text x="186" y="161" font-size="16" class="bold" fill="#ffa726" text-anchor="middle">−</text>
      <text x="238" y="162" font-size="13" class="bold" fill="#ffffff" text-anchor="middle">${data.breakVal}</text>
      <rect x="270" y="142" width="28" height="28" rx="8" fill="#1e2736" />
      <text x="284" y="161" font-size="16" class="bold" fill="#ffa726" text-anchor="middle">+</text>

      <line x1="60" y1="186" x2="300" y2="186" stroke="#1f2837" stroke-width="1" />

      <!-- Row 3: Rounds -->
      <text x="64" y="223" font-size="12" class="semibold" fill="#d0d5dd">${data.roundsLabel}</text>
      <rect x="172" y="204" width="28" height="28" rx="8" fill="#1e2736" />
      <text x="186" y="223" font-size="16" class="bold" fill="#31c48d" text-anchor="middle">−</text>
      <text x="238" y="224" font-size="14" class="bold" fill="#ffffff" text-anchor="middle">${data.roundsVal}</text>
      <rect x="270" y="204" width="28" height="28" rx="8" fill="#1e2736" />
      <text x="284" y="223" font-size="16" class="bold" fill="#31c48d" text-anchor="middle">+</text>
    </g>

    <!-- Bottom Buttons: Cancel & Save -->
    <g class="txt" text-anchor="middle">
      <rect x="60" y="268" width="114" height="42" rx="14" fill="#151b24" stroke="#263143" stroke-width="1" />
      <text x="117" y="294" font-size="13" class="semibold" fill="#d0d5dd">${data.cancelBtn}</text>

      <rect x="186" y="268" width="114" height="42" rx="14" fill="#2f80ed" />
      <text x="243" y="294" font-size="13" class="bold" fill="#ffffff">${data.saveBtn}</text>
    </g>

    <circle cx="180" cy="180" r="179" fill="none" stroke="#222b38" stroke-width="1" opacity="0.6" />
  </g>
</svg>`;
}

/* =========================================================================
   SQUARE SCREEN SVG RENDERERS (360x360 Rounded Rect Watch Baseline)
   ========================================================================= */

function renderSquareTimerSvg(raw) {
  const data = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, escapeXml(v)])
  );

  const cx = 180;
  const cy = 160;
  const r = 68;
  const strokeW = 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - 0.65);

  return `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="square-clip-t">
      <rect x="12" y="12" width="336" height="336" rx="42" />
    </clipPath>
    <linearGradient id="sq-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4fa0ff" />
      <stop offset="100%" stop-color="#2f80ed" />
    </linearGradient>
    <style>
      .txt { font-family: ${FONT_STACK}; }
      .bold { font-weight: 700; }
      .bolder { font-weight: 800; }
      .medium { font-weight: 500; }
    </style>
  </defs>

  <!-- Square Screen Outer Background -->
  <g clip-path="url(#square-clip-t)">
    <rect x="12" y="12" width="336" height="336" rx="42" fill="#05070a" />

    <!-- Top Timeline: 3 Columns -->
    <g class="txt" text-anchor="middle">
      <text x="80" y="32" font-size="11" fill="#667085">${data.tlStartLabel}</text>
      <text x="80" y="49" font-size="13" class="bold" fill="#98a2b3">${data.tlStartTime}</text>

      <text x="180" y="28" font-size="11" fill="#98a2b3">${data.tlNowLabel}</text>
      <text x="180" y="47" font-size="15" class="bolder" fill="#ffffff">${data.tlNowTime}</text>

      <text x="280" y="32" font-size="11" fill="#667085">${data.tlEndLabel}</text>
      <text x="280" y="49" font-size="13" class="bold" fill="#98a2b3">${data.tlEndTime}</text>
    </g>

    <!-- Top Progress Bar (4 Rounds) -->
    <g>
      <!-- Round 1 (Active) -->
      <rect x="36" y="64" width="66" height="6" rx="3" fill="#2f80ed" />
      <!-- Round 2 -->
      <rect x="108" y="64" width="66" height="6" rx="3" fill="#1e2736" />
      <!-- Round 3 -->
      <rect x="180" y="64" width="66" height="6" rx="3" fill="#1e2736" />
      <!-- Round 4 -->
      <rect x="252" y="64" width="66" height="6" rx="3" fill="#1e2736" />
    </g>

    <!-- Center Progress Ring -->
    <g transform="rotate(-90 ${cx} ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#161f2e" stroke-width="${strokeW}" />
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#sq-primary-grad)" stroke-width="${strokeW}"
        stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" stroke-linecap="round" />
    </g>

    <!-- Ring Center Content -->
    <g class="txt" text-anchor="middle">
      <rect x="126" y="108" width="108" height="20" rx="10" fill="#152438" />
      <text x="180" y="122" font-size="11" class="bold" fill="#4fa0ff" letter-spacing="0.5">${data.phaseBadge}</text>

      <text x="180" y="170" font-size="38" class="bolder" fill="#ffffff" letter-spacing="-1">${data.timeMain}</text>
      <text x="180" y="194" font-size="12" class="medium" fill="#98a2b3">${data.totalLabel}</text>
    </g>

    <!-- Skip Phase Link -->
    <text x="180" y="248" class="txt bold" text-anchor="middle" font-size="13" fill="#7d899b">${data.skipText}</text>

    <!-- Bottom Controls -->
    <rect x="38" y="272" width="136" height="44" rx="14" fill="#ff4d5e" />
    <text x="106" y="299" class="txt bold" text-anchor="middle" font-size="13" fill="#ffffff">${data.stopBtn}</text>

    <rect x="186" y="272" width="136" height="44" rx="14" fill="#2f80ed" />
    <text x="254" y="299" class="txt bold" text-anchor="middle" font-size="13" fill="#ffffff">${data.pauseBtn}</text>

    <!-- Bezel Edge -->
    <rect x="12" y="12" width="336" height="336" rx="42" fill="none" stroke="#252f3f" stroke-width="1.5" />
  </g>
</svg>`;
}

function renderSquareHomeSvg(raw) {
  const data = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, escapeXml(v)])
  );

  return `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="square-clip-h">
      <rect x="12" y="12" width="336" height="336" rx="42" />
    </clipPath>
    <linearGradient id="sq-card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181e28" />
      <stop offset="100%" stop-color="#10151d" />
    </linearGradient>
    <style>
      .txt { font-family: ${FONT_STACK}; }
      .bold { font-weight: 700; }
      .bolder { font-weight: 800; }
      .semibold { font-weight: 600; }
    </style>
  </defs>

  <g clip-path="url(#square-clip-h)">
    <rect x="12" y="12" width="336" height="336" rx="42" fill="#05070a" />

    <!-- Top Header -->
    <g class="txt" text-anchor="middle">
      <text x="180" y="38" font-size="11" class="bolder" fill="#667085" letter-spacing="2">${data.appName}</text>
      <text x="180" y="58" font-size="15" class="bold" fill="#ffffff">${data.subTitle}</text>
    </g>

    <!-- Preset Carousel Card -->
    <rect x="34" y="74" width="292" height="136" rx="18" fill="url(#sq-card-grad)" stroke="#222c3d" stroke-width="1" />

    <g class="txt">
      <text x="62" y="114" font-size="20" class="bold" fill="#2f80ed" text-anchor="middle">&#8249;</text>
      <text x="180" y="116" font-size="26" class="bolder" fill="#ffffff" text-anchor="middle" letter-spacing="1">${data.presetTitle}</text>
      <text x="298" y="114" font-size="20" class="bold" fill="#2f80ed" text-anchor="middle">&#8250;</text>

      <line x1="52" y1="134" x2="308" y2="134" stroke="#1f2837" stroke-width="1" />

      <!-- Row 1: Work / Break -->
      <text x="56" y="156" font-size="12" fill="#7d899b">${data.workLabel}: <tspan class="bold" fill="#ffffff">${data.workVal}</tspan></text>
      <text x="200" y="156" font-size="12" fill="#7d899b">${data.breakLabel}: <tspan class="bold" fill="#ffa726">${data.breakVal}</tspan></text>

      <!-- Row 2: Rounds / Total -->
      <text x="56" y="184" font-size="12" fill="#7d899b">${data.roundsLabel}: <tspan class="bold" fill="#ffffff">${data.roundsVal}</tspan></text>
      <text x="200" y="184" font-size="12" fill="#7d899b">${data.totalLabel}: <tspan class="bold" fill="#31c48d">${data.totalVal}</tspan></text>
    </g>

    <!-- Mid Buttons: Custom & History -->
    <g class="txt" text-anchor="middle">
      <rect x="38" y="222" width="136" height="38" rx="12" fill="#151b24" stroke="#263143" stroke-width="1" />
      <text x="106" y="246" font-size="13" class="semibold" fill="#d0d5dd">${data.customBtn}</text>

      <rect x="186" y="222" width="136" height="38" rx="12" fill="#151b24" stroke="#263143" stroke-width="1" />
      <text x="254" y="246" font-size="13" class="semibold" fill="#d0d5dd">${data.historyBtn}</text>
    </g>

    <!-- Bottom Start Button -->
    <rect x="38" y="270" width="284" height="46" rx="16" fill="#2f80ed" />
    <text x="180" y="299" class="txt bold" text-anchor="middle" font-size="15" fill="#ffffff" letter-spacing="0.5">${data.startBtn}</text>

    <!-- Bezel Edge -->
    <rect x="12" y="12" width="336" height="336" rx="42" fill="none" stroke="#252f3f" stroke-width="1.5" />
  </g>
</svg>`;
}

function renderSquareCustomSvg(raw) {
  const data = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, escapeXml(v)])
  );

  return `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="square-clip-c">
      <rect x="12" y="12" width="336" height="336" rx="42" />
    </clipPath>
    <linearGradient id="sq-card-grad-c" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181e28" />
      <stop offset="100%" stop-color="#10151d" />
    </linearGradient>
    <style>
      .txt { font-family: ${FONT_STACK}; }
      .bold { font-weight: 700; }
      .semibold { font-weight: 600; }
    </style>
  </defs>

  <g clip-path="url(#square-clip-c)">
    <rect x="12" y="12" width="336" height="336" rx="42" fill="#05070a" />

    <g class="txt" text-anchor="middle">
      <text x="180" y="42" font-size="15" class="bold" fill="#ffffff" letter-spacing="1">${data.title}</text>
    </g>

    <!-- Config Card (3 Rows) -->
    <rect x="34" y="60" width="292" height="190" rx="18" fill="url(#sq-card-grad-c)" stroke="#222c3d" stroke-width="1" />

    <g class="txt">
      <!-- Row 1: Work -->
      <text x="54" y="99" font-size="13" class="semibold" fill="#d0d5dd">${data.workLabel}</text>
      <rect x="180" y="78" width="30" height="30" rx="8" fill="#1e2736" />
      <text x="195" y="99" font-size="16" class="bold" fill="#2f80ed" text-anchor="middle">−</text>
      <text x="249" y="100" font-size="13" class="bold" fill="#ffffff" text-anchor="middle">${data.workVal}</text>
      <rect x="282" y="78" width="30" height="30" rx="8" fill="#1e2736" />
      <text x="297" y="99" font-size="16" class="bold" fill="#2f80ed" text-anchor="middle">+</text>

      <line x1="50" y1="124" x2="310" y2="124" stroke="#1f2837" stroke-width="1" />

      <!-- Row 2: Break -->
      <text x="54" y="161" font-size="13" class="semibold" fill="#d0d5dd">${data.breakLabel}</text>
      <rect x="180" y="140" width="30" height="30" rx="8" fill="#1e2736" />
      <text x="195" y="161" font-size="16" class="bold" fill="#ffa726" text-anchor="middle">−</text>
      <text x="249" y="162" font-size="13" class="bold" fill="#ffffff" text-anchor="middle">${data.breakVal}</text>
      <rect x="282" y="140" width="30" height="30" rx="8" fill="#1e2736" />
      <text x="297" y="161" font-size="16" class="bold" fill="#ffa726" text-anchor="middle">+</text>

      <line x1="50" y1="186" x2="310" y2="186" stroke="#1f2837" stroke-width="1" />

      <!-- Row 3: Rounds -->
      <text x="54" y="223" font-size="13" class="semibold" fill="#d0d5dd">${data.roundsLabel}</text>
      <rect x="180" y="202" width="30" height="30" rx="8" fill="#1e2736" />
      <text x="195" y="223" font-size="16" class="bold" fill="#31c48d" text-anchor="middle">−</text>
      <text x="249" y="224" font-size="14" class="bold" fill="#ffffff" text-anchor="middle">${data.roundsVal}</text>
      <rect x="282" y="202" width="30" height="30" rx="8" fill="#1e2736" />
      <text x="297" y="223" font-size="16" class="bold" fill="#31c48d" text-anchor="middle">+</text>
    </g>

    <!-- Bottom Buttons: Cancel & Save -->
    <g class="txt" text-anchor="middle">
      <rect x="38" y="266" width="136" height="44" rx="14" fill="#151b24" stroke="#263143" stroke-width="1" />
      <text x="106" y="293" font-size="13" class="semibold" fill="#d0d5dd">${data.cancelBtn}</text>

      <rect x="186" y="266" width="136" height="44" rx="14" fill="#2f80ed" />
      <text x="254" y="293" font-size="13" class="bold" fill="#ffffff">${data.saveBtn}</text>
    </g>

    <!-- Bezel Edge -->
    <rect x="12" y="12" width="336" height="336" rx="42" fill="none" stroke="#252f3f" stroke-width="1.5" />
  </g>
</svg>`;
}

/* =========================================================================
   MAIN GENERATOR
   ========================================================================= */

async function generateAll() {
  const roundBase = path.join(__dirname, '..', 'store', 'screenshots', 'round');
  const squareBase = path.join(__dirname, '..', 'store', 'screenshots', 'square');

  for (const [langKey, langObj] of Object.entries(LANGUAGES)) {
    // 1. ROUND SCREENSHOTS
    const roundLangDir = path.join(roundBase, langObj.dir);
    fs.mkdirSync(roundLangDir, { recursive: true });

    await sharp(Buffer.from(renderRoundTimerSvg(langObj.timer)))
      .png()
      .toFile(path.join(roundLangDir, 'round-timer.png'));
    await sharp(Buffer.from(renderRoundHomeSvg(langObj.home)))
      .png()
      .toFile(path.join(roundLangDir, 'round-home.png'));
    await sharp(Buffer.from(renderRoundCustomSvg(langObj.custom)))
      .png()
      .toFile(path.join(roundLangDir, 'round-custom.png'));
    console.log(`[Round] Generated: ${langObj.dir} (timer, home, custom)`);

    // 2. SQUARE SCREENSHOTS
    const squareLangDir = path.join(squareBase, langObj.dir);
    fs.mkdirSync(squareLangDir, { recursive: true });

    await sharp(Buffer.from(renderSquareTimerSvg(langObj.timer)))
      .png()
      .toFile(path.join(squareLangDir, 'square-timer.png'));
    await sharp(Buffer.from(renderSquareHomeSvg(langObj.home)))
      .png()
      .toFile(path.join(squareLangDir, 'square-home.png'));
    await sharp(Buffer.from(renderSquareCustomSvg(langObj.custom)))
      .png()
      .toFile(path.join(squareLangDir, 'square-custom.png'));
    console.log(`[Square] Generated: ${langObj.dir} (timer, home, custom)`);
  }

  // Copy default (en) to root of each category for quick single-folder access
  fs.copyFileSync(path.join(roundBase, 'en', 'round-timer.png'), path.join(roundBase, 'round-timer.png'));
  fs.copyFileSync(path.join(roundBase, 'en', 'round-home.png'), path.join(roundBase, 'round-home.png'));
  fs.copyFileSync(path.join(roundBase, 'en', 'round-custom.png'), path.join(roundBase, 'round-custom.png'));

  fs.copyFileSync(path.join(squareBase, 'en', 'square-timer.png'), path.join(squareBase, 'square-timer.png'));
  fs.copyFileSync(path.join(squareBase, 'en', 'square-home.png'), path.join(squareBase, 'square-home.png'));
  fs.copyFileSync(path.join(squareBase, 'en', 'square-custom.png'), path.join(squareBase, 'square-custom.png'));

  console.log('All Round and Square screenshots generated successfully!');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
