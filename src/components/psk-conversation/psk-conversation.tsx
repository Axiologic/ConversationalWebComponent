import { Component, h, Listen, Prop, State, Watch, Element, forceUpdate } from "@stencil/core";
import CustomTheme from "../../../dev/cardinal/src/decorators/CustomTheme";
import { TableOfContentProperty } from "../../../dev/cardinal/src/decorators/TableOfContentProperty";
import { BindModel } from "../../../dev/cardinal/src/decorators/BindModel";

import {
  ConsoleContentItem,
  PskConversationConfig,
  PskConversationConfigOption,
  PskConversationContext,
} from "./models";
import { getBasePath, fetchJson } from "./utils";
import { PskConversationHandler } from "./psk-conversation-handler";
import PskFragment from "./psk-fragment";
import { HTMLStencilElement } from "@stencil/core/internal";
import { FloatingButtonConfig } from "../../interfaces/FloatingButtonConfig";

@Component({
  tag: "psk-conversation",
  styleUrl: "./psk-conversation.css",
})
export class PskConversation {
  @Element()
  el!: HTMLStencilElement;

  @CustomTheme()
  @BindModel()
  modelHandler;

  @TableOfContentProperty({
    description: `This property is the path to the conversation config file.`,
    isMandatory: false,
    propertyType: `string`,
    defaultValue: "conversation-config.json",
  })
  @Prop()
  configPath: string = "conversation-config.json";

  @State()
  private context: PskConversationContext;

  @State()
  private consoleContent: ConsoleContentItem[] = [];

  @State()
  private visibleOptionCount = -1;

  private mustRecomputeVisibleOptionCount = false;

  private handler: PskConversationHandler;
  private consoleContainerRef: HTMLDivElement;
  private optionButtonsContainerRef: HTMLDivElement;

  componentWillLoad(): Promise<any> {
    const configUrl = `${getBasePath()}${this.configPath}`;

    return new Promise((resolve) => {
      fetchJson(configUrl, (err, loadedConfiguration) => {
        let configuration: PskConversationConfig;
        if (err) {
          console.log(err);
          //use default configuration
        } else {
          configuration = loadedConfiguration;
        }

        this.handler = new PskConversationHandler({
          config: configuration,
          onContextChanged: (context: PskConversationContext) => {
            this.context = context;
          },
          onOptionSelected: (option: PskConversationConfigOption) => {
            this.appendConsoleContentText(`Executing ${option.title} command...`);
          },
          onOptionScriptExecuted: (error: any, _data: any, option: PskConversationConfigOption) => {
            if (error) {
              this.appendConsoleContent(
                <div>
                  <psk-label label={`Failed to execute ${option.title} command!`} />
                  {this.getErrorContent(error)}
                </div>
              );
            }
          },
          onLogError: (error, option: PskConversationConfigOption) => {
            this.appendConsoleContent(
              <div>
                <psk-label label={`Failed to execute ${option.title} command!`} />
                {this.getErrorContent(error)}
              </div>
            );
          },
          onLog: (data, model, _option: PskConversationConfigOption) => {
            this.appendConsoleContent(data, model);
          },
        });

        resolve(configuration);
      });
    });
  }

  componentDidRender() {
    this.consoleContainerRef.scrollTop = this.consoleContainerRef.scrollHeight;

    // after the context was changed (new options are available) we need to recompute the visibleOptionButtonsCount
    // only after the first render
    if (this.mustRecomputeVisibleOptionCount) {
      this.updateVisibleOptionButtonCount();
      this.mustRecomputeVisibleOptionCount = false;
    }
  }

  // @Watch("visibleOptionCount")
  // visibleOptionCountWatchHandler(newValue: number, oldValue: number) {
  //   if (newValue === -1 && newValue !== oldValue) {
  //     this.isHiddenOptionsModalOpen = false;
  //   }
  // }

  @Watch("context")
  contextWatchHandler() {
    this.visibleOptionCount = -1;
    this.mustRecomputeVisibleOptionCount = true;
  }

  @Listen("window:resize")
  handleScroll() {
    setTimeout(() => {
      this.visibleOptionCount = -1;
      this.mustRecomputeVisibleOptionCount = true;
      forceUpdate(this.el);
    }, 100);
  }

  @Listen("needFloatingMenu")
  needFloatingMenu(event): void {
    event.detail(null, [{ name: "TEST1" }, { name: "TEST2" }, { name: "TEST3" }]);
  }

  @Listen("openHiddenOptionsMenu")
  openHiddenOptionsMenu(event): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    const {
      context: {
        currentLevelConfig: { options = [] },
      },
      visibleOptionCount,
    } = this;

    if (visibleOptionCount === -1) {
      // the show more button shoudn't have been visible
      return;
    }

    let triggeredButton = event.path[0];
    let elementRect = triggeredButton.getBoundingClientRect();
    let itemActionsBtn = this.el.querySelector(".options-menu");

    const hiddenButtonCount = options.length - visibleOptionCount;
    let optionsMenuTrigger = this.el.querySelector(".options-menu-trigger");

    const containerHeight = (optionsMenuTrigger as HTMLElement).offsetHeight * hiddenButtonCount + 100;

    let topCorrection = containerHeight / 2 - 15;
    if (window.innerHeight < elementRect.top + containerHeight / 2) {
      topCorrection = topCorrection + (elementRect.top + containerHeight / 2 - window.innerHeight);
    }
    const gridElement = itemActionsBtn.querySelector("psk-grid") as HTMLElement;
    gridElement.style.top = elementRect.top - topCorrection + "px";
    gridElement.style.left = elementRect.left - 220 + "px";

