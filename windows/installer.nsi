Unicode true
Name "Amythest for Windows"
OutFile "${OUTPUT}\amythest-0.6.0-windows-setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Amythest"
InstallDirRegKey HKCU "Software\Amythest" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "${DIST}\amythest.ico"
UninstallIcon "${DIST}\amythest.ico"
ShowInstDetails show
ShowUninstDetails show
Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  File "${DIST}\Amythest.exe"
  File "${DIST}\Amythest.NativeHost.exe"
  File "${DIST}\icon48.png"
  File "${DIST}\LICENSE"
  File "${DIST}\README.md"
  WriteUninstaller "$INSTDIR\Uninstall Amythest.exe"
  CreateDirectory "$SMPROGRAMS\Amythest"
  CreateShortCut "$SMPROGRAMS\Amythest\Amythest.lnk" "$INSTDIR\Amythest.exe"
  CreateShortCut "$SMPROGRAMS\Amythest\Uninstall Amythest.lnk" "$INSTDIR\Uninstall Amythest.exe"
  WriteRegStr HKCU "Software\Amythest" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Amythest" "DisplayName" "Amythest for Windows"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Amythest" "UninstallString" '"$INSTDIR\Uninstall Amythest.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Amythest" "DisplayIcon" "$INSTDIR\Amythest.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Amythest" "Publisher" "Amythest"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Amythest" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Amythest" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\Amythest\Amythest.lnk"
  Delete "$SMPROGRAMS\Amythest\Uninstall Amythest.lnk"
  RMDir "$SMPROGRAMS\Amythest"
  Delete "$INSTDIR\Amythest.exe"
  Delete "$INSTDIR\Amythest.NativeHost.exe"
  Delete "$INSTDIR\icon48.png"
  Delete "$INSTDIR\LICENSE"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\Uninstall Amythest.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Amythest"
  DeleteRegKey HKCU "Software\Amythest"
SectionEnd
