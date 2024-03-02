@echo off
WHERE node >nul 2>nul
if %ERRORLEVEL% NEQ 0 ( 
    echo You must install node.js to build this app!
) else (
    echo It is recommended to install signtool to remove corrupted signature warning!
    echo https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/

    .\node_modules\.bin\esbuild index.js --bundle --platform=node --outfile=out.js

    node --experimental-sea-config sea-config.json
    node -e "require('fs').copyFileSync(process.execPath, 'gif-validator.exe')"

    if NOT exist "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe" ( echo Signtool not found. Ignoring... ) else ( "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe" remove /s gif-validator.exe )
    
    npx postject gif-validator.exe NODE_SEA_BLOB sea.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

    if exist sea.blob ( del sea.blob )
    if exist out.js (  out.js )
)