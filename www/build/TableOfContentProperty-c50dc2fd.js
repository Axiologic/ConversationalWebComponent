import { g as getElement } from './index-a9b4faa7.js';

const SLOTTED = "SLOTTED:";
const regex = /@import.*?["']([^"']+)["'].*?;/g;
let dependencies = {};
let imports = {};
let appTheme;
function checkForInnerDependencies(referrer, styleStr) {
    if (!imports[referrer]) {
        imports[referrer] = new Promise((resolve, reject) => {
            if (regex.exec(styleStr)) {
                styleStr.replace(regex, (match, depUrl) => {
                    if (!dependencies[depUrl]) {
                        dependencies[depUrl] = resolveDependency(depUrl);
                    }
                    dependencies[depUrl].then((content) => {
                        resolve(styleStr.replace(match, content));
                    }).catch(reject);
                });
            }
            else {
                resolve(styleStr);
            }
        });
    }
    return imports[referrer];
}
function resolveDependency(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then((response) => {
            if (response.ok) {
                return resolve(response.text());
            }
            reject({ url: response.url, status: response.status, statusText: response.statusText });
        });
    });
}
function isFromSlot(child, element) {
    if (!element) {
        return false;
    }
    if (element.shadowRoot) {
        return child.parentNode === element.shadowRoot.host;
    }
    return isFromSlot(element, element.parentElement);
}
function CustomTheme() {
    let handleStyleExistenceCheck = (element) => {
        let childComponents = {};
        element.addEventListener("styleExists", (event) => {
            event.stopImmediatePropagation();
            event.preventDefault();
            let eventCallback = event.detail.callback;
            let componentName = event.detail.componentTag;
            eventCallback(undefined, childComponents.hasOwnProperty(componentName), element);
            if (!childComponents[componentName]) {
                childComponents[componentName] = true;
            }
        });
        element.addEventListener("componentWasRemoved", (event) => {
            let componentName = event.detail.componentTag;
            if (childComponents[componentName]) {
                delete childComponents[componentName];
            }
        });
    };
    handleStyleExistenceCheck(document.querySelector("body"));
    return (proto) => {
        const { componentWillLoad, disconnectedCallback } = proto;
        proto.componentWillLoad = function () {
            const host = getElement(this);
            if (!host) {
                return componentWillLoad && componentWillLoad.call(this);
            }
            else {
                let injectThemeStyle = (theme) => {
                    let componentName = host.tagName.toLowerCase();
                    let addStyleElement = (parent) => {
                        return new Promise((resolve) => {
                            // @ts-ignore
                            let themeStylePath = window.basePath + "themes/" + theme + "/components/" + componentName + "/" + componentName + ".css";
                            if (!dependencies[themeStylePath]) {
                                dependencies[themeStylePath] = new Promise((resolve, reject) => {
                                    resolveDependency(themeStylePath).then((cssRaw) => {
                                        resolve(cssRaw);
                                    }).catch(reject);
                                });
                            }
                            dependencies[themeStylePath].then((cssRaw) => {
                                checkForInnerDependencies(themeStylePath, cssRaw).then((data) => {
                                    let styleElement = document.createElement("style");
                                    styleElement.innerHTML = data;
                                    parent.append(styleElement);
                                });
                            }).catch((errorStatus) => {
                                console.log(`Request on resource ${errorStatus.url} ended with status: ${errorStatus.status} (${errorStatus.statusText})`);
                            }).finally(() => {
                                resolve(componentWillLoad && componentWillLoad.call(this));
                            });
                        });
                    };
                    if (host.shadowRoot) {
                        handleStyleExistenceCheck(host);
                        return addStyleElement(host.shadowRoot);
                    }
                    if (!host.isConnected) {
                        return new Promise(resolve => {
                            resolve(componentWillLoad && componentWillLoad.call(this));
                        });
                    }
                    return new Promise((resolve => {
                        let isSlotted = isFromSlot(host, host.parentElement);
                        host['isSlotted'] = isSlotted;
                        let styleExistsEvent = new CustomEvent("styleExists", {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            detail: {
                                callback: (err, styleExists, shadowRootHostComponent) => {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    if (!styleExists) {
                                        if (!isSlotted) {
                                            shadowRootHostComponent = shadowRootHostComponent.shadowRoot;
                                        }
                                        addStyleElement(shadowRootHostComponent).then(() => {
                                            resolve();
                                        });
                                    }
                                    else {
                                        resolve(componentWillLoad && componentWillLoad.call(this));
                                    }
                                },
                                componentTag: isSlotted ? SLOTTED + componentName : componentName
                            }
                        });
                        host.dispatchEvent(styleExistsEvent);
                    }));
                };
                if (!appTheme) {
                    return new Promise((resolve) => {
                        let event = new CustomEvent("getThemeConfig", {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            detail: (err, theme) => {
                                if (err) {
                                    return console.log(err);
                                }
                                appTheme = theme;
                                injectThemeStyle(appTheme).then(() => {
                                    resolve();
                                });
                            }
                        });
                        host.dispatchEvent(event);
                    });
                }
                else {
                    return injectThemeStyle(appTheme);
                }
            }
        };
        proto.disconnectedCallback = function () {
            const host = getElement(this);
            let componentName = host.tagName.toLowerCase();
            if (host['isSlotted']) {
                componentName = SLOTTED + componentName;
            }
            let componentWasRemovedEvent = new CustomEvent("componentWasRemoved", {
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: {
                    componentTag: componentName
                }
            });
            host.dispatchEvent(componentWasRemovedEvent);
            disconnectedCallback && disconnectedCallback.call(this);
        };
    };
}

