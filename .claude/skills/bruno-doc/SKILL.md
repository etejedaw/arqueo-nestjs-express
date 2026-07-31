---
name: bruno-doc
description: Update the Bruno API documentation in docs/api/ whenever an HTTP endpoint is created, modified, or removed. Trigger on changes to *.controller.ts, *.dto.ts, or exception filters / custom exceptions that affect the HTTP surface (method, path, body/query/params, response shape, status codes, domain errors). Uses the Bruno YAML collection format (.yml).
---

# Endpoint Doc

Documentación de endpoints HTTP en `docs/api/` usando el formato de colección **YAML de Bruno** (`.yml`).

## Cuándo aplicar

Cada vez que se **crea, modifica o elimina** un endpoint, hay que actualizar su documentación. En un backend NestJS eso pasa cuando se tocan:

- `*.controller.ts` — alta/baja de endpoints, cambio de método/path (decoradores `@Get`/`@Post`/`@Patch`/`@Delete`, `@Param`, `@Query`), status codes (`@HttpCode`), o el shape de la respuesta que devuelve el handler.
- `*.dto.ts` — cambio en el contrato de validación (body/query/params validados con `class-validator`).
- **Exception filters / excepciones custom** (`*.filter.ts`, `*.exception.ts`) — nuevo error de dominio o cambio del status HTTP que emite un módulo.

Si el cambio no toca la superficie HTTP (refactor interno de un service, rename de variables privadas, lógica sin efecto en request/response), no hace falta tocar `docs/api/`.

## Estructura de la colección

```
docs/api/
  opencollection.yml        # config raíz de la colección (no tocar)
  Login.yml                 # endpoints sueltos a nivel raíz
  environments/
    Develop.yml             # vars de entorno (BASE_URL, etc.)
  <module>/
    folder.yml              # config del folder (auth bearer heredado)
    <Endpoint Name>.yml     # un archivo por endpoint
```

- **Nombre del archivo**: Title Case con espacios, sin guiones. Ej: `Create Transaction.yml`, `Get Monthly Summary.yml`, `Send Statement.yml`.
- **Nombre de la carpeta**: lowercase, espacios permitidos. Un folder por módulo NestJS: `periods/`, `transactions/`, `contacts/`, `statements/`, `auth/`.
- **`folder.yml`**: define `info.name` (Title Case del módulo), `info.seq` (orden en la UI) y, si todos los endpoints del módulo requieren auth, `request.auth: { type: bearer, token: "{{TOKEN}}" }`. Los endpoints públicos del módulo deben sobrescribir con `auth: none` en su archivo.

## Schema YAML del endpoint

Indentación: **4 espacios** (lo que Bruno genera; respetar). No usar tabs.

````yaml
info:
    name: <Endpoint Name> # mismo string que el filename sin .yml
    type: http
    seq: <n> # orden dentro del folder, empezando en 1

http:
    method: <GET|POST|PATCH|PUT|DELETE>
    url: http://{{BASE_URL}}<path> # path con vars Bruno: {{PERIOD_ID}}, {{CONTACT_ID}}, etc.
    body: # solo si tiene body
        type: json
        data: |-
            {
              "field": "value"
            }
    auth: <inherit|none> # inherit = hereda del folder (bearer); none = público

runtime: # opcional, solo si necesita scripts
    scripts:
        - type: after-response
          code: bru.setVar("TOKEN", res.body.data.access_token)

settings:
    encodeUrl: true
    timeout: 0
    followRedirects: true
    maxRedirects: 5

docs: |-
    # <Endpoint Name>

    <Descripción funcional en 1-3 líneas. Qué hace y cuándo se usa.>

    **Auth:** <Bearer token | public>

    ## Path params
    - `paramName` (tipo) — descripción

    ## Query
    - `paramName` (tipo) — descripción

    ## Request body
    ```json
    {
      "field": "value"
    }
    ```

    <Notas adicionales sobre el contrato si las hay.>

    ## Response <status>
    ```json
    { "data": { ... } }
    ```

    <Notas sobre transiciones de estado o efectos secundarios si los hay.>

    ## Errors
    - `<status> <ERROR_CODE>` — descripción breve de cuándo se dispara
````

### Reglas del bloque `docs`

