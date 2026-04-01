import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, CheckCircle, Clock } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { routes } from '@/config/routes';
import { useTraineeOnboardingResponse, useSubmitOnboarding } from '@/api/onboarding';
import type { Question, Answer } from '@fitnassist/schemas';

export const OnboardingCompletePage = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();

  const { data: response, isLoading } = useTraineeOnboardingResponse(responseId || '');
  const submitOnboarding = useSubmitOnboarding();

  const [answers, setAnswers] = useState<Record<string, Answer['answer']>>({});
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [waiverSignedName, setWaiverSignedName] = useState('');

  if (isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageLayout>
    );
  }

  if (!response) {
    return (
      <PageLayout>
        <PageLayout.Header
          title="Onboarding Not Found"
          backLink={{ to: routes.dashboard, label: 'Back to Dashboard' }}
        />
        <p className="text-muted-foreground">This onboarding could not be found.</p>
      </PageLayout>
    );
  }

  if (response.status !== 'PENDING') {
    return (
      <PageLayout>
        <PageLayout.Header
          title="Onboarding"
          icon={<ClipboardCheck className="h-6 w-6 sm:h-8 sm:w-8" />}
          backLink={{ to: routes.dashboard, label: 'Back to Dashboard' }}
        />
        <Card>
          <CardContent className="py-12 text-center">
            {response.status === 'SUBMITTED' ? (
              <>
                <Clock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="font-medium text-lg mb-2">Waiting for Review</h3>
                <p className="text-muted-foreground">
                  Your onboarding has been submitted and is awaiting review from your trainer.
                </p>
              </>
            ) : response.status === 'APPROVED' ? (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-medium text-lg mb-2">Onboarding Complete</h3>
                <p className="text-muted-foreground">Your onboarding has been approved.</p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-lg mb-2">Onboarding Status: {response.status}</h3>
                {response.reviewNotes && (
                  <p className="text-muted-foreground mt-2">Notes: {response.reviewNotes}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const questions = response.template.questions as Question[];
  const hasWaiver = !!response.template.waiverText;

  const setAnswer = (questionId: string, value: Answer['answer']) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiChoiceToggle = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  };

  const handleSubmit = async () => {
    const answerArray: Answer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
    }));

    await submitOnboarding.mutateAsync({
      responseId: response.id,
      answers: answerArray,
      waiverSigned,
      waiverSignedName: waiverSignedName || null,
    });
    navigate(routes.dashboard);
  };

  return (
    <PageLayout>
      <PageLayout.Header
        title="Complete Onboarding"
        description={`${response.template.name}`}
        icon={<ClipboardCheck className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ to: routes.dashboard, label: 'Back to Dashboard' }}
      />

      <div className="space-y-6">
        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Questionnaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <Label>
                  {index + 1}. {question.label}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {question.type === 'SHORT_TEXT' && (
                  <Input
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}

                {question.type === 'LONG_TEXT' && (
                  <Textarea
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    placeholder="Your answer..."
                    rows={4}
                  />
                )}

                {question.type === 'NUMBER' && (
                  <Input
                    type="number"
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    placeholder="0"
                  />
                )}

                {question.type === 'YES_NO' && (
                  <div className="flex gap-4">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={opt}
                          checked={answers[question.id] === opt}
                          onChange={() => setAnswer(question.id, opt)}
                          className="h-4 w-4"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'SINGLE_CHOICE' && (
                  <div className="space-y-2">
                    {(question.options || []).map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() => setAnswer(question.id, option)}
                          className="h-4 w-4"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2">
                    {(question.options || []).map((option) => {
                      const current = (answers[question.id] as string[]) || [];
                      return (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={current.includes(option)}
                            onCheckedChange={() => handleMultiChoiceToggle(question.id, option)}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Waiver */}
        {hasWaiver && (
          <Card>
            <CardHeader>
              <CardTitle>Waiver Agreement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 overflow-y-auto border rounded-md p-4 text-sm whitespace-pre-wrap bg-muted/50">
                {response.template.waiverText}
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={waiverSigned}
                    onCheckedChange={(checked) => setWaiverSigned(checked === true)}
                  />
                  <span>I have read and agree to the above waiver</span>
                </label>
                {waiverSigned && (
                  <div>
                    <Label htmlFor="waiver-name">Type your full name to sign</Label>
                    <Input
                      id="waiver-name"
                      value={waiverSignedName}
                      onChange={(e) => setWaiverSignedName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitOnboarding.isPending}>
            {submitOnboarding.isPending ? 'Submitting...' : 'Submit Onboarding'}
          </Button>
        </div>

        {submitOnboarding.isError && (
          <p className="text-sm text-destructive text-right">
            {submitOnboarding.error?.message || 'Failed to submit. Please try again.'}
          </p>
        )}
      </div>
    </PageLayout>
  );
};

export default OnboardingCompletePage;
