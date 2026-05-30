import os
import re
import urllib.request
import urllib.parse
import json
import ssl
import time

INPUT_PATH = "scratch/toeic_input.txt"
DICT_PATH = "src/data/dictionary.ts"
IELTS_PATH = "src/data/ieltsWords.ts"
OUTPUT_PATH = "src/data/toeicWords.ts"
BATCH_SIZE = 80  # Reasonable batch size to ensure URL length limits are not exceeded

def load_words_from_input(path):
    print(f"Reading words from {path}...")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Input file not found at: {path}")
    
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    words = []
    for line in lines:
        w = line.strip()
        if not w:
            continue
        # Skip the header if any
        if w.lower() in ("english", "word", "toeic"):
            continue
        words.append(w)
        
    # Deduplicate while preserving order
    seen = set()
    unique_words = []
    for w in words:
        wl = w.lower()
        if wl not in seen:
            seen.add(wl)
            unique_words.append(w)
            
    print(f"Loaded {len(words)} raw rows. Unique words count: {len(unique_words)}")
    return unique_words

def load_existing_words(*paths):
    existing = set()
    for path in paths:
        if not os.path.exists(path):
            continue
        print(f"Scanning existing words in {path} to avoid duplicates...")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        matches = re.findall(r"word:\s*['\"]([^'\"]+)['\"]", content)
        existing.update({m.lower().strip() for m in matches})
        
    print(f"Found total {len(existing)} existing words across scanned files.")
    return existing

def translate_batch(words, sl="en", tl="vi"):
    text = "\n".join(words)
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sl + "&tl=" + tl + "&dt=t&q=" + urllib.parse.quote(text)
    
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
    context = ssl._create_unverified_context()
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            res = urllib.request.urlopen(req, context=context).read().decode("utf-8")
            data = json.loads(res)
            
            # Map translated segments back to original words
            mapping = {}
            for item in data[0]:
                if len(item) >= 2 and item[0] and item[1]:
                    orig = item[1].strip().lower()
                    trans = item[0].strip()
                    mapping[orig] = trans
            return mapping
        except Exception as e:
            print(f"Error translating batch (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                return {}

def translate_all_words(words, sl="en", tl="vi", lang_name="Vietnamese"):
    print(f"Translating {len(words)} words into {lang_name} in batches of {BATCH_SIZE}...")
    translations = {}
    
    for i in range(0, len(words), BATCH_SIZE):
        batch = words[i:i+BATCH_SIZE]
        print(f"  Processing {i} to {min(i+BATCH_SIZE, len(words))} / {len(words)}...")
        
        batch_mapping = translate_batch(batch, sl, tl)
        
        # Verify and merge
        for w in batch:
            wl = w.lower()
            if wl in batch_mapping:
                translations[wl] = batch_mapping[wl]
            else:
                # Individual fallback for missing keys
                fallback = translate_batch([w], sl, tl)
                if wl in fallback:
                    translations[wl] = fallback[wl]
                else:
                    translations[wl] = w  # Fallback to original word if failed
                    
        # Sleep to avoid rate limiting
        time.sleep(0.3)
        
    return translations

def get_difficulty(word):
    length = len(word)
    if length <= 5:
        return 1
    elif length <= 8:
        return 2
    else:
        return 3

def main():
    try:
        # Step 1: Load and filter
        all_words = load_words_from_input(INPUT_PATH)
        existing = load_existing_words(DICT_PATH, IELTS_PATH)
        
        new_words = [w for w in all_words if w.lower() not in existing]
        print(f"Number of new words to translate: {len(new_words)}")
        
        if not new_words:
            print("All words already exist in scanned files!")
            return
            
        # Step 2: Translate to VI and JA
        vi_translations = translate_all_words(new_words, "en", "vi", "Vietnamese")
        ja_translations = translate_all_words(new_words, "en", "ja", "Japanese")
        
        # Step 3: Format and write to toeicWords.ts
        print(f"Generating TypeScript file at {OUTPUT_PATH}...")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            f.write("import type { DictionaryEntry } from '../types/game';\n\n")
            f.write("export const TOEIC_WORDS: DictionaryEntry[] = [\n")
            
            for w in new_words:
                wl = w.lower()
                vi = vi_translations.get(wl, w).replace("'", "\\'")
                ja = ja_translations.get(wl, w).replace("'", "\\'")
                diff = get_difficulty(w)
                escaped_word = w.replace("'", "\\'")
                
                f.write(f"  {{ word: '{escaped_word}', meaning_vi: '{vi}', meaning_ja: '{ja}', level: 'TOEIC', difficulty: {diff} }},\n")
                
            f.write("];\n")
            
        print("Success! Generated toeicWords.ts file successfully.")
        
    except Exception as e:
        print(f"Execution failed: {e}")

if __name__ == "__main__":
    main()
