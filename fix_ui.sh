#!/bin/bash
# 1. Fix Truncation in Student Names (Mobile Cards) in AttendanceSanad
sed -i 's/<h4 className="font-bold text-sm text-\[#0D2C3B\] truncate leading-tight">/<h4 className="font-bold text-sm text-\[#0D2C3B\] whitespace-normal break-words leading-tight">/g' components/AttendanceSanad.tsx
sed -i 's/<span className="truncate">السبورة الحائطية ومنصة الأستاذ<\/span>/<span className="whitespace-normal">السبورة الحائطية ومنصة الأستاذ<\/span>/g' components/AttendanceSanad.tsx

# 2. Fix Truncation in Student Names (Mobile Cards) in GradesAndEvaluation
sed -i 's/<h4 className="font-bold text-sm text-\[#0D2C3B\] truncate leading-tight">/<h4 className="font-bold text-sm text-\[#0D2C3B\] whitespace-normal break-words leading-tight">/g' components/GradesAndEvaluation.tsx

# 3. Fix Seating Plan Layout Issue (Squished boxes)
# Add an overflow-x-auto wrapper and min-width to the grid
sed -i 's/{.*Classroom Seating Grid.*}/{*\ Classroom Seating Grid: Rows of Double Desks *\}\n              <div className="overflow-x-auto pb-4 w-full">\n                <div/' components/AttendanceSanad.tsx
sed -i 's/className="grid gap-4"/className="grid gap-4 min-w-[600px] md:min-w-0"/g' components/AttendanceSanad.tsx
# Need to close the new div wrapper after the grid
# Let's use perl to add a closing </div> after the grid ends
# The grid ends at `</div>` before the `) : (` or `</div>` that closes the seating plan.
