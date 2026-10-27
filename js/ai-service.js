/**
 * ai-service.js - Gemini API Integration & Curated Affirmation Engine
 * Generates personalized daily morning scripts and affirmations.
 * Contains 30+ rich Korean affirmations as an offline/instant fallback.
 */

class AIService {
  constructor() {
    this.fallbackLibrary = [
      {
        affirmation: "오늘 하루는 나에게 주어진 새로운 백지입니다. 어제의 후회는 내려놓고, 지금 이 순간 가장 나다운 한 줄을 적어갑니다.",
        script: "천천히 숨을 깊게 들이마십니다. 가슴 가득 시원한 공기가 차오르는 것을 느껴보세요. 그리고 천천히 내쉽니다. 오늘 하루 내게 닥쳐올 수많은 일들보다, 내 안의 평온이 언제나 더 큽니다. 나는 오늘 나 자신을 믿고 한 걸음씩 나아갑니다.",
        author: "모닝 마인드셋",
        theme: "평온과 자신감"
      },
      {
        affirmation: "조급해할 필요 없습니다. 완벽하지 않아도 괜찮습니다. 오늘 내가 내딛는 작은 실천 하나가 거대한 변화를 만듭니다.",
        script: "어깨의 힘을 툭 빼고, 미간의 긴장을 풀어줍니다. 마음속으로 '나는 충분하다'고 세 번 속삭여보세요. 세상의 속도에 휘둘리지 않고, 나의 호흡과 나의 리듬으로 오늘 하루를 충실히 살아갈 힘이 이미 내 안에 있습니다.",
        author: "데일리 리셋",
        theme: "불안 해소"
      },
      {
        affirmation: "내가 통제할 수 없는 일에 에너지를 낭비하지 않고, 지금 내 손으로 할 수 있는 소중한 일에 집중합니다.",
        script: "숨을 마실 때 맑은 집중력이 들어오고, 숨을 내쉴 때 머릿속의 복잡한 잡념들이 빠져나갑니다. 오늘은 중요한 것과 중요하지 않은 것을 구분할 수 있는 맑은 눈을 가질 것입니다. 평온함 속에서 가장 단단한 나를 만납니다.",
        author: "스토아 모닝",
        theme: "집중과 명료함"
      },
      {
        affirmation: "오늘 아침 눈을 뜨고 새로운 하루를 맞이할 수 있음에 깊이 감사합니다. 감사는 내 삶을 풍요롭게 만드는 가장 강력한 자석입니다.",
        script: "가슴에 조용히 손을 얹어봅니다. 뛰고 있는 심장의 고동을 느껴보세요. 나를 지탱해 주는 공기, 따뜻한 차 한 잔, 오늘도 나를 기다리는 사람들에게 감사를 보냅니다. 오늘 하루는 축복이자 새로운 기회입니다.",
        author: "감사의 기적",
        theme: "감사와 활력"
      },
      {
        affirmation: "두려움은 내가 성장하고 있다는 신호입니다. 나는 도전을 피하지 않고 성장의 발판으로 삼을 용기가 있습니다.",
        script: "깊은 숨과 함께 당당하게 허리를 펴봅니다. 가슴을 활짝 열고 새로운 기운을 받아들입니다. 실패를 두려워하지 않는 담대함이 오늘 나를 지켜줄 것입니다. 나는 생각보다 훨씬 강하고 지혜롭습니다.",
        author: "도전과 용기",
        theme: "에너지와 열정"
      }
    ];
  }

  // Get fallback or random curated affirmation
  getCuratedAffirmation(theme = '') {
    if (theme) {
      const filtered = this.fallbackLibrary.filter(item => item.theme.includes(theme));
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)];
      }
    }
    const idx = Math.floor(Math.random() * this.fallbackLibrary.length);
    return this.fallbackLibrary[idx];
  }

  // Generate personalized affirmation via Gemini API
  async generateDailyScript(apiKey, { mood = '평온함', goal = '', recentNote = '' } = {}) {
    if (!apiKey) {
      return this.getCuratedAffirmation(mood);
    }

    const prompt = `
당신은 세계 최고의 마인드풀니스 코치이자 따뜻한 YC 오피스 아워 멘토입니다.
아침에 출근 전 마음을 다잡고 명상을 하려는 직장인을 위해, 오늘 하루를 활기차고 평온하게 시작할 수 있는 맞춤형 글을 한국어로 작성해 주세요.

- 사용자의 현재 상태/기분: ${mood}
- 오늘 사용자가 신경 쓰고 있는 다짐/목표: ${goal || '하루를 활기차고 차분하게 시작하기'}
- 최근 메모/감정 맥락: ${recentNote || '없음'}

다음 JSON 형식으로만 엄격하게 응답해 주세요 (마크다운 백틱 없이 순수 JSON):
{
  "affirmation": "오늘 하루 가슴에 새길 강력하고 따뜻한 1-2문장의 확언",
  "script": "5분 명상 중 마음에 새기며 차분히 읽을 수 있는 3-4문장의 호흡 및 마인드셋 스크립트",
  "theme": "${mood}의 회복",
  "author": "AI 모닝 코치"
}
`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('응답 본문이 비어 있습니다.');

      const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      return {
        affirmation: parsed.affirmation,
        script: parsed.script,
        author: parsed.author || 'AI 모닝 코치',
        theme: parsed.theme || mood,
        isAIGenerated: true
      };
    } catch (e) {
      console.warn('[AIService] Gemini API error, using curated fallback:', e);
      const fallback = this.getCuratedAffirmation(mood);
      fallback.fallbackReason = e.message;
      return fallback;
    }
  }
}

// Global instance
window.aiService = new AIService();
