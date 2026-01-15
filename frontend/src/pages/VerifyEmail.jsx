import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { verifyEmail } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            toast.error('Token de verificación no encontrado');
            navigate('/register');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await verifyEmail(token, password);
            toast.success('¡Cuenta verificada exitosamente!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.detail || 'Error al verificar email';
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
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="font-heading text-2xl">Crea tu contraseña</CardTitle>
                        <CardDescription>
                            Establece una contraseña segura para tu cuenta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    data-testid="verify-password-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Repite tu contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    data-testid="verify-confirm-password-input"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={loading}
                                data-testid="verify-submit-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    'Verificar mi cuenta'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VerifyEmail;
