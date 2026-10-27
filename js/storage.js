/**
 * storage.js - Local-First Persistent Engine for Morning Meditation Journal
 * Provides robust LocalStorage management, autosave drafts, date search, streak counting, and data export/import.
 */

class StorageManager {
  constructor(storageKey = 'morning_mindset_journals', draftKey = 'morning_mindset_draft') {
    this.storageKey = storageKey;
    this.draftKey = draftKey;
    this.settingsKey = 'morning_mindset_settings';
  }

  // Load all journals as an object { 'YYYY-MM-DD': journalData }
  getAllJournals() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
      console.error('[StorageManager] Error reading journals:', e);
      return {};
    }
  }

  // Save all journals
  _saveAll(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[StorageManager] Failed to persist data:', e);
      throw new Error('저장 공간이 부족하거나 스토리지 접근이 차단되었습니다.');
    }
  }

  // Get a single journal entry by YYYY-MM-DD
  getJournal(dateStr) {
    const all = this.getAllJournals();
    return all[dateStr] || null;
  }

  // Save or update a journal entry
  saveJournal(dateStr, entry) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error('올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.');
    }
    const all = this.getAllJournals();
    const existing = all[dateStr] || {};
    
    const record = {
      ...existing,
      ...entry,
      date: dateStr,
      updatedAt: new Date().toISOString()
    };
    if (!record.createdAt) {
      record.createdAt = record.updatedAt;
    }

    all[dateStr] = record;
    this._saveAll(all);
    this.clearDraft();
    return record;
  }

  // Delete an entry
  deleteJournal(dateStr) {
    const all = this.getAllJournals();
    if (all[dateStr]) {
      delete all[dateStr];
      this._saveAll(all);
      return true;
    }
    return false;
  }

  // Search journals by keyword, date, or mood
  searchJournals({ keyword = '', date = '', mood = '' } = {}) {
    const all = this.getAllJournals();
    const entries = Object.values(all).sort((a, b) => b.date.localeCompare(a.date));

    return entries.filter(item => {
      let match = true;
      if (date && item.date !== date) {
        match = false;
      }
      if (mood && item.mood !== mood) {
        match = false;
      }
      if (keyword) {
        const lower = keyword.toLowerCase();
        const contentMatch = (item.content || '').toLowerCase().includes(lower);
        const affirmationMatch = (item.affirmation || '').toLowerCase().includes(lower);
        const titleMatch = (item.title || '').toLowerCase().includes(lower);
        if (!contentMatch && !affirmationMatch && !titleMatch) {
          match = false;
        }
      }
      return match;
    });
  }

  // Calculate current and maximum streak
  calculateStreak() {
    const all = this.getAllJournals();
    const dates = Object.keys(all).sort().reverse(); // newest first
    if (dates.length === 0) {
      return { current: 0, longest: 0, totalEntries: 0 };
    }

    const todayStr = this.getTodayDateString();
    const yesterdayStr = this.getYesterdayDateString();

    let currentStreak = 0;
    let checkDate = new Date();
    
    // If written today, start from today; else if written yesterday, start from yesterday; else 0
    let startDay = null;
    if (all[todayStr]) {
      startDay = new Date();
    } else if (all[yesterdayStr]) {
      startDay = new Date();
      startDay.setDate(startDay.getDate() - 1);
    }

    if (startDay) {
      while (true) {
        const dateKey = this.formatDate(startDay);
        if (all[dateKey]) {
          currentStreak++;
          startDay.setDate(startDay.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedAsc = Object.keys(all).sort();
    let prevDate = null;

    for (const dStr of sortedAsc) {
      const curDate = new Date(dStr);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curDate;
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      totalEntries: Object.keys(all).length
    };
  }

  // Get mood distribution stats
  getMoodStats() {
    const all = this.getAllJournals();
    const stats = {};
    for (const item of Object.values(all)) {
      if (item.mood) {
        stats[item.mood] = (stats[item.mood] || 0) + 1;
      }
    }
    return stats;
  }

  // Draft operations for zero-data-loss autosave
  saveDraft(content, mood = '', affirmation = '') {
    try {
      const draft = { content, mood, affirmation, savedAt: new Date().toISOString() };
      localStorage.setItem(this.draftKey, JSON.stringify(draft));
    } catch (e) {
      console.warn('[StorageManager] Draft autosave failed:', e);
    }
  }

  getDraft() {
    try {
      const raw = localStorage.getItem(this.draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  clearDraft() {
    try {
      localStorage.removeItem(this.draftKey);
    } catch (e) {}
  }

  // Settings
  getSettings() {
    try {
      const raw = localStorage.getItem(this.settingsKey);
      return raw ? JSON.parse(raw) : { geminiApiKey: '', soundVolume: 0.5 };
    } catch (e) {
      return { geminiApiKey: '', soundVolume: 0.5 };
    }
  }

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      localStorage.setItem(this.settingsKey, JSON.stringify({ ...current, ...settings }));
    } catch (e) {
      console.error('[StorageManager] Failed to save settings:', e);
    }
  }

  // Backup & Restore
  exportDataJSON() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      journals: this.getAllJournals(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  importDataJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed.journals !== 'object') {
        throw new Error('유효하지 않은 백업 데이터 형식입니다.');
      }
      const existing = this.getAllJournals();
      const merged = { ...existing, ...parsed.journals };
      this._saveAll(merged);
      if (parsed.settings) {
        this.saveSettings(parsed.settings);
      }
      return { success: true, count: Object.keys(parsed.journals).length };
    } catch (e) {
      throw new Error(`데이터 복원 실패: ${e.message}`);
    }
  }

  // Helper date methods
  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayDateString() {
    return this.formatDate(new Date());
  }

  getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.formatDate(d);
  }
}

// Global instance export
window.storageManager = new StorageManager();
