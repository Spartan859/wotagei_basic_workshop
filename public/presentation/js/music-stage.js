/* ==========================================================================
   BATTLE 音乐页：全黑屏 ↔ 音乐控件
   - 进入页面默认全黑（上台时观众看不到任何多余元素）
   - 右下角角落按键切换出音乐控件面板
   - 状态按 section id 记忆，离开再回来保持原样
   ========================================================================== */

// 每个音乐舞台页的状态：'blank' | 'panel'
const stageState = {};

function getStages() {
  return Array.from(document.querySelectorAll('section.music-stage'));
}

function getStageToggle(stage) {
  return document.querySelector(`.stage-toggle[data-stage="${stage.id}"]`)
    || stage.querySelector('.stage-toggle');
}

/** 舞台当前是否处于全黑态 */
function isStageBlank(stage) {
  return stageState[stage.id] !== 'panel';
}

function setStageMode(stage, mode) {
  stageState[stage.id] = mode;

  const blank = mode !== 'panel';
  stage.classList.toggle('is-blank', blank);
  stage.classList.toggle('is-panel', !blank);

  const toggle = getStageToggle(stage);
  if (toggle) {
    toggle.textContent = blank ? '♪' : '✕';
    toggle.setAttribute(
      'aria-label',
      blank ? '显示音乐控件' : '隐藏音乐控件，进入全黑屏'
    );
    toggle.title = blank ? '显示音乐控件' : '进入全黑屏';
  }
  // Reveal 层的类（进度条、按键显隐）由 syncProgressBar 统一管，
  // 那里才知道当前停在哪一页
}

/** 只在当前展示的舞台处于全黑态时才藏进度条 */
function syncProgressBar(currentSlide) {
  const reveal = document.querySelector('.reveal');
  const onStage = !!currentSlide && currentSlide.classList.contains('music-stage');
  const blank = onStage && isStageBlank(currentSlide);
  reveal.classList.toggle('stage-blank', blank);
  reveal.classList.toggle('on-music-stage', onStage);

  // 角落按键已挂到 <body> 上，只显示属于当前页的那一个
  document.querySelectorAll('.stage-toggle').forEach((btn) => {
    btn.hidden = !onStage || btn.dataset.stage !== currentSlide.id;
  });
}

function toggleStage(stage) {
  setStageMode(stage, isStageBlank(stage) ? 'panel' : 'blank');
  syncProgressBar(stage);
}

/* --------------------------------------------------------------------------
   回合聚焦：点击头像突出当前出战选手
   -------------------------------------------------------------------------- */
function setActiveMusicDancer(stage, dancer = '') {
  const faceoff = stage.querySelector('.battle-music-faceoff');
  if (!faceoff) return;

  faceoff.dataset.activeDancer = dancer;
  faceoff.querySelectorAll('.music-dancer-select').forEach((button) => {
    const active = button.dataset.dancer === dancer;
    button.setAttribute('aria-pressed', String(active));
  });
}

function setupMusicDancerSelection(stage) {
  const faceoff = stage.querySelector('.battle-music-faceoff');
  if (!faceoff) return;

  faceoff.querySelectorAll('.music-dancer-select').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const next = faceoff.dataset.activeDancer === button.dataset.dancer
        ? ''
        : button.dataset.dancer;
      setActiveMusicDancer(stage, next);
    });
  });
}

/* --------------------------------------------------------------------------
   自定义播放控件
   -------------------------------------------------------------------------- */
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function setupStageAudio(stage) {
  const audio = stage.querySelector('audio');
  const playBtn = stage.querySelector('.stage-play');
  const seek = stage.querySelector('.stage-seek');
  const timeLabel = stage.querySelector('.stage-time');
  const empty = stage.querySelector('.stage-empty');
  if (!audio || !playBtn || !seek || !timeLabel) return;

  const render = () => {
    const dur = audio.duration;
    if (empty) empty.hidden = isFinite(dur) && dur > 0;
    playBtn.textContent = audio.paused ? '▶' : '❚❚';
    timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
    if (isFinite(dur) && dur > 0) {
      seek.disabled = false;
      seek.max = String(Math.floor(dur));
      if (!seek.dataset.dragging) seek.value = String(Math.floor(audio.currentTime));
    } else {
      seek.disabled = true;
      seek.value = '0';
    }
  };

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audio.paused) {
      audio.play().catch((err) => console.warn('播放失败:', err));
    } else {
      audio.pause();
    }
  });

  // 拖动进度条：拖动期间不要被 timeupdate 抢走滑块位置
  seek.addEventListener('pointerdown', () => {
    seek.dataset.dragging = '1';
  });
  const endDrag = () => {
    delete seek.dataset.dragging;
    if (isFinite(audio.duration)) audio.currentTime = Number(seek.value);
  };
  seek.addEventListener('pointerup', endDrag);
  seek.addEventListener('pointercancel', endDrag);
  seek.addEventListener('change', endDrag);
  seek.addEventListener('input', () => {
    timeLabel.textContent = `${formatTime(Number(seek.value))} / ${formatTime(audio.duration)}`;
  });

  // 音频元数据到位后才拿得到时长
  audio.addEventListener('loadedmetadata', () => {
    if (empty) empty.hidden = true;
    render();
  });
  audio.addEventListener('error', () => {
    if (empty) {
      empty.hidden = false;
      empty.textContent = '音频文件缺失或无法加载';
    }
    seek.disabled = true;
  });

  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('timeupdate', render);
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    render();
  });

  render();
}

/* --------------------------------------------------------------------------
   初始化
   -------------------------------------------------------------------------- */
function initMusicStages() {
  getStages().forEach((stage) => {
    const toggle = stage.querySelector('.stage-toggle');
    if (toggle) {
      // 移到 <body>：Reveal 的 .slides 带 transform，会让 position: fixed
      // 退化成相对它定位，按键被推到屏幕外
      toggle.dataset.stage = stage.id;
      toggle.hidden = true;
      document.body.appendChild(toggle);
      toggle.addEventListener('click', (e) => {
        e.stopPropagation(); // 不要触发 main.js 的点击翻页
        toggleStage(stage);
      });
    }

    // 默认全黑
    if (!stageState[stage.id]) stageState[stage.id] = 'blank';
    setStageMode(stage, stageState[stage.id]);

    setupMusicDancerSelection(stage);
    setupStageAudio(stage);
  });

  // 初次进入时按当前页同步一次 Reveal 层的类
  if (window.Reveal && typeof Reveal.getCurrentSlide === 'function') {
    syncProgressBar(Reveal.getCurrentSlide());
  }
}

/** 供 main.js 在切页时调用：离开舞台页就暂停播放 */
function handleStageSlideChange(currentSlide) {
  getStages().forEach((stage) => {
    if (stage !== currentSlide) {
      const audio = stage.querySelector('audio');
      if (audio && !audio.paused) audio.pause();
      setActiveMusicDancer(stage, '');
    }
  });
  syncProgressBar(currentSlide);
}

/** 空格键：在舞台页切播放/暂停（返回 true 表示已消费该按键） */
function handleStageSpaceKey(currentSlide) {
  if (!currentSlide || !currentSlide.classList.contains('music-stage')) return false;
  const audio = currentSlide.querySelector('audio');
  if (!audio) return false;

  if (audio.paused) {
    audio.play().catch((err) => console.warn('播放失败:', err));
  } else {
    audio.pause();
  }
  return true;
}

document.addEventListener('DOMContentLoaded', initMusicStages);
