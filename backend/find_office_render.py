import os

filepath = r"c:\Users\user\Desktop\HCM\HCM_V3\frontend\src\components\ModalForm.jsx"
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    start_line = -1
    for i, line in enumerate(lines):
        if "modalType === 'Offices'" in line:
            print(f"Found modalType === 'Offices' at line {i+1}")
            start_line = i
            break
            
    if start_line != -1:
        # print 200 lines from start_line
        for idx in range(start_line, min(start_line + 300, len(lines))):
            print(f"{idx+1}: {lines[idx].strip()}")
else:
    print("File does not exist")
