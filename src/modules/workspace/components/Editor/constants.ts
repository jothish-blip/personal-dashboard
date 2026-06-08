import {
  FolderOpen,
  BarChart2,
  Clock,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  SquareTerminal,
  Tag,
} from "lucide-react";

export interface WorkspaceView {
  id: "editor" | "media" | "analytics" | "history";
  icon: React.ElementType;
  label: string;
}

export const WORKSPACE_VIEWS: WorkspaceView[] = [
  { id: "editor", icon: FileText, label: "Editor" },
  { id: "media", icon: FolderOpen, label: "Media" },
  { id: "analytics", icon: BarChart2, label: "Analytics" },
  { id: "history", icon: Clock, label: "History" },
];

export interface SlashCommand {
  label: string;
  cmd: string;
  icon: React.ElementType | string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { label: "Heading 1", cmd: "h1", icon: Heading1 },
  { label: "Heading 2", cmd: "h2", icon: Heading2 },
  { label: "Heading 3", cmd: "h3", icon: Heading3 },
  { label: "To-do List", cmd: "todo", icon: "☑" },
  { label: "Quote", cmd: "quote", icon: Quote },
  { label: "Divider", cmd: "divider", icon: Minus },
  { label: "Code Block", cmd: "code", icon: SquareTerminal },
  { label: "Add Tag", cmd: "tag", icon: Tag },
];