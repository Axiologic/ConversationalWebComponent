import { g as getElement, r as registerInstance, h, f as forceUpdate } from './index-a9b4faa7.js';
import { d as dashToCamelCase, n as normalizeModelChain, C as CustomTheme, T as TableOfContentProperty } from './TableOfContentProperty-c50dc2fd.js';

const ATTRIBUTE = "attr";
const PROPERTY = "prop";
function hasChainSignature(property) {
    if (property === null || typeof property !== "string") {
        return false;
    }
    if (!property.startsWith("@")) {
        return false;
    }
    return property.length >= 1;
}
function attributeHasValidChain(attr, attrValue, properties) {
    if (!hasChainSignature(attrValue)) {
        return false;
    }
    if (typeof properties[dashToCamelCase(attr)] !== "undefined") {
        return false;
    }
    return attr !== "view-model";
}
function getUpdateHandler(type, model) {
    switch (type) {
        case ATTRIBUTE:
            return function (attr, boundedChain) {
                this.setAttribute(attr, model.getChainValue(boundedChain));
            };
        default:
            return function (property, boundedChain) {
                let newValue = model.getChainValue(boundedChain);
                if (Array.isArray(this[property])) {
                    this[property] = [...newValue];
                }
                else {
                    this[property] = newValue;
                }
            };
    }
}
function BoundedModel(updateHandler, model) {
    this.createBoundedModel = function (property, boundedChain) {
        boundedChain = normalizeModelChain(boundedChain);
        model.onChange(boundedChain, () => {
            updateHandler(property, boundedChain);
        });
        updateHandler(property, boundedChain);
        return {
            updateModel: (value) => {
                model.setChainValue(boundedChain, value);
            }
        };
    };
}
function bindComponentProps(element, propsData, callback) {
    let { properties, hasViewModel, instanceName } = propsData;
    let modelReceived = (err, model) => {
        if (err) {
            console.error(err);
        }
        let viewModelParentChain;
        let boundedProperties = {};
        const bindSingleProperty = (prop) => {
            if (!boundedProperties[prop]) {
                let instance = properties[prop].type === ATTRIBUTE ? element : this;
                let handler = getUpdateHandler.call(instance, properties[prop].type, model);
                let propViewModel = new BoundedModel(handler.bind(instance), model);
                boundedProperties[prop] = propViewModel.createBoundedModel(prop, properties[prop].value);
            }
        };
        const bindProperties = () => {
            for (let prop in properties) {
                bindSingleProperty(prop);
            }
        };
        /**
         * if view-model is defined, construct the property dictionary but do not overwrite existing
         * properties
         */
        if (hasViewModel) {
            viewModelParentChain = element.getAttribute("view-model");
            viewModelParentChain = normalizeModelChain(viewModelParentChain);
            const updateProperties = () => {
                let propertiesData = model.getChainValue(viewModelParentChain);
                for (let prop in propertiesData) {
                    if (!properties[prop]) {
                        properties[prop] = {
                            value: viewModelParentChain ? viewModelParentChain + "." + prop : prop,
                            type: PROPERTY
                        };
                    }
                }
            };
            updateProperties();
            /**
             * This model chain listener set on the view model parent chain is used for the those children chains (of this parent chain) which are added at the runtime, and are not bound.
             * The below part of the code is updating and binding these new children chains to the component.
             */
            model.onChange(viewModelParentChain, () => {
                updateProperties();
                bindProperties();
            });
        }
        bindProperties();
        if (typeof this[instanceName] !== "undefined") {
            throw new Error(`BindModel decorator received a wrong argument as instance name: [${instanceName}]`);
        }
        else {
            this[instanceName] = {
                updateModel: (prop, value) => {
                    if (!properties[prop]) {
                        properties[prop] = {
                            value: viewModelParentChain ? viewModelParentChain + "." + prop : prop,
                            type: PROPERTY
                        };
                        bindSingleProperty(prop);
                    }
                    boundedProperties[prop].updateModel(value);
                }
            };
        }
        callback();
    };
    element.dispatchEvent(new CustomEvent("getModelEvent", {
        bubbles: true,
        composed: true,
        detail: { callback: modelReceived }
    }));
}
function BindModel() {
    return (proto, instanceName) => {
        let { componentWillLoad } = proto;
        proto.componentWillLoad = function () {
            let componentInstance = this.__proto__;
            let self = this;
            let element = getElement(self);
            let callComponentWillLoad = (promise) => {
                if (!promise) {
                    return componentWillLoad && componentWillLoad.call(self);
                }
                else {
                    return new Promise((resolve => {
                        promise.then(() => {
                            resolve(componentWillLoad && componentWillLoad.call(self));
                        });
                    }));
                }
            };
            if (element.isConnected) {
                let componentProperties = Object.keys(componentInstance);
                let elementAttributes = element.getAttributeNames();
                let properties = {};
                /**
                 * iterate through component properties and search for model chains
                 */
                for (let i = 0; i < componentProperties.length; i++) {
                    let prop = componentProperties[i];
                    if (hasChainSignature(this[prop])) {
                        properties[prop] = {
                            value: this[prop],
                            type: PROPERTY
                        };
                    }
                }
                /**
                 * iterate through component attributes and search for model chains
                 */
                for (let i = 0; i < elementAttributes.length; i++) {
                    let attr = elementAttributes[i];
                    let attrValue = element.getAttribute(attr);
                    if (attributeHasValidChain(attr, attrValue, properties)) {
                        properties[attr] = {
                            value: attrValue,
                            type: ATTRIBUTE
                        };
                    }
                }
                /**
                 * check for existing view-model attribute
                 */
                let hasViewModel = element.hasAttribute("view-model");
                if (Object.keys(properties).length > 0 || hasViewModel) {
                    return callComponentWillLoad(new Promise((resolve) => {
                        let propsData = {
                            properties: properties,
                            hasViewModel: hasViewModel,
                            instanceName: instanceName
                        };
                        bindComponentProps.call(self, element, propsData, resolve);
                    }));
                }
            }
            return callComponentWillLoad();
        };
    };
}

