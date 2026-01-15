# SmartTasks - PRD (Product Requirements Document)

## Original Problem Statement
Crear una aplicación web que ayude a dueños de PyMEs a identificar qué tareas deben conservar, delegar, automatizar o eliminar, liberando su tiempo para actividades estratégicas.

## User Personas
- **Dueños de PyMEs**: Empresarios sobrecargados que necesitan optimizar su tiempo
- **Gerentes de operaciones**: Necesitan claridad en delegación y procesos

## Core Requirements (Static)
1. Sistema de autenticación con verificación de email
2. CRUD completo de tareas
3. Análisis de tareas con IA (clasificar en C/D/A/E)
4. Generación de informes con estadísticas
5. Exportación a Excel
6. Panel de administrador para configuración

## What's Been Implemented (December 2024)

### FASE 1 - Fundación ✅
- [x] Sistema de autenticación completo (registro, verificación email, login)
- [x] Primer usuario automáticamente es administrador
- [x] CRUD completo de tareas (crear, leer, editar, eliminar)
- [x] Formulario con campos obligatorios y opcionales (scores manuales)

### FASE 2 - Core Feature ✅
- [x] Integración con OpenAI GPT-4o para análisis de tareas
- [x] Análisis individual y masivo de tareas
- [x] Clasificación automática: Conservar/Delegar/Automatizar/Eliminar
- [x] Sugerencia de perfiles y horas para tareas a delegar

### FASE 3 - Reporting ✅
- [x] Dashboard con tabla de tareas y badges de decisión
- [x] Página de informe con resumen ejecutivo (cards estadísticas)
- [x] Filtros por tipo de decisión (C/D/A/E)
- [x] Exportación a Excel con dos hojas (tareas + resumen)

### Configuración Administrable ✅
- [x] Panel de Settings para administradores
- [x] Configuración de Resend API key y sender email
- [x] Modo testing: muestra link de verificación directamente si email no configurado

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **IA**: OpenAI GPT-4o via Emergent LLM Key
- **Email**: Resend (configurable desde UI)

## Prioritized Backlog

### P0 (Crítico) - Completado ✅
- Auth system with email verification
- Task CRUD operations
- AI analysis integration
- Basic reporting

### P1 (Alta prioridad)
- [ ] Onboarding tutorial para nuevos usuarios
- [ ] Validación de email real (no solo formato)
- [ ] Mejoras de UX en móvil

### P2 (Media prioridad)
- [ ] Multi-idioma (agregar inglés)
- [ ] Exportación a PDF
- [ ] Historial de cambios en tareas
- [ ] Notificaciones por email de recordatorio

### P3 (Baja prioridad)
- [ ] Integración con Google Calendar
- [ ] API pública para integraciones
- [ ] Dashboard analytics avanzado

## Next Tasks
1. Probar flujo completo de registro → verificación → dashboard
2. Configurar Resend API key desde Settings si se desea envío real de emails
3. Agregar tareas y usar "Analizar con IA" para obtener recomendaciones
4. Revisar informe y exportar a Excel
