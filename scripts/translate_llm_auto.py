import os
import json
import time
from google import genai
from google.genai import types

# Cấu hình file
MISSING_FILES = {
    'toeic': {
        'missing': 'scratch/toeic_missing.json',
        'target': 'public/data/levels/TOEIC.json',
        'level': 'TOEIC'
    },
    'toefl': {
        'missing': 'scratch/toefl_missing.json',
        'target': 'public/data/levels/TOEFL.json',
        'level': 'TOEFL'
    }
}
BATCH_SIZE = 50

def get_difficulty(word):
    length = len(word)
    if length <= 5:
        return 1
    elif length <= 8:
        return 2
    else:
        return 3

def translate_batch(client, words, level):
    prompt = f"""
Translate the following English words into Vietnamese and Japanese.
Provide the output strictly as a JSON array of objects. Do not include markdown formatting or extra text.
Each object must have the exact keys: "word", "meaning_vi", "meaning_ja".
Words:
{json.dumps(words)}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            ),
        )
        
        results = json.loads(response.text)
        formatted_results = []
        for item in results:
            formatted_results.append({
                "word": item["word"],
                "meaning_vi": item["meaning_vi"],
                "meaning_ja": item["meaning_ja"],
                "level": level,
                "difficulty": get_difficulty(item["word"])
            })
        return formatted_results
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("LỖI: Chưa thiết lập biến môi trường GEMINI_API_KEY.")
        print("Vui lòng chạy lệnh: export GEMINI_API_KEY='your_api_key' trước khi chạy script này.")
        return

    client = genai.Client(api_key=api_key)

    for key, config in MISSING_FILES.items():
        if not os.path.exists(config['missing']):
            continue
            
        print(f"\n--- Bắt đầu xử lý: {key.upper()} ---")
        with open(config['missing'], 'r', encoding='utf-8') as f:
            missing_words = json.load(f)
            
        if not missing_words:
            print(f"Không có từ nào cần dịch cho {key.upper()}.")
            continue
            
        # Đọc dữ liệu hiện tại
        existing_data = []
        if os.path.exists(config['target']):
            with open(config['target'], 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                
        print(f"Số lượng từ cần dịch: {len(missing_words)}")
        
        successful = 0
        for i in range(0, len(missing_words), BATCH_SIZE):
            batch = missing_words[i:i+BATCH_SIZE]
            print(f"Đang dịch batch {i//BATCH_SIZE + 1}/{(len(missing_words)+BATCH_SIZE-1)//BATCH_SIZE} ({len(batch)} từ)...")
            
            translated = translate_batch(client, batch, config['level'])
            if translated:
                existing_data.extend(translated)
                successful += len(translated)
                
                # Ghi ngay sau mỗi batch để không mất dữ liệu nếu lỗi
                with open(config['target'], 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, ensure_ascii=False)
                    
            time.sleep(2) # Tránh rate limit
            
        print(f"Hoàn thành {key.upper()}: Đã dịch thành công {successful}/{len(missing_words)} từ.")
        
        # Cập nhật all_words.json
        print("Đang cập nhật all_words.json...")
        all_words_path = 'public/data/all_words.json'
        if os.path.exists(all_words_path):
            with open(all_words_path, 'r', encoding='utf-8') as f:
                all_words = json.load(f)
            
            # Xóa các từ cũ của level này và thêm bản mới nhất
            filtered = [w for w in all_words if w['level'] != config['level']]
            filtered.extend(existing_data)
            
            with open(all_words_path, 'w', encoding='utf-8') as f:
                json.dump(filtered, f, ensure_ascii=False)
            print("Đã cập nhật all_words.json.")

if __name__ == "__main__":
    main()
