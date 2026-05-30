import urllib.request
import urllib.parse
import json
import ssl
import re
import time
import os

# Bypass macOS SSL verification errors
ssl_context = ssl._create_unverified_context()

def translate_single(text, src='ja', dest='vi'):
    try:
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + src + "&tl=" + dest + "&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, context=ssl_context) as response:
            res = response.read().decode('utf-8')
            data = json.loads(res)
            translated = "".join([part[0] for part in data[0] if part[0]])
            return translated.strip()
    except Exception as e:
        print(f"Error translating single '{text}': {e}")
        return ""

def translate_batch_raw(texts, src='ja', dest='vi'):
    combined = "\n".join(texts)
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + src + "&tl=" + dest + "&dt=t&q=" + urllib.parse.quote(combined)
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    with urllib.request.urlopen(req, context=ssl_context) as response:
        res = response.read().decode('utf-8')
        data = json.loads(res)
        
        translated_lines = []
        for part in data[0]:
            if part[0]:
                translated_lines.append(part[0])
        
        full_translation = "".join(translated_lines)
        return [line.strip() for line in full_translation.strip().split("\n")]

def translate_batch(texts, src='ja', dest='vi'):
    try:
        results = translate_batch_raw(texts, src, dest)
        if len(results) == len(texts):
            return results
        # If length mismatch, print warning and try individually
        print(f"Warning: Batch output count mismatch ({len(results)} vs {len(texts)}). Retrying individually...")
    except Exception as e:
        print(f"Warning: Batch translation error: {e}. Retrying individually...")
    
    # Fallback to individual
    individual_results = []
    for txt in texts:
        individual_results.append(translate_single(txt, src, dest))
        time.sleep(0.05)
    return individual_results

def clean_translation(text, original_word):
    if not text:
        return ""
    text = text.strip()
    
    # Clean leading/trailing Japanese particles or punctuation like ~, ～, ..., …, -, +
    text = re.sub(r'^[~～…\.\s\-\+]+', '', text)
    text = re.sub(r'[~～…\.\s\-\+]+$', '', text)
    
    # Remove surrounding double/single quotes if any
    if (text.startswith("'") and text.endswith("'")) or (text.startswith('"') and text.endswith('"')):
        text = text[1:-1].strip()
        
    # Match casing of the original English word
    if original_word and original_word[0].isupper():
        text = text[0].upper() + text[1:]
    else:
        if original_word and original_word[0].islower():
            text = text[0].lower() + text[1:]
            
    # Escape single quotes for safe TS usage
    text = text.replace("'", "\\'")
    return text

def execute_translation_pipeline():
    dict_path = 'src/data/dictionary.ts'
    if not os.path.exists(dict_path):
        print(f"Error: {dict_path} not found.")
        return
        
    print("Reading and parsing src/data/dictionary.ts...")
    with open(dict_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Regex to capture:
    # Group 1: Prefix up to meaning_vi:'
    # Group 2: Word (with potential escaped quotes)
    # Group 3: Old meaning_vi
    # Group 4: Middle and Japanese meaning and suffix
    # Group 5: Japanese meaning (with potential escaped quotes)
    line_pattern = re.compile(
        r"^(\s*\{\s*word:\s*'((?:[^'\\]|\\.)*)',\s*meaning_vi:\s*')([^']*)('\s*,\s*meaning_ja:\s*'((?:[^'\\]|\\.)*)'.*)$"
    )
    
    missing_items = []
    
    for idx, line in enumerate(lines):
        match = line_pattern.search(line)
        if match:
            prefix, word, old_vi, suffix, meaning_ja = match.groups()
            # We want to translate if meaning_vi is empty OR has placeholder "từ vựng"
            if old_vi == "" or old_vi == "từ vựng":
                missing_items.append({
                    "line_index": idx,
                    "word": word,
                    "meaning_ja": meaning_ja
                })
                
    total_missing = len(missing_items)
    print(f"Found total {total_missing} entries that need Vietnamese translations.")
    if total_missing == 0:
        print("All entries are already fully translated! Nothing to do.")
        return
        
    print("Beginning batch translation pipeline...")
    batch_size = 50
    completed_count = 0
    start_time = time.time()
    
    for i in range(0, total_missing, batch_size):
        chunk = missing_items[i:i+batch_size]
        chunk_ja_phrases = [item["meaning_ja"] for item in chunk]
        
        # Translate the batch
        translated_results = translate_batch(chunk_ja_phrases)
        
        # Merge back into our line representations
        for idx, item in enumerate(chunk):
            line_idx = item["line_index"]
            original_line = lines[line_idx]
            match = line_pattern.search(original_line)
            
            if match:
                prefix, word, old_vi, suffix, meaning_ja = match.groups()
                
                # Get the translated text (handling index safety)
                translated_text = ""
                if idx < len(translated_results):
                    translated_text = translated_results[idx]
                    
                clean_vi = clean_translation(translated_text, word)
                
                if clean_vi:
                    # Update the line directly
                    updated_line = f"{prefix}{clean_vi}{suffix}\n"
                    lines[line_idx] = updated_line
                    
        completed_count += len(chunk)
        elapsed = time.time() - start_time
        speed = completed_count / elapsed if elapsed > 0 else 0
        remaining_time = (total_missing - completed_count) / speed if speed > 0 else 0
        
        print(f"Progress: {completed_count}/{total_missing} ({completed_count/total_missing*100:.1f}%) | "
              f"Elapsed: {elapsed/60:.1f}m | Est. Remaining: {remaining_time/60:.1f}m")
        
        # Polite delay to be nice to Google's free service
        time.sleep(0.1)
        
    # Save the updated file
    print(f"Writing updated translations back to {dict_path}...")
    with open(dict_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print("Translation pipeline successfully executed!")

if __name__ == "__main__":
    execute_translation_pipeline()
