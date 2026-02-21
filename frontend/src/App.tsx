import { useState, UseEffect } from 'react'

function App() {
  useEffect(() => {
    console.log(import.meta.env.VITE_API_URL)
  }, [])
  return(
  <>
  hello world
  </>
  )
}

export default App
