class DomainError(Exception):
    """Error de regla de negocio. Lo lanza el dominio; la capa de
    interfaces lo traduce a un HTTP 4xx."""
