export interface PskConversationConfigOption {
  title?: string;
  text?: string;
  data?: any;
  options?: PskConversationConfigOption[];
  commonOptions?: PskConversationConfigOption;
  runScript?: string;
}

export interface PskConversationConfig extends PskConversationConfigOption {
  text?: string;
  options?: PskConversationConfigOption[];
}

export interface PskConversationContext {
  config: PskConversationConfig;
  currentLevelConfig: PskConversationConfigOption;
  configStack: PskConversationConfigOption[];
}

export interface ConsoleContentItem {
  content: any;
  model: any;
}