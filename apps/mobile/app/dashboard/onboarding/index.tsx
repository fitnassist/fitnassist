import { useState } from 'react';
import { View, FlatList, RefreshControl, Alert, ScrollView, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, ClipboardCheck, Plus, Trash2, Circle,
  X, FileText, Clock, CheckCircle, XCircle,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Input, Card, CardContent, Skeleton, Badge, TabBar } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

type OnboardingTab = 'templates' | 'pending';

const QUESTION_TYPES = [
  { value: 'SHORT_TEXT', label: 'Short Text' },
  { value: 'LONG_TEXT', label: 'Long Text' },
  { value: 'SINGLE_CHOICE', label: 'Single Choice' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'YES_NO', label: 'Yes / No' },
  { value: 'NUMBER', label: 'Number' },
] as const;

const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']);

// ===== TEMPLATE FORM =====
const TemplateForm = ({ template, onClose }: { template?: any; onClose: () => void }) => {
  const isEdit = !!template;
  const createTemplate = trpc.onboarding.createTemplate.useMutation();
  const updateTemplate = trpc.onboarding.updateTemplate.useMutation();
  const utils = trpc.useUtils();

  const [name, setName] = useState(template?.name ?? '');
  const [isActive, setIsActive] = useState(template?.isActive ?? false);
  const [waiverText, setWaiverText] = useState(template?.waiverText ?? '');
  const [questions, setQuestions] = useState<any[]>(
    template?.questions ?? [{ id: String(Date.now()), type: 'SHORT_TEXT', label: '', required: false }],
  );

  const addQuestion = () => {
    setQuestions([...questions, { id: String(Date.now()), type: 'SHORT_TEXT', label: '', required: false }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_: any, i: number) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'type') {
      if (CHOICE_TYPES.has(value) && !updated[index].options) {
        updated[index].options = [''];
      } else if (!CHOICE_TYPES.has(value)) {
        delete updated[index].options;
      }
    }
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], options: [...(updated[qIndex].options ?? []), ''] };
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    const opts = [...(updated[qIndex].options ?? [])];
    if (opts.length <= 1) return;
    opts.splice(oIndex, 1);
    updated[qIndex] = { ...updated[qIndex], options: opts };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    const opts = [...(updated[qIndex].options ?? [])];
    opts[oIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: opts };
    setQuestions(updated);
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Error', 'Template name is required'); return; }
    if (questions.some((q: any) => !q.label.trim())) { Alert.alert('Error', 'All questions must have text'); return; }

    const payload = {
      name: name.trim(),
      isActive,
      questions: questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        required: q.required,
        ...(CHOICE_TYPES.has(q.type) ? { options: q.options } : {}),
      })),
      waiverText: waiverText.trim() || null,
    };

    const mutation = isEdit
      ? updateTemplate.mutateAsync({ ...payload, id: template.id } as any)
      : createTemplate.mutateAsync(payload as any);

    mutation.then(() => {
      utils.onboarding.getTemplates.invalidate();
      onClose();
    }).catch(() => Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} template`));
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-base font-semibold text-foreground">{isEdit ? 'Edit Template' : 'New Template'}</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.foreground} /></TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8" keyboardShouldPersistTaps="handled">
          <Input label="Template Name" value={name} onChangeText={setName} placeholder="e.g. New Client Questionnaire" />

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-1 gap-0.5">
              <Text className="text-sm text-foreground">Set as active template</Text>
              <Text className="text-xs text-muted-foreground">Active template is used automatically for new clients.</Text>
            </View>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
          </View>

          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Questions</Text>
          {questions.map((q: any, qi: number) => (
            <Card key={q.id}>
              <CardContent className="py-3 px-4 gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">Question {qi + 1}</Text>
                  <TouchableOpacity onPress={() => removeQuestion(qi)} disabled={questions.length <= 1}>
                    <Trash2 size={14} color={questions.length <= 1 ? colors.muted : colors.destructive} />
                  </TouchableOpacity>
                </View>

                <Input label="Question text" value={q.label} onChangeText={(v) => updateQuestion(qi, 'label', v)} placeholder="Enter your question..." />

                <Text className="text-xs font-medium text-foreground">Type</Text>
                <View className="flex-row flex-wrap gap-1">
                  {QUESTION_TYPES.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      className={`px-2.5 py-1.5 rounded-lg border ${q.type === value ? 'border-teal bg-teal/10' : 'border-border'}`}
                      onPress={() => updateQuestion(qi, 'type', value)}
                    >
                      <Text className={`text-xs ${q.type === value ? 'text-teal' : 'text-muted-foreground'}`}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {CHOICE_TYPES.has(q.type) && (
                  <View className="gap-2">
                    <Text className="text-xs font-medium text-foreground">Options</Text>
                    {(q.options ?? []).map((opt: string, oi: number) => (
                      <View key={oi} className="flex-row items-center gap-2">
                        <View className="flex-1"><Input value={opt} onChangeText={(v) => updateOption(qi, oi, v)} placeholder={`Option ${oi + 1}`} /></View>
                        <TouchableOpacity onPress={() => removeOption(qi, oi)} disabled={(q.options ?? []).length <= 1}>
                          <Trash2 size={14} color={(q.options ?? []).length <= 1 ? colors.muted : colors.destructive} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => addOption(qi)} className="flex-row items-center gap-1">
                      <Plus size={14} color={colors.teal} />
                      <Text className="text-xs text-teal">Add Option</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-foreground">Required</Text>
                  <Switch value={q.required} onValueChange={(v) => updateQuestion(qi, 'required', v)} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
                </View>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" size="sm" onPress={addQuestion}>
            <View className="flex-row items-center gap-1">
              <Plus size={14} color={colors.foreground} />
              <Text className="text-sm font-semibold text-foreground">Add Question</Text>
            </View>
          </Button>

          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Waiver (optional)</Text>
          <Input
            value={waiverText}
            onChangeText={setWaiverText}
            placeholder="Enter waiver/disclaimer text that clients must agree to..."
            multiline
            numberOfLines={6}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          <View className="flex-row gap-2">
            <Button className="flex-1" onPress={handleSave} loading={createTemplate.isPending || updateTemplate.isPending}>
              {isEdit ? 'Update Template' : 'Create Template'}
            </Button>
            <Button variant="outline" className="flex-1" onPress={onClose}>Cancel</Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ===== REVIEW MODAL =====
const ReviewModal = ({ response, onClose }: { response: any; onClose: () => void }) => {
  const [notes, setNotes] = useState('');
  const reviewMutation = trpc.onboarding.reviewResponse.useMutation();
  const utils = trpc.useUtils();

  const handleReview = (decision: 'APPROVED' | 'REJECTED') => {
    reviewMutation.mutate(
      { responseId: response.id, decision, reviewNotes: notes.trim() || null } as any,
      {
        onSuccess: () => {
          utils.onboarding.submittedResponses.invalidate();
          utils.onboarding.pendingReviewCount.invalidate();
          utils.clientRoster.list.invalidate();
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to submit review'),
      },
    );
  };

  const answers = response.answers ?? [];
  const questions = response.template?.questions ?? [];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-base font-semibold text-foreground">Review Response</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.foreground} /></TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
          <Text className="text-sm text-muted-foreground">
            {response.clientRoster?.connection?.sender?.name ?? 'Client'} · {response.template?.name ?? 'Template'}
          </Text>

          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Answers</Text>
              {questions.map((q: any, i: number) => {
                const answer = answers.find((a: any) => a.questionId === q.id);
                const val = answer?.answer;
                const display = Array.isArray(val) ? val.join(', ') : typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—');
                return (
                  <View key={q.id} className="gap-0.5 py-2 border-b border-border">
                    <Text className="text-xs text-muted-foreground">{i + 1}. {q.label}{q.required ? ' *' : ''}</Text>
                    <Text className="text-sm text-foreground">{display}</Text>
                  </View>
                );
              })}
            </CardContent>
          </Card>

          {response.template?.waiverText && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Waiver</Text>
                {response.waiverSigned ? (
                  <View className="flex-row items-center gap-2">
                    <CheckCircle size={14} color={colors.teal} />
                    <Text className="text-xs text-foreground">
                      Signed by {response.waiverSignedName ?? 'client'} on {new Date(response.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <XCircle size={14} color={colors.destructive} />
                    <Text className="text-xs text-destructive">Waiver not signed</Text>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {response.status === 'SUBMITTED' && (
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Input
                  label="Review Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about your decision..."
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
                <View className="flex-row gap-2">
                  <Button className="flex-1" onPress={() => handleReview('APPROVED')} loading={reviewMutation.isPending}>
                    <View className="flex-row items-center gap-1">
                      <CheckCircle size={14} color="#fff" />
                      <Text className="text-sm font-semibold text-white">Approve</Text>
                    </View>
                  </Button>
                  <Button variant="destructive" className="flex-1" onPress={() => handleReview('REJECTED')} loading={reviewMutation.isPending}>
                    <View className="flex-row items-center gap-1">
                      <XCircle size={14} color="#fff" />
                      <Text className="text-sm font-semibold text-white">Reject</Text>
                    </View>
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}

          {response.reviewNotes && response.status !== 'SUBMITTED' && (
            <Card>
              <CardContent className="py-3 px-4 gap-1">
                <Text className="text-xs text-muted-foreground">Review Notes</Text>
                <Text className="text-sm text-foreground">{response.reviewNotes}</Text>
              </CardContent>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ===== MAIN SCREEN =====
const STATUS_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  PENDING: { icon: Clock, color: '#f59e0b', label: 'Pending' },
  SUBMITTED: { icon: FileText, color: '#3b82f6', label: 'Awaiting Review' },
  APPROVED: { icon: CheckCircle, color: '#10b981', label: 'Approved' },
  REJECTED: { icon: XCircle, color: '#ef4444', label: 'Rejected' },
};

const OnboardingScreen = () => {
  const router = useRouter();
  const [tab, setTab] = useState<OnboardingTab>('templates');
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewResponse, setReviewResponse] = useState<any>(null);

  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = trpc.onboarding.getTemplates.useQuery();
  const { data: submitted, isLoading: submittedLoading, refetch: refetchSubmitted } = trpc.onboarding.submittedResponses.useQuery();
  const { data: pendingCount } = trpc.onboarding.pendingReviewCount.useQuery();
  const deleteTemplate = trpc.onboarding.deleteTemplate.useMutation();
  const utils = trpc.useUtils();

  const templatesList = (templates ?? []) as any[];
  const submittedList = (submitted ?? []) as any[];

  const tabs = [
    { key: 'templates' as OnboardingTab, label: 'Templates' },
    { key: 'pending' as OnboardingTab, label: `Pending${typeof pendingCount === 'number' && pendingCount > 0 ? ` (${pendingCount})` : ''}` },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Onboarding</Text>
        </View>
        {tab === 'templates' && (
          <TouchableOpacity onPress={() => setShowCreate(true)} className="flex-row items-center gap-1">
            <Plus size={18} color={colors.teal} />
            <Text className="text-sm font-medium text-teal">New</Text>
          </TouchableOpacity>
        )}
      </View>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'templates' && (
        templatesLoading ? (
          <View className="px-4 py-4 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </View>
        ) : (
          <FlatList
            data={templatesList}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <Card className="mx-4 mb-2">
                <CardContent className="py-3 px-4 gap-2">
                  <View className="flex-row items-center gap-2">
                    {item.isActive ? <CheckCircle size={14} color={colors.teal} /> : <Circle size={14} color={colors.mutedForeground} />}
                    <Text className="text-sm font-semibold text-foreground flex-1">{item.name}</Text>
                    {item.isActive && <Badge>Active</Badge>}
                  </View>
                  <Text className="text-xs text-muted-foreground">
                    {item.questions?.length ?? 0} questions{item.waiverText ? ' + waiver' : ''}{item._count?.responses ? ` · ${item._count.responses} responses` : ''}
                  </Text>
                  <View className="flex-row gap-2 mt-1">
                    <TouchableOpacity className="bg-secondary rounded-lg px-3 py-1.5" onPress={() => setEditTemplate(item)}>
                      <Text className="text-xs text-foreground">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-secondary rounded-lg px-3 py-1.5" onPress={() => {
                      Alert.alert('Delete Template', `Delete "${item.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate.mutate({ id: item.id }, { onSuccess: () => { utils.onboarding.getTemplates.invalidate(); } }) },
                      ]);
                    }}>
                      <Text className="text-xs text-destructive">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-12 gap-3">
                <ClipboardCheck size={48} color={colors.mutedForeground} />
                <Text className="text-base text-muted-foreground">No templates yet</Text>
                <Button size="sm" onPress={() => setShowCreate(true)}>Create Template</Button>
              </View>
            }
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetchTemplates} tintColor={colors.teal} />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          />
        )
      )}

      {tab === 'pending' && (
        submittedLoading ? (
          <View className="px-4 py-4 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </View>
        ) : (
          <FlatList
            data={submittedList}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => {
              const statusInfo = STATUS_ICONS[item.status] ?? STATUS_ICONS.PENDING;
              const Icon = statusInfo.icon;
              return (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setReviewResponse(item)}>
                  <Card className="mx-4 mb-2">
                    <CardContent className="py-3 px-4 flex-row items-center gap-3">
                      <Icon size={18} color={statusInfo.color} />
                      <View className="flex-1 gap-0.5">
                        <Text className="text-sm font-medium text-foreground">
                          {item.clientRoster?.connection?.sender?.name ?? 'Client'}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {item.template?.name} · Submitted {formatDistanceToNow(String(item.completedAt ?? item.updatedAt))} ago
                        </Text>
                      </View>
                      <Badge variant="secondary">{statusInfo.label}</Badge>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12 gap-2">
                <CheckCircle size={48} color={colors.mutedForeground} />
                <Text className="text-base text-muted-foreground">No pending reviews</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetchSubmitted} tintColor={colors.teal} />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          />
        )
      )}

      {(showCreate || editTemplate) && (
        <TemplateForm template={editTemplate} onClose={() => { setShowCreate(false); setEditTemplate(null); }} />
      )}

      {reviewResponse && (
        <ReviewModal response={reviewResponse} onClose={() => setReviewResponse(null)} />
      )}
    </SafeAreaView>
  );
};

export default OnboardingScreen;
