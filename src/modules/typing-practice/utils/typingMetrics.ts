import { fingerMapping, fingerLabels } from '../data/fingerMapping';

// Calculate Words Per Minute (WPM)
export const calculateWPM = (correctChars: number, startTime: number | null): number => {
  if (!startTime) return 0;
  const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
  if (elapsedMinutes <= 0) return 0;
  
  // Standard: 1 word = 5 characters
  const wpm = (correctChars / 5) / elapsedMinutes;
  return Math.round(wpm);
};

// Calculate Typing Accuracy
export const calculateAccuracy = (correctKeystrokes: number, totalKeystrokes: number): number => {
  if (totalKeystrokes <= 0) return 100;
  const acc = (correctKeystrokes / totalKeystrokes) * 100;
  return Math.round(acc * 10) / 10; // Keep 1 decimal place
};

// Simple auto comments generator based on metrics
export const generateFeedback = (wpm: number, accuracy: number, weakKeys: string[]): string => {
  if (accuracy < 85) {
    return 'Tốc độ của bạn khá tốt nhưng độ chính xác còn thấp. Hãy gõ chậm lại và tập trung đặt đúng ngón tay vào vị trí Home Row nhé!';
  }
  
  if (wpm < 15 && accuracy >= 95) {
    return 'Độ chính xác của bạn rất tuyệt vời! Bây giờ, bạn có thể tăng nhịp điệu gõ nhanh hơn một chút mà không cần lo lắng quá nhiều.';
  }

  if (weakKeys.length > 0) {
    const key = weakKeys[0];
    const mapping = fingerMapping[key];
    if (mapping) {
      const fingerLabel = fingerLabels[mapping.finger];
      return `Bạn thường gõ sai phím "${key.toUpperCase()}" do ${fingerLabel} phụ trách. Hãy luyện tập nhấn phím này một vài lần để tạo trí nhớ cơ nhé!`;
    }
  }

  if (wpm >= 40 && accuracy >= 95) {
    return 'Xuất sắc! Bạn đã gõ cực kỳ điêu luyện với tốc độ và độ chính xác của một chuyên gia gõ 10 ngón. Hãy tiếp tục duy trì nhé!';
  }

  return 'Kết quả rất tốt! Hãy tiếp tục luyện tập bài học tiếp theo để tăng phản xạ của các ngón tay khác.';
};

// Format elapsed seconds to mm:ss
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
