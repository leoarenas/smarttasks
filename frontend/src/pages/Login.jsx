import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(email, password);
            toast.success('¡Bienvenido de vuelta!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.detail || 'Error al iniciar sesión';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al inicio
                </Link>
                
                <Card className="border-border shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="font-heading text-2xl">Iniciar sesión</CardTitle>
                        <CardDescription>
                            Ingresa tus credenciales para acceder a tu cuenta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    data-testid="login-email-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    data-testid="login-password-input"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={loading}
                                data-testid="login-submit-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    'Iniciar sesión'
                                )}
                            </Button>
                        </form>
                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">¿No tienes cuenta? </span>
                            <Link to="/register" className="text-primary hover:underline font-medium">
                                Regístrate gratis
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;
