# backend/UniTasker/middleware.py

class PrefetchNextPageMiddleware:
    """
    Middleware para implementar prefetching de datos mediante cabeceras HTTP Link.
    Esto permite al navegador descargar recursos de la API en segundo plano
    antes de que el usuario navegue hacia ellos.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Solo aplicamos prefetch en peticiones GET exitosas o respuestas de login
        # Aunque el prefetch es un GET, la "señal" puede venir de un POST (como login)
        
        prefetch_urls = []

        # 1. Si el usuario se loguea, pre-cargamos sus tareas y actividades principales
        if request.path == '/api/token/' and request.method == 'POST':
            prefetch_urls.append('</api/tareas/>; rel=prefetch')
            prefetch_urls.append('</api/actividades/>; rel=prefetch')

        # 2. Si el usuario está viendo sus tareas, pre-cargamos los registros de avance
        elif '/api/tareas/' in request.path and request.method == 'GET':
            prefetch_urls.append('</api/registros/>; rel=prefetch')

        # 3. Si está viendo actividades, pre-cargamos las tareas relacionadas
        elif '/api/actividades/' in request.path and request.method == 'GET':
            prefetch_urls.append('</api/tareas/>; rel=prefetch')

        if prefetch_urls:
            # Si ya existe una cabecera Link, añadimos a ella, si no, la creamos
            existing_link = response.get('Link')
            new_links = ', '.join(prefetch_urls)
            response['Link'] = f"{existing_link}, {new_links}" if existing_link else new_links
            
            # Es importante exponer la cabecera si el frontend necesita leerla (opcional para prefetch nativo)
            # response['Access-Control-Expose-Headers'] = 'Link'

        return response