const loadedScripts = {};
function getBasePath() {
    let basePath;
    if (window && window.location && window.location.origin) {
        basePath = window.location.origin;
    }
    let baseElement = document.querySelector("base");
    if (baseElement) {
        let appDir = baseElement.getAttribute("href");
        if (appDir) {
            basePath += appDir;
        }
    }
    if (!basePath.endsWith("/")) {
        basePath += "/";
    }
    return basePath;
}
function fetchJson(url, callback) {
    fetch(url)
        .then(function (response) {
        return response.json();
    })
        .then(function (data) {
        callback(undefined, data);
    })
        .catch(function (e) {
        callback(e);
    });
}
function fetchScript(url, callback) {
    if (loadedScripts[url]) {
        return callback(undefined, loadedScripts[url]);
    }
    fetch(url)
        .then(function (response) {
        return response.text();
    })
        .then(function (data) {
        loadedScripts[url] = Function(`"use strict";return (${data})`)();
        callback(undefined, loadedScripts[url]);
    })
        .catch(function (e) {
        callback(e);
    });
}
function getOffsetWidthOfHiddenElement(element) {
    if (!element)
        return 0;
    const clone = element.cloneNode(true);
    const styles = {
        left: -10000,
        top: -10000,
        position: "absolute",
        display: "inline",
        visibility: "visible",
    };
    Object.keys(styles).forEach((styleName) => (clone.style[styleName] = styles[styleName]));
    document.body.appendChild(clone);
    const { offsetWidth } = clone;
    clone.remove();
    return offsetWidth;
}

