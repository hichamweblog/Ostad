#!/bin/bash
# Insert useEffect after getObjectivesFromUnit definition
sed -i '/const handleSelectUnit = (unitId: string) => {/i \  useEffect(() => {\n    if (selectedUnitId \&\& !sessionGoals) {\n      const unit = availableUnits.find(u => u.id === selectedUnitId);\n      if (unit) {\n        setSessionGoals(getObjectivesFromUnit(unit));\n      }\n    }\n  }, [selectedUnitId, availableUnits]); // Initialize objectives on load\n' components/SessionCahier.tsx
