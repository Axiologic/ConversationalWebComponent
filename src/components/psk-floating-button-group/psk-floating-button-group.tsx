import { Component, h, Prop, Element, Host } from "@stencil/core";
import { FloatingButtonConfig } from "../../interfaces/FloatingButtonConfig";
import CustomTheme from "../../../dev/cardinal/src/decorators/CustomTheme";
import { TableOfContentProperty } from "../../../dev/cardinal/src/decorators/TableOfContentProperty";

@Component({
  tag: "psk-floating-button-group",
  styleUrl: "psk-floating-button-group.css",
})
export class PskFloatingButtonGroup {
  @CustomTheme()
  @Element()
  host: HTMLElement;

  @TableOfContentProperty({
    description: `This property shows the button group configuration`,
    isMandatory: false,
    propertyType: "array of FloatingButtonConfig items (FloatingButtonConfig[])",
    defaultValue: `false`,
  })
  @Prop()
  buttons: FloatingButtonConfig[] = [];

  @TableOfContentProperty({
    description: [
      "By defining this attribute, you tell the component if it has backdrop or not.",
      'Possible values: "true", "false".',
    ],
    isMandatory: false,
    propertyType: "boolean",
    defaultValue: "false",
  })
  @Prop()
  backdrop: boolean = false;

  @TableOfContentProperty({
    description: `This property shows the state of the backdrop on the PskFloatingButtonGroup.`,
    isMandatory: false,
    propertyType: `boolean`,
    defaultValue: `false`,
  })
  @Prop({ reflect: true, mutable: true })
  opened: boolean = false;

  // componentDidLoad() {
  //   this.host.addEventListener("blur", (event) => {
  //     event.preventDefault();
  //     this.opened = !this.opened;
  //   });
  // }

  render() {
    return (
      <Host
        onBlur={(event) => {
          debugger
          event.preventDefault();
          this.opened = !this.opened;
        }}
      >
        {this.backdrop && (
          <div
            id="backdrop"
            onClick={(event) => {
              event.preventDefault();
              this.opened = !this.opened;
            }}
          ></div>
        )}
        <ul class="items">
          <psk-button-group>
            <psk-grid>
              {this.buttons.map((option, idx) => {
                return (
                  <psk-button
                    label={option.title}
                    onClick={() => {
                      this.opened = !this.opened;
                      option.onClick(idx, option);
                    }}
                  />
                );
              })}
            </psk-grid>
          </psk-button-group>
        </ul>

        <psk-button
          onClick={(event) => {
            event.preventDefault();
            this.opened = !this.opened;
          }}
        >
          <psk-icon icon="ellipsis-v" icon-color="#572a57"></psk-icon>
        </psk-button>
      </Host>
    );
  }
}
