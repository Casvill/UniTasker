"use client"; // <--- Importante: Este componente ES un cliente

import dynamic from 'next/dynamic';

// Aquí es donde movemos el ssr: false que causaba el error
const SwaggerUIWrapper = dynamic(() => import('./SwaggerUI'), { 
  ssr: false,
  loading: () => <p className="p-10 text-center">Cargando Swagger UI...</p>
});

export default function SwaggerClientLoader({ url }: { url: string }) {
  return <SwaggerUIWrapper url={url} />;
}
