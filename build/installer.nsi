; Custom per-user NSIS installer. The uninstaller is written at installation
; time, so cross-compilation does not execute Windows binaries or require Wine.
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"
!include "${PROJECT_DIR}/build/app-files.nsh"
!define ROOM_INSTALL_KEY "Software\${APP_ID}"
!define ROOM_UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_FILENAME}.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Raumakustik Digital Twin starten"
Name "${PRODUCT_NAME}"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\${PRODUCT_FILENAME}"
SetCompressor /SOLID lzma
SetOverwrite on
ShowInstDetails show
ShowUninstDetails show
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "German"
!insertmacro MUI_LANGUAGE "English"
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "Diese Anwendung benötigt Windows x64."
    Abort
  ${EndIf}
  SetRegView 64
  SetShellVarContext current
  ; Respect an explicit /D= directory. Otherwise reuse the previous location.
  ${If} $INSTDIR == "$LOCALAPPDATA\Programs\${PRODUCT_FILENAME}"
    ReadRegStr $0 HKCU "${ROOM_INSTALL_KEY}" "InstallLocation"
    ${If} $0 != ""
      StrCpy $INSTDIR $0
    ${EndIf}
  ${EndIf}
FunctionEnd
Section "Installieren"
  SetOutPath "$INSTDIR"
  File /r "${ROOM_APP_DIR}/*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "${ROOM_INSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${ROOM_UNINSTALL_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${ROOM_UNINSTALL_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${ROOM_UNINSTALL_KEY}" "Publisher" "Raumakustik"
  WriteRegStr HKCU "${ROOM_UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${ROOM_UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  WriteRegStr HKCU "${ROOM_UNINSTALL_KEY}" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
  WriteRegStr HKCU "${ROOM_UNINSTALL_KEY}" "QuietUninstallString" '$\"$INSTDIR\Uninstall.exe$\" /S'
  WriteRegDWORD HKCU "${ROOM_UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${ROOM_UNINSTALL_KEY}" "NoRepair" 1
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\Deinstallieren.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
SectionEnd
Function .onInstSuccess
  ; electron-updater passes --force-run when restart was requested.
  IfSilent 0 done
  ${GetParameters} $0
  ClearErrors
  ${GetOptions} $0 "--force-run" $1
  IfErrors done
  ExecShell "open" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  done:
FunctionEnd
Function un.onInit
  SetRegView 64
  SetShellVarContext current
FunctionEnd
Section "Uninstall"
  ; Delete only packaged files. Projects or other user files remain intact.
  !insertmacro DeleteInstalledApplication
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\Deinstallieren.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  DeleteRegKey HKCU "${ROOM_INSTALL_KEY}"
  DeleteRegKey HKCU "${ROOM_UNINSTALL_KEY}"
  ; Intentionally retain app settings and encrypted keys in userData.
SectionEnd
