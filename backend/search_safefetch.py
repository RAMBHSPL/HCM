import os

filepath = r"c:\Users\user\Desktop\HCM\HCM_V3\frontend\src\context\DataContext.jsx"
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    start_line = -1
    for i, line in enumerate(lines):
        if "const safeFetch" in line:
            start_line = i
            break
    if start_line != -1:
        for idx in range(start_line, min(start_line + 50, len(lines))):
            print(f"{idx+1}: {lines[idx].strip()}")
else:
    print("File does not exist")
