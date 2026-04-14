import { useContext } from 'react'
import { SettingsContext } from './settingsStore'

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings 必须在 SettingsProvider 内使用')
  }
  return context
}

