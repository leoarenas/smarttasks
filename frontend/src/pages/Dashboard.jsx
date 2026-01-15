import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter,
    DialogClose,
    DialogDescription
} from '../components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { toast } from 'sonner';
import { 
    Plus, 
    LogOut, 
    FileText, 
    Settings, 
    Loader2, 
    Pencil, 
    Trash2, 
    Sparkles,
    Brain,
    HelpCircle,
    X,
    Lightbulb
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Onboarding questions from the guide
const ONBOARDING_QUESTIONS = [
    "¿Cuáles son tus 5 tareas que más tiempo consumen?",
    "¿Qué tareas impactan más en ingresos o clientes?",
    "¿Qué tareas te cansan o interrumpen tu foco diario?",
    "¿Qué tareas fallan o generan quejas?",
    "¿Qué tareas creés que solo podés hacer vos?",
    "¿Cuáles tienen pasos claros o podrían documentarse fácilmente?",
    "¿Quién del equipo tiene 2-6 hs/semanales libres y conocimientos afines?",
    "¿Qué tareas podrían hacer proveedores o servicios externos?"
];

// Help tooltips for evaluation fields
const FIELD_HELP = {
    impact: {
        title: "Impacto",
        description: "Cuánto contribuye la tarea a los resultados del negocio (ventas, clientes, eficiencia).",
        levels: [
            { value: "1-2", label: "Muy bajo", desc: "No cambia nada importante. Ej: Reunión sin decisiones" },
            { value: "3", label: "Medio", desc: "Afecta parcialmente un proceso. Ej: Reporte interno" },
            { value: "4-5", label: "Crítico", desc: "Determina resultados clave. Ej: Negociación con clientes estratégicos" }
        ],
        rule: "Si impacta en ingresos o clientes, su impacto ≥4"
    },
    risk: {
        title: "Riesgo",
        description: "Qué tan grave sería si la tarea se hace mal o no se hace.",
        levels: [
            { value: "1-2", label: "Muy bajo", desc: "Error sin consecuencias. Ej: Error de formato" },
            { value: "3", label: "Medio", desc: "Re-trabajo o molestia menor. Ej: Error en pedido" },
            { value: "4-5", label: "Crítico", desc: "Riesgo legal o financiero. Ej: Enviar info confidencial por error" }
        ],
        rule: "Si involucra dinero, datos personales o información estratégica, su riesgo ≥4"
    },
    effort: {
        title: "Esfuerzo del dueño",
        description: "Cuánto tiempo y energía mental te exige realizarla o decidir sobre ella.",
        levels: [
            { value: "1-2", label: "Muy bajo", desc: "Demora minutos. Ej: Aprobar mensaje estándar" },
            { value: "3", label: "Medio", desc: "30-60 min. de concentración. Ej: Revisar presupuesto" },
            { value: "4-5", label: "Crítico", desc: "Horas, decisiones críticas. Ej: Planificación estratégica" }
        ],
        rule: "Si te interrumpe o te saca del foco varias veces/semana, esfuerzo ≥3"
    },
    confidentiality: {
        title: "Confidencialidad",
        description: "Cuán sensible es la información que maneja la tarea y qué controles necesita para ser delegada.",
        levels: [
            { value: "Baja", label: "Baja", desc: "La información no tiene impacto si se difunde. Ej: Publicar en redes sociales" },
            { value: "Media", label: "Media", desc: "Datos internos no críticos. Ej: Reporte de ventas, listas de precios" },
            { value: "Alta", label: "Alta", desc: "Datos personales, financieros o estratégicos. Ej: Nóminas, contratos, accesos" }
        ],
        rule: "Si involucra dinero, datos personales, accesos o info estratégica, confidencialidad ≥ Media"
    }
};

const HelpTooltip = ({ field }) => {
    const help = FIELD_HELP[field];
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button type="button" className="ml-1 text-muted-foreground hover:text-foreground">
                        <HelpCircle className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm p-4">
                    <div className="space-y-2">
                        <p className="font-semibold">{help.title}</p>
                        <p className="text-sm text-muted-foreground">{help.description}</p>
                        <div className="space-y-1 text-xs">
                            {help.levels.map((level, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="font-medium text-primary">{level.value}:</span>
                                    <span>{level.desc}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-medium text-primary mt-2">Regla: {help.rule}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [analyzing, setAnalyzing] = useState(null);
    const [analyzingAll, setAnalyzingAll] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    // Form state with default values
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        frequency: '',
        duration: '',
        impact: 1,
        risk: 1,
        effort: 1,
        confidentiality: 'Baja'
    });

    useEffect(() => {
        fetchTasks();
        // Show onboarding on first load if no tasks
        const hasSeenOnboarding = localStorage.getItem('smarttasks_onboarding_seen');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API}/tasks`);
            setTasks(response.data);
        } catch (error) {
            toast.error('Error al cargar tareas');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            frequency: '',
            duration: '',
            impact: 1,
            risk: 1,
            effort: 1,
            confidentiality: 'Baja'
        });
        setEditingTask(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingTask) {
                await axios.put(`${API}/tasks/${editingTask.id}`, formData);
                toast.success('Tarea actualizada');
            } else {
                await axios.post(`${API}/tasks`, formData);
                toast.success('Tarea creada');
            }
            fetchTasks();
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar tarea');
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormData({
            name: task.name,
            description: task.description,
            frequency: task.frequency,
            duration: task.duration,
            impact: task.impact || 1,
            risk: task.risk || 1,
            effort: task.effort || 1,
            confidentiality: task.confidentiality || 'Baja'
        });
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!taskToDelete) return;
        
        try {
            await axios.delete(`${API}/tasks/${taskToDelete.id}`);
            toast.success('Tarea eliminada');
            fetchTasks();
        } catch (error) {
            toast.error('Error al eliminar tarea');
        } finally {
            setDeleteDialogOpen(false);
            setTaskToDelete(null);
        }
    };

    const handleAnalyze = async (taskId) => {
        setAnalyzing(taskId);
        try {
            await axios.post(`${API}/tasks/${taskId}/analyze`);
            toast.success('Análisis completado');
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al analizar tarea');
        } finally {
            setAnalyzing(null);
        }
    };

    const handleAnalyzeAll = async () => {
        setAnalyzingAll(true);
        try {
            const response = await axios.post(`${API}/tasks/analyze-all`);
            toast.success(`${response.data.success} de ${response.data.total} tareas analizadas`);
            fetchTasks();
        } catch (error) {
            toast.error('Error al analizar tareas');
        } finally {
            setAnalyzingAll(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const dismissOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('smarttasks_onboarding_seen', 'true');
    };

    const getDecisionBadge = (decision) => {
        const badges = {
            C: { label: 'Conservar', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            D: { label: 'Delegar', class: 'bg-green-100 text-green-800 border-green-200' },
            A: { label: 'Automatizar', class: 'bg-blue-100 text-blue-800 border-blue-200' },
            E: { label: 'Eliminar', class: 'bg-red-100 text-red-800 border-red-200' }
        };
        return badges[decision] || { label: 'Sin analizar', class: 'bg-gray-100 text-gray-600 border-gray-200' };
    };

    const getScoreBadge = (score) => {
        if (!score) return 'bg-gray-100 text-gray-600';
        if (score <= 2) return 'bg-green-100 text-green-800';
        if (score <= 3) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div className="min-h-screen bg-secondary">
            {/* Header */}
            <header className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/dashboard">
                        <h1 className="font-heading text-2xl font-bold text-foreground">SmartTasks</h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/report">
                            <Button variant="ghost" size="sm" data-testid="report-link">
                                <FileText className="h-4 w-4 mr-2" />
                                Informe
                            </Button>
                        </Link>
                        {user?.is_admin && (
                            <Link to="/settings">
                                <Button variant="ghost" size="sm" data-testid="settings-link">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configuración
                                </Button>
                            </Link>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-btn">
                            <LogOut className="h-4 w-4 mr-2" />
                            Salir
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Onboarding Card */}
                {showOnboarding && (
                    <Card className="mb-8 border-primary/20 bg-primary/5 animate-fadeIn">
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-primary" />
                                    <CardTitle className="font-heading text-lg">Guía para identificar tus tareas</CardTitle>
                                </div>
                                <Button variant="ghost" size="sm" onClick={dismissOnboarding} data-testid="close-onboarding">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Responde estas preguntas para identificar las tareas que más impactan tu tiempo:
                            </p>
                            <div className="grid md:grid-cols-2 gap-3">
                                {ONBOARDING_QUESTIONS.map((question, index) => (
                                    <div key={index} className="flex items-start gap-2 text-sm">
                                        <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                            {index + 1}
                                        </span>
                                        <span>{question}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Tip:</strong> Revisá tus correos, WhatsApp y agenda de las últimas 3 semanas para recordar todas las tareas que te tomaron tiempo.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="font-heading text-3xl font-bold text-foreground">Mis Tareas</h2>
                        <p className="text-muted-foreground mt-1">
                            Gestiona y analiza tus tareas empresariales
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowOnboarding(!showOnboarding)}
                            data-testid="toggle-onboarding-btn"
                        >
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Ayuda
                        </Button>
                        {tasks.length > 0 && (
                            <Button 
                                variant="outline" 
                                onClick={handleAnalyzeAll}
                                disabled={analyzingAll}
                                data-testid="analyze-all-btn"
                            >
                                {analyzingAll ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Analizando...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="h-4 w-4 mr-2" />
                                        Analizar todas
                                    </>
                                )}
                            </Button>
                        )}
                        <Dialog open={dialogOpen} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button data-testid="add-task-btn">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Tarea
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="font-heading">
                                        {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {editingTask ? 'Modifica los datos de la tarea' : 'Agrega una nueva tarea para analizar'}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre de la tarea *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ej: Revisión de contratos"
                                            required
                                            data-testid="task-name-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descripción detallada *</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Describe qué implica esta tarea, cómo se realiza actualmente..."
                                            rows={3}
                                            required
                                            data-testid="task-description-input"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Frecuencia *</Label>
                                            <Select 
                                                value={formData.frequency} 
                                                onValueChange={(value) => setFormData({...formData, frequency: value})}
                                                required
                                            >
                                                <SelectTrigger data-testid="task-frequency-select">
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Diaria">Diaria</SelectItem>
                                                    <SelectItem value="Semanal">Semanal</SelectItem>
                                                    <SelectItem value="Mensual">Mensual</SelectItem>
                                                    <SelectItem value="Ocasional">Ocasional</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="duration">Duración estimada *</Label>
                                            <Input
                                                id="duration"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                                placeholder="Ej: 2 horas"
                                                required
                                                data-testid="task-duration-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Evaluation Fields - Always visible */}
                                    <div className="border-t border-border pt-4 mt-4">
                                        <p className="text-sm font-medium text-muted-foreground mb-4">Evaluación de la tarea</p>
                                        
                                        {/* Impact */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center">
                                                <Label>Impacto: {formData.impact}</Label>
                                                <HelpTooltip field="impact" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Slider
                                                    value={[formData.impact]}
                                                    onValueChange={(value) => setFormData({...formData, impact: value[0]})}
                                                    min={1}
                                                    max={5}
                                                    step={1}
                                                    className="flex-1"
                                                    data-testid="task-impact-slider"
                                                />
                                                <div className="flex gap-1">
                                                    {[1,2,3,4,5].map(n => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => setFormData({...formData, impact: n})}
                                                            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                                                                formData.impact === n 
                                                                    ? 'bg-primary text-primary-foreground' 
                                                                    : 'bg-muted hover:bg-muted/80'
                                                            }`}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Risk */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center">
                                                <Label>Riesgo: {formData.risk}</Label>
                                                <HelpTooltip field="risk" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Slider
                                                    value={[formData.risk]}
                                                    onValueChange={(value) => setFormData({...formData, risk: value[0]})}
                                                    min={1}
                                                    max={5}
                                                    step={1}
                                                    className="flex-1"
                                                    data-testid="task-risk-slider"
                                                />
                                                <div className="flex gap-1">
                                                    {[1,2,3,4,5].map(n => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => setFormData({...formData, risk: n})}
                                                            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                                                                formData.risk === n 
                                                                    ? 'bg-primary text-primary-foreground' 
                                                                    : 'bg-muted hover:bg-muted/80'
                                                            }`}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Effort */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center">
                                                <Label>Esfuerzo del dueño: {formData.effort}</Label>
                                                <HelpTooltip field="effort" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Slider
                                                    value={[formData.effort]}
                                                    onValueChange={(value) => setFormData({...formData, effort: value[0]})}
                                                    min={1}
                                                    max={5}
                                                    step={1}
                                                    className="flex-1"
                                                    data-testid="task-effort-slider"
                                                />
                                                <div className="flex gap-1">
                                                    {[1,2,3,4,5].map(n => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => setFormData({...formData, effort: n})}
                                                            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                                                                formData.effort === n 
                                                                    ? 'bg-primary text-primary-foreground' 
                                                                    : 'bg-muted hover:bg-muted/80'
                                                            }`}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Confidentiality */}
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <Label>Confidencialidad</Label>
                                                <HelpTooltip field="confidentiality" />
                                            </div>
                                            <Select 
                                                value={formData.confidentiality} 
                                                onValueChange={(value) => setFormData({...formData, confidentiality: value})}
                                            >
                                                <SelectTrigger data-testid="task-confidentiality-select">
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Baja">Baja - Info pública o sin impacto</SelectItem>
                                                    <SelectItem value="Media">Media - Datos internos no críticos</SelectItem>
                                                    <SelectItem value="Alta">Alta - Datos personales, financieros o estratégicos</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">Cancelar</Button>
                                        </DialogClose>
                                        <Button type="submit" data-testid="task-submit-btn">
                                            {editingTask ? 'Guardar cambios' : 'Crear tarea'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Tasks Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : tasks.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-heading text-xl font-semibold mb-2">No tienes tareas todavía</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-sm">
                                Comienza agregando las tareas que realizas en tu día a día para obtener recomendaciones personalizadas.
                            </p>
                            <Button onClick={() => setDialogOpen(true)} data-testid="empty-add-task-btn">
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar primera tarea
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full task-table" data-testid="tasks-table">
                                <thead className="border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tarea</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Frecuencia</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Duración</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Impacto</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Riesgo</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Esfuerzo</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Conf.</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Decisión</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tasks.map((task) => {
                                        const badge = getDecisionBadge(task.decision);
                                        return (
                                            <tr key={task.id} className="hover:bg-secondary/50 transition-colors" data-testid={`task-row-${task.id}`}>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="font-medium text-foreground">{task.name}</p>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">{task.frequency}</td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">{task.duration}</td>
                                                <td className="px-4 py-4 text-center">
                                                    {task.impact && (
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-medium rounded-sm ${getScoreBadge(task.impact)}`}>
                                                            {task.impact}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {task.risk && (
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-medium rounded-sm ${getScoreBadge(task.risk)}`}>
                                                            {task.risk}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {task.effort && (
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-medium rounded-sm ${getScoreBadge(task.effort)}`}>
                                                            {task.effort}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {task.confidentiality && (
                                                        <span className={`text-xs px-2 py-1 rounded-sm ${
                                                            task.confidentiality === 'Alta' ? 'bg-red-100 text-red-800' :
                                                            task.confidentiality === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {task.confidentiality}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-sm border ${badge.class}`}>
                                                        {task.decision && <span className="font-bold mr-1">{task.decision}</span>}
                                                        {badge.label}
                                                    </span>
                                                    {task.decision_justification && (
                                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs line-clamp-2">
                                                            {task.decision_justification}
                                                        </p>
                                                    )}
                                                    {task.suggested_profile && (
                                                        <p className="text-xs text-primary mt-1">
                                                            {task.suggested_profile} ({task.suggested_hours})
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAnalyze(task.id)}
                                                            disabled={analyzing === task.id}
                                                            data-testid={`analyze-task-${task.id}`}
                                                        >
                                                            {analyzing === task.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(task)}
                                                            data-testid={`edit-task-${task.id}`}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setTaskToDelete(task);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="text-destructive hover:text-destructive"
                                                            data-testid={`delete-task-${task.id}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </main>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la tarea "{taskToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Dashboard;
