import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, CheckCircle, Clock, Users, Zap } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="font-heading text-2xl font-bold text-foreground">SmartTasks</h1>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" data-testid="header-login-btn">Iniciar sesión</Button>
                        </Link>
                        <Link to="/register">
                            <Button data-testid="header-register-btn">Comenzar gratis</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                <div className="space-y-8 text-center">
                    <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                        ¿Hasta cuándo vas a sostener una empresa sin roles claros ni procesos definidos?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        <span className="font-medium text-foreground">Reduce tu dependencia</span> operativa del día a día · 
                        <span className="font-medium text-foreground"> Delega con claridad</span> sin perder el control · 
                        <span className="font-medium text-foreground"> Haz que tu equipo funcione</span> con criterios y estándares compartidos
                    </p>
                    <div className="flex justify-center">
                        <Link to="/register">
                            <Button size="lg" className="text-base px-8" data-testid="hero-cta-btn">
                                Comenzar ahora - Es gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-secondary py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <h3 className="font-heading text-3xl md:text-4xl font-bold text-center mb-16">
                        ¿Cómo funciona?
                    </h3>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="bg-card p-6 rounded-sm border border-border hover-lift">
                            <div className="w-12 h-12 bg-yellow-100 rounded-sm flex items-center justify-center mb-4">
                                <span className="text-2xl font-bold text-yellow-800">C</span>
                            </div>
                            <h4 className="font-heading text-xl font-semibold mb-2">Conservar</h4>
                            <p className="text-muted-foreground text-sm">
                                Tareas críticas de alto riesgo o confidencialidad que debes mantener temporalmente.
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-sm border border-border hover-lift">
                            <div className="w-12 h-12 bg-green-100 rounded-sm flex items-center justify-center mb-4">
                                <span className="text-2xl font-bold text-green-800">D</span>
                            </div>
                            <h4 className="font-heading text-xl font-semibold mb-2">Delegar</h4>
                            <p className="text-muted-foreground text-sm">
                                Tareas de alto impacto y esfuerzo que puedes asignar a tu equipo o externos.
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-sm border border-border hover-lift">
                            <div className="w-12 h-12 bg-blue-100 rounded-sm flex items-center justify-center mb-4">
                                <span className="text-2xl font-bold text-blue-800">A</span>
                            </div>
                            <h4 className="font-heading text-xl font-semibold mb-2">Automatizar</h4>
                            <p className="text-muted-foreground text-sm">
                                Procesos repetitivos y frecuentes que pueden sistematizarse con tecnología.
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-sm border border-border hover-lift">
                            <div className="w-12 h-12 bg-red-100 rounded-sm flex items-center justify-center mb-4">
                                <span className="text-2xl font-bold text-red-800">E</span>
                            </div>
                            <h4 className="font-heading text-xl font-semibold mb-2">Eliminar</h4>
                            <p className="text-muted-foreground text-sm">
                                Tareas de bajo impacto que no aportan valor real a tu negocio.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <img 
                            src="https://images.unsplash.com/photo-1758691737158-18ffa31c0a46?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwYnVzaW5lc3MlMjB0ZWFtJTIwbWVldGluZyUyMG9mZmljZXxlbnwwfHx8fDE3Njg1MDAwNTl8MA&ixlib=rb-4.1.0&q=85&w=800"
                            alt="Equipo trabajando juntos"
                            className="rounded-sm shadow-lg w-full"
                        />
                    </div>
                    <div className="space-y-8">
                        <h3 className="font-heading text-3xl md:text-4xl font-bold">
                            Delega con inteligencia, no con intuición
                        </h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Recupera tu tiempo</h4>
                                    <p className="text-muted-foreground text-sm">
                                        Identifica qué tareas te están robando horas que podrías invertir en crecer tu negocio.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Perfiles sugeridos</h4>
                                    <p className="text-muted-foreground text-sm">
                                        Te recomendamos qué tipo de perfil necesitas y cuántas horas semanales para cada tarea.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <Zap className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Análisis con IA</h4>
                                    <p className="text-muted-foreground text-sm">
                                        Nuestra inteligencia artificial evalúa cada tarea según metodología probada de consultoría.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-foreground text-background py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h3 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                        Empieza tu diagnóstico operativo hoy
                    </h3>
                    <p className="text-lg text-muted mb-8 opacity-80">
                        Identifica qué tareas conservar, delegar, automatizar o eliminar con ayuda de inteligencia artificial.
                    </p>
                    <Link to="/register">
                        <Button size="lg" variant="secondary" className="text-base px-8" data-testid="footer-cta-btn">
                            Comenzar ahora - Es gratis
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground text-sm">
                    <p>&copy; 2024 SmartTasks. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