const MOBILE_MAX_WIDTH = 960;
const DEFINED_PROPERTIES = "definedProperties";
const DEFINED_EVENTS = "definedEvents";
const DEFINED_CONTROLLERS = "definedControllers";
const DATA_DEFINED_PROPS = "data-define-props";
const DATA_DEFINED_EVENTS = "data-define-events";
const DATA_DEFINED_CONTROLLERS = "data-define-controller";
const TOOLTIP_TEXT = "Copy to clipboard";
const TOOLTIP_COPIED_TEXT = "Copied!";
const LIST_TYPE_ORDERED = "ordered";
const LIST_TYPE_UNORDERED = "unordered";
const EVENTS_TYPES = {
    PSK_BUTTON_EVT: "PSK_BUTTON_EVT",
    PSK_SCROLL_EVT: "PSK_SCROLL_EVT",
    PSK_WIZARD_EVT: "PSK_WIZARD_EVT",
    PSK_FILE_CHOOSER_EVT: "PSK_FILE_CHOOSER_EVT",
    PSK_SUB_MENU_EVT: "PSK_SUB_MENU_EVT"
};
const INVALID_ID_CHARACTERS_REGEX = /[^A-Za-z0-9_-]/g;
const PSK_LIST_PARSE_CONFIG = {
    startTag: /^<([a-z]+-?[a-z]*)+[^>]*>/,
    endTag: /^<\/([a-z]+-?[a-z]*)+[^>]*>/,
    inlineTag: /^<([a-z]+-?[a-z]*)+[^>]*>.*<\/([a-z]+-?[a-z]*)+[^>]*>/
};
const ACTIONS_ICONS = {
    view: {
        value: "eye",
        color: "rgba(108, 192, 145, 1)"
    },
    edit: {
        value: "edit",
        color: "#007bff"
    },
    cancel: {
        value: "close",
        color: "#dc3545"
    },
    bid: {
        value: "gavel"
    },
    calendar: {
        value: "calendar-check-o"
    }
};
const GRID_IGNORED_COMPONENTS = ["link", "style", "slot", "#text", "#comment", "text", "comment"];
const GRID_BREAKPOINTS = ["xs", "s", "m", "l", "xl"];
const GRID_HIDDEN_BREAKPOINTS = {
    xs: "d-none d-sm-block",
    sm: "d-sm-none d-md-block",
    md: "d-md-none d-lg-block",
    lg: "d-lg-none d-xl-block",
    xl: "d-xl-none"
};
const DATE_FORMAT_MASKS = {
    'default': 'mm dd yyyy HH:MM',
    'shortTime': 'HH:MM ',
    'isoTime': 'HH:MM:ss',
    'isoDate': 'yyyy-mm-dd',
};

