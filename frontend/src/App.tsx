import { useState, useEffect } from 'react'


function App() {

const [data, setData] = useState([]);
useEffect(() => {
  async function fetchData() {
    console.log(import.meta.env.VITE_API_URL)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      console.log(result)
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  fetchData();
}, []);

  return(
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Dashboard de UniTasker</h1>

      {data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ejemplo: Mostrar los endpoints disponibles que devuelve tu API */}
          <div className="p-4 border rounded shadow-sm bg-slate-50">
            <h2 className="font-semibold text-lg border-b mb-2">Endpoints Disponibles</h2>
            <ul className="list-disc ml-5">
              <li><strong>Usuarios:</strong> {data.usuarios}</li>
              <li><strong>Tareas:</strong> {data.tareas}</li>
              <li><strong>Actividades:</strong> {data.actividades}</li>
            </ul>
          </div>

          {/* Sección para visualizar el JSON crudo de forma ordenada */}
          <div className="p-4 border rounded shadow-sm bg-gray-900 text-green-400 overflow-auto max-h-60">
            <h2 className="text-white mb-2 font-mono">Respuesta de la API:</h2>
            <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <p>Cargando datos del servidor...</p>
      )}
    </div>
  )
}

export default App
