with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

target = """  React.useEffect(() => {
    if (!selectedClassId && state.classes.length > 0) {
      setSelectedClassId(state.activeClassId || state.classes[0].id);
    }
  }, [state.classes, selectedClassId, state.activeClassId]);"""

content = content.replace(target, '')

with open('components/ClassesManager.tsx', 'w') as f:
    f.write(content)

