import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { routes } from '@/config/routes';
import { trpc } from '@/lib/trpc';
import {
  callbackRequestSchema,
  connectionRequestSchema,
  type CallbackRequestInput,
  type ConnectionRequestInput,
} from '@fitnassist/schemas';

interface ProfileContactProps {
  trainerId: string;
  trainerName: string;
}

export function ProfileContact({ trainerId, trainerName }: ProfileContactProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isTrainee, isLoading: authLoading } = useAuth();
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for pending request
  const { data: pendingData, isLoading: pendingLoading } =
    trpc.contact.checkPendingRequest.useQuery(
      { trainerId },
      { enabled: isAuthenticated && isTrainee },
    );

  const utils = trpc.useUtils();

  // Callback request mutation
  const callbackMutation = trpc.contact.submitCallbackRequest.useMutation({
    onSuccess: () => {
      setCallbackModalOpen(false);
      setSuccessMessage('Callback request sent! The trainer will contact you soon.');
      utils.contact.checkPendingRequest.invalidate({ trainerId });
    },
  });

  // Connection request mutation
  const connectionMutation = trpc.contact.submitConnectionRequest.useMutation({
    onSuccess: () => {
      setConnectionModalOpen(false);
      setSuccessMessage('Connection request sent! Wait for the trainer to accept.');
      utils.contact.checkPendingRequest.invalidate({ trainerId });
    },
  });

  // Callback form
  const callbackForm = useForm<CallbackRequestInput>({
    resolver: zodResolver(callbackRequestSchema),
    defaultValues: {
      trainerId,
      phone: '',
      message: '',
    },
  });

  // Connection form
  const connectionForm = useForm<ConnectionRequestInput>({
    resolver: zodResolver(connectionRequestSchema),
    defaultValues: {
      trainerId,
      message: '',
    },
  });

  const handleCallbackSubmit = (data: CallbackRequestInput) => {
    callbackMutation.mutate(data);
  };

  const handleConnectionSubmit = (data: ConnectionRequestInput) => {
    connectionMutation.mutate(data);
  };

  // Show loading state
  if (authLoading || pendingLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If user is not a trainee (e.g., they are a trainer), don't show contact options
  if (isAuthenticated && !isTrainee) {
    return null;
  }

  // Success message state
  if (successMessage) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
          <p className="text-sm text-muted-foreground">{successMessage}</p>
          <Button variant="outline" onClick={() => setSuccessMessage(null)}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not logged in - show sign up CTA
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
            <MessageCircle className="h-5 w-5" />
            Get in Touch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Want to train with {trainerName}? Create a free account to send a message.
          </p>
          <Button onClick={() => navigate(routes.register)} className="w-full">
            Sign Up to Contact
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <button onClick={() => navigate(routes.login)} className="text-primary hover:underline">
              Log in
            </button>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Already connected - show link to messages
  if (pendingData?.isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You're connected with {trainerName}. Send them a message to get started.
          </p>
          <Button
            onClick={() => navigate(routes.dashboardMessageThread(pendingData.connectionId!))}
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Has pending request
  if (pendingData?.hasPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
            <MessageCircle className="h-5 w-5" />
            Request Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You have already sent a request to {trainerName}. Please wait for them to respond.
          </p>
          <Button variant="outline" disabled className="w-full">
            Request Sent
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Logged in trainee - show contact options
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
            <MessageCircle className="h-5 w-5" />
            Get in Touch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Interested in training with {trainerName}? Choose how you'd like to connect.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => setCallbackModalOpen(true)}
              variant="outline"
              className="w-full justify-start"
            >
              <Phone className="h-4 w-4 mr-2" />
              Request a Callback
            </Button>
            <Button onClick={() => setConnectionModalOpen(true)} className="w-full justify-start">
              <UserPlus className="h-4 w-4 mr-2" />
              Request to Connect
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Your contact details will only be shared with this trainer.
          </p>
        </CardContent>
      </Card>

      {/* Callback Request Modal */}
      <Dialog open={callbackModalOpen} onOpenChange={setCallbackModalOpen}>
        <DialogContent>
          <form onSubmit={callbackForm.handleSubmit(handleCallbackSubmit)}>
            <DialogHeader>
              <DialogTitle>Request a Callback</DialogTitle>
              <DialogDescription>
                Enter your phone number and {trainerName} will call you back.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07123 456789"
                  {...callbackForm.register('phone')}
                />
                {callbackForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {callbackForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="callback-message">Message (optional)</Label>
                <Textarea
                  id="callback-message"
                  placeholder="Best time to call, what you'd like to discuss..."
                  rows={3}
                  {...callbackForm.register('message')}
                />
                {callbackForm.formState.errors.message && (
                  <p className="text-sm text-destructive">
                    {callbackForm.formState.errors.message.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCallbackModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={callbackMutation.isPending}>
                {callbackMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Request
              </Button>
            </DialogFooter>
            {callbackMutation.error && (
              <p className="text-sm text-destructive mt-2">{callbackMutation.error.message}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Connection Request Modal */}
      <Dialog open={connectionModalOpen} onOpenChange={setConnectionModalOpen}>
        <DialogContent>
          <form onSubmit={connectionForm.handleSubmit(handleConnectionSubmit)}>
            <DialogHeader>
              <DialogTitle>Request to Connect</DialogTitle>
              <DialogDescription>
                Send a message to {trainerName}. Once they accept, you can chat directly in the app.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="connection-message">Your Message *</Label>
                <Textarea
                  id="connection-message"
                  placeholder="Introduce yourself, your fitness goals, what you're looking for in a trainer..."
                  rows={5}
                  {...connectionForm.register('message')}
                />
                {connectionForm.formState.errors.message && (
                  <p className="text-sm text-destructive">
                    {connectionForm.formState.errors.message.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConnectionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={connectionMutation.isPending}>
                {connectionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Request
              </Button>
            </DialogFooter>
            {connectionMutation.error && (
              <p className="text-sm text-destructive mt-2">{connectionMutation.error.message}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
