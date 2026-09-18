#!/bin/bash
sed -i 's/import React, { useState } from '"'"'react'"'"';/import React, { useState, useEffect } from '"'"'react'"'"';/g' components/SessionCahier.tsx