const defaultHandlerOptions = {
    config: {},
    onContextChanged: () => { },
    onOptionSelected: () => { },
    onOptionScriptExecuted: () => { },
    onLogError: () => { },
    onLog: () => { },
};
class PskConversationHandler {
    constructor(options) {
        this._options = Object.assign(Object.assign({}, defaultHandlerOptions), (options || {}));
        this.updateContext(this.getInitialContext());
    }
    isCurrentLevelRoot() {
        return this._context.configStack.length === 1;
    }
    chooseOption(optionIdx) {
        const context = this._context;
        let { currentLevelConfig } = context;
        const { options } = currentLevelConfig;
        const isValidOption = options && options.length && optionIdx >= 0 && optionIdx < options.length;
        if (!isValidOption)
            return;
        const choosenOption = options[optionIdx];
        const choosenLevelConfig = this.clone(choosenOption);
        this._options.onOptionSelected(choosenLevelConfig);
        const optionContext = Object.assign(Object.assign({}, context), { configStack: [...context.configStack, choosenLevelConfig], currentLevelConfig: choosenLevelConfig });
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
                }
                catch (error) {
                    onOptionScriptExecuted(error, null, choosenLevelConfig);
                }
            });
            return;
        }
        this.updateContext(optionContext);
    }
    resetToInitialLevel() {
        const context = this._context;
        this.updateContext(Object.assign(Object.assign({}, context), { currentLevelConfig: this.clone(context.config), configStack: [context.configStack[0]] }));
    }
    resetToPreviousLevel() {
        const context = this._context;
        if (this.isCurrentLevelRoot())
            return;
        context.configStack.pop();
        const previousLevelConfig = context.configStack[context.configStack.length - 1];
        this.updateContext(Object.assign(Object.assign({}, context), { currentLevelConfig: this.clone(previousLevelConfig), configStack: [...context.configStack] }));
    }
    updateContext(context) {
        this._context = context;
        this._options.onContextChanged(context);
    }
    getInitialContext() {
        const normalizedConfig = this.normalizeConfig(this._options.config);
        const currentLevelConfig = this.clone(normalizedConfig);
        return {
            config: normalizedConfig,
            currentLevelConfig,
            configStack: [currentLevelConfig],
        };
    }
    normalizeConfig(config) {
        config = this.clone(config);
        const normalizeConfigOption = (option) => {
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
    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

const PskFragment = (_props, children) => [...children];

const pskConversationCss = ":host{scroll-behavior:hidden;overflow-y:auto;height:100vh;display:block;color:#000}.conversation-container{height:100vh;display:flex;flex-direction:column;justify-content:stretch;align-items:stretch}@media (max-width: 960px){:host,.conversation-container{height:calc(100vh - 70px)}}.console-container{flex:1 1 auto;overflow:auto;margin:5px;border:2px solid #4c71de;border-radius:5px;padding:5px}.option-buttons-container{min-height:50px;flex:0 0 auto;display:flex;justify-content:center;align-items:center;overflow-x:hidden}@media (max-width: 640px){.option-buttons-container{margin:auto 10px}}.footer{min-height:50px;flex:0 0 auto;display:flex;justify-content:center;align-items:center}psk-button button.btn.btn-primary{margin-left:5px;margin-right:5px;margin-bottom:0}psk-button .icon{margin:0;padding:0}.options-wrapper{display:flex;flex-direction:column;justify-content:stretch;align-items:center}.options-wrapper psk-button{margin:4px}";

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const PskConversation = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.configPath = "conversation-config.json";
        this.consoleContent = [];
        this.visibleOptionCount = -1;
        this.mustRecomputeVisibleOptionCount = false;
    }
    componentWillLoad() {
        const configUrl = `${getBasePath()}${this.configPath}`;
        return new Promise((resolve) => {
            fetchJson(configUrl, (err, loadedConfiguration) => {
                let configuration;
                if (err) {
                    console.log(err);
                    //use default configuration
                }
                else {
                    configuration = loadedConfiguration;
                }
                this.handler = new PskConversationHandler({
                    config: configuration,
                    onContextChanged: (context) => {
                        this.context = context;
                    },
                    onOptionSelected: (option) => {
                        this.appendConsoleContentText(`Executing ${option.title} command...`);
                    },
                    onOptionScriptExecuted: (error, data, option) => {
                        if (error) {
                            this.appendConsoleContent(h("div", null, h("psk-label", { label: `Failed to execute ${option.title} command!` }), this.getErrorContent(error)));
                        }
                    },
                    onLogError: (error, option) => {
                        this.appendConsoleContent(h("div", null, h("psk-label", { label: `Failed to execute ${option.title} command!` }), this.getErrorContent(error)));
                    },
                    onLog: (data, model, option) => {
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
    contextWatchHandler() {
        this.visibleOptionCount = -1;
        this.mustRecomputeVisibleOptionCount = true;
    }
    handleScroll() {
        setTimeout(() => {
            this.visibleOptionCount = -1;
            this.mustRecomputeVisibleOptionCount = true;
            forceUpdate(this.el);
        }, 100);
    }
    needFloatingMenu(event) {
        event.detail(null, [{ name: "TEST1" }, { name: "TEST2" }, { name: "TEST3" }]);
    }
    openHiddenOptionsMenu(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const { context: { currentLevelConfig: { options = [] }, }, visibleOptionCount, } = this;
        if (visibleOptionCount === -1) {
            // the show more button shoudn't have been visible
            return;
        }
        let triggeredButton = event.path[0];
        let elementRect = triggeredButton.getBoundingClientRect();
        let itemActionsBtn = this.el.querySelector(".options-menu");
        const hiddenButtonCount = options.length - visibleOptionCount;
        let optionsMenuTrigger = this.el.querySelector(".options-menu-trigger");
        const containerHeight = optionsMenuTrigger.offsetHeight * hiddenButtonCount + 100;
        let topCorrection = containerHeight / 2 - 15;
        if (window.innerHeight < elementRect.top + containerHeight / 2) {
            topCorrection = topCorrection + (elementRect.top + containerHeight / 2 - window.innerHeight);
        }
        const gridElement = itemActionsBtn.querySelector("psk-grid");
        gridElement.style.top = elementRect.top - topCorrection + "px";
        gridElement.style.left = elementRect.left - 220 + "px";
        itemActionsBtn.setAttribute("opened", "");
    }
    render() {
        console.log("render...");
        const { currentLevelConfig: { options }, } = this.context;
        let optionButtonsContent = null;
        if (options) {
            let visibleButtons = options;
            let hiddenButtons = [];
            if (this.visibleOptionCount !== -1) {
                visibleButtons = options.slice(0, this.visibleOptionCount);
                hiddenButtons = options.slice(this.visibleOptionCount);
            }
            optionButtonsContent = (h(PskFragment, null, visibleButtons.map((option, idx) => {
                return (h("psk-button", { label: option.title, onClick: () => {
                        this.handler.chooseOption(idx);
                    } }));
            }), h("psk-floating-button-group", { style: {
                    display: this.visibleOptionCount !== -1 ? "initial" : "none",
                }, backdrop: true, buttons: hiddenButtons.map((button) => ({
                    title: button.title,
                    onClick: (idx, _) => {
                        this.handler.chooseOption(visibleButtons.length + idx);
                    },
                })) })));
        }
        return (h("div", { class: "conversation-container" }, h("div", { class: "console-container", ref: (element) => {
                this.consoleContainerRef = element;
            } }, this.consoleContent.map(({ content, model }) => {
            if (typeof content !== "string")
                return content;
            const modelJson = JSON.stringify(model || {});
            const script = `<script type="text/javascript">controller.setModel(${modelJson})</script>`;
            return h("psk-container", { innerHTML: `${script}${script}${content}` });
        })), h("div", { class: "option-buttons-container", ref: (element) => (this.optionButtonsContainerRef = element) }, optionButtonsContent), this.renderFooter()));
    }
    renderFooter() {
        const isRootOption = this.handler.isCurrentLevelRoot();
        return (h("div", { class: "footer" }, !isRootOption && (h("psk-button", { onClick: () => {
                this.handler.resetToInitialLevel();
                this.appendConsoleContentText("Home command executed");
            } }, h("psk-icon", { icon: "home" }))), !isRootOption && (h("psk-button", { onClick: () => {
                this.handler.resetToPreviousLevel();
                this.appendConsoleContentText("Back command executed");
            } }, h("psk-icon", { icon: "chevron-left" }))), this.context.currentLevelConfig.text));
    }
    updateVisibleOptionButtonCount() {
        console.log("updateVisibleOptionButtonCount...");
        const { clientWidth, scrollWidth } = this.optionButtonsContainerRef;
        if (this.visibleOptionCount == -1 && clientWidth === scrollWidth) {
            this.visibleOptionCount = -1;
            return;
        }
        const optionButtons = Array.from(this.optionButtonsContainerRef.children).filter((element) => element.nodeName === "PSK-BUTTON");
        const seeMoreButton = optionButtons.pop();
        // let availableWidth = clientWidth - getOffsetWidthOfHiddenElement(seeMoreButton);
        let availableWidth = clientWidth - 35;
        let visibleOptionCount = 0;
        for (let index = 0; index < optionButtons.length; index++) {
            const optionButtonWidth = optionButtons[index].offsetWidth;
            if (availableWidth >= optionButtonWidth) {
                availableWidth -= optionButtonWidth;
                visibleOptionCount++;
            }
            else {
                break;
            }
        }
        const { currentLevelConfig: { options = [] }, } = this.context;
        if (visibleOptionCount === options.length) {
            visibleOptionCount = -1;
        }
        console.log(`Settying visibleOptionCount: ${visibleOptionCount}`);
        this.visibleOptionCount = visibleOptionCount;
    }
    appendConsoleContent(content, model) {
        this.consoleContent = [...this.consoleContent, { content, model }];
    }
    appendConsoleContentText(contentText) {
        this.appendConsoleContent(h("psk-label", { label: contentText }));
    }
    appendConsoleContentError(error) {
        this.appendConsoleContent({
            content: this.getErrorContent(error),
        });
    }
    getErrorContent(error) {
        let errorContent = error;
        if (error instanceof Error) {
            errorContent = (h("div", null, h("psk-label", { label: `Error: ${error.message}` }), h("pre", null, error.stack)));
        }
        else {
            errorContent = h("pre", null, JSON.stringify(error));
        }
        return errorContent;
    }
    get el() { return getElement(this); }
    static get watchers() { return {
        "context": ["contextWatchHandler"]
    }; }
};
__decorate([
    CustomTheme(),
    BindModel()
], PskConversation.prototype, "modelHandler", void 0);
__decorate([
    TableOfContentProperty({
        description: `This property is the path to the conversation config file.`,
        isMandatory: false,
        propertyType: `string`,
        defaultValue: "conversation-config.json",
    })
], PskConversation.prototype, "configPath", void 0);
PskConversation.style = pskConversationCss;

export { PskConversation as psk_conversation };
