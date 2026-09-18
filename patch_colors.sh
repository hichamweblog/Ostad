#!/bin/bash
sed -i 's/--bg-page: #F4F7F6;/--bg-page: #FAF9F6; \/* Modern Off-White (Warm) *\//g' app/globals.css
sed -i 's/--bg-page-subtle: #EBEFED;/--bg-page-subtle: #F0EFEA;/g' app/globals.css
sed -i 's/--bg-card: #FFFFFF;/--bg-card: #FFFFFF;/g' app/globals.css
sed -i 's/--border-card: #D5DFDC;/--border-card: #E2E0D8;/g' app/globals.css
sed -i 's/--text-primary: #0D2C3B;/--text-primary: #152A32; \/* Modern Slate Blue *\//g' app/globals.css
sed -i 's/--text-secondary: #425B67;/--text-secondary: #3E5159;/g' app/globals.css
sed -i 's/--text-muted: #647C87;/--text-muted: #74868C;/g' app/globals.css

sed -i 's/--accent-navy: #0D2C3B;/--accent-navy: #152A32;/g' app/globals.css
sed -i 's/--accent-navy-card: #123749;/--accent-navy-card: #223842;/g' app/globals.css
sed -i 's/--accent-green: #0E7C61;/--accent-green: #00D47F; \/* Vibrant Teal\/Green *\//g' app/globals.css
sed -i 's/--accent-green-hover: #0B634E;/--accent-green-hover: #00B66D;/g' app/globals.css
sed -i 's/--accent-light-green: #E8F5F1;/--accent-light-green: #E5FBF0;/g' app/globals.css
sed -i 's/--accent-gold: #D9B44A;/--accent-gold: #C9B5FF; \/* Modern Purple Accent *\//g' app/globals.css
sed -i 's/--accent-gold-hover: #C5A036;/--accent-gold-hover: #AE92F8;/g' app/globals.css

echo "Colors updated successfully."