    itemActionsBtn.setAttribute("opened", "");
  }

  render() {
    console.log("render...");
    const {
      currentLevelConfig: { options },
    } = this.context;

    let optionButtonsContent = null;
    if (options) {
      let visibleButtons = options;
      let hiddenButtons: PskConversationConfigOption[] = [];
      if (this.visibleOptionCount !== -1) {
        visibleButtons = options.slice(0, this.visibleOptionCount);
        hiddenButtons = options.slice(this.visibleOptionCount);
      }

      optionButtonsContent = (
        <PskFragment>
          {visibleButtons.map((option, idx) => {
            return (
              <psk-button
                label={option.title}
                onClick={() => {
                  this.handler.chooseOption(idx);
                }}
              />
            );
          })}

          <psk-floating-button-group
            style={{
              display: this.visibleOptionCount !== -1 ? "initial" : "none",
            }}
            backdrop
            buttons={hiddenButtons.map(
              (button) =>
                ({
                  title: button.title,
                  onClick: (idx, _) => {
                    this.handler.chooseOption(visibleButtons.length + idx);
                  },
                } as FloatingButtonConfig)
            )}
          ></psk-floating-button-group>

          {/* <psk-floating-menu></psk-floating-menu> */}

          {/* <psk-button
            class="options-menu-trigger"
            event-name="openHiddenOptionsMenu"
            touch-event-name="openHiddenOptionsMenu"
            style={{
              display: this.visibleOptionCount !== -1 ? "initial" : "none",
            }}
          >
            <psk-icon icon="ellipsis-v" icon-color="#572a57"></psk-icon>
          </psk-button>

          <psk-button-group class="options-menu">
            <psk-grid class="options-wrapper">
              {hiddenButtons.map((option, idx) => {
                return (
                  <psk-button
                    label={option.title}
                    onClick={() => {
                      this.handler.chooseOption(visibleButtons.length + idx);
                    }}
                  />
                );
              })}
            </psk-grid>
          </psk-button-group> */}
        </PskFragment>
      );
    }

    return (
      <div class="conversation-container">
        <div
          class="console-container"
          ref={(element) => {
            this.consoleContainerRef = element;
          }}
        >
          {this.consoleContent.map(({ content, model }) => {
            if (typeof content !== "string") return content;

            const modelJson = JSON.stringify(model || {});
            const script = `<script type="text/javascript">controller.setModel(${modelJson})</script>`;

            return <psk-container innerHTML={`${script}${script}${content}`}></psk-container>;
          })}
        </div>
        <div class="option-buttons-container" ref={(element) => (this.optionButtonsContainerRef = element)}>
          {optionButtonsContent}
        </div>

        {this.renderFooter()}
      </div>
    );
  }

  private renderFooter() {
    const isRootOption = this.handler.isCurrentLevelRoot();

    return (
      <div class="footer">
        {!isRootOption && (
          <psk-button
            onClick={() => {
              this.handler.resetToInitialLevel();
              this.appendConsoleContentText("Home command executed");
            }}
          >
            <psk-icon icon="home" />
          </psk-button>
        )}
        {!isRootOption && (
          <psk-button
            onClick={() => {
              this.handler.resetToPreviousLevel();
              this.appendConsoleContentText("Back command executed");
            }}
          >
            <psk-icon icon="chevron-left" />
          </psk-button>
        )}
        {this.context.currentLevelConfig.text}
      </div>
    );
  }

  private updateVisibleOptionButtonCount() {
    console.log("updateVisibleOptionButtonCount...");
    const { clientWidth, scrollWidth } = this.optionButtonsContainerRef;

    if (this.visibleOptionCount == -1 && clientWidth === scrollWidth) {
      this.visibleOptionCount = -1;
      return;
    }
    const optionButtons = Array.from(this.optionButtonsContainerRef.children).filter(
      (element) => element.nodeName === "PSK-BUTTON"
    ) as HTMLElement[];

    optionButtons.pop();

    // let availableWidth = clientWidth - getOffsetWidthOfHiddenElement(seeMoreButton);
    let availableWidth = clientWidth - 35;
    let visibleOptionCount = 0;

    for (let index = 0; index < optionButtons.length; index++) {
      const optionButtonWidth = optionButtons[index].offsetWidth;
      if (availableWidth >= optionButtonWidth) {
        availableWidth -= optionButtonWidth;
        visibleOptionCount++;
      } else {
        break;
      }
    }

    const {
      currentLevelConfig: { options = [] },
    } = this.context;
    if (visibleOptionCount === options.length) {
      visibleOptionCount = -1;
    }

    console.log(`Settying visibleOptionCount: ${visibleOptionCount}`);

    this.visibleOptionCount = visibleOptionCount;
  }

  private appendConsoleContent(content: any, model?: any) {
    this.consoleContent = [...this.consoleContent, { content, model }];
  }

  private appendConsoleContentText(contentText) {
    this.appendConsoleContent(<psk-label label={contentText}></psk-label>);
  }

  // private appendConsoleContentError(error) {
  //   this.appendConsoleContent({
  //     content: this.getErrorContent(error),
  //   });
  // }

  private getErrorContent(error) {
    let errorContent = error;
    if (error instanceof Error) {
      errorContent = (
        <div>
          <psk-label label={`Error: ${error.message}`} />
          <pre>{error.stack}</pre>
        </div>
      );
    } else {
      errorContent = <pre>{JSON.stringify(error)}</pre>;
    }

    return errorContent;
  }
}
