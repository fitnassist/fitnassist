import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Users } from 'lucide-react';
import { Button } from '@/components/ui';
import { authClient, useSession } from '@/lib/auth-client';
import { routes } from '@/config/routes';

const roles = [
  {
    value: 'TRAINEE',
    label: 'Trainee',
    description: 'Find trainers, track progress, and reach your fitness goals',
    icon: Users,
  },
  {
    value: 'TRAINER',
    label: 'Personal Trainer',
    description: 'Manage clients, create programmes, and grow your business',
    icon: Dumbbell,
  },
] as const;

export const SelectRolePage = () => {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [selected, setSelected] = useState<'TRAINEE' | 'TRAINER'>('TRAINEE');
  const [isLoading, setIsLoading] = useState(false);

  // Wait for session to load
  if (isPending) return null;

  // If not authenticated, redirect to login
  if (!session?.user) {
    navigate(routes.login);
    return null;
  }

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await authClient.updateUser({ role: selected });
      navigate(routes.dashboard);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Fitnassist</h1>
          <p className="text-muted-foreground mt-2">How will you be using the platform?</p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = selected === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelected(role.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{role.label}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full rounded-full uppercase tracking-wider font-semibold"
        >
          {isLoading ? 'Setting up...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default SelectRolePage;
