@echo off
echo Testing Improved RAG System...
cd /d "%~dp0backend"
python src/utils/test_improved_system.py > test_results.txt 2>&1
echo Test complete. Results saved to test_results.txt
type test_results.txt
pause