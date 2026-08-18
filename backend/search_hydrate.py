import os

filepath = r"c:\Users\user\Desktop\HCM\HCM_V3\frontend\src\components\ModalForm.jsx"
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for i, line in enumerate(lines):
        if "hydrate" in line or "edit" in line.lower() or "setformdata" in line.lower():
            if "React.useEffect" in line or "useEffect" in line or "const edit" in line or "hydrate" in line:
                print(f"{i+1}: {line.strip()}")
else:
    print("File does not exist")
