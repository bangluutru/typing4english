import re
import json
import os

def extract_missing_words(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    missing_items = []
    total_parsed = 0
    missing_vi_count = 0
    missing_ja_count = 0
    fully_translated = 0
    
    # Track statistics by level
    level_stats = {}

    for idx, line in enumerate(lines):
        line = line.strip()
        # Ensure it looks like a dictionary entry line
        if not (line.startswith('{') and line.endswith('},') or line.endswith('}')):
            continue

        # Extract fields robustly using individual regexes
        word_match = re.search(r"word:\s*['\"](.*?)['\"]", line)
        vi_match = re.search(r"meaning_vi:\s*['\"](.*?)['\"]", line)
        ja_match = re.search(r"meaning_ja:\s*['\"](.*?)['\"]", line)
        level_match = re.search(r"level:\s*['\"](.*?)['\"]", line)
        diff_match = re.search(r"difficulty:\s*(\d+)", line)
        emoji_match = re.search(r"emoji:\s*['\"](.*?)['\"]", line)

        if word_match:
            word = word_match.group(1)
            meaning_vi = vi_match.group(1) if vi_match else ""
            meaning_ja = ja_match.group(1) if ja_match else ""
            level = level_match.group(1) if level_match else "Unknown"
            difficulty = int(diff_match.group(1)) if diff_match else 2
            emoji = emoji_match.group(1) if emoji_match else None

            total_parsed += 1

            if level not in level_stats:
                level_stats[level] = {
                    "total": 0,
                    "missing_vi": 0,
                    "missing_ja": 0,
                    "complete": 0
                }

            level_stats[level]["total"] += 1

            # Check translation status
            is_missing_vi = meaning_vi == ""
            is_missing_ja = meaning_ja == ""

            if is_missing_vi:
                missing_vi_count += 1
                level_stats[level]["missing_vi"] += 1
            if is_missing_ja:
                missing_ja_count += 1
                level_stats[level]["missing_ja"] += 1

            if not is_missing_vi and not is_missing_ja:
                fully_translated += 1
                level_stats[level]["complete"] += 1

            if is_missing_vi or is_missing_ja:
                missing_items.append({
                    "line_index": idx + 1,  # 1-based index
                    "word": word,
                    "meaning_vi": meaning_vi,
                    "meaning_ja": meaning_ja,
                    "level": level,
                    "difficulty": difficulty,
                    "emoji": emoji
                })

    # Save missing items to JSON
    os.makedirs('scratch', exist_ok=True)
    with open('scratch/missing_translations.json', 'w', encoding='utf-8') as out:
        json.dump(missing_items, out, ensure_ascii=False, indent=2)

    # Output stats report
    print("=" * 60)
    print("           BÁO CÁO THỐNG KÊ TỪ ĐIỂN TYPING AIR BATTLE")
    print("=" * 60)
    print(f"Tổng số từ vựng tìm thấy:      {total_parsed}")
    print(f"Đã dịch đầy đủ (3 ngôn ngữ):   {fully_translated} ({fully_translated/total_parsed*100:.2f}%)")
    print(f"Thiếu nghĩa tiếng Việt (VI):   {missing_vi_count} ({missing_vi_count/total_parsed*100:.2f}%)")
    print(f"Thiếu nghĩa tiếng Nhật (JA):   {missing_ja_count} ({missing_ja_count/total_parsed*100:.2f}%)")
    print(f"Số lượng từ cần dịch bổ sung:  {len(missing_items)}")
    print("-" * 60)
    print("                  CHI TIẾT THEO CẤP ĐỘ (LEVEL)")
    print("-" * 60)
    
    for lvl, stats in sorted(level_stats.items()):
        complete_pct = stats["complete"] / stats["total"] * 100
        print(f" Cấp độ: {lvl:<18} | Tổng: {stats['total']:>4} | Hoàn thành: {stats['complete']:>4} ({complete_pct:>5.1f}%) | Thiếu VI: {stats['missing_vi']:>4} | Thiếu JA: {stats['missing_ja']:>4}")
        
    print("=" * 60)
    print(f"Đã ghi danh sách {len(missing_items)} từ cần dịch vào file: scratch/missing_translations.json")
    print("=" * 60)

if __name__ == "__main__":
    extract_missing_words('src/data/dictionary.ts')
