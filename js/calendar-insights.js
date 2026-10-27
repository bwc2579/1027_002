/**
 * calendar-insights.js - Calendar Heatmap, Date Search, and Mood Analytics
 */

class CalendarInsights {
  constructor(storage) {
    this.storage = storage;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth(); // 0-indexed
  }

  // Render monthly calendar grid into a container element
  renderCalendar(containerEl, onSelectDate) {
    if (!containerEl) return;
    const allJournals = this.storage.getAllJournals();

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const todayStr = this.storage.getTodayDateString();

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

    let html = `
      <div class="calendar-header">
        <button id="cal-prev" class="btn-cal-nav">&lt;</button>
        <span class="cal-title">${this.currentYear}년 ${monthNames[this.currentMonth]}</span>
        <button id="cal-next" class="btn-cal-nav">&gt;</button>
      </div>
      <div class="calendar-grid">
    `;

    // Weekday headers
    daysOfWeek.forEach(d => {
      html += `<div class="cal-day-header">${d}</div>`;
    });

    // Empty spaces before first day
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day-empty"></div>`;
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(this.currentMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateKey = `${this.currentYear}-${mStr}-${dStr}`;

      const entry = allJournals[dateKey];
      const hasEntry = !!entry;
      const isToday = (dateKey === todayStr);

      let moodIcon = '';
      if (hasEntry) {
        moodIcon = this._getMoodEmoji(entry.mood);
      }

      const classes = [
        'cal-day-cell',
        hasEntry ? 'has-entry' : '',
        isToday ? 'is-today' : ''
      ].filter(Boolean).join(' ');

      html += `
        <div class="${classes}" data-date="${dateKey}">
          <span class="day-number">${day}</span>
          ${hasEntry ? `<span class="day-mood-icon" title="${entry.mood || '기록됨'}">${moodIcon || '🌱'}</span>` : ''}
        </div>
      `;
    }

    html += `</div>`;
    containerEl.innerHTML = html;

    // Attach navigation listeners
    const prevBtn = containerEl.querySelector('#cal-prev');
    const nextBtn = containerEl.querySelector('#cal-next');

    if (prevBtn) {
      prevBtn.onclick = () => {
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = 11;
          this.currentYear--;
        }
        this.renderCalendar(containerEl, onSelectDate);
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        this.currentMonth++;
        if (this.currentMonth > 11) {
          this.currentMonth = 0;
          this.currentYear++;
        }
        this.renderCalendar(containerEl, onSelectDate);
      };
    }

    // Attach click listener on cells
    containerEl.querySelectorAll('.cal-day-cell').forEach(cell => {
      cell.onclick = () => {
        const date = cell.dataset.date;
        if (onSelectDate) onSelectDate(date);
      };
    });
  }

  _getMoodEmoji(mood) {
    const map = {
      '평온함': '🌿',
      '활기참': '☀️',
      '설렘/희망': '✨',
      '차분함': '🌊',
      '불안해소': '🕊️',
      '감사함': '🙏'
    };
    return map[mood] || '🌱';
  }

  // Render search results
  renderSearchResults(containerEl, searchParams, onSelectDate) {
    if (!containerEl) return;
    const results = this.storage.searchJournals(searchParams);

    if (results.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-results">
          <p>해당 조건의 기록이 없습니다.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="history-list">`;
    results.forEach(item => {
      html += `
        <div class="history-card" data-date="${item.date}">
          <div class="history-card-header">
            <span class="history-date">${item.date}</span>
            <span class="history-mood-badge">${this._getMoodEmoji(item.mood)} ${item.mood || '일반'}</span>
          </div>
          ${item.affirmation ? `<div class="history-affirmation">"${item.affirmation}"</div>` : ''}
          <div class="history-snippet">${this._escapeHtml(item.content || '').substring(0, 120)}...</div>
        </div>
      `;
    });
    html += `</div>`;

    containerEl.innerHTML = html;

    containerEl.querySelectorAll('.history-card').forEach(card => {
      card.onclick = () => {
        if (onSelectDate) onSelectDate(card.dataset.date);
      };
    });
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Global instance
window.calendarInsights = new CalendarInsights(window.storageManager);
