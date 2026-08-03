# Arqueo

App de finanzas personales (NestJS + TypeORM + PostgreSQL) que reemplaza una planilla Excel de control mensual. Proyecto privado en su uso, AGPLv3, desarrollo iterativo.

## Fuente de verdad

Los documentos del proyecto viven en AFFiNE, workspace `b48542ca-7422-4505-a933-3640ba923c2d`:

| Doc     | docId                   | Qué contiene                                           |
| ------- | ----------------------- | ------------------------------------------------------ |
| CONTEXT | `Xu9AhNbcnQM5exzJqi-_p` | Modelo de dominio, decisiones, arquitectura, supuestos |
| TODO    | `AeJlURWlaP-Qg4pg9CSM5` | Plan por fases (0–10) con el estado real de cada ítem  |

Léelos con `mcp__affine__export_doc_markdown` antes de empezar una fase nueva, al diseñar entidades, o cuando la tarea toque decisiones de producto. Para un fix puntual basta con las decisiones de más abajo.

**Si cambia una decisión de producto o arquitectura, actualiza el doc en AFFiNE** — con `mcp__affine__update_block` sobre el bloque puntual, no reescribiendo el documento.

Al completar ítems del TODO, márcalos ahí (`update_block` con `checked`).
