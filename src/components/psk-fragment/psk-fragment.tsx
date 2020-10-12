import { Component, h } from "@stencil/core";

@Component({
  tag: "psk-fragment",
})
export class PskFragment {
  render() {
    return <slot />;
  }
}
