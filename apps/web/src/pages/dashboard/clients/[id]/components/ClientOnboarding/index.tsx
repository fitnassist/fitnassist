import { useState } from 'react';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Textarea } from '@/components/ui';
import { useOnboardingResponses, useOnboardingReview } from '@/api/onboarding';
import type { Question, Answer } from '@fitnassist/schemas';
import type { OnboardingStatus } from '@fitnassist/database';

interface ClientOnboardingProps {
  clientRosterId: string;
}

const STATUS_DISPLAY: Record<
  OnboardingStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  PENDING: { label: 'Pending', icon: Clock, className: 'text-amber-600' },
  SUBMITTED: { label: 'Awaiting Review', icon: FileText, className: 'text-blue-600' },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'text-green-600 dark:text-green-400',
  },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'text-red-600' },
};

const formatAnswer = (answer: Answer['answer']): string => {
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'boolean') return answer ? 'Yes' : 'No';
  return String(answer || '—');
};

interface ResponseCardProps {
  response: {
    id: string;
    status: OnboardingStatus;
    answers: unknown;
    waiverSigned: boolean;
    waiverSignedAt: Date | null;
    waiverSignedName: string | null;
    reviewNotes: string | null;
    template: {
      name: string;
      questions: unknown;
      waiverText: string | null;
    };
  };
}

const ResponseCard = ({ response }: ResponseCardProps) => {
  const reviewMutation = useOnboardingReview();
  const [reviewNotes, setReviewNotes] = useState('');

  const questions = response.template.questions as Question[];
  const answers = (response.answers as Answer[]) || [];
  const answersMap = new Map(answers.map((a) => [a.questionId, a.answer]));
  const statusInfo = STATUS_DISPLAY[response.status];
  const StatusIcon = statusInfo.icon;

  const handleReview = (decision: 'APPROVED' | 'REJECTED') => {
    reviewMutation.mutate({
      responseId: response.id,
      decision,
      reviewNotes: reviewNotes || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{response.template.name}</CardTitle>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusInfo.className}`} />
            <span className={`text-sm font-medium ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Answers (shown for SUBMITTED, APPROVED, REJECTED) */}
        {response.status !== 'PENDING' && (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div key={question.id}>
                <p className="text-sm font-medium text-muted-foreground">
                  {index + 1}. {question.label}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </p>
                <p className="mt-1">{formatAnswer(answersMap.get(question.id) ?? '')}</p>
              </div>
            ))}
          </div>
        )}

        {/* Waiver status */}
        {response.template.waiverText && response.status !== 'PENDING' && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-2">
              {response.waiverSigned ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">
                    Waiver signed by <strong>{response.waiverSignedName}</strong>
                    {response.waiverSignedAt && (
                      <> on {new Date(response.waiverSignedAt).toLocaleDateString()}</>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Waiver not signed</span>
                </>
              )}
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View waiver text
              </summary>
              <div className="mt-2 border rounded-md p-3 bg-muted/50 whitespace-pre-wrap">
                {response.template.waiverText}
              </div>
            </details>
          </div>
        )}

        {/* Review notes (shown after review) */}
        {response.reviewNotes && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">Review Notes</p>
            <p className="whitespace-pre-wrap">{response.reviewNotes}</p>
          </div>
        )}

        {/* Review actions (only for SUBMITTED status) */}
        {response.status === 'SUBMITTED' && (
          <div className="border-t pt-3 space-y-3">
            <div>
              <Label htmlFor={`review-notes-${response.id}`}>Notes (optional)</Label>
              <Textarea
                id={`review-notes-${response.id}`}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleReview('APPROVED')} disabled={reviewMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReview('REJECTED')}
                disabled={reviewMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
            {reviewMutation.isError && (
              <p className="text-sm text-destructive">
                {reviewMutation.error?.message || 'Failed to submit review.'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ClientOnboarding = ({ clientRosterId }: ClientOnboardingProps) => {
  const { data: responses, isLoading } = useOnboardingResponses(clientRosterId);

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  if (!responses?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No onboarding data for this client.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <ResponseCard key={response.id} response={response} />
      ))}
    </div>
  );
};
