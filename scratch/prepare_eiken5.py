import json
import os

def prepare_eiken5():
    missing_path = 'scratch/missing_translations.json'
    if not os.path.exists(missing_path):
        print("Error: missing_translations.json not found. Run extract_dictionary.py first.")
        return

    with open(missing_path, 'r', encoding='utf-8') as f:
        all_missing = json.load(f)

    # Filter for Eiken 5 Kyu
    eiken5_items = [item for item in all_missing if item["level"] == "Eiken 5 Kyu"]
    
    print(f"Total Eiken 5 Kyu items to translate: {len(eiken5_items)}")
    
    # Save the full Eiken 5 Kyu set for references
    os.makedirs('scratch/eiken5', exist_ok=True)
    with open('scratch/eiken5/eiken5_all.json', 'w', encoding='utf-8') as out:
        json.dump(eiken5_items, out, ensure_ascii=False, indent=2)

    # Split into 2 manageable chunks (~220 words each) for the LLM translation pass
    chunk_size = 220
    chunks = [eiken5_items[i:i + chunk_size] for i in range(0, len(eiken5_items), chunk_size)]

    for idx, chunk in enumerate(chunks):
        chunk_path = f'scratch/eiken5/eiken5_chunk_{idx+1}.json'
        with open(chunk_path, 'w', encoding='utf-8') as out:
            # Save only necessary fields for cleaner LLM prompting
            prompt_chunk = [
                {
                    "word": item["word"],
                    "meaning_ja": item["meaning_ja"],
                    "meaning_vi": ""
                }
                for item in chunk
            ]
            json.dump(prompt_chunk, out, ensure_ascii=False, indent=2)
        print(f"Created chunk {idx+1} ({len(chunk)} words) at: {chunk_path}")

if __name__ == "__main__":
    prepare_eiken5()
