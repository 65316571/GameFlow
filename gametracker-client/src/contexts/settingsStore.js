import { createContext } from 'react'

export const defaultSettings = {
  immersiveMode: false,
  immersiveGameId: null,
  themeMode: 'light',
  mobileMode: 'auto',
  isMobileView: false,
  sidebarFloat: true,
  sidebarCollapsed: false,
}

export const SettingsContext = createContext(null)

