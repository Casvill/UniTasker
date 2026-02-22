import { useState, useEffect } from 'react'

// 1. Definimos la interfaz para que TypeScript sepa qué contiene 'data'
interface ApiResponse {
  usuarios: string;
  actividades: string;
  tareas: string;
  registros: string;
}

function App() {
  // 2. Inicializamos como null y pasamos la interfaz ApiResponse
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Verificamos que la URL exista en la consola del build
      console.log("Fetching from:", import.meta.env.VITE_API_URL)
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log("Result:", result)
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-6 font-sans text-black">
      <h1 className="text-2xl font-bold mb-4">Dashboard de UniTasker</h1>

      {data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded shadow-sm bg-slate-50 text-black">
            <h2 className="font-semibold text-lg border-b mb-2">Endpoints Disponibles</h2>
            <ul className="list-disc ml-5">
              {/* Ahora TypeScript reconoce estas propiedades correctamente */}
              <li><strong>Usuarios:</strong> {data.usuarios}</li>
              <li><strong>Tareas:</strong> {data.tareas}</li>
              <li><strong>Actividades:</strong> {data.actividades}</li>
            </ul>
          </div>

          <div className="p-4 border rounded shadow-sm bg-gray-900 text-green-400 overflow-auto max-h-60">
            <h2 className="text-white mb-2 font-mono">Respuesta de la API:</h2>
            <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Cargando datos del servidor...</p>
      )}
    </div>
  )
}

export default App
