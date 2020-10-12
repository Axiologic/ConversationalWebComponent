import {
  PskConversationConfig,
  PskConversationConfigOption,
  PskConversationContext,
} from "./models";
import { fetchScript, getBasePath } from "./utils";

export interface PskConversationHandlerOptions {
  config: PskConversationConfig;
  onContextChanged?: (context: PskConversationContext) => void;
  onOptionSelected?: (option: PskConversationConfigOption) => void;
  onOptionScriptExecuted?: (
    error: any,
    data: any,
    option: PskConversationConfigOption
  ) => void;
  onLogError?: (error: any, option: PskConversationConfigOption) => void;
  onLog?: (data: any, model: any, option: PskConversationConfigOption) => void;
}

const defaultHandlerOptions: PskConversationHandlerOptions = {
  config: {},
  onContextChanged: () => {},
  onOptionSelected: () => {},
  onOptionScriptExecuted: () => {},
  onLogError: () => {},
  onLog: () => {},
};

export class PskConversationHandler {
  private _options: PskConversationHandlerOptions;
  private _context: PskConversationContext;

  constructor(options: PskConversationHandlerOptions) {
    this._options = {
      ...defaultHandlerOptions,
      ...(options || {}),
    };

    this.updateContext(this.getInitialContext());
  }

  isCurrentLevelRoot(): boolean {
    return this._context.configStack.length === 1;
  }

  chooseOption(optionIdx: number) {
    const context = this._context;
    let { currentLevelConfig } = context;
    const { options } = currentLevelConfig;

    const isValidOption =
      options && options.length && optionIdx >= 0 && optionIdx < options.length;
    if (!isValidOption) return;

    const choosenOption = options[optionIdx];
    const choosenLevelConfig = this.clone(
      choosenOption
    ) as PskConversationConfigOption;

    this._options.onOptionSelected(choosenLevelConfig);

    const optionContext = {
      ...context,
      configStack: [...context.configStack, choosenLevelConfig],
      currentLevelConfig: choosenLevelConfig,
    };

    if (choosenLevelConfig.runScript) {
      // when runScript is available it will be executed, but the context will remain the same
      const scriptPath = `${getBasePath()}${choosenLevelConfig.runScript}`;
      fetchScript(scriptPath, (err, script) => {
        const { onOptionScriptExecuted } = this._options;
        if (err) {
          onOptionScriptExecuted(err, null, choosenLevelConfig);
          return;
        }
        onOptionScriptExecuted(null, null, choosenLevelConfig);

        const { onLog, onLogError } = this._options;
        const { configStack } = optionContext;

        try {
          script({
            log: (data, model) => onLog(data, model, choosenLevelConfig),
            logError: (error) => onLogError(error, choosenLevelConfig),
            getData: (level = 0) => {
              if (0 <= level && level < optionContext.configStack.length) {
                return configStack[configStack.length - 1 - level].data;
              }
              return undefined;
            },
          });
        } catch (error) {
          onOptionScriptExecuted(error, null, choosenLevelConfig);
        }
      });

      return;
    }

    this.updateContext(optionContext);
  }

  resetToInitialLevel() {
    const context = this._context;
    this.updateContext({
      ...context,
      currentLevelConfig: this.clone(context.config),
      configStack: [context.configStack[0]],
    });
  }

  resetToPreviousLevel() {
    const context = this._context;
    if (this.isCurrentLevelRoot()) return;

    context.configStack.pop();
    const previousLevelConfig =
      context.configStack[context.configStack.length - 1];

    this.updateContext({
      ...context,
      currentLevelConfig: this.clone(previousLevelConfig),
      configStack: [...context.configStack],
    });
  }

  private updateContext(context: PskConversationContext) {
    this._context = context;
    this._options.onContextChanged(context);
  }

  private getInitialContext(): PskConversationContext {
    const normalizedConfig = this.normalizeConfig(this._options.config);
    const currentLevelConfig = this.clone(normalizedConfig);
    return {
      config: normalizedConfig,
      currentLevelConfig,
      configStack: [currentLevelConfig],
    };
  }

  private normalizeConfig(
    config: PskConversationConfig
  ): PskConversationConfig {
    config = this.clone(config);

    const normalizeConfigOption = (option: PskConversationConfigOption) => {
      option.options = option.options || [];
      if (option.commonOptions) {
        option.options.forEach((childOption) => {
          const childOptionKeys = Object.keys(childOption);
          Object.keys(option.commonOptions)
            .filter((optionName) => !childOptionKeys.includes(optionName))
            .forEach((optionName) => {
              childOption[optionName] = option.commonOptions[optionName];
            });
        });
      }

      option.options.forEach(normalizeConfigOption);
    };

    config.options = config.options || [];
    config.options.forEach(normalizeConfigOption);

    return config;
  }
  private clone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }
}
