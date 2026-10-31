@echo off
echo ============================================
echo  ExtTorrent App - EAS Cloud Build
echo ============================================
echo.
echo Step 1: Login to Expo (create free account at expo.dev)
call eas login

echo.
echo Step 2: Configure project
call eas build:configure

echo.
echo Step 3: Building APK (takes 5-10 min on Expo cloud)...
call eas build -p android --profile preview

echo.
echo Build complete! Check the URL above to download your APK.
pause
