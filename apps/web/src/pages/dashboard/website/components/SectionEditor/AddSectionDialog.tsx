import {
  Layout,
  User,
  Briefcase,
  Image,
  Quote,
  FileText,
  Mail,
  Type,
  Play,
  PoundSterling,
  HelpCircle,
  Megaphone,
  Share2,
  ShoppingBag,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@/components/ui';
import { useAddSection } from '@/api/website';
import { SECTION_TYPES } from '../../website.constants';
import type { AddSectionInput } from '@fitnassist/schemas';

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  layout: <Layout className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
  quote: <Quote className="h-5 w-5" />,
  'file-text': <FileText className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  type: <Type className="h-5 w-5" />,
  play: <Play className="h-5 w-5" />,
  'pound-sterling': <PoundSterling className="h-5 w-5" />,
  'help-circle': <HelpCircle className="h-5 w-5" />,
  megaphone: <Megaphone className="h-5 w-5" />,
  'share-2': <Share2 className="h-5 w-5" />,
  'shopping-bag': <ShoppingBag className="h-5 w-5" />,
};

export const AddSectionDialog = ({ open, onOpenChange }: AddSectionDialogProps) => {
  const addSection = useAddSection();

  const handleAdd = (type: AddSectionInput['type']) => {
    const config = SECTION_TYPES.find((s) => s.type === type);
    addSection.mutate(
      { type, title: config?.label ?? type },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {SECTION_TYPES.map((section) => (
            <Button
              key={section.type}
              variant="ghost"
              className="justify-start h-auto py-3 px-3"
              onClick={() => handleAdd(section.type as AddSectionInput['type'])}
              disabled={addSection.isPending}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="rounded-md bg-muted p-2">
                  {ICON_MAP[section.icon] ?? <Layout className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
