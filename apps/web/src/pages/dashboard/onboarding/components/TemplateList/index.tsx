import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { routes } from '@/config/routes';
import { useOnboardingTemplates, useDeleteOnboardingTemplate } from '@/api/onboarding';

export const TemplateList = () => {
  const { data: templates, isLoading } = useOnboardingTemplates();
  const deleteTemplate = useDeleteOnboardingTemplate();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete template "${name}"? This cannot be undone.`)) {
      deleteTemplate.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to={routes.dashboardOnboardingTemplateCreate}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {!templates?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No onboarding templates yet. Create one to start onboarding new clients.
            </p>
            <Link to={routes.dashboardOnboardingTemplateCreate}>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {template.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{template.name}</h3>
                        {template.isActive && <Badge variant="success">Active</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(template.questions as unknown[]).length} questions
                        {template.waiverText ? ' + waiver' : ''}
                        {' · '}
                        {template._count.responses} responses
                        {' · '}
                        Updated{' '}
                        {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={routes.dashboardOnboardingTemplateEdit(template.id)}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id, template.name)}
                      disabled={deleteTemplate.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
