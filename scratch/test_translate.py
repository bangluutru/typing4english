import urllib.request
import urllib.parse
import json
import ssl

def translate_free_batch(texts, src='ja', dest='vi'):
    try:
        combined = "\n".join(texts)
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + src + "&tl=" + dest + "&dt=t&q=" + urllib.parse.quote(combined)
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            res = response.read().decode('utf-8')
            data = json.loads(res)
            
            # Combine the translations of lines
            translated_lines = []
            for part in data[0]:
                if part[0]:
                    translated_lines.append(part[0])
            
            full_translation = "".join(translated_lines)
            return full_translation.strip().split("\n")
    except Exception as e:
        print(f"Error: {e}")
        return []

# Test batch
tests = ["一生懸命に", "かたい", "～しよう", "ほかの", "人々"]
results = translate_free_batch(tests)
print("Batch results:")
for original, res in zip(tests, results):
    print(f"'{original}' -> '{res}'")
