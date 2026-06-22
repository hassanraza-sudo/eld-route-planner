import { useState } from 'react'
import HomePage from './pages/HomePage'
import ResultsPage from './pages/ResultsPage'

function App() {
  const [tripData, setTripData] = useState(null)
  const [formValues, setFormValues] = useState(null)

  const handleResults = (data, form) => {
    setTripData(data)
    setFormValues(form)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setTripData(null)
    setFormValues(null)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f1117' }}>
      {tripData ? (
        <ResultsPage tripData={tripData} formValues={formValues} onBack={handleBack} />
      ) : (
        <HomePage onResults={handleResults} initialValues={formValues} />
      )}
    </div>
  )
}

export default App