function format(first, middle, last) {
    return ((first || "") + (middle ? ` ${middle}` : "") + (last ? ` ${last}` : ""));
}
function scrollToElement(elementId, htmlView) {
    const selector = normalizeElementId(elementId);
    const chapterElm = htmlView.querySelector(`#${selector}`);
    if (!chapterElm) {
        return;
    }
    chapterElm.scrollIntoView();
    let basePath = window.location.href;
    let queryOperator = "?";
    if (basePath.indexOf("chapter=") !== -1) {
        basePath = window.location.href.split("chapter=")[0];
        if (basePath.length > 0) {
            queryOperator = basePath[basePath.length - 1];
            basePath = basePath.substring(0, basePath.length - 1);
        }
    }
    else {
        queryOperator = basePath.indexOf("?") > 0 ? "&" : "?";
    }
    let chapterKey = `${queryOperator}chapter=`;
    window.history.pushState({}, "", `${basePath}${chapterKey}${selector}`);
}
//TODO refactor this
/**
 * @deprecated You should create your own Event. See /events/PskButtonEvent.ts example
 * @param eventName
 * @param options
 * @param trigger
 * @param triggerElement
 */
function createCustomEvent(eventName, options, trigger = false, triggerElement = null) {
    const customEvent = new CustomEvent(eventName, options);
    if (trigger) {
        if (triggerElement) {
            triggerElement.dispatchEvent(customEvent);
        }
        else {
            document.dispatchEvent(customEvent);
        }
    }
}
function closestParentElement(el, selector, stopSelector) {
    let retval = null;
    while (el) {
        if (el.matches(selector)) {
            retval = el;
            break;
        }
        else if (stopSelector && el.matches(stopSelector)) {
            break;
        }
        el = el.parentElement;
    }
    return retval;
}
function closestParentTagElement(el, tag, deepLevel = 1) {
    let retval = null;
    while (el) {
        if (el.tagName.toLowerCase() === tag && --deepLevel === 0) {
            retval = el;
            break;
        }
        el = el.parentElement;
    }
    return retval;
}
function normalizeInnerHTML(source = "") {
    return source.replace(/<!----->/g, "").replace(/<!---->/g, "");
}
function normalizeCamelCaseToDashed(source) {
    if (!source || typeof source !== 'string' || source.length === 0) {
        return '';
    }
    return source
        .split("")
        .map((letter) => {
        if (letter === letter.toLowerCase()) {
            return letter;
        }
        return `-${letter.toLowerCase()}`;
    })
        .join("");
}
function normalizeDashedToCamelCase(source) {
    if (!source || typeof source !== 'string' || source.length === 0) {
        return '';
    }
    return source
        .split("-")
        .map((word, index) => {
        if (index === 0) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    })
        .join("");
}
/**
 * normalize a string to be compliant with a HTML id value
 * @param source
 */
function normalizeElementId(source) {
    let normalizedId = source.replace(INVALID_ID_CHARACTERS_REGEX, "-").toLowerCase();
    normalizedId = normalizedId.replace(/(-+){2}/gm, "-");
    normalizedId = normalizedId.replace(/(-+)$/gm, "");
    return normalizedId;
}
/**
 *
 * @param source
 * @param regex
 * @param replaceString
 * @param applyCallback - A callback function that will be applyed to the string result
 */
