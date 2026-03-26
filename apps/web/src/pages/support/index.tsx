import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, CheckCircle } from 'lucide-react';
import { supportContactSchema, type SupportContactInput } from '@fitnassist/schemas';
import { Button, Input, Label, Textarea, Card, CardContent } from '@/components/ui';
import { HeroBanner } from '@/components/HeroBanner';
import { trpc } from '@/lib/trpc';

const SUBJECT_OPTIONS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'account', label: 'Account issue' },
  { value: 'trainer', label: 'Trainer profile issue' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'feedback', label: 'Feedback or suggestion' },
  { value: 'other', label: 'Other' },
];

export const SupportPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupportContactInput>({
    resolver: zodResolver(supportContactSchema),
  });

  const submitMutation = trpc.support.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      reset();
    },
  });

  const onSubmit = (data: SupportContactInput) => {
    submitMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Message sent</h2>
            <p className="mt-2 text-muted-foreground">
              Thank you for getting in touch. We'll get back to you as soon as possible.
            </p>
            <Button className="mt-6" onClick={() => setSubmitted(false)}>
              Send another message
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner title="Support" imageUrl="/images/hero-support.jpg" size="small" />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Have a question, issue, or feedback? Fill out the form below and we'll get back to you.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <select
            id="subject"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            defaultValue=""
            {...register('subject')}
          >
            <option value="" disabled>
              Select a subject...
            </option>
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.subject && (
            <p className="text-sm text-destructive">{errors.subject.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Tell us how we can help..."
            rows={6}
            {...register('message')}
          />
          {errors.message && (
            <p className="text-sm text-destructive">{errors.message.message}</p>
          )}
        </div>

        {submitMutation.error && (
          <p className="text-sm text-destructive">
            Something went wrong. Please try again.
          </p>
        )}

        <Button type="submit" disabled={submitMutation.isPending} className="w-full">
          {submitMutation.isPending ? (
            'Sending...'
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send message
            </>
          )}
        </Button>
        </form>
      </div>
    </div>
  );
};
