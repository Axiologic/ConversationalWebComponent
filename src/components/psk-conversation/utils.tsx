const loadedScripts = {};

export function getBasePath() {
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

export function fetchJson(url, callback) {
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

export function fetchScript(url, callback) {
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

export function getOffsetWidthOfHiddenElement(element: HTMLElement) {
  if (!element) return 0;

  const clone = element.cloneNode(true) as HTMLElement;

  const styles = {
    left: -10000,
    top: -10000,
    position: "absolute",
    display: "inline",
    visibility: "visible",
  };
  Object.keys(styles).forEach(
    (styleName) => (clone.style[styleName] = styles[styleName])
  );

  document.body.appendChild(clone);
  const { offsetWidth } = clone;
  clone.remove();

  return offsetWidth;
}
