@echo off
cd /d "C:\Users\cm8ms\Desktop\MSM-Zafiro"
start /B "" "C:\Program Files\nodejs\npx.cmd" next dev -p 3001 > ".next\dev-server.log" 2>&1
echo Dev server starting on http://localhost:3001
echo Log: .next\dev-server.log
