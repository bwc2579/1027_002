/**
 * app.js - Main Application Controller for Morning Mindset & Meditation
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const todayDateEl = document.getElementById('current-date');
  const streakCountEl = document.getElementById('streak-count');
  const longestStreakEl = document.getElementById('longest-streak');
  const totalEntriesEl = document.getElementById('total-entries');

  // AI & Affirmation Elements
  const affirmationTextEl = document.getElementById('affirmation-text');
  const meditationScriptEl = document.getElementById('meditation-script');
  const affirmationThemeEl = document.getElementById('affirmation-theme');
  const btnRefreshAI = document.getElementById('btn-refresh-ai');
  const btnPlayTTS = document.getElementById('btn-play-tts');

  // Audio & Timer Elements
  const ytContainer = document.getElementById('yt-container');
  const playlistSelect = document.getElementById('playlist-select');
  const customYtInput = document.getElementById('custom-yt-url');
  const btnLoadCustomYt = document.getElementById('btn-load-custom-yt');
  const btnPlayBell = document.getElementById('btn-play-bell');
  const timerDisplay = document.getElementById('timer-display');
  const timerSelect = document.getElementById('timer-select');
  const btnStartTimer = document.getElementById('btn-start-timer');

  // Ambient Mixer Toggles & Sliders
  const ambientToggles = document.querySelectorAll('.ambient-toggle');
  const ambientSliders = document.querySelectorAll('.ambient-slider');
  const masterVolumeSlider = document.getElementById('master-volume');

  // Journal Elements
  const journalDateLabel = document.getElementById('journal-date-label');
  const journalInput = document.getElementById('journal-content');
  const moodChips = document.querySelectorAll('.mood-chip');
  const btnSaveJournal = document.getElementById('btn-save-journal');
  const autosaveIndicator = document.getElementById('autosave-indicator');

  // History & Modal Elements
  const calendarContainer = document.getElementById('calendar-container');
  const historyListContainer = document.getElementById('history-list-container');
  const historySearchInput = document.getElementById('history-search');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const settingsModal = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const apiKeyInput = document.getElementById('gemini-api-key');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnExportData = document.getElementById('btn-export-data');
  const btnImportData = document.getElementById('btn-import-data');
  const importFileInput = document.getElementById('import-file-input');
  const historyDetailModal = document.getElementById('history-detail-modal');
  const btnCloseDetail = document.getElementById('btn-close-detail');

  // State
  let currentMood = '평온함';
  let activeJournalDate = window.storageManager.getTodayDateString();
  let timerInterval = null;
  let timerRemainingSeconds = 300; // default 5 min

  // --- 1. Initialization ---
  function initApp() {
    displayDateInfo();
    updateStreakUI();
    loadCuratedPlaylist();
    loadDailyAffirmation();
    loadTodayJournalOrDraft();
    renderCalendarView();
    setupAmbientControls();
    setupSettings();
  }

  function displayDateInfo() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    todayDateEl.textContent = now.toLocaleDateString('ko-KR', options);
    journalDateLabel.textContent = `${activeJournalDate} 오늘의 마음가짐`;
  }

  function updateStreakUI() {
    const stats = window.storageManager.calculateStreak();
    streakCountEl.textContent = `${stats.current}일`;
    if (longestStreakEl) longestStreakEl.textContent = `${stats.longest}일`;
    if (totalEntriesEl) totalEntriesEl.textContent = `${stats.totalEntries}회`;
  }

  // --- 2. YouTube & Ambient Audio ---
  function loadCuratedPlaylist() {
    const list = window.youtubePlayer.getCuratedPlaylist();
    playlistSelect.innerHTML = list.map((item, idx) => 
      `<option value="${item.id}">${item.title} (${item.duration})</option>`
    ).join('');

    // Load first item
    ytContainer.innerHTML = window.youtubePlayer.getEmbedHtml(list[0].id);

    playlistSelect.addEventListener('change', (e) => {
      ytContainer.innerHTML = window.youtubePlayer.getEmbedHtml(e.target.value);
    });

    if (btnLoadCustomYt) {
      btnLoadCustomYt.addEventListener('click', () => {
        const id = window.youtubePlayer.extractVideoId(customYtInput.value);
        if (id) {
          ytContainer.innerHTML = window.youtubePlayer.getEmbedHtml(id);
          customYtInput.value = '';
        } else {
          alert('유효한 유튜브 영상 링크나 영상 ID를 입력해 주세요.');
        }
      });
    }
  }

  function setupAmbientControls() {
    ambientToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const type = toggle.dataset.type;
        const isActive = window.ambientMixer.toggleSound(type);
        toggle.classList.toggle('active', isActive);
      });
    });

    ambientSliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const type = e.target.dataset.type;
        const val = parseFloat(e.target.value);
        window.ambientMixer.setVolume(type, val);
      });
    });

    if (masterVolumeSlider) {
      masterVolumeSlider.addEventListener('input', (e) => {
        window.ambientMixer.setMasterVolume(parseFloat(e.target.value));
      });
    }

    if (btnPlayBell) {
      btnPlayBell.addEventListener('click', () => {
        window.ambientMixer.playMeditationBell();
      });
    }

    // Timer Logic
    if (btnStartTimer) {
      btnStartTimer.addEventListener('click', toggleMeditationTimer);
    }
    if (timerSelect) {
      timerSelect.addEventListener('change', (e) => {
        if (!timerInterval) {
          timerRemainingSeconds = parseInt(e.target.value, 10) * 60;
          updateTimerDisplay();
        }
      });
    }
  }

  function toggleMeditationTimer() {
    if (timerInterval) {
      // Stop timer
      clearInterval(timerInterval);
      timerInterval = null;
      btnStartTimer.textContent = '명상 타이머 시작';
      btnStartTimer.classList.remove('running');
    } else {
      // Start timer
      timerRemainingSeconds = parseInt(timerSelect.value, 10) * 60;
      updateTimerDisplay();
      btnStartTimer.textContent = '타이머 일시 정지';
      btnStartTimer.classList.add('running');
      window.ambientMixer.playMeditationBell(); // Starting bell

      timerInterval = setInterval(() => {
        timerRemainingSeconds--;
        updateTimerDisplay();

        if (timerRemainingSeconds <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          btnStartTimer.textContent = '명상 완료!';
          btnStartTimer.classList.remove('running');
          window.ambientMixer.playMeditationBell(); // Finishing bell
          alert('5분 명상이 완료되었습니다. 오늘의 마음가짐을 기록해 보세요 🌿');
          journalInput.focus();
        }
      }, 1000);
    }
  }

  function updateTimerDisplay() {
    const mins = Math.floor(timerRemainingSeconds / 60);
    const secs = timerRemainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- 3. AI & Affirmation ---
  async function loadDailyAffirmation(customTheme = '') {
    affirmationTextEl.textContent = '오늘의 활력 메시지를 불러오는 중...';
    meditationScriptEl.textContent = '';
    const settings = window.storageManager.getSettings();
    const result = await window.aiService.generateDailyScript(settings.geminiApiKey, {
      mood: customTheme || currentMood,
      goal: '하루를 차분하고 힘차게 시작하기'
    });

    affirmationTextEl.textContent = `"${result.affirmation}"`;
    meditationScriptEl.textContent = result.script;
    affirmationThemeEl.textContent = `${result.theme || '아침 리추얼'} • ${result.author}`;

    // Auto-prepare text for TTS
    setupTTS();
  }

  function setupTTS() {
    if (!window.ttsService.isSupported()) {
      btnPlayTTS.style.display = 'none';
      return;
    }

    btnPlayTTS.onclick = () => {
      const fullText = `${affirmationTextEl.textContent}. ${meditationScriptEl.textContent}`;
      window.ttsService.toggle(
        fullText,
        () => {
          btnPlayTTS.innerHTML = '⏸️ 음성 정지';
          btnPlayTTS.classList.add('playing');
        },
        () => {
          btnPlayTTS.innerHTML = '🔊 음성 낭독';
          btnPlayTTS.classList.remove('playing');
        },
        (err) => {
          console.warn(err);
          btnPlayTTS.innerHTML = '🔊 음성 낭독';
          btnPlayTTS.classList.remove('playing');
        }
      );
    };
  }

  if (btnRefreshAI) {
    btnRefreshAI.addEventListener('click', () => {
      window.ttsService.stop();
      loadDailyAffirmation(currentMood);
    });
  }

  // --- 4. Journaling & Autosave ---
  function loadTodayJournalOrDraft() {
    const existing = window.storageManager.getJournal(activeJournalDate);
    if (existing) {
      journalInput.value = existing.content || '';
      currentMood = existing.mood || '평온함';
      updateMoodChipSelection();
      autosaveIndicator.textContent = '오늘 이미 작성된 기록이 있습니다.';
    } else {
      const draft = window.storageManager.getDraft();
      if (draft && draft.content) {
        journalInput.value = draft.content;
        currentMood = draft.mood || '평온함';
        updateMoodChipSelection();
        autosaveIndicator.textContent = '작성 중이던 임시 저장본을 불러왔습니다.';
      } else {
        journalInput.value = '';
        autosaveIndicator.textContent = '자동 저장 준비됨';
      }
    }
  }

  // Keystroke Autosave
  journalInput.addEventListener('input', () => {
    window.storageManager.saveDraft(journalInput.value, currentMood, affirmationTextEl.textContent);
    autosaveIndicator.textContent = '자동 저장됨 (' + new Date().toLocaleTimeString('ko-KR') + ')';
  });

  // Mood selector chips
  moodChips.forEach(chip => {
    chip.addEventListener('click', () => {
      currentMood = chip.dataset.mood;
      updateMoodChipSelection();
      window.storageManager.saveDraft(journalInput.value, currentMood, affirmationTextEl.textContent);
    });
  });

  function updateMoodChipSelection() {
    moodChips.forEach(chip => {
      chip.classList.toggle('selected', chip.dataset.mood === currentMood);
    });
  }

  // Save journal entry
  btnSaveJournal.addEventListener('click', () => {
    const content = journalInput.value.trim();
    if (!content) {
      alert('오늘의 마음가짐이나 다짐을 한 줄 이상 작성해 주세요.');
      journalInput.focus();
      return;
    }

    try {
      window.storageManager.saveJournal(activeJournalDate, {
        content: content,
        mood: currentMood,
        affirmation: affirmationTextEl.textContent.replace(/^"|"$/g, '')
      });

      autosaveIndicator.textContent = '성공적으로 저장되었습니다!';
      updateStreakUI();
      renderCalendarView();
      alert('오늘의 모닝 리추얼이 안전하게 저장되었습니다! 활기찬 하루 보내세요 ☀️');
    } catch (e) {
      alert(`저장 중 오류가 발생했습니다: ${e.message}`);
    }
  });

  // --- 5. Calendar & History Search ---
  function renderCalendarView() {
    window.calendarInsights.renderCalendar(calendarContainer, (dateStr) => {
      openDateDetailModal(dateStr);
    });
    renderHistorySearchResults();
  }

  function renderHistorySearchResults() {
    const keyword = historySearchInput ? historySearchInput.value.trim() : '';
    window.calendarInsights.renderSearchResults(historyListContainer, { keyword }, (dateStr) => {
      openDateDetailModal(dateStr);
    });
  }

  if (historySearchInput) {
    historySearchInput.addEventListener('input', renderHistorySearchResults);
  }

  function openDateDetailModal(dateStr) {
    const entry = window.storageManager.getJournal(dateStr);
    const detailTitle = document.getElementById('detail-date');
    const detailMood = document.getElementById('detail-mood');
    const detailAffirmation = document.getElementById('detail-affirmation');
    const detailContent = document.getElementById('detail-content');
    const btnLoadToEditor = document.getElementById('btn-load-to-editor');

    detailTitle.textContent = `${dateStr} 기록`;
    if (entry) {
      detailMood.textContent = `기분: ${entry.mood || '평온함'}`;
      detailAffirmation.textContent = entry.affirmation ? `"${entry.affirmation}"` : '';
      detailContent.textContent = entry.content || '(기록된 내용이 없습니다)';
      btnLoadToEditor.style.display = 'inline-block';
      btnLoadToEditor.onclick = () => {
        activeJournalDate = dateStr;
        journalDateLabel.textContent = `${activeJournalDate} 기록 수정`;
        journalInput.value = entry.content || '';
        currentMood = entry.mood || '평온함';
        updateMoodChipSelection();
        historyDetailModal.classList.remove('active');
        journalInput.focus();
      };
    } else {
      detailMood.textContent = '';
      detailAffirmation.textContent = '';
      detailContent.textContent = '이 날짜에 작성된 기록이 없습니다.';
      btnLoadToEditor.style.display = 'none';
    }

    historyDetailModal.classList.add('active');
  }

  if (btnCloseDetail) {
    btnCloseDetail.addEventListener('click', () => {
      historyDetailModal.classList.remove('active');
    });
  }

  // --- 6. Settings, Backup, and API Key ---
  function setupSettings() {
    const settings = window.storageManager.getSettings();
    if (apiKeyInput && settings.geminiApiKey) {
      apiKeyInput.value = settings.geminiApiKey;
    }

    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', () => {
        settingsModal.classList.add('active');
      });
    }
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
      });
    }

    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        window.storageManager.saveSettings({ geminiApiKey: key });
        alert('설정이 저장되었습니다.');
        settingsModal.classList.remove('active');
        if (key) {
          loadDailyAffirmation();
        }
      });
    }

    // Export Data JSON
    if (btnExportData) {
      btnExportData.addEventListener('click', () => {
        const jsonStr = window.storageManager.exportDataJSON();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `morning-mindset-backup-${window.storageManager.getTodayDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Import Data JSON
    if (btnImportData && importFileInput) {
      btnImportData.addEventListener('click', () => {
        importFileInput.click();
      });

      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const res = window.storageManager.importDataJSON(event.target.result);
            alert(`성공적으로 ${res.count}개의 기록을 복원했습니다!`);
            initApp();
            settingsModal.classList.remove('active');
          } catch (err) {
            alert(err.message);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  // Kickoff
  initApp();
});
