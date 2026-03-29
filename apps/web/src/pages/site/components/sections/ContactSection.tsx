import { useState } from 'react';
import { Mail, Phone, UserPlus, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import {
  callbackRequestSchema,
  connectionRequestSchema,
  type CallbackRequestInput,
  type ConnectionRequestInput,
} from '@fitnassist/schemas';
import type { PublicSection, PublicTrainer } from '../../site.types';

interface ContactContent {
  showForm?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
  address?: string;
}

interface ContactSectionProps {
  section: PublicSection;
  trainer: PublicTrainer;
  preview?: boolean;
}

const parseContent = (raw: unknown): ContactContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as ContactContent;
};

const ConnectCard = ({ trainer }: { trainer: PublicTrainer }) => {
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Try to check auth state — if session query fails, user is not logged in
  const { data: session } = trpc.auth.getSession.useQuery(undefined, {
    retry: false,
  });
  const isAuthenticated = !!session?.user;

  // Check pending request
  const { data: pendingData } = trpc.contact.checkPendingRequest.useQuery(
    { trainerId: trainer.id },
    { enabled: isAuthenticated }
  );

  const utils = trpc.useUtils();

  const callbackMutation = trpc.contact.submitCallbackRequest.useMutation({
    onSuccess: () => {
      setCallbackOpen(false);
      setSuccessMessage('Callback request sent! The trainer will contact you soon.');
      utils.contact.checkPendingRequest.invalidate({ trainerId: trainer.id });
    },
  });

  const connectionMutation = trpc.contact.submitConnectionRequest.useMutation({
    onSuccess: () => {
      setConnectionOpen(false);
      setSuccessMessage('Connection request sent! Wait for the trainer to accept.');
      utils.contact.checkPendingRequest.invalidate({ trainerId: trainer.id });
    },
  });

  const callbackForm = useForm<CallbackRequestInput>({
    resolver: zodResolver(callbackRequestSchema),
    defaultValues: { trainerId: trainer.id, phone: '', message: '' },
  });

  const connectionForm = useForm<ConnectionRequestInput>({
    resolver: zodResolver(connectionRequestSchema),
    defaultValues: { trainerId: trainer.id, message: '' },
  });

  if (successMessage) {
    return (
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{successMessage}</p>
          <Button
            variant="outline"
            onClick={() => setSuccessMessage(null)}
            className="border-[hsl(var(--border))]"
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pendingData?.isConnected) {
    return (
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
          <p className="text-sm font-medium text-[hsl(var(--card-foreground))]">
            You're connected with {trainer.displayName}!
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Log in to the app to send them a message.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (pendingData?.hasPending) {
    return (
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-sm font-medium text-[hsl(var(--card-foreground))]">
            Request pending
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            You've already sent a request to {trainer.displayName}. Please wait for them to respond.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-[hsl(var(--card-foreground))]">
            Want to train with {trainer.displayName}? Create a free account to get in touch.
          </p>
          <Button
            className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
            onClick={() => window.open('https://fitnassist.co/register', '_blank')}
          >
            Sign Up — It's Free
          </Button>
          <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
            Already have an account?{' '}
            <a href="https://fitnassist.co/login" className="text-[hsl(var(--primary))] hover:underline">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-[hsl(var(--card-foreground))]">
            Interested in training with {trainer.displayName}? Choose how you'd like to connect.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => setCallbackOpen(true)}
              variant="outline"
              className="w-full justify-start border-[hsl(var(--border))] text-[hsl(var(--card-foreground))]"
            >
              <Phone className="h-4 w-4 mr-2" />
              Request a Callback
            </Button>
            <Button
              onClick={() => setConnectionOpen(true)}
              className="w-full justify-start bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Request to Connect
            </Button>
          </div>
          <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
            Your contact details will only be shared with this trainer.
          </p>
        </CardContent>
      </Card>

      <Dialog open={callbackOpen} onOpenChange={setCallbackOpen}>
        <DialogContent>
          <form onSubmit={callbackForm.handleSubmit((data) => callbackMutation.mutate(data))}>
            <DialogHeader>
              <DialogTitle>Request a Callback</DialogTitle>
              <DialogDescription>
                Enter your phone number and {trainer.displayName} will call you back.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" placeholder="07123 456789" {...callbackForm.register('phone')} />
                {callbackForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">{callbackForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="cb-message">Message (optional)</Label>
                <Textarea id="cb-message" placeholder="Best time to call..." rows={3} {...callbackForm.register('message')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCallbackOpen(false)}>Cancel</Button>
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

      <Dialog open={connectionOpen} onOpenChange={setConnectionOpen}>
        <DialogContent>
          <form onSubmit={connectionForm.handleSubmit((data) => connectionMutation.mutate(data))}>
            <DialogHeader>
              <DialogTitle>Request to Connect</DialogTitle>
              <DialogDescription>
                Send a message to {trainer.displayName}. Once accepted, you can chat directly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="conn-message">Your Message *</Label>
                <Textarea
                  id="conn-message"
                  placeholder="Introduce yourself, your fitness goals..."
                  rows={5}
                  {...connectionForm.register('message')}
                />
                {connectionForm.formState.errors.message && (
                  <p className="text-sm text-destructive">{connectionForm.formState.errors.message.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConnectionOpen(false)}>Cancel</Button>
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
};

const formatAddress = (trainer: PublicTrainer, customAddress?: string): string | null => {
  if (customAddress) return customAddress;

  const parts = [
    trainer.addressLine1,
    trainer.addressLine2,
    trainer.city,
    trainer.postcode,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
};

const ConnectCardPlaceholder = ({ trainer }: { trainer: PublicTrainer }) => (
  <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
    <CardContent className="p-6 space-y-4">
      <p className="text-sm text-[hsl(var(--card-foreground))]">
        Interested in training with {trainer.displayName}? Choose how you'd like to connect.
      </p>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start border-[hsl(var(--border))] text-[hsl(var(--card-foreground))]"
          disabled
        >
          <Phone className="h-4 w-4 mr-2" />
          Request a Callback
        </Button>
        <Button
          className="w-full justify-start bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
          disabled
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Request to Connect
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const ContactSection = ({ section, trainer, preview }: ContactSectionProps) => {
  const content = parseContent(section.content);

  const email = trainer.contactEmail || (trainer as any).user?.email;
  const showEmail = content.showEmail !== false && email;
  const showPhone = content.showPhone !== false && trainer.phoneNumber;
  const showForm = content.showForm !== false;
  const address = content.showAddress ? formatAddress(trainer, content.address) : null;

  return (
    <section id={`section-${section.id}`} className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="site-heading mb-4 text-center text-3xl font-bold text-[hsl(var(--foreground))]">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="mb-10 text-center text-lg text-[hsl(var(--muted-foreground))]">
            {section.subtitle}
          </p>
        )}

        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          {/* Contact info */}
          <div className="flex flex-col gap-4">
            {showEmail && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--primary))]"
              >
                <Mail className="h-5 w-5 text-[hsl(var(--primary))]" />
                <span>{email}</span>
              </a>
            )}
            {showPhone && (
              <a
                href={`tel:${trainer.phoneNumber}`}
                className="flex items-center gap-3 text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--primary))]"
              >
                <Phone className="h-5 w-5 text-[hsl(var(--primary))]" />
                <span>{trainer.phoneNumber}</span>
              </a>
            )}
            {address && (
              <div className="flex items-start gap-3 text-[hsl(var(--foreground))]">
                <MapPin className="h-5 w-5 mt-0.5 text-[hsl(var(--primary))]" />
                <span>{address}</span>
              </div>
            )}
          </div>

          {/* Callback / Connect request card */}
          {showForm && (preview ? <ConnectCardPlaceholder trainer={trainer} /> : <ConnectCard trainer={trainer} />)}
        </div>
      </div>
    </section>
  );
};
