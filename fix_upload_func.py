lines = []
with open('components/ClassesManager.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const handleFileUpload = async" in line:
        start_idx = i
    if start_idx != -1 and i > start_idx and "};" in line and "const handleAddStudent" in lines[i+1]:
        end_idx = i
        break
    if start_idx != -1 and i > start_idx and "catch (err: any)" in line:
        pass # keep searching for end of function

if start_idx != -1:
    print(f"Found handleFileUpload from {start_idx} to {end_idx}")

