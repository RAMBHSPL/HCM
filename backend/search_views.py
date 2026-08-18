import os

filepath = r"c:\Users\user\Desktop\HCM\HCM_V3\backend\core\views.py"
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for i, line in enumerate(lines):
        if "Section" in line or "section" in line:
            if "class" in line or "def " in line or "queryset" in line:
                print(f"{i+1}: {line.strip()}")
else:
    print("File does not exist")
