import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Library from './pages/Library'
import Timer from './pages/Timer'
import Stats from './pages/Stats'
import Calendar from './pages/Calendar'
import Wiki from './pages/Wiki'
import Design from './pages/Design'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/library" element={<Library />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/design" element={<Design />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
