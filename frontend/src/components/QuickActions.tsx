import { 
  MapPinIcon, 
  CalendarDaysIcon, 
  BookmarkIcon, 
  CloudIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

interface QuickActionsProps {
  /** Callback function called when a quick action is clicked */
  onActionClick: (action: string) => void;
  /** Whether to display in compact mode (fewer actions, smaller size) */
  compact?: boolean;
}

/**
 * Quick action buttons component providing shortcuts to common hiking-related tasks.
 * Displays a grid of action buttons with icons, labels, and emojis for easy interaction.
 * Supports both full and compact display modes.
 * 
 * @param props - Component props
 * @param props.onActionClick - Function called when an action button is clicked, receives the action label
 * @param props.compact - Optional flag to display in compact mode with fewer actions
 * 
 * @example
 * ```tsx
 * function ChatInterface() {
 *   const handleQuickAction = (action: string) => {
 *     console.log('Action clicked:', action);
 *   };
 * 
 *   return (
 *     <QuickActions 
 *       onActionClick={handleQuickAction} 
 *       compact={false} 
 *     />
 *   );
 * }
 * ```
 */
export function QuickActions({ onActionClick, compact = false }: QuickActionsProps) {
  const actions = [
    {
      icon: MapPinIcon,
      label: 'Find trails near me',
      emoji: '📍',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: CalendarDaysIcon,
      label: 'Plan a weekend trip',
      emoji: '🏕️',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: BookmarkIcon,
      label: 'Check my saved trips',
      emoji: '📋',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: CloudIcon,
      label: 'Get weather updates',
      emoji: '🌤️',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const additionalActions = [
    {
      icon: MagnifyingGlassIcon,
      label: 'Search specific trails',
      emoji: '🔍',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: ShoppingBagIcon,
      label: 'Get gear recommendations',
      emoji: '🎒',
      color: 'from-red-500 to-red-600'
    }
  ];

  const allActions = compact ? actions : [...actions, ...additionalActions];

  return (
    <div className="space-y-3">
      {!compact && (
        <h3 className="text-white/90 font-medium text-center">
          Quick Actions
        </h3>
      )}
      
      <div className={`grid gap-3 ${
        compact 
          ? 'grid-cols-2 lg:grid-cols-4' 
          : 'grid-cols-1 sm:grid-cols-2'
      }`}>
        {allActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.label)}
            className={`
              bg-gradient-to-r ${action.color} 
              hover:scale-105 active:scale-95
              text-white rounded-xl p-4 
              transition-all duration-200 
              shadow-lg hover:shadow-xl
              group text-left
              ${compact ? 'p-3' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                bg-white/20 rounded-lg p-2 
                group-hover:bg-white/30 transition-colors
                ${compact ? 'p-1.5' : ''}
              `}>
                <action.icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={compact ? 'text-lg' : 'text-xl'}>{action.emoji}</span>
                  <span className={`font-medium ${compact ? 'text-sm' : 'text-base'} truncate`}>
                    {action.label}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {!compact && (
        <div className="text-center mt-4">
          <p className="text-white/60 text-sm">
            Or just start typing to ask me anything about hiking!
          </p>
        </div>
      )}
    </div>
  );
}
