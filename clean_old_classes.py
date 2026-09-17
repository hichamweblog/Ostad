import re

with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

# Add a tiny useEffect to clean up old 'عام' streams if needed?
# Actually, I won't. The user can just delete it from the UI.