function normalizeRegexToString(source, regex, replaceString, applyCallback = null) {
    let result = source.replace(regex, replaceString);
    if (applyCallback) {
        return applyCallback(result);
    }
    return result;
}
function canAttachShadow(tagName) {
    if (tagName.startsWith("psk-")) {
        return true;
    }
    const found = [
        "article",
        "aside",
        "blockquote",
        "body",
        "div",
        "footer",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "main",
        "nav",
        "p",
        "section",
        "span"
    ].find((htmlTag) => htmlTag === tagName);
    return found === tagName;
}
function normalizeModelChain(chain) {
    if (typeof chain !== "string") {
        throw new Error("Invalid model chain");
    }
    return chain.split("@").join("");
}
function stringToBoolean(str) {
    if (typeof str === "boolean") {
        return str;
    }
    if (typeof str === "string") {
        switch (str.toLowerCase().trim()) {
            case "true":
            case "1":
                return true;
            case "false":
            case "0":
            case null:
                return false;
            default:
                return Boolean(str);
        }
    }
    return Boolean(str);
}
function dashToCamelCase(str) {
    return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
}
function getInnerHTML(component) {
    const host = getElement(component);
    if (!host.innerHTML) {
        return null;
    }
    let styleElement = host.querySelector('style');
    if (styleElement) {
        let content = host.innerHTML.replace(styleElement.outerHTML, "");
        host.innerHTML = styleElement.outerHTML;
        return content;
    }
    return host.innerHTML;
}
;

function TableOfContentProperty(opts) {
    return function (proto, propertyKey) {
        const { connectedCallback, render, componentWillLoad, componentDidLoad } = proto;
        proto.componentWillLoad = function () {
            let self = this;
            let thisElement = getElement(self);
            if (!thisElement.hasAttribute(DATA_DEFINED_PROPS)) {
                return componentWillLoad && componentWillLoad.call(self);
            }
        };
        proto.componentDidLoad = function () {
            let self = this;
            let thisElement = getElement(self);
            if (!thisElement.hasAttribute(DATA_DEFINED_PROPS)) {
                return componentDidLoad && componentDidLoad.call(self);
            }
        };
        proto.connectedCallback = function () {
            let self = this;
            let thisElement = getElement(self);
            let propertyName = normalizeCamelCaseToDashed(String(propertyKey));
            if (thisElement.hasAttribute(DATA_DEFINED_PROPS)) {
                if (!self.componentDefinitions) {
                    self.componentDefinitions = {
                        definedProperties: [
                            Object.assign(Object.assign({}, opts), { propertyName: propertyName })
                        ]
                    };
                    return connectedCallback && connectedCallback.call(self);
                }
                let componentDefinitions = self.componentDefinitions;
                const newProperty = Object.assign(Object.assign({}, opts), { propertyName: propertyName });
                if (componentDefinitions &&
                    componentDefinitions.hasOwnProperty(DEFINED_PROPERTIES)) {
                    let tempProps = [
                        ...componentDefinitions[DEFINED_PROPERTIES]
                    ];
                    tempProps.push(newProperty);
                    componentDefinitions[DEFINED_PROPERTIES] = [...tempProps];
                }
                else {
                    componentDefinitions[DEFINED_PROPERTIES] = [newProperty];
                }
                self.componentDefinitions = Object.assign({}, componentDefinitions);
            }
            return connectedCallback && connectedCallback.call(self);
        };
        proto.render = function () {
            let self = this;
            if (!self.componentDefinitions ||
                !(self.componentDefinitions &&
                    self.componentDefinitions[DEFINED_PROPERTIES])) {
                return render && render.call(self);
            }
            let definedProps = self.componentDefinitions[DEFINED_PROPERTIES];
            if (definedProps) {
                definedProps = definedProps.reverse();
            }
            createCustomEvent("psk-send-props", {
                composed: true,
                bubbles: true,
                cancelable: true,
                detail: definedProps
            }, true);
        };
    };
}

export { CustomTheme as C, TableOfContentProperty as T, dashToCamelCase as d, normalizeModelChain as n };
