import SwaggerClientLoader from '@/components/SwaggerClientLoader';

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="p-4 border-b bg-gray-50">
        <h1 className="text-xl font-bold text-gray-800">UniTasker API Docs</h1>
      </div>
      
      <SwaggerClientLoader url="https://petstore.swagger.io/v2/swagger.json" />
    </main>
  );
}