- Markdown dentro del block scalar `|-` (preserva newlines, sin newline final).
- Encabezado H1 con el mismo nombre que `info.name`.
- Secciones con H2: `Path params`, `Query`, `Request body`, `Response <status>`, `Errors`. Solo incluir las que aplican.
- **`Auth:`** siempre presente. Valores comunes:
    - `Bearer token` — endpoints protegidos por `JwtAuthGuard` (folder con auth heredada)
    - `public` — sin autenticación (endpoints marcados con `@Public()` o sin guard)
- **Response shape**: si el proyecto envuelve las respuestas en `{ "data": ... }` (interceptor de transformación), documentarlo así. Si devuelve el objeto crudo, mostrar el objeto tal cual.
- En **Errors** listar los códigos de dominio que las excepciones/exception filters del módulo pueden emitir + `401 UNAUTHORIZED` (guard) y `400 BAD_REQUEST` (validación de `class-validator` vía `ValidationPipe`) cuando apliquen. Formato exacto: `` `<status> <CODE>` — descripción ``.
    - Status típicos en NestJS: `400` (validación / `BadRequestException`), `401` (`UnauthorizedException`), `403` (`ForbiddenException`), `404` (`NotFoundException`), `409` (`ConflictException`).

## Variables Bruno disponibles

Definidas en `environments/Develop.yml` o seteadas runtime por scripts. Usar las existentes antes de inventar nuevas.

- `{{BASE_URL}}` — host + puerto del backend (ej: `localhost:3000/api/v1`)
- `{{TOKEN}}` — JWT del usuario logueado (lo setea `Login.yml` en `after-response`)
- `{{USER_ID}}` — id del usuario logueado
- `{{PERIOD_ID}}` — período (mes) bajo prueba
- `{{CONTACT_ID}}` — contacto bajo prueba
- `{{TRANSACTION_ID}}` — movimiento individual
- `{{STATEMENT_ID}}` — boleta individual

Para datos sensibles en bodies de auth (`Login.yml`), usar `{{process.env.EMAIL}}` / `{{process.env.PASSWORD}}` desde el `.env` local de Bruno.

## Mapeo de cambios en código → archivo a tocar

| Cambio                                             | Archivo doc                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Endpoint nuevo (nuevo handler en el controller)    | Crear `docs/api/<module>/<Endpoint Name>.yml` con `seq` siguiente    |
| Cambio de método/path (decorador de ruta)          | Actualizar `http.method` y `http.url`                                |
| Cambio en el DTO de body/query/params              | Actualizar `http.body.data` (sample) + bloque `docs` correspondiente |
| Cambio en response shape o status (`@HttpCode`)    | Actualizar bloque `## Response <status>`                             |
| Nueva excepción de dominio / exception filter      | Agregar línea en `## Errors` del/los endpoints afectados             |
| Endpoint eliminado                                 | Borrar el `.yml` y reordenar `seq` de los hermanos si es necesario   |
| Módulo NestJS nuevo                                | Crear carpeta + `folder.yml` con `seq` siguiente del nivel raíz      |

## Convenciones de contenido

- **Sample bodies realistas**: usar valores plausibles del dominio de Arqueo (`"Arriendo"`, montos en CLP como enteros `475000`, fechas reales en `YYYY-MM-DD`), no `"string"` ni `"foo"`.
- **`<uuid>`** como placeholder en responses para campos generados por el server.
- **PATCH** se usa para updates parciales (todos los campos del body son opcionales). Mencionarlo en la descripción.
- **Soft deletes / cierres** (ej: marcar boleta como pagada, cerrar período) se documentan con su status real y una nota explicando el efecto de estado.
- Respetar el idioma que ya haya en `docs/api/` (no mezclar español e inglés dentro del bloque `docs`).

## Antes de cerrar el cambio

1. Verificar que el `seq` no choque con otro endpoint del mismo folder.
2. Verificar que todos los errores listados en `## Errors` existen realmente (excepción lanzada en el service/controller o mapeada por un exception filter del módulo).
3. Verificar que las path/query vars del bloque `docs` matchean exactamente las del DTO / los `@Param`/`@Query` del controller.
4. Si se agregó un endpoint público (`@Public()` o sin guard), dejar `auth: none` en el `.yml` (no heredar del folder).
