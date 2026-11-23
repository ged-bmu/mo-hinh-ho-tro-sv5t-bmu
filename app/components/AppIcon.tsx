import type { LucideProps } from "lucide-react";
import {
  Archive,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  Folder,
  FolderOpen,
  Heart,
  Home,
  Mail,
  Menu,
  MapPin,
  Paperclip,
  Search,
  Settings,
  Upload,
  Trash2,
  Users,
  Bell,
  BarChart3,
  KeyRound,
  Globe2,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Sprout,
  Star,
  Trophy,
  X,
  MessageCircle,
  Info,
  Send,
  AlertTriangle,
  Pencil,
  FileText,
  FileSpreadsheet,
  LogOut,
} from "lucide-react";

export type AppIconName =
  | "archive"
  | "book"
  | "calendar"
  | "check"
  | "chevron-down"
  | "chevron-right"
  | "help"
  | "clipboard"
  | "download"
  | "edit"
  | "eye"
  | "folder"
  | "folder-open"
  | "heart"
  | "home"
  | "mail"
  | "menu"
  | "map-pin"
  | "paperclip"
  | "search"
  | "settings"
  | "upload"
  | "trash"
  | "users"
  | "bell"
  | "chart"
  | "key"
  | "globe"
  | "dumbbell"
  | "graduation"
  | "handshake"
  | "sprout"
  | "star"
  | "trophy"
  | "close"
  | "message"
  | "info"
  | "send"
  | "warning"
  | "pencil"
  | "file"
  | "spreadsheet"
  | "logout";

const icons = {
  archive: Archive,
  book: BookOpen,
  calendar: CalendarDays,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  help: CircleHelp,
  clipboard: ClipboardList,
  download: Download,
  edit: Edit3,
  eye: Eye,
  folder: Folder,
  "folder-open": FolderOpen,
  heart: Heart,
  home: Home,
  mail: Mail,
  menu: Menu,
  "map-pin": MapPin,
  paperclip: Paperclip,
  search: Search,
  settings: Settings,
  upload: Upload,
  trash: Trash2,
  users: Users,
  bell: Bell,
  chart: BarChart3,
  key: KeyRound,
  globe: Globe2,
  dumbbell: Dumbbell,
  graduation: GraduationCap,
  handshake: HeartHandshake,
  sprout: Sprout,
  star: Star,
  trophy: Trophy,
  close: X,
  message: MessageCircle,
  info: Info,
  send: Send,
  warning: AlertTriangle,
  pencil: Pencil,
  file: FileText,
  spreadsheet: FileSpreadsheet,
  logout: LogOut,
} satisfies Record<AppIconName, React.ComponentType<LucideProps>>;

export default function AppIcon({
  name,
  size = 20,
  ...props
}: LucideProps & { name: AppIconName }) {
  const Icon = icons[name];
  return <Icon size={size} aria-hidden="true" {...props} />;
}
