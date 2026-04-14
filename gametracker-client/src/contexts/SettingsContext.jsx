import { useState, useEffect } from 'react'
import { SettingsContext, defaultSettings } from './settingsStore'

export function SettingsProvider({ children }) {
  // 从 localStorage 加载设置
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gametracker-settings')
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) }
        } catch (e) {
          console.error('Failed to parse settings:', e)
        }
      }
    }
    return defaultSettings
  })

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('gametracker-settings', JSON.stringify(settings))
  }, [settings])

  // 检测系统主题偏好
  useEffect(() => {
    if (settings.themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light')
      }
      handleChange()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      document.documentElement.setAttribute('data-theme', settings.themeMode)
    }
  }, [settings.themeMode])

  // 检测设备类型（手机模式自动检测）
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isMobileWidth = window.innerWidth < 768
      
      let isMobileView = false
      
      if (settings.mobileMode === 'auto') {
        isMobileView = isMobileDevice || isMobileWidth
      } else if (settings.mobileMode === 'mobile') {
        isMobileView = true
      } else {
        isMobileView = false
      }
      
      setSettings(prev => ({ ...prev, isMobileView }))
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [settings.mobileMode])

  // 更新设置
  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  // 沉浸模式相关
  const enableImmersiveMode = (gameId) => {
    updateSettings({ immersiveMode: true, immersiveGameId: gameId })
  }

  const disableImmersiveMode = () => {
    updateSettings({ immersiveMode: false, immersiveGameId: null })
  }

  // 切换主题
  const toggleTheme = () => {
    const modes = ['light', 'dark', 'auto']
    const currentIndex = modes.indexOf(settings.themeMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    updateSettings({ themeMode: nextMode })
  }

  // 切换侧边栏
  const toggleSidebar = () => {
    updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
  }

  const toggleSidebarFloat = () => {
    updateSettings({ sidebarFloat: !settings.sidebarFloat })
  }

  const value = {
    settings,
    updateSettings,
    enableImmersiveMode,
    disableImmersiveMode,
    toggleTheme,
    toggleSidebar,
    toggleSidebarFloat,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
